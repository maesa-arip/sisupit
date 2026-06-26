import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Combobox } from '@/Components/ui/combobox';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import { IconLoader2, IconMapPin, IconShieldCheck } from '@tabler/icons-react';
import axios from 'axios';
import { GEO_OPTIONS } from '@/lib/utils';
import { useEffect, useState } from 'react';

// Helper: Algoritma Pencocokan "Sapu Jagat" (Omni-Search) - sama seperti Front/Reports/Create.jsx
const matchRegionName = (dbList, osmNamesArray, removeWords = []) => {
    if (!osmNamesArray || osmNamesArray.length === 0 || !dbList || dbList.length === 0) return null;

    const cleanOsmNames = osmNamesArray.map((name) => {
        let clean = name.toLowerCase();
        removeWords.forEach((w) => { clean = clean.replace(new RegExp(`\\b${w}\\b`, 'gi'), ''); });
        return clean.replace(/[^\w\s]/gi, '').trim();
    }).filter((n) => n.length > 0);

    let matched = dbList.find((dbItem) => {
        let itemName = dbItem.name.toLowerCase();
        removeWords.forEach((w) => { itemName = itemName.replace(new RegExp(`\\b${w}\\b`, 'gi'), ''); });
        itemName = itemName.replace(/[^\w\s]/gi, '').trim();
        return cleanOsmNames.includes(itemName);
    });

    if (!matched) {
        matched = dbList.find((dbItem) => {
            let itemName = dbItem.name.toLowerCase();
            removeWords.forEach((w) => { itemName = itemName.replace(new RegExp(`\\b${w}\\b`, 'gi'), ''); });
            itemName = itemName.replace(/[^\w\s]/gi, '').trim();
            return cleanOsmNames.some((osmName) => itemName.includes(osmName) || osmName.includes(itemName));
        });
    }

    return matched;
};

export default function CompleteProfile({ provinces, user }) {
    const { data, setData, post, processing, errors } = useForm({
        phone: user?.phone || '',
        province_code: '',
        city_code: '',
        district_code: '',
        village_code: '',
    });

    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [villages, setVillages] = useState([]);
    const [isDetecting, setIsDetecting] = useState(true);
    const [detectedAddress, setDetectedAddress] = useState('');

    useEffect(() => {
        if (data.province_code) {
            axios.get(`/api/regions/cities/${data.province_code}`).then((res) => setCities(res.data));
        }
    }, [data.province_code]);

    useEffect(() => {
        if (data.city_code) {
            axios.get(`/api/regions/districts/${data.city_code}`).then((res) => setDistricts(res.data));
        }
    }, [data.city_code]);

    useEffect(() => {
        if (data.district_code) {
            axios.get(`/api/regions/villages/${data.district_code}`).then((res) => setVillages(res.data));
        }
    }, [data.district_code]);

    useEffect(() => {
        if (!navigator.geolocation) {
            setIsDetecting(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await axios.get(route('api.geocode.reverse'), { params: { lat: latitude, lng: longitude } });
                    const addr = res.data?.address;
                    setDetectedAddress(res.data?.display_name || '');

                    if (addr) {
                        const osmNames = [
                            addr.state, addr.region, addr.city, addr.county, addr.regency,
                            addr.town, addr.city_district, addr.municipality, addr.district,
                            addr.suburb, addr.village, addr.neighbourhood, addr.hamlet,
                        ].filter((n) => n && !n.toLowerCase().includes('no name'));
                        const removeWords = ['provinsi', 'prov', 'kota', 'kabupaten', 'kab', 'kecamatan', 'kec', 'kelurahan', 'desa'];

                        let pCode = '', cCode = '', dCode = '', vCode = '';

                        const matchedProv = matchRegionName(provinces, osmNames, removeWords);
                        if (matchedProv) pCode = matchedProv.code;

                        if (pCode) {
                            const resCity = await axios.get(`/api/regions/cities/${pCode}`);
                            setCities(resCity.data);
                            const matchedCity = matchRegionName(resCity.data, osmNames, removeWords);
                            if (matchedCity) cCode = matchedCity.code;
                        }

                        if (cCode) {
                            const resDist = await axios.get(`/api/regions/districts/${cCode}`);
                            setDistricts(resDist.data);
                            const matchedDist = matchRegionName(resDist.data, osmNames, removeWords);
                            if (matchedDist) dCode = matchedDist.code;
                        }

                        if (dCode) {
                            const resVill = await axios.get(`/api/regions/villages/${dCode}`);
                            setVillages(resVill.data);
                            const matchedVill = matchRegionName(resVill.data, osmNames, removeWords);
                            if (matchedVill) vCode = matchedVill.code;
                        }

                        setData((prev) => ({ ...prev, province_code: pCode, city_code: cCode, district_code: dCode, village_code: vCode }));
                    }
                } catch (e) {
                    // Reverse geocode gagal - biarkan user mengisi wilayah secara manual
                } finally {
                    setIsDetecting(false);
                }
            },
            () => setIsDetecting(false),
            GEO_OPTIONS.oneShot,
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onSubmit = (e) => {
        e.preventDefault();
        post(route('profile.complete.store'));
    };

    return (
        <div className="w-full max-w-2xl py-8 mx-auto">
            <Card className="border border-border bg-card shadow-none rounded-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                        <IconShieldCheck className="w-5 h-5 text-destructive" /> Lengkapi Profil Anda
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                        Sebelum melanjutkan, mohon lengkapi nomor HP dan wilayah domisili Anda sampai tingkat desa. Data ini dipakai untuk menentukan jangkauan notifikasi darurat di sekitar Anda.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-5">
                        {isDetecting && (
                            <div className="flex items-center gap-2 p-3 text-xs font-medium border rounded-lg text-muted-foreground bg-muted border-border">
                                <IconLoader2 className="w-4 h-4 animate-spin" /> Mendeteksi lokasi Anda...
                            </div>
                        )}
                        {!isDetecting && detectedAddress && (
                            <div className="flex items-start gap-2 p-3 text-xs leading-relaxed border rounded-lg text-foreground/80 bg-muted border-border">
                                <IconMapPin className="w-4 h-4 mt-0.5 shrink-0 text-destructive" />
                                <span>Lokasi terdeteksi di sekitar <b>{detectedAddress}</b>. Wilayah di bawah sudah terisi otomatis &mdash; periksa dan sesuaikan bila kurang tepat.</span>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="phone">No. HP</Label>
                            <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="08xxxxxxxxxx" />
                            {errors.phone && <InputError message={errors.phone} />}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Provinsi</Label>
                            <Combobox
                                items={provinces}
                                value={data.province_code}
                                onChange={(val) => setData((prev) => ({ ...prev, province_code: val, city_code: '', district_code: '', village_code: '' }))}
                                placeholder="Pilih Provinsi..."
                            />
                            {errors.province_code && <InputError message={errors.province_code} />}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Kabupaten / Kota</Label>
                            <Combobox
                                items={cities}
                                value={data.city_code}
                                disabled={!data.province_code}
                                onChange={(val) => setData((prev) => ({ ...prev, city_code: val, district_code: '', village_code: '' }))}
                                placeholder="Pilih Kabupaten/Kota..."
                            />
                            {errors.city_code && <InputError message={errors.city_code} />}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Kecamatan</Label>
                            <Combobox
                                items={districts}
                                value={data.district_code}
                                disabled={!data.city_code}
                                onChange={(val) => setData((prev) => ({ ...prev, district_code: val, village_code: '' }))}
                                placeholder="Pilih Kecamatan..."
                            />
                            {errors.district_code && <InputError message={errors.district_code} />}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Kelurahan / Desa</Label>
                            <Combobox
                                items={villages}
                                value={data.village_code}
                                disabled={!data.district_code}
                                onChange={(val) => setData('village_code', val)}
                                placeholder="Pilih Kelurahan/Desa..."
                            />
                            {errors.village_code && <InputError message={errors.village_code} />}
                        </div>

                        <Button type="submit" disabled={processing} className="w-full h-11 font-bold text-destructive-foreground uppercase tracking-wider rounded-lg shadow-none bg-destructive hover:bg-destructive/90">
                            {processing ? <IconLoader2 className="w-4 h-4 animate-spin" /> : 'Simpan & Lanjutkan'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

CompleteProfile.layout = (page) => <AppLayout children={page} title="Lengkapi Profil" />;

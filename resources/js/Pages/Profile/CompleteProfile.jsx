import BanjarField from '@/Components/BanjarField';
import { groupedRowsClass } from '@/Components/GroupedForm';
import InputError from '@/Components/InputError';
import RegionFields from '@/Components/RegionFields';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import { IconInfoCircle, IconLoader2, IconShieldCheck } from '@tabler/icons-react';

export default function CompleteProfile({ provinces, user, banjar_required = false }) {
	const { data, setData, post, processing, errors } = useForm({
		phone: user?.phone || '',
		province_code: '',
		city_code: '',
		district_code: '',
		village_code: '',
		banjar_id: '',
	});

	const onSubmit = (e) => {
		e.preventDefault();
		post(route('profile.complete.store'));
	};

	return (
		<div className="mx-auto w-full max-w-2xl py-8">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
						<IconShieldCheck className="h-5 w-5 text-destructive" /> Lengkapi Profil Anda
					</CardTitle>
					<CardDescription className="text-sm leading-relaxed text-muted-foreground">
						Sebelum melanjutkan, mohon lengkapi nomor HP dan wilayah <b>tempat tinggal</b> Anda sampai
						tingkat desa. Data ini dipakai untuk menentukan jangkauan notifikasi darurat di sekitar Anda.
						{/* Pendaftar selalu mulai sebagai warga; petugas dikecualikan dari layar ini
						    (CENTRALLY_MANAGED_ROLES). Laporan user 2026-11-06: petugas yang mendaftar sendiri
						    salah membaca isian ini sebagai wilayah TUGAS - kini disebut terang di kotak info. */}
						<span className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-muted p-3 text-xs leading-relaxed text-foreground/80">
							<IconInfoCircle className="mt-0.5 h-4 w-4 shrink-0 text-info" />
							<span>
								<b>Petugas Damkar?</b> Isi tetap dengan tempat tinggal Anda. Wilayah tugas diatur oleh
								admin saat akun Anda diangkat menjadi petugas (atau lewat undangan petugas dari admin),
								bukan di sini. Wilayah tempat tinggal bisa diubah kapan saja di halaman Profil.
							</span>
						</span>
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={onSubmit} className={groupedRowsClass}>
						<div className="space-y-1.5">
							<Label htmlFor="phone">No. HP</Label>
							<Input
								id="phone"
								type="tel"
								inputMode="tel"
								autoComplete="tel"
								value={data.phone}
								onChange={(e) => setData('phone', e.target.value)}
								placeholder="08xxxxxxxxxx"
							/>
							{errors.phone && <InputError message={errors.phone} />}
						</div>

						<RegionFields data={data} setData={setData} errors={errors} provinces={provinces} autoDetect />

						{/* Banjar — satuan komunitas di bawah desa. Ditanyakan di SINI, bukan di form
						    daftar (keputusan user 2026-08-26): layar ini sudah menanyakan wilayah sampai desa
						    sehingga pilihannya bisa langsung disaring, sementara menambahkannya ke form daftar
						    berarti menanyakan wilayah dua kali dan memberatkan pendaftaran darurat.
						    Selalu ditampilkan sejak 2026-08-26: warga kini bisa mengusulkan banjar yang belum
						    terdaftar, jadi menyembunyikannya saat daftar kosong justru menutup satu-satunya
						    jalan mengisi 11 desa yang masternya masih nihil. */}
						<BanjarField
							villageCode={data.village_code}
							value={data.banjar_id}
							onChange={(val) => setData('banjar_id', val)}
							error={errors.banjar_id}
							required={banjar_required}
							className="space-y-1.5"
						/>

						<Button
							type="submit"
							disabled={processing}
							className="h-11 w-full rounded-lg bg-destructive font-bold uppercase tracking-wide text-destructive-foreground shadow-none hover:bg-destructive/90"
						>
							{processing ? <IconLoader2 className="h-4 w-4 animate-spin" /> : 'Simpan & Lanjutkan'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

CompleteProfile.layout = (page) => <AppLayout children={page} title="Lengkapi Profil" />;

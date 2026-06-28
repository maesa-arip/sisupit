import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { Link, useForm } from '@inertiajs/react';
import { IconArrowLeft, IconCloudUpload, IconDeviceFloppy, IconLoader2, IconX } from '@tabler/icons-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

const MAX_PHOTOS = 6;

export default function Edit(props) {
    const report = props.report;

    const { data, setData, post, processing, errors } = useForm({
        title: report.title ?? '',
        description: report.description ?? '',
        address: report.address ?? '',
        photos: [], // foto baru yang ditambahkan
        removed_photos: [], // id foto galeri lama yang dihapus
        _method: props.page_settings.method,
    });

    const [previews, setPreviews] = useState([]); // preview foto baru
    const previewsRef = useRef([]);
    const fileInputPhoto = useRef(null);

    const existingPhotos = (report.photos || []).filter((p) => !data.removed_photos.includes(p.id));
    const totalPhotos = existingPhotos.length + data.photos.length;

    const onHandleChange = (e) => setData(e.target.name, e.target.value);

    const handleAddPhotos = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const room = MAX_PHOTOS - totalPhotos;
        const accepted = files.slice(0, Math.max(0, room));
        const combined = [...data.photos, ...accepted];
        setData('photos', combined);

        previewsRef.current.forEach((p) => URL.revokeObjectURL(p.url));
        const next = combined.map((f) => ({ url: URL.createObjectURL(f) }));
        previewsRef.current = next;
        setPreviews(next);

        if (fileInputPhoto.current) fileInputPhoto.current.value = '';
    };

    const removeNewPhoto = (index) => {
        const nextPhotos = data.photos.filter((_, i) => i !== index);
        setData('photos', nextPhotos);
        if (previews[index]) URL.revokeObjectURL(previews[index].url);
        const nextPrev = previews.filter((_, i) => i !== index);
        previewsRef.current = nextPrev;
        setPreviews(nextPrev);
    };

    const removeExistingPhoto = (id) => {
        setData('removed_photos', [...data.removed_photos, id]);
    };

    const onHandleSubmit = (e) => {
        e.preventDefault();
        if (totalPhotos < 1) {
            toast.warning('Laporan harus memiliki minimal satu foto.');
            return;
        }
        post(props.page_settings.action, {
            preserveScroll: true,
            onSuccess: (success) => {
                const flash = flashMessage(success);
                if (flash) toast[flash.type](flash.message);
            },
        });
    };

    return (
        <div className="relative w-full pb-32">
            <div className="flex flex-col w-full max-w-3xl mx-auto space-y-6">
                <div>
                    <Button
                        variant="outline"
                        className="h-9 px-4 rounded-md border-border bg-card text-sm font-medium text-foreground hover:bg-accent shadow-sm transition-colors"
                        asChild
                    >
                        <Link href={route('reports.show', report.id)}>
                            <IconArrowLeft className="w-4 h-4 mr-2" />
                            Batal
                        </Link>
                    </Button>
                </div>

                <Card className="overflow-hidden rounded-xl border border-border shadow-sm bg-card">
                    <CardHeader className="pb-5 border-b border-border bg-transparent">
                        <CardTitle className="text-lg font-semibold text-foreground">{props.page_settings.title}</CardTitle>
                        <CardDescription className="mt-1 text-sm text-muted-foreground">
                            {props.page_settings.subtitle}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-5 sm:p-6">
                        <form className="space-y-6" onSubmit={onHandleSubmit}>
                            <div>
                                <Label htmlFor="title" className="text-sm font-medium text-foreground/80">Apa yang terjadi?</Label>
                                <Input
                                    name="title"
                                    id="title"
                                    value={data.title}
                                    onChange={onHandleChange}
                                    className="h-10 mt-1.5 rounded-md border-border bg-card focus-visible:ring-1 focus-visible:ring-destructive"
                                />
                                {errors.title && <InputError message={errors.title} className="mt-1" />}
                            </div>

                            <div>
                                <Label htmlFor="description" className="text-sm font-medium text-foreground/80">Detail Kejadian</Label>
                                <Textarea
                                    name="description"
                                    id="description"
                                    value={data.description}
                                    onChange={onHandleChange}
                                    className="min-h-[100px] mt-1.5 resize-y rounded-md border-border bg-card p-3 text-sm focus-visible:ring-1 focus-visible:ring-destructive"
                                />
                                {errors.description && <InputError message={errors.description} className="mt-1" />}
                            </div>

                            <div>
                                <Label htmlFor="address" className="text-sm font-medium text-foreground/80">Detail Patokan Lokasi</Label>
                                <Input
                                    name="address"
                                    id="address"
                                    value={data.address}
                                    onChange={onHandleChange}
                                    className="h-10 mt-1.5 rounded-md border-border bg-card focus-visible:ring-1 focus-visible:ring-destructive"
                                    placeholder="Contoh: Samping warung cat biru, gang buntu..."
                                />
                                <p className="mt-1 text-[12px] text-muted-foreground">Titik GPS & wilayah tidak diubah di sini.</p>
                                {errors.address && <InputError message={errors.address} className="mt-1" />}
                            </div>

                            <div className="pt-2 border-t border-border">
                                <div className="mb-3 mt-4">
                                    <Label className="text-sm font-medium text-foreground/80">Foto Bukti ({totalPhotos}/{MAX_PHOTOS})</Label>
                                    <p className="text-[13px] text-muted-foreground mt-0.5">Hapus foto lama atau tambah foto baru. Minimal satu foto.</p>
                                </div>

                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    ref={fileInputPhoto}
                                    onChange={handleAddPhotos}
                                    className="sr-only"
                                />

                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {existingPhotos.map((p) => (
                                        <div key={`old-${p.id}`} className="relative w-full h-32 overflow-hidden border rounded-md shadow-sm border-border group">
                                            <img src={`/storage/${p.path}`} onError={(e) => (e.target.src = p.path)} alt="Foto" className="object-cover w-full h-full" />
                                            <button
                                                type="button"
                                                onClick={() => removeExistingPhoto(p.id)}
                                                className="absolute flex items-center justify-center text-red-600 transition-colors border border-transparent rounded-md shadow-sm w-7 h-7 dark:text-destructive top-2 right-2 bg-card/90 hover:bg-red-50 dark:hover:bg-destructive/10 backdrop-blur-sm hover:border-red-200 dark:hover:border-destructive/30"
                                                title="Hapus foto"
                                            >
                                                <IconX stroke={2.5} className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {previews.map((p, i) => (
                                        <div key={`new-${i}`} className="relative w-full h-32 overflow-hidden border rounded-md shadow-sm border-border group">
                                            <img src={p.url} alt={`Foto baru ${i + 1}`} className="object-cover w-full h-full" />
                                            <span className="absolute left-2 top-2 px-1.5 py-0.5 rounded bg-card/90 text-[9px] font-bold text-foreground border border-border">BARU</span>
                                            <button
                                                type="button"
                                                onClick={() => removeNewPhoto(i)}
                                                className="absolute flex items-center justify-center text-red-600 transition-colors border border-transparent rounded-md shadow-sm w-7 h-7 dark:text-destructive top-2 right-2 bg-card/90 hover:bg-red-50 dark:hover:bg-destructive/10 backdrop-blur-sm hover:border-red-200 dark:hover:border-destructive/30"
                                                title="Hapus foto"
                                            >
                                                <IconX stroke={2.5} className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {totalPhotos < MAX_PHOTOS && (
                                        <button
                                            type="button"
                                            onClick={() => fileInputPhoto.current?.click()}
                                            className="flex flex-col items-center justify-center w-full h-32 text-center transition-colors border border-dashed rounded-md border-border bg-muted/50 hover:bg-muted text-muted-foreground"
                                        >
                                            <IconCloudUpload className="w-6 h-6 mb-1" stroke={1.5} />
                                            <span className="text-xs font-semibold">Tambah foto</span>
                                        </button>
                                    )}
                                </div>
                                {errors.photos && <InputError message={errors.photos} className="mt-1" />}
                            </div>

                            <div className="pt-5 mt-5 border-t border-border">
                                <Button
                                    type="submit"
                                    className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-destructive px-8 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-70"
                                    disabled={processing}
                                >
                                    {processing ? <IconLoader2 className="w-5 h-5 animate-spin" /> : <IconDeviceFloppy className="w-5 h-5" />}
                                    Simpan Perubahan
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

Edit.layout = (page) => <AppLayout children={page} title="Edit Laporan" />;

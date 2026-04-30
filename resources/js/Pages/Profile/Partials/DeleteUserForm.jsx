import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        clearErrors();
        reset();
    };

    return (
        <Card className={`overflow-hidden border-red-200 dark:border-red-900/30 shadow-sm ${className}`}>
            <CardHeader className="pb-6 border-b border-red-100 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/20">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 rounded-xl">
                        <IconAlertTriangle size={24} stroke={1.5} />
                    </div>
                    <div>
                        <CardTitle className="text-xl text-red-700 dark:text-red-400">Hapus Akun</CardTitle>
                        <CardDescription className="mt-1.5 dark:text-slate-400">
                            Setelah akun Anda dihapus, semua sumber daya dan datanya akan dihapus secara permanen.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="pt-6">
                <div className="max-w-2xl">
                    <p className="mb-6 text-sm text-gray-600 dark:text-slate-400">
                        Sebelum menghapus akun Anda, harap unduh data atau informasi apa pun yang ingin Anda simpan. Proses ini tidak dapat dibatalkan.
                    </p>
                    
                    <Button 
                        variant="destructive" 
                        onClick={confirmUserDeletion}
                        className="px-8 rounded-xl"
                    >
                        Hapus Akun Permanen
                    </Button>
                </div>

                <Modal show={confirmingUserDeletion} onClose={closeModal}>
                    <form onSubmit={deleteUser} className="p-6 sm:p-8 dark:bg-slate-900">
                        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-slate-100">
                            <IconAlertTriangle className="text-red-500" />
                            Apakah Anda yakin?
                        </h2>

                        <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                            Setelah akun Anda dihapus, semua sumber daya dan datanya akan dihapus secara permanen. 
                            Silakan masukkan kata sandi Anda untuk mengonfirmasi bahwa Anda ingin menghapus akun Anda secara permanen.
                        </p>

                        <div className="mt-6">
                            <Label htmlFor="password" className="sr-only">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="block w-full sm:w-3/4 focus-visible:ring-red-500 dark:bg-slate-800"
                                placeholder="Masukkan kata sandi Anda"
                            />
                            {errors.password && (
                                <InputError message={errors.password} className="mt-2" />
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <Button type="button" variant="outline" className="rounded-xl" onClick={closeModal}>
                                Batal
                            </Button>
                            <Button 
                                variant="destructive" 
                                className="rounded-xl" 
                                disabled={processing}
                            >
                                Ya, Hapus Akun Saya
                            </Button>
                        </div>
                    </form>
                </Modal>
            </CardContent>
        </Card>
    );
}
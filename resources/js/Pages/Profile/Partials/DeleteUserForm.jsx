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
        <Card className={`overflow-hidden border border-[#e5e5e5] bg-white shadow-sm dark:bg-[#151515] dark:border-[#262626] rounded-xl ${className}`}>
            <CardHeader className="pb-5 border-b border-[#e5e5e5] bg-transparent dark:border-[#262626]">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-red-50 border border-red-100 p-2 text-red-600 dark:bg-[#2a1313] dark:border-[#4a1c1c] dark:text-[#ff6b6b]">
                        <IconAlertTriangle size={20} stroke={1.5} />
                    </div>
                    <div>
                        <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">Hapus Akun</CardTitle>
                        <CardDescription className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Setelah akun Anda dihapus, semua sumber daya dan datanya akan dihapus secara permanen.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="pt-5">
                <div className="max-w-2xl">
                    <p className="mb-5 text-sm text-gray-600 dark:text-gray-400">
                        Sebelum menghapus akun Anda, harap unduh data atau informasi apa pun yang ingin Anda simpan. Proses ini tidak dapat dibatalkan.
                    </p>
                    
                    <Button 
                        variant="destructive" 
                        onClick={confirmUserDeletion}
                        className="h-9 px-4 rounded-md text-sm font-medium transition-colors bg-[#b42826] hover:bg-[#9a2220] focus-visible:ring-2 focus-visible:ring-[#b42826]/50"
                    >
                        Hapus Akun Permanen
                    </Button>
                </div>

                <Modal show={confirmingUserDeletion} onClose={closeModal}>
                    <form onSubmit={deleteUser} className="p-6 sm:p-8 bg-white dark:bg-[#151515] rounded-xl border border-[#e5e5e5] dark:border-[#262626]">
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                            <IconAlertTriangle className="text-[#b42826] w-5 h-5" />
                            Apakah Anda yakin?
                        </h2>

                        <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                            Setelah akun Anda dihapus, semua sumber daya dan datanya akan dihapus secara permanen. 
                            Silakan masukkan kata sandi Anda untuk mengonfirmasi bahwa Anda ingin menghapus akun Anda secara permanen.
                        </p>

                        <div className="mt-5">
                            <Label htmlFor="password" className="sr-only">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="h-10 block w-full sm:w-3/4 rounded-md border-[#e5e5e5] bg-white focus-visible:ring-1 focus-visible:ring-[#b42826] dark:border-[#262626] dark:bg-[#101010] dark:text-gray-100"
                                placeholder="Masukkan kata sandi Anda"
                            />
                            {errors.password && (
                                <InputError message={errors.password} className="mt-2" />
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <Button type="button" variant="outline" className="h-9 rounded-md border-[#e5e5e5] dark:border-[#333] dark:text-gray-300 dark:bg-[#151515] dark:hover:bg-[#1f1f1f]" onClick={closeModal}>
                                Batal
                            </Button>
                            <Button 
                                variant="destructive" 
                                className="h-9 rounded-md bg-[#b42826] hover:bg-[#9a2220] focus-visible:ring-2 focus-visible:ring-[#b42826]/50" 
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
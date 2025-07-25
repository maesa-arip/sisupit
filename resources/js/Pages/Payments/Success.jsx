import { Button } from '@/Components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card'
import { Head, Link } from '@inertiajs/react'
import { IconCircleCheck } from '@tabler/icons-react'
import React from 'react'

export default function Success() {
  return (
    <>
        <Head title='Pembayaran sukses'/>
        <div className='flex items-center justify-center min-h-screen'>
            <div className='max-w-sm mx-auto'>
                <Card>
                    <CardHeader className='flex flex-row items-center gap-x-2'>
                        <IconCircleCheck className='text-green-500'/>
                        <div>
                            <CardTitle>Berhasil</CardTitle>
                            <CardDescription>Pembayaran Telah Sukses Diproses</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className='flex flex-col gap-y-6'>
                        <p className='text-start text-foreground'>
                            Terimakasih telah menyelesaikan pembayaran denda. Kami dengan senang hati mengkonfirmasi bahwa transaksi anda telah berhasil diproses. 
                        </p>
                        <Button variant='orange' asChild>
                            <Link href={route('dashboard')}>
                                Kembali
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    </>
  )
}

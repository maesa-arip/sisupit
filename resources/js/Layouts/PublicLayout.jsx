import ApplicationLogo from '@/Components/ApplicationLogo';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Button } from '@/Components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Toaster } from '@/Components/ui/sonner';
import { Head, Link, usePage } from '@inertiajs/react';
import Sidebar from './Partials/Sidebar';
import SidebarResponsive from './Partials/SidebarResponsive';
import Banner from '@/Components/Banner';
import ThemeSwitcher from '@/Components/ThemeSwitcher';
import PublicSidebarResponsive from './Partials/PublicSidebarResponsive';
import PublicSidebar from './Partials/PublicSidebar';
import { useEffect } from 'react';
export default function PublicLayout({ title, children }) {
	const { url } = usePage();
	const announcemet = usePage().props.announcemet;
	// const auth = usePage().props.auth.user;
	// console.log(auth)
useEffect(() => {
  let audio;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.onmessage = (event) => {
      if (event.data && event.data.type === 'PLAY_SOUND') {
        if (!audio) {
          audio = new Audio(event.data.soundUrl);
          audio.loop = true;
          audio.play().catch((error) => {
            console.warn('Gagal memutar suara:', error);
          });
        }
      }
    };

    // Hentikan audio saat notifikasi diklik (misalnya jika halaman / sudah terbuka)
    window.addEventListener('focus', () => {
      if (audio) {
        audio.pause();
        audio = null;
      }
    });
  }
}, []);


	return (
		<>
			<Head title={title} />
			<Toaster position="top-center" richColors />
			<div className="flex flex-row w-full min-h-screen">
				
				<div className="hidden w-1/5 border-r lg:block">
					<div className="flex flex-col h-full min-h-screen gap-2">
						<div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
							<ApplicationLogo />
						</div>
						<div className="flex-1">
							<PublicSidebar url={url} />
						</div>
					</div>
				</div>
				<div className="flex flex-col w-full lg:w-4/5">
					<header className="flex h-12 items-center justify-between gap-4 border-b px-4 lg:h-[60px] lg:justify-end lg:px-6">
						{/* sidebar responsive */}
						<PublicSidebarResponsive url={url} />
						{/* dropdown */}
						<ThemeSwitcher/>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size='lg' className="flex gap-x-2">
									<span>Hi,</span>
									{/* <Avatar>
										<AvatarImage src={auth.avatar} />
										<AvatarFallback>{auth.name.substring(0, 1)}</AvatarFallback>
									</Avatar> */}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem>Profile</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link href="#">Logout</Link>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</header>
					<main className="w-full">
						<div className="relative">
							<div
								className="absolute inset-x-0 overflow-hidden -top-40 -z-10 transform-gpu blur-3xl sm:-top-80"
								aria-hidden="true"
							>
								<div
									className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-orange-100 to-orange-200 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
									style={{
										clipPath:
											'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
									}}
								/>
							</div>
							<div className="gap-4 p-4 lg:gap-6">{children} {announcemet && announcemet.is_active == 1 && (
								<Banner message={announcemet.message} url={announcemet.url}/>
							)}</div>
						</div>
					</main>
				</div>
			</div>
		</>
	);
}

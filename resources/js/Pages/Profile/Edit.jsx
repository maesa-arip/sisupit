import { Button } from '@/Components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/Components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import AppLayout from '@/Layouts/AppLayout';
import { cn, flashMessage } from '@/lib/utils';
import { Link, router, usePage } from '@inertiajs/react';
import {
	IconAward,
	IconBrandAndroid,
	IconChevronRight,
	IconDeviceFloppy,
	IconDownload,
	IconHistory,
	IconLoader2,
	IconLock,
	IconLogout,
	IconMapPin,
	IconMedal,
	IconSettings,
	IconShieldCheck,
	IconUserEdit,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit(props) {
	const user = usePage().props.auth.user;
	const [openRelawan, setOpenRelawan] = useState(false);

	const [isWebView, setIsWebView] = useState(true);

	useEffect(() => {
		const checkWebView = () => {
			const ua = navigator.userAgent || navigator.vendor || window.opera;
			const isAndroidWebView = /wv|Android.*Version\/[\d\.]+/i.test(ua);
			const isIOSWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(ua);
			const isInAppBrowser = /FBAV|FBAN|Instagram|Line|Twitter|MicroMessenger/i.test(ua);
			const isMyOwnApp = /SisupitApp/i.test(ua);

			return isAndroidWebView || isIOSWebView || isInAppBrowser || isMyOwnApp;
		};
		setIsWebView(checkWebView());
	}, []);

	const userRoles = Array.isArray(user?.role) ? user.role : user?.role ? [user.role] : [];
	const isVolunteer = userRoles.includes('relawan');
	const isAdmin = userRoles.includes('petugas') || userRoles.includes('admin');
	//  console.log('User Roles:', userRoles, 'Is Volunteer:', isVolunteer);

	// Editor keahlian relawan (lihat VolunteerController::updateSkills).
	// Master keahlian (App\Models\Skill) dari prop skillOptions; nilai tersimpan di auth.user.skills.
	const SKILL_OPTIONS = Array.isArray(props.skillOptions) ? props.skillOptions : [];
	const [skills, setSkills] = useState(Array.isArray(user?.skills) ? user.skills : []);
	const [isSavingSkills, setIsSavingSkills] = useState(false);

	const toggleSkill = (skill) => {
		setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
	};

	const handleSaveSkills = () => {
		setIsSavingSkills(true);
		router.post(
			route('volunteer.skills'),
			{ skills },
			{
				preserveScroll: true,
				onSuccess: () => toast.success('Keahlian berhasil diperbarui.'),
				onError: () => toast.error('Gagal menyimpan keahlian. Silakan coba lagi.'),
				onFinish: () => setIsSavingSkills(false),
			},
		);
	};

	const handleDaftarRelawan = () => {
		router.put(
			route('admin.relawan.update', { user: user.id }),
			{},
			{
				onSuccess: () => {
					setOpenRelawan(false);
					const flash = flashMessage('success');
					if (flash) toast[flash.type](flash.message);
					toast.success('Berhasil mendaftar sebagai relawan!');
				},
			},
		);
	};

	return (
		<div className="relative w-full pb-32">
			<div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col space-y-6">
				{/* --- 1. HEADER PROFIL & LOGOUT --- */}
				<div className="mt-4 flex flex-col items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-start sm:p-6">
					<div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
						<div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-3xl font-semibold text-foreground">
							{user.name?.[0]?.toUpperCase() ?? 'U'}
							{(isVolunteer || isAdmin) && (
								<div className="absolute bottom-0 right-0 rounded-full border-2 border-background bg-blue-600 p-1 text-white dark:bg-info dark:text-info-foreground">
									<IconShieldCheck size={14} stroke={2} />
								</div>
							)}
						</div>
						<div className="mt-2 flex flex-col items-center text-center sm:mt-0 sm:items-start sm:text-left">
							<h2 className="text-xl font-semibold leading-tight text-foreground">{user.name}</h2>
							<p className="text-sm font-medium text-muted-foreground">{user.email}</p>
							<span
								className={`mt-2 rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${isVolunteer ? 'border-blue-100 bg-blue-50 text-blue-600 dark:border-info/20 dark:bg-info/10 dark:text-info' : isAdmin ? 'border-green-100 bg-green-50 text-green-600 dark:border-success/20 dark:bg-success/10 dark:text-success' : 'border-border bg-muted text-muted-foreground'}`}
							>
								{isVolunteer ? 'Relawan Aktif' : isAdmin ? 'Administrator' : 'Anggota Masyarakat'}
							</span>
						</div>
					</div>

					<Link
						href={route('logout')}
						method="post"
						as="button"
						className="flex items-center gap-1.5 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-red-100 dark:border-destructive/20 dark:bg-destructive/10 dark:hover:bg-destructive/20"
					>
						<IconLogout size={16} stroke={2} />
						Keluar
					</Link>
				</div>

				{/* --- YURISDIKSI AKUN --- */}
				{props.jurisdiction && (
					<div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
						<div className="flex items-center justify-between gap-3">
							<h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
								<IconMapPin size={18} className="text-muted-foreground" /> Yurisdiksi Akun
							</h3>
							<span className="shrink-0 rounded-md border border-border bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
								{props.jurisdiction.scope.level}
							</span>
						</div>

						{props.jurisdiction.scope.name && (
							<p className="mt-3 text-base font-semibold capitalize text-foreground">
								{props.jurisdiction.scope.name.toLowerCase()}
							</p>
						)}

						{props.jurisdiction.levels.length > 0 ? (
							<dl className="mt-4 space-y-2.5">
								{props.jurisdiction.levels.map((level) => (
									<div
										key={level.label}
										className="flex items-start justify-between gap-4 border-b border-border/60 pb-2.5 text-sm last:border-b-0 last:pb-0"
									>
										<dt className="shrink-0 text-muted-foreground">{level.label}</dt>
										<dd className="text-right font-medium capitalize text-foreground">
											{level.name.toLowerCase()}
										</dd>
									</div>
								))}
							</dl>
						) : (
							<p className="mt-3 text-sm text-muted-foreground">
								Cakupan nasional — tidak terbatas pada wilayah tertentu.
							</p>
						)}
					</div>
				)}

				{/* --- KEAHLIAN RELAWAN --- */}
				{isVolunteer && (
					<div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-foreground">
								<IconMedal className="h-5 w-5" stroke={1.5} />
							</div>
							<div>
								<h3 className="text-sm font-semibold text-foreground">Keahlian Saya</h3>
								<p className="mt-0.5 text-xs text-muted-foreground">
									Beritahu kami pelatihan apa yang pernah Anda ikuti.
								</p>
							</div>
						</div>

						<div className="mt-4 flex flex-wrap gap-2">
							{SKILL_OPTIONS.map((skill) => {
								const selected = skills.includes(skill);
								return (
									<button
										key={skill}
										type="button"
										onClick={() => toggleSkill(skill)}
										className={cn(
											'flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
											selected
												? 'border-destructive bg-destructive/10 text-destructive'
												: 'border-border bg-card text-foreground/80 hover:bg-muted',
										)}
									>
										<IconMedal className="h-3.5 w-3.5" stroke={selected ? 2 : 1.5} />
										{skill}
									</button>
								);
							})}
						</div>

						<div className="mt-4 flex justify-end">
							<Button
								onClick={handleSaveSkills}
								disabled={isSavingSkills}
								className="h-9 shrink-0 rounded-md border border-transparent bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
							>
								{isSavingSkills ? (
									<IconLoader2 className="mr-1.5 h-4 w-4 animate-spin" />
								) : (
									<IconDeviceFloppy className="mr-1.5 h-4 w-4" />
								)}
								Simpan Keahlian
							</Button>
						</div>
					</div>
				)}

				{/* --- 2. QUICK ACTIONS (Riwayat & Banner) --- */}
				<div className="space-y-4">
					<Link
						href={route('front.reports.index')}
						className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm outline-none transition-colors hover:border-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-muted-foreground/50"
					>
						<div className="shrink-0 rounded-lg border border-border bg-muted p-2.5 text-muted-foreground transition-colors group-hover:bg-accent">
							<IconHistory size={20} />
						</div>
						<div className="flex-1">
							<h3 className="text-sm font-semibold text-foreground">Riwayat Laporan Saya</h3>
							<p className="mt-0.5 text-xs text-muted-foreground">
								Pantau status kejadian yang pernah Anda laporkan
							</p>
						</div>
						<IconChevronRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground" />
					</Link>

					{!isVolunteer && !isAdmin && (
						<div className="relative flex flex-col items-start justify-between gap-4 overflow-hidden rounded-xl border border-border bg-secondary p-5 text-secondary-foreground sm:flex-row sm:items-center sm:p-6">
							<div className="relative z-10">
								<h3 className="flex items-center gap-2 text-base font-semibold">
									<IconAward size={20} /> Panggilan Kemanusiaan
								</h3>
								<p className="mt-1.5 max-w-md text-sm leading-relaxed text-secondary-foreground/70">
									Jadilah pahlawan di sekitar Anda. Daftar sebagai relawan untuk merespons keadaan
									darurat lebih cepat.
								</p>
							</div>
							<Button
								onClick={() => setOpenRelawan(true)}
								className="relative z-10 h-9 w-full shrink-0 rounded-md border border-border bg-secondary-foreground text-sm font-medium text-secondary hover:bg-secondary-foreground/90 sm:w-auto"
							>
								Daftar Relawan
							</Button>
							<IconShieldCheck
								size={100}
								className="pointer-events-none absolute -bottom-6 -right-4 rotate-12 text-secondary-foreground/5"
							/>
						</div>
					)}
				</div>

				{/* --- 3. PENGATURAN AKUN (MENGGUNAKAN TABS) --- */}
				<div className="pt-4">
					<h3 className="mb-4 flex items-center gap-2 px-1 text-sm font-semibold uppercase tracking-wider text-foreground">
						<IconSettings size={18} className="text-muted-foreground" /> Pengaturan & Keamanan
					</h3>

					<Tabs defaultValue="profil" className="w-full">
						<TabsList className="mb-6 grid h-fit w-full grid-cols-2 rounded-lg border border-border bg-muted p-1">
							<TabsTrigger
								value="profil"
								className="flex items-center gap-2 rounded-md py-2 text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
							>
								<IconUserEdit size={16} /> Data Profil
							</TabsTrigger>
							<TabsTrigger
								value="keamanan"
								className="flex items-center gap-2 rounded-md py-2 text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
							>
								<IconLock size={16} /> Kata Sandi
							</TabsTrigger>
						</TabsList>

						<TabsContent value="profil" className="mt-0 outline-none focus-visible:ring-0">
							<UpdateProfileInformationForm
								mustVerifyEmail={props.mustVerifyEmail}
								status={props.status}
							/>
						</TabsContent>

						<TabsContent value="keamanan" className="mt-0 outline-none focus-visible:ring-0">
							<UpdatePasswordForm />
						</TabsContent>
					</Tabs>
				</div>
			</div>
			{/* --- UNDUH APLIKASI --- */}
			{!isWebView && (
				<div className="mt-4 flex w-full flex-col items-center">
					<a
						href="/apk/sisupit.apk"
						download="Sisupit.apk"
						className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 font-medium text-foreground shadow-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-muted-foreground/50 sm:w-auto"
					>
						<div className="flex items-center justify-center rounded-md bg-green-50 p-1 dark:bg-success/10">
							<IconBrandAndroid className="h-5 w-5 text-green-600 dark:text-success" stroke={2} />
						</div>
						<span className="text-sm">Unduh Aplikasi Android</span>
						<IconDownload className="ml-1 h-4 w-4 text-muted-foreground" stroke={2} />
					</a>
				</div>
			)}

			{/* MODAL DAFTAR RELAWAN */}
			<Dialog open={openRelawan} onOpenChange={setOpenRelawan}>
				<DialogContent className="w-[95vw] max-w-md rounded-xl border border-border bg-card p-0 shadow-sm">
					<DialogHeader className="border-b border-border p-5">
						<DialogTitle className="text-base font-semibold text-foreground">
							Konfirmasi Pendaftaran
						</DialogTitle>
						<DialogDescription className="mt-2 text-sm text-muted-foreground">
							Dengan mendaftar sebagai relawan, lokasi Anda akan dapat dilacak saat menuju lokasi kejadian
							untuk membantu pelapor. Pastikan profil (KTP & No. HP) Anda sudah diisi dengan data asli.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="gap-2 p-5 sm:justify-end">
						<Button
							variant="outline"
							className="h-9 rounded-md border-border bg-card text-foreground hover:bg-accent"
							onClick={() => setOpenRelawan(false)}
						>
							Batal
						</Button>
						<Button
							className="h-9 rounded-md bg-blue-600 font-medium text-white hover:bg-blue-700 dark:bg-info dark:text-info-foreground dark:hover:bg-info/90"
							onClick={handleDaftarRelawan}
						>
							Ya, Daftarkan Saya
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

Edit.layout = (page) => <AppLayout children={page} title={'Profil Pengguna'} />;

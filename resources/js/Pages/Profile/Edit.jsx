import BanjarField from '@/Components/BanjarField';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/Components/ui/alert-dialog';
import { Button } from '@/Components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import AppLayout from '@/Layouts/AppLayout';
import { cn, roleLabel, roleTone } from '@/lib/utils';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import {
	IconBrandAndroid,
	IconChevronRight,
	IconDeviceDesktopOff,
	IconDeviceFloppy,
	IconDownload,
	IconHistory,
	IconHome2,
	IconLoader2,
	IconLock,
	IconLogout,
	IconMapPin,
	IconMedal,
	IconShieldCheck,
	IconUserEdit,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import NotificationDeviceCard from '@/Components/NotificationDeviceCard';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit(props) {
	const user = usePage().props.auth.user;
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
	// Nama & warna peran dibaca dari kamus bersama (lib/utils.js), bukan dari tangga `if` —
	// bentuk lama menyebut akun OPD, pejabat, dan superadmin "Anggota Masyarakat" karena
	// ketiganya jatuh ke cabang terakhir (FINDINGS #90). Lencana perisai ikut kamus itu juga:
	// yang bukan warga biasa mendapatkannya.
	const accountRole = roleLabel(userRoles);
	const isPlainCitizen = userRoles.length === 0 || (userRoles.length === 1 && userRoles[0] === 'warga');
	//  console.log('User Roles:', userRoles, 'Is Volunteer:', isVolunteer);

	// Editor keahlian relawan (lihat VolunteerController::updateSkills).
	// Master keahlian (App\Models\Skill) dari prop skillOptions; nilai tersimpan di auth.user.skills.
	const SKILL_OPTIONS = Array.isArray(props.skillOptions) ? props.skillOptions : [];
	const [skills, setSkills] = useState(Array.isArray(user?.skills) ? user.skills : []);
	const [isSavingSkills, setIsSavingSkills] = useState(false);
	const [confirmLogoutEverywhere, setConfirmLogoutEverywhere] = useState(false);

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

	// Tata letak ala layar Settings iOS (TASK_69, apple-design, khusus branch feat/mobile-native-polish):
	// kepala identitas di tengah, lalu grup-grup bergaris rambut berjudul kecil, dan "Keluar" sebagai
	// baris merah tersendiri di bawah - bukan tombol di pojok kartu identitas.
	const Group = ({ title, footer, children }) => (
		<section className="space-y-2">
			{title && (
				<h2 className="px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
					{title}
				</h2>
			)}
			<div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
				{children}
			</div>
			{footer && <p className="px-4 text-xs leading-relaxed text-muted-foreground">{footer}</p>}
		</section>
	);
	const RowLink = ({ href, icon: Icon, tint, title, subtitle, ...rest }) => (
		<Link
			href={href}
			{...rest}
			className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 active:bg-muted"
		>
			<span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', tint)}>
				<Icon size={18} stroke={1.75} />
			</span>
			<span className="min-w-0 flex-1">
				<span className="block truncate text-[15px] font-medium text-foreground">{title}</span>
				{subtitle && <span className="block truncate text-[13px] text-muted-foreground">{subtitle}</span>}
			</span>
			<IconChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
		</Link>
	);

	return (
		<div className="relative w-full pb-32">
			<div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-8">
				{/* --- KEPALA IDENTITAS --- */}
				<div className="mt-2 flex flex-col items-center text-center">
					<div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-muted text-4xl font-semibold text-foreground">
						{user.name?.[0]?.toUpperCase() ?? 'U'}
						{!isPlainCitizen && (
							<div className="absolute bottom-0.5 right-0.5 rounded-full border-[3px] border-background bg-info p-1 text-info-foreground">
								<IconShieldCheck size={14} stroke={2} />
							</div>
						)}
					</div>
					<h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">{user.name}</h1>
					<p className="mt-0.5 text-[15px] text-muted-foreground">{user.email}</p>
					<span className={`mt-3 rounded-full border px-3 py-1 text-xs font-semibold ${roleTone(userRoles)}`}>
						{accountRole}
					</span>
				</div>

				{/* --- WILAYAH AKUN --- */}
				{props.jurisdiction && (
					<Group
						title={props.jurisdiction.kind === 'tugas' ? 'Wilayah Tugas' : 'Wilayah Domisili'}
						footer={
							props.jurisdiction.kind === 'tugas'
								? 'Wilayah tempat Anda bertugas, ditetapkan admin. Wilayah ini menentukan laporan dan notifikasi yang Anda terima. Tempat tinggal Anda dicatat terpisah di isian Alamat Tinggal.'
								: 'Wilayah tempat tinggal Anda. Wilayah ini menentukan notifikasi darurat di sekitar Anda.'
						}
					>
						{/* Kode wilayah akun bagi petugas/staf = tempat BERTUGAS, bukan tempat tinggal
						    (TASK_61). Tempat tinggal dicatat terpisah di isian Alamat Tinggal. */}
						<div className="flex items-center justify-between gap-3 px-4 py-3">
							<span className="flex items-center gap-3 text-[15px] font-medium text-foreground">
								<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
									<IconMapPin size={18} stroke={1.75} />
								</span>
								<span className="capitalize">
									{props.jurisdiction.scope.name
										? props.jurisdiction.scope.name.toLowerCase()
										: 'Nasional'}
								</span>
							</span>
							<span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
								{props.jurisdiction.scope.level}
							</span>
						</div>
						{props.jurisdiction.levels.length > 0 ? (
							props.jurisdiction.levels.map((level) => (
								<div
									key={level.label}
									className="flex items-start justify-between gap-4 px-4 py-3 text-[15px]"
								>
									<span className="shrink-0 text-muted-foreground">{level.label}</span>
									<span className="text-right font-medium capitalize text-foreground">
										{level.name.toLowerCase()}
									</span>
								</div>
							))
						) : (
							<p className="px-4 py-3 text-[15px] text-muted-foreground">
								Cakupan nasional - tidak terbatas pada wilayah tertentu.
							</p>
						)}
					</Group>
				)}

				{/* --- BANJAR --- */}
				{/* Terpisah dari kartu wilayah di atas yang murni tampilan: banjar BOLEH diubah
				    (warga pindah banjar, atau salah pilih saat mendaftar), sedangkan kode wilayah akun
				    tidak — ia menentukan apa yang dilihat & notifikasi apa yang diterima. Hanya muncul
				    bagi akun yang punya desa; staf kabupaten/kecamatan sengaja tak berbanjar (#56). */}
				{props.banjar && <BanjarCard banjar={props.banjar} />}

				{/* --- KEAHLIAN RELAWAN --- */}
				{isVolunteer && (
					<Group title="Keahlian Saya" footer="Beritahu kami pelatihan apa yang pernah Anda ikuti.">
						<div className="flex flex-wrap gap-2 p-4">
							{SKILL_OPTIONS.map((skill) => {
								const selected = skills.includes(skill);
								return (
									<button
										key={skill}
										type="button"
										aria-pressed={selected}
										onClick={() => toggleSkill(skill)}
										className={cn(
											'flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors active:scale-[0.97] motion-reduce:active:scale-100',
											selected
												? 'border-primary/30 bg-primary/10 text-primary'
												: 'border-border/70 bg-card text-foreground/80 hover:bg-muted',
										)}
									>
										<IconMedal className="h-4 w-4" stroke={selected ? 2 : 1.5} />
										{skill}
									</button>
								);
							})}
						</div>
						<div className="flex justify-end px-4 py-3">
							<Button
								onClick={handleSaveSkills}
								disabled={isSavingSkills}
								className="h-10 rounded-xl px-4"
							>
								{isSavingSkills ? (
									<IconLoader2 className="h-4 w-4 animate-spin" />
								) : (
									<IconDeviceFloppy className="h-4 w-4" />
								)}
								Simpan keahlian
							</Button>
						</div>
					</Group>
				)}

				{/* --- AKTIVITAS --- */}
				{/* Banner "Panggilan Kemanusiaan" (ajakan mendaftar jadi relawan) DICABUT
				    2026-09-02 atas permintaan user, sepasang dengan kartu serupa di
				    Pages/Dashboard.jsx. Peran relawan kini hanya diberikan admin lewat
				    /admin/users - tak ada lagi pendaftaran mandiri di layar mana pun.
				    Jangan hidupkan lagi tanpa menanyakan user. */}
				<Group title="Aktivitas">
					<RowLink
						href={route('front.reports.index')}
						icon={IconHistory}
						tint="bg-info/10 text-info"
						title="Riwayat Laporan Saya"
						subtitle="Pantau status kejadian yang pernah Anda laporkan"
					/>
				</Group>

				{/* --- PENGATURAN AKUN --- */}
				<section className="space-y-2">
					<h2 className="px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
						Akun
					</h2>
					<Tabs defaultValue="profil" className="w-full">
						<TabsList className="mb-4 grid h-auto w-full grid-cols-2 rounded-xl bg-muted p-1">
							<TabsTrigger
								value="profil"
								className="flex h-9 items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
							>
								<IconUserEdit size={16} /> Data profil
							</TabsTrigger>
							<TabsTrigger
								value="keamanan"
								className="flex h-9 items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
							>
								<IconLock size={16} /> Kata sandi
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
				</section>

				{/* --- APLIKASI --- */}
				{/* #182: status notifikasi HP ini + uji bunyi. Ditaut banner dashboard & ketukan
				    notifikasi uji lewat #notifikasi-hp - jangan ganti id-nya. */}
				<div id="notifikasi-hp" className="scroll-mt-20">
					<Group
						title="Notifikasi di HP ini"
						footer="Tidak berbunyi? Matikan optimasi baterai untuk Sisupit, naikkan volume alarm, dan izinkan Sisupit menembus mode Jangan Ganggu di Setelan HP."
					>
						<NotificationDeviceCard tests={props.notificationTests ?? []} />
					</Group>
				</div>

				{!isWebView && (
					<Group title="Aplikasi">
						<a
							href="/apk/sisupit.apk"
							download="Sisupit.apk"
							className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 active:bg-muted"
						>
							<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
								<IconBrandAndroid size={18} stroke={1.75} />
							</span>
							<span className="flex-1 text-[15px] font-medium text-foreground">
								Unduh Aplikasi Android
							</span>
							<IconDownload className="h-4 w-4 shrink-0 text-muted-foreground" stroke={2} />
						</a>
					</Group>
				)}

				{/* --- KELUAR --- */}
				<Group>
					<Link
						href={route('logout')}
						method="post"
						as="button"
						className="flex min-h-[52px] w-full items-center justify-center gap-2 px-4 py-3 text-[15px] font-semibold text-destructive transition-colors hover:bg-destructive/5 active:bg-destructive/10"
					>
						<IconLogout size={18} stroke={2} />
						Keluar
					</Link>
					{/* TASK_73: Keluar di atas hanya mengeluarkan perangkat ini. */}
					<button
						type="button"
						onClick={() => setConfirmLogoutEverywhere(true)}
						className="flex min-h-[52px] w-full items-center justify-center gap-2 px-4 py-3 text-[15px] font-medium text-muted-foreground transition-colors hover:bg-muted/50 active:bg-muted"
					>
						<IconDeviceDesktopOff size={18} stroke={2} />
						Keluar dari semua perangkat
					</button>
				</Group>

				<AlertDialog open={confirmLogoutEverywhere} onOpenChange={setConfirmLogoutEverywhere}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Keluar dari semua perangkat?</AlertDialogTitle>
							<AlertDialogDescription>
								Akun Anda dikeluarkan dari semua HP, aplikasi, dan browser - termasuk yang ini. Semua
								perangkat berhenti menerima notifikasi sampai Anda masuk lagi. Pakai ini bila HP hilang
								atau pernah dipinjam orang lain.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
							<AlertDialogAction
								className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
								onClick={() => router.post(route('profile.logout-everywhere'))}
							>
								Keluar dari semua
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				{/* Syarat Google Play: hapus akun dari dalam aplikasi. Tautan web yang didaftarkan
				    ke Play Console = /profile#hapus-akun - jangan ganti id-nya tanpa memperbarui Play. */}
				<div id="hapus-akun" className="scroll-mt-20">
					<DeleteUserForm hasPassword={props.hasPassword} />
				</div>
			</div>
		</div>
	);
}

Edit.layout = (page) => <AppLayout children={page} title={'Profil Pengguna'} />;

/**
 * Kartu ubah banjar. Memakai <BanjarField/> yang sama dengan layar Lengkapi Profil & form
 * hydrant warga, jadi perilaku "usulkan yang belum terdaftar" dan pencegah duplikatnya ikut
 * tanpa satu baris pun disalin.
 */
function BanjarCard({ banjar }) {
	const { data, setData, patch, processing, errors, isDirty } = useForm({
		banjar_id: banjar.banjar_id || '',
	});

	const simpan = (e) => {
		e.preventDefault();
		patch(route('profile.banjar'), { preserveScroll: true });
	};

	return (
		<form onSubmit={simpan} className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
			<h3 className="flex items-center gap-3 text-[15px] font-semibold text-foreground">
				<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal/10 text-teal">
					<IconHome2 size={18} stroke={1.75} />
				</span>
				Banjar
			</h3>
			<p className="mt-2 text-[13px] text-muted-foreground">
				Banjar tempat Anda tinggal. Belum terdaftar? Ketik namanya lalu tambahkan sendiri.
			</p>

			<div className="mt-4">
				<BanjarField
					villageCode={banjar.village_code}
					value={data.banjar_id}
					onChange={(val) => setData('banjar_id', val)}
					error={errors.banjar_id}
					required={banjar.required}
					label=""
				/>
			</div>

			<Button type="submit" disabled={processing || !isDirty} className="mt-4 h-10 rounded-xl px-4">
				Simpan
			</Button>
		</form>
	);
}

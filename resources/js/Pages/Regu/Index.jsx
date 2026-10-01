import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
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
import { CardContent } from '@/Components/ui/card';
import { Checkbox } from '@/Components/ui/checkbox';
import { Combobox } from '@/Components/ui/combobox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { Head, router, useForm } from '@inertiajs/react';
import { IconEdit, IconPlus, IconSearch, IconShieldHalf, IconTrash, IconUsers } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Regu & Danru (TASK_60). Satu halaman untuk dua peran:
 *   - admin/superadmin membuat regu, menunjuk danru, mengganti nama, menghapus;
 *   - danru (petugas) mengatur siapa saja anggota regunya sendiri.
 * Hak tombolnya dibaca dari prop SERVER (`can.manage`, `can_manage_members` per regu), bukan dari
 * daftar peran di sini (#101) - gerbangnya ada di ReguController.
 */
export default function Index({ regus, candidates, can }) {
	const [editing, setEditing] = useState(null); // null = tertutup, {} = regu baru, regu = sunting
	const [membersOf, setMembersOf] = useState(null);
	const [selectedIds, setSelectedIds] = useState([]);
	const [reguToDelete, setReguToDelete] = useState(null);
	const [memberErrors, setMemberErrors] = useState({});
	const [memberQuery, setMemberQuery] = useState('');

	const form = useForm({ name: '', leader_id: '' });

	const toastFlash = (success) => {
		const flash = flashMessage(success);
		if (flash) toast[flash.type](flash.message);
	};

	const openForm = (regu = {}) => {
		form.clearErrors();
		form.setData({ name: regu.name || '', leader_id: regu.leader ? String(regu.leader.id) : '' });
		setEditing(regu);
	};

	const submitForm = (e) => {
		e.preventDefault();
		const options = {
			preserveScroll: true,
			onSuccess: (success) => {
				setEditing(null);
				toastFlash(success);
			},
		};
		if (editing?.id) form.put(route('regu.update', editing.id), options);
		else form.post(route('regu.store'), options);
	};

	const openMembers = (regu) => {
		setMemberErrors({});
		setMemberQuery('');
		setSelectedIds(regu.members.map((m) => m.id));
		setMembersOf(regu);
	};

	const toggleMember = (id) => {
		setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
	};

	const submitMembers = () => {
		router.put(
			route('regu.members', membersOf.id),
			{ member_ids: selectedIds },
			{
				preserveScroll: true,
				onSuccess: (success) => {
					setMembersOf(null);
					toastFlash(success);
				},
				onError: (errors) => setMemberErrors(errors),
			},
		);
	};

	const confirmDelete = () => {
		router.delete(route('regu.destroy', reguToDelete.id), {
			preserveScroll: true,
			onSuccess: (success) => {
				setReguToDelete(null);
				toastFlash(success);
			},
		});
	};

	// Rincian pembeda untuk nama yang mirip. Hanya terisi bagi admin - server tidak mengirim
	// email/telepon/wilayah ke danru (lihat ReguController::index).
	const candidateDetail = (c) => [c.email, c.phone, c.wilayah].filter(Boolean).join(' . ');

	// Pencarian di "Atur Anggota" (prod: 80+ petugas). Hanya MENYARING tampilan - centang tetap di
	// `selectedIds`, jadi anggota yang tersembunyi oleh pencarian tidak ikut terlepas saat disimpan.
	const memberCandidates = candidates.filter((c) => c.id !== membersOf?.leader?.id);
	const memberNeedle = memberQuery.trim().toLowerCase();
	const visibleMembers = memberNeedle
		? memberCandidates.filter((c) =>
				[c.name, candidateDetail(c), c.regu_name]
					.filter(Boolean)
					.join(' ')
					.toLowerCase()
					.includes(memberNeedle),
			)
		: memberCandidates;

	// Calon danru: petugas yang belum beregu, atau yang sudah di regu yang sedang disunting.
	const leaderOptions = candidates.filter((c) => !c.regu_id || (editing?.id && c.regu_id === editing.id));

	return (
		<div className="flex h-full w-full flex-col space-y-6">
			<Head title="Manajemen Regu" />

			<div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
				<HeaderTitle
					title="Manajemen Regu"
					subtitle="Saat meluncur, nama regu yang tampil. Tiap anggota tetap memilih sendiri: Meluncur atau Jaga di Kantor."
					icon={IconShieldHalf}
				/>
				{can.manage && (
					<Button size="sm" onClick={() => openForm()}>
						<IconPlus className="mr-1.5 h-4 w-4" /> Tambah Regu
					</Button>
				)}
			</div>

			<div className="flex flex-col gap-3">
				{regus.length > 0 ? (
					<div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
						{regus.map((regu) => (
							<div key={regu.id}>
								<CardContent className="flex flex-col gap-3 p-3 sm:p-4">
									<div className="flex flex-row items-start gap-3">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
											<IconUsers className="h-5 w-5" />
										</div>
										<div className="min-w-0 flex-1">
											<h3 className="truncate text-sm font-semibold text-foreground">
												{regu.name}
											</h3>
											<p className="mt-0.5 truncate text-xs text-muted-foreground">
												Danru: {regu.leader?.name || '-'} . {regu.members.length} anggota
											</p>
										</div>
										{can.manage && (
											<div className="flex shrink-0 gap-1">
												<Button variant="ghost" size="icon" onClick={() => openForm(regu)}>
													<IconEdit className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="text-destructive hover:text-destructive"
													onClick={() => setReguToDelete(regu)}
												>
													<IconTrash className="h-4 w-4" />
												</Button>
											</div>
										)}
									</div>

									<div className="flex flex-wrap gap-1.5">
										{regu.members.map((m) => (
											<span
												key={m.id}
												className="rounded-2xl border border-border bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
											>
												{m.name}
												{regu.leader?.id === m.id && ' (Danru)'}
											</span>
										))}
									</div>

									{regu.can_manage_members && (
										<Button
											size="sm"
											variant="secondary"
											className="self-start"
											onClick={() => openMembers(regu)}
										>
											<IconUsers className="mr-1.5 h-4 w-4" /> Atur Anggota
										</Button>
									)}
								</CardContent>
							</div>
						))}
					</div>
				) : (
					<div className="rounded-2xl border border-dashed border-input p-10 text-center">
						<span className="text-sm text-muted-foreground">
							{can.manage
								? 'Belum ada regu. Tambahkan regu lalu tunjuk danrunya; danru yang akan mengatur anggotanya.'
								: 'Anda belum tergabung dalam regu mana pun. Hubungi admin atau danru Anda.'}
						</span>
					</div>
				)}
			</div>

			{/* Buat / sunting regu - admin saja */}
			<Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
				<DialogContent className="grid-cols-[minmax(0,1fr)]">
					<form onSubmit={submitForm} className="space-y-4">
						<DialogHeader>
							<DialogTitle>{editing?.id ? 'Ubah Regu' : 'Tambah Regu'}</DialogTitle>
						</DialogHeader>
						<div className="space-y-2">
							<Label htmlFor="name">Nama Regu</Label>
							<Input
								id="name"
								value={form.data.name}
								onChange={(e) => form.setData('name', e.target.value)}
								placeholder="mis. Regu A"
							/>
							<InputError message={form.errors.name} />
						</div>
						<div className="space-y-2">
							<Label>Danru (Komandan Regu)</Label>
							<Combobox
								items={leaderOptions.map((c) => ({
									code: String(c.id),
									name: c.name,
									keywords: [c.email, c.phone, c.wilayah].filter(Boolean),
									detail: candidateDetail(c),
								}))}
								value={form.data.leader_id}
								onChange={(v) => form.setData('leader_id', v)}
								placeholder="Pilih petugas"
								emptyText="Petugas tidak ditemukan."
								itemDescription={(item) =>
									item.detail && (
										<span className="truncate text-xs text-muted-foreground">{item.detail}</span>
									)
								}
								modal
							/>
							{leaderOptions.length === 0 && (
								<p className="text-xs text-muted-foreground">
									Tidak ada petugas yang belum beregu di wilayah Anda.
								</p>
							)}
							<InputError message={form.errors.leader_id} />
						</div>
						<DialogFooter>
							<Button type="button" variant="ghost" onClick={() => setEditing(null)}>
								Batal
							</Button>
							<Button type="submit" disabled={form.processing}>
								Simpan
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Atur anggota - admin atau danru regu itu */}
			<Dialog open={membersOf !== null} onOpenChange={(open) => !open && setMembersOf(null)}>
				{/* grid-cols-[minmax(0,1fr)]: kolom grid DialogContent bawaannya selebar isi terpanjang,
				    jadi baris rincian petugas yang `truncate` mendorong dialog melebar & bergulir ke kanan. */}
				<DialogContent className="max-h-[85vh] grid-cols-[minmax(0,1fr)] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Anggota {membersOf?.name}</DialogTitle>
					</DialogHeader>
					<p className="text-xs text-muted-foreground">
						Hanya petugas. Satu petugas hanya bisa di satu regu, dan danru selalu termasuk anggota.
					</p>
					{/* Danru dipisah di atas & tanpa checkbox: ia selalu anggota dan tak bisa dilepas dari
					    sini (diganti lewat "Ubah Regu"). Rincian dari `candidates` bila ada (admin). */}
					{membersOf?.leader && (
						<div className="space-y-1.5">
							<Label>Danru</Label>
							{(() => {
								const leader = candidates.find((c) => c.id === membersOf.leader.id) ?? membersOf.leader;
								return (
									<div className="flex min-h-[44px] items-center gap-3 rounded-lg border border-border bg-muted px-3 py-2 text-sm">
										<IconShieldHalf className="size-4 shrink-0 text-muted-foreground" />
										<span className="flex min-w-0 flex-1 flex-col">
											<span className="truncate font-medium">{leader.name}</span>
											{candidateDetail(leader) && (
												<span className="truncate text-xs text-muted-foreground">
													{candidateDetail(leader)}
												</span>
											)}
										</span>
									</div>
								);
							})()}
						</div>
					)}
					<div className="space-y-1.5">
						<Label>
							Pilih Anggota{' '}
							<span className="font-normal text-muted-foreground">
								({selectedIds.filter((id) => id !== membersOf?.leader?.id).length} dipilih)
							</span>
						</Label>
						{memberCandidates.length === 0 ? (
							<p className="text-xs text-muted-foreground">Belum ada petugas lain di wilayah ini.</p>
						) : (
							<div className="relative">
								<IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									type="search"
									value={memberQuery}
									onChange={(e) => setMemberQuery(e.target.value)}
									placeholder="Cari nama, email, telepon, atau wilayah..."
									className="pl-9"
								/>
							</div>
						)}
						{memberNeedle && visibleMembers.length === 0 && (
							<p className="py-2 text-center text-xs text-muted-foreground">
								Tidak ada petugas yang cocok dengan "{memberQuery.trim()}".
							</p>
						)}
						{/* Daftar bergulir SENDIRI (TASK_65): di prod 80+ petugas, dan dulu yang
						    bergulir seluruh dialog - judul & pencarian ikut hilang ke atas. overscroll-contain
						    supaya gulir yang mentok tidak berpindah ke halaman di belakang dialog. */}
						<div className="max-h-[45vh] space-y-1 overflow-y-auto overscroll-contain pr-1">
							{visibleMembers.map((c) => {
								const inOtherRegu = c.regu_id && c.regu_id !== membersOf?.id;
								return (
									<label
										key={c.id}
										className="flex min-h-[44px] items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm has-[:disabled]:opacity-60"
									>
										<Checkbox
											checked={selectedIds.includes(c.id)}
											disabled={inOtherRegu}
											onCheckedChange={() => toggleMember(c.id)}
										/>
										<span className="flex min-w-0 flex-1 flex-col">
											<span className="truncate">{c.name}</span>
											{candidateDetail(c) && (
												<span className="truncate text-xs text-muted-foreground">
													{candidateDetail(c)}
												</span>
											)}
										</span>
										{inOtherRegu && (
											<span className="max-w-[40%] shrink-0 truncate text-xs text-muted-foreground">
												{c.regu_name}
											</span>
										)}
									</label>
								);
							})}
						</div>
					</div>
					<InputError message={memberErrors.member_ids} />
					<DialogFooter>
						<Button type="button" variant="ghost" onClick={() => setMembersOf(null)}>
							Batal
						</Button>
						<Button type="button" onClick={submitMembers}>
							Simpan Anggota
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog open={reguToDelete !== null} onOpenChange={(open) => !open && setReguToDelete(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus {reguToDelete?.name}?</AlertDialogTitle>
						<AlertDialogDescription>
							Anggotanya dilepas dan bisa masuk regu lain. Catatan kejadian yang lalu tetap menyebut nama
							regu ini.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Batal</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={confirmDelete}
						>
							Hapus
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

Index.layout = (page) => <AppLayout children={page} title="Manajemen Regu" />;

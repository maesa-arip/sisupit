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
import { Card, CardContent } from '@/Components/ui/card';
import { Checkbox } from '@/Components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { Head, router, useForm } from '@inertiajs/react';
import { IconEdit, IconPlus, IconShieldHalf, IconTrash, IconUsers } from '@tabler/icons-react';
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

	// Calon danru: petugas yang belum beregu, atau yang sudah di regu yang sedang disunting.
	const leaderOptions = candidates.filter((c) => !c.regu_id || (editing?.id && c.regu_id === editing.id));

	return (
		<div className="flex h-full w-full flex-col space-y-6">
			<Head title="Regu & Danru" />

			<div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
				<HeaderTitle
					title="Regu & Danru"
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
					regus.map((regu) => (
						<Card key={regu.id}>
							<CardContent className="flex flex-col gap-3 p-3 sm:p-4">
								<div className="flex flex-row items-start gap-3">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
										<IconUsers className="h-5 w-5" />
									</div>
									<div className="min-w-0 flex-1">
										<h3 className="truncate text-sm font-semibold text-foreground">{regu.name}</h3>
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
											className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
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
						</Card>
					))
				) : (
					<div className="rounded-xl border border-dashed border-input p-10 text-center">
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
				<DialogContent>
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
							<Select value={form.data.leader_id} onValueChange={(v) => form.setData('leader_id', v)}>
								<SelectTrigger className="data-[placeholder]:text-muted-foreground">
									<SelectValue placeholder="Pilih petugas" />
								</SelectTrigger>
								<SelectContent>
									{leaderOptions.map((c) => (
										<SelectItem key={c.id} value={String(c.id)}>
											{c.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
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
				<DialogContent className="max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Anggota {membersOf?.name}</DialogTitle>
					</DialogHeader>
					<p className="text-xs text-muted-foreground">
						Hanya petugas. Satu petugas hanya bisa di satu regu, dan danru selalu termasuk anggota.
					</p>
					<div className="space-y-1">
						{candidates.map((c) => {
							const isLeader = membersOf?.leader?.id === c.id;
							const inOtherRegu = c.regu_id && c.regu_id !== membersOf?.id;
							return (
								<label
									key={c.id}
									className="flex min-h-[44px] items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm has-[:disabled]:opacity-60"
								>
									<Checkbox
										checked={isLeader || selectedIds.includes(c.id)}
										disabled={isLeader || inOtherRegu}
										onCheckedChange={() => toggleMember(c.id)}
									/>
									<span className="min-w-0 flex-1 truncate">{c.name}</span>
									{isLeader && <span className="text-xs text-muted-foreground">Danru</span>}
									{inOtherRegu && (
										<span className="text-xs text-muted-foreground">{c.regu_name}</span>
									)}
								</label>
							);
						})}
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

Index.layout = (page) => <AppLayout children={page} title="Regu & Danru" />;

import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Combobox } from '@/Components/ui/combobox';
import { Label } from '@/Components/ui/label';
import { IconPlus } from '@tabler/icons-react';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * Pemilih banjar — SATU komponen untuk ketiga layar yang memakainya (Lengkapi Profil,
 * Tambah & Ubah Hydrant Warga).
 *
 * Disatukan karena tiga salinan sudah terbukti menyimpang: sampai 2026-08-26 hanya layar
 * Lengkapi Profil yang mengosongkan pilihan saat desa berganti, sementara dua form hydrant
 * tidak — dan itulah yang membuat tandon bisa tersimpan di bawah banjar desa lain (FINDINGS
 * #82). Menaruh aturannya di satu tempat membuat kekambuhan seperti itu mustahil.
 *
 * Tiga perilaku yang dibawanya:
 *  1. Pilihan mengikuti desa; ganti desa = pilihan lama dikosongkan (lewat ref, supaya layar
 *     Ubah tidak menghapus banjar yang sedang dibuka pada render pertama).
 *  2. Banjar yang belum terdaftar bisa diusulkan langsung dari keadaan kosong dropdown —
 *     master banjar tak akan pernah lengkap dari data resmi saja.
 *  3. Nama mirip DITAWARKAN lebih dulu, tidak digabungkan diam-diam maupun dibuat begitu saja.
 */
export default function BanjarField({
	villageCode,
	value,
	onChange,
	error,
	label = 'Banjar',
	required = false,
	className,
}) {
	const [options, setOptions] = useState([]);
	const [memuat, setMemuat] = useState(false);
	const [serupa, setSerupa] = useState(null); // {usulan, banjar} — tawaran saat nama mirip
	const previousVillageRef = useRef(villageCode);

	const muat = (kode) =>
		axios
			.get(`/api/banjars/${kode}`)
			.then((res) =>
				setOptions(res.data.map((row) => ({ code: String(row.id), name: row.name, status: row.status }))),
			)
			// Dulu kegagalan di sini tak meninggalkan jejak apa pun: dropdown kosong, dan dalam
			// mode wajib pendaftaran terhenti tanpa sebab yang terlihat (bentuk #74).
			.catch(() => toast.error('Gagal memuat daftar banjar. Periksa koneksi lalu coba lagi.'));

	useEffect(() => {
		if (previousVillageRef.current !== villageCode) {
			previousVillageRef.current = villageCode;
			onChange('');
			setSerupa(null);
		}

		if (!villageCode) {
			setOptions([]);

			return;
		}

		muat(villageCode);
	}, [villageCode]);

	const usulkan = (nama, paksa = false) => {
		const bersih = (nama || '').trim();

		if (bersih.length < 3) {
			toast.error('Ketik nama banjarnya dulu (minimal 3 huruf).');

			return;
		}

		setMemuat(true);
		axios
			.post('/api/banjars', { village_code: villageCode, name: bersih, paksa })
			.then((res) => {
				const b = res.data.banjar;
				setSerupa(null);
				setOptions((lama) =>
					lama.some((o) => o.code === String(b.id))
						? lama
						: [...lama, { code: String(b.id), name: b.name, status: b.status }].sort((a, c) =>
								a.name.localeCompare(c.name),
							),
				);
				onChange(String(b.id));
				toast.success(
					res.data.status === 'sudah_ada'
						? `${b.name} sudah terdaftar dan langsung dipilih.`
						: `${b.name} ditambahkan dan menunggu peninjauan admin.`,
				);
			})
			.catch((err) => {
				// 409 = ada yang mirip. Ditawarkan ke pengguna, bukan diputuskan sepihak.
				if (err.response?.status === 409) {
					setSerupa({ usulan: err.response.data.usulan, banjar: err.response.data.serupa.banjar });

					return;
				}

				toast.error(err.response?.data?.message ?? 'Gagal menambahkan banjar. Coba lagi sebentar lagi.');
			})
			.finally(() => setMemuat(false));
	};

	const pilih = (id) => {
		setSerupa(null);
		onChange(String(id));
	};

	return (
		<div className={className ?? 'grid gap-1.5'}>
			<Label>
				{label}
				{!required && <span className="ml-1 text-xs font-normal text-muted-foreground">(opsional)</span>}
			</Label>

			<Combobox
				items={options}
				value={value}
				disabled={!villageCode}
				onChange={onChange}
				placeholder={villageCode ? 'Pilih Banjar...' : 'Pilih desa/kelurahan dulu'}
				emptyText="Banjar ini belum terdaftar."
				itemBadge={(item) =>
					item.status === 'usulan' ? (
						<span className="ml-auto shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
							usulan
						</span>
					) : null
				}
				emptyAction={(query, tutup) => (
					<Button
						type="button"
						size="sm"
						variant="secondary"
						disabled={memuat || !villageCode}
						onClick={() => {
							usulkan(query);
							tutup();
						}}
					>
						<IconPlus className="mr-1.5 h-4 w-4" />
						{query ? `Tambah "${query}"` : 'Tambah banjar baru'}
					</Button>
				)}
			/>

			{/* Tawaran saat namanya mirip dengan yang sudah ada. Keputusan tetap di tangan
			    pengguna: menggabungkan otomatis adalah kesalahan yang sudah ditolak di importir
			    (kriteria jarak huruf sempat mengusulkan CATUR → SANUR). */}
			{serupa && (
				<div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
					<p className="text-foreground">
						Sudah ada <span className="font-semibold">{serupa.banjar.name}</span> di desa ini. Apakah itu
						yang Anda maksud?
					</p>
					<div className="mt-2 flex flex-wrap gap-2">
						<Button type="button" size="sm" onClick={() => pilih(serupa.banjar.id)}>
							Ya, pakai itu
						</Button>
						<Button
							type="button"
							size="sm"
							variant="outline"
							disabled={memuat}
							onClick={() => usulkan(serupa.usulan, true)}
						>
							Bukan, tambahkan "{serupa.usulan}"
						</Button>
					</div>
				</div>
			)}

			{error && <InputError message={error} />}
		</div>
	);
}

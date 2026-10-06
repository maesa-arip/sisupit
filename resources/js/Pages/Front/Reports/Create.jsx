import { filledFieldsClass } from '@/Components/GroupedForm';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Combobox } from '@/Components/ui/combobox';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Textarea } from '@/Components/ui/textarea';
import UserLeafletMap from '@/Components/UserLeafletMap';
import AppLayout from '@/Layouts/AppLayout';
import { compressImages, oversizeMessage, splitOversize } from '@/lib/compress-image';
import {
	alamatTerbaca,
	cn,
	DEFAULT_MAP_CENTER,
	flashMessage,
	GEO_ACCURACY_THRESHOLD,
	getFreshPosition,
	NOMOR_DARURAT_NASIONAL,
} from '@/lib/utils';
import { Link, useForm } from '@inertiajs/react';
import {
	IconAlertTriangle,
	IconAmbulance,
	IconArrowLeft,
	IconBuildingStore,
	IconCar,
	IconChevronDown,
	IconCloudUpload,
	IconDotsCircleHorizontal,
	IconFiretruck,
	IconFlame,
	IconHome,
	IconLoader2,
	IconMapPinFilled,
	IconSearch,
	IconSend,
	IconX,
} from '@tabler/icons-react';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// Helper: Algoritma Pencocokan "Sapu Jagat" (Omni-Search)
const matchRegionName = (dbList, osmNamesArray, removeWords = []) => {
	if (!osmNamesArray || osmNamesArray.length === 0 || !dbList || dbList.length === 0) return null;

	const cleanOsmNames = osmNamesArray
		.map((name) => {
			let clean = name.toLowerCase();
			removeWords.forEach((w) => {
				clean = clean.replace(new RegExp(`\\b${w}\\b`, 'gi'), '');
			});
			return clean.replace(/[^\w\s]/gi, '').trim();
		})
		.filter((n) => n.length > 0);

	let matched = dbList.find((dbItem) => {
		let itemName = dbItem.name.toLowerCase();
		removeWords.forEach((w) => {
			itemName = itemName.replace(new RegExp(`\\b${w}\\b`, 'gi'), '');
		});
		itemName = itemName.replace(/[^\w\s]/gi, '').trim();
		return cleanOsmNames.includes(itemName);
	});

	if (!matched) {
		matched = dbList.find((dbItem) => {
			let itemName = dbItem.name.toLowerCase();
			removeWords.forEach((w) => {
				itemName = itemName.replace(new RegExp(`\\b${w}\\b`, 'gi'), '');
			});
			itemName = itemName.replace(/[^\w\s]/gi, '').trim();
			return cleanOsmNames.some((osmName) => itemName.includes(osmName) || osmName.includes(itemName));
		});
	}

	return matched;
};

// Jenis kejadian dipisah DUA TAB (permintaan user 2026-08-27). Nilai-nilainya WAJIB sama
// dengan Report::INCIDENT_TYPES — server memvalidasinya lewat Rule::in, jadi nama jenis baru
// harus ditambahkan di kedua tempat.
//
// Tab KEBAKARAN: tombol pilihan cepat (darurat-first) → foto/deskripsi/patokan OPSIONAL agar
// warga bisa melapor cepat. 'kebakaran_lainnya' tetap kebakaran, hanya judulnya yang diketik
// sendiri karena jenisnya tak terdaftar.
const FIRE_INCIDENT_TYPES = [
	{ value: 'rumah', label: 'Rumah', title: 'Kebakaran Rumah', icon: IconHome },
	{ value: 'toko', label: 'Toko', title: 'Kebakaran Toko/Bangunan', icon: IconBuildingStore },
	{ value: 'kendaraan', label: 'Kendaraan', title: 'Kebakaran Kendaraan', icon: IconCar },
	{ value: 'lahan', label: 'Lahan', title: 'Kebakaran Lahan', icon: IconFlame },
	{ value: 'kebakaran_lainnya', label: 'Lainnya', title: '', icon: IconDotsCircleHorizontal },
];

// Tab NON KEBAKARAN hanya punya SATU jenis, jadi tak ada tombol pilihan: membuka tabnya
// sudah menentukan jenisnya dan warga langsung mengetik kejadiannya. Di sinilah server
// mewajibkan deskripsi/patokan (ReportRequest; foto sementara opsional) karena petugas butuh konteks lebih.
const NON_FIRE_INCIDENT_TYPE = { value: 'lainnya', title: '' };

const INCIDENT_TAB = { fire: 'kebakaran', nonFire: 'non_kebakaran' };

// Sebentuk dengan tab di halaman Syarat & Ketentuan (Pages/Info/Terms.jsx) — satu-satunya
// pemakai Tabs yang sudah ada, supaya tab di sini tidak jadi dialek kedua.
const incidentTabClass =
	'flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm';

// Kedekatan peta saat operator memilih wilayah (TASK_28): makin dalam tingkatnya makin
// rapat, supaya pin tinggal digeser sedikit dari titik tengah wilayah terpilih.
const REGION_ZOOM = { city: 12, district: 14, village: 16 };

// Kedekatan peta saat operator memilih satu hasil pencarian tempat: setingkat jalan,
// karena hasil Nominatim sudah menunjuk titik (bukan area) — tinggal dikoreksi sedikit.
const SEARCH_ZOOM = 17;

// Titik tengah wilayah dari kolom `meta` tabel indonesia_* (laravolt) yang ikut terkirim
// apa adanya oleh /api/regions/*. Bentuknya {"lat":"..","long":".."} — bisa berupa string
// JSON (MySQL) atau objek, jadi keduanya ditangani. null = wilayah tanpa koordinat.
const regionCoords = (item) => {
	if (!item?.meta) return null;

	try {
		const meta = typeof item.meta === 'string' ? JSON.parse(item.meta) : item.meta;
		const lat = parseFloat(meta?.lat);
		const lng = parseFloat(meta?.long ?? meta?.lng);

		return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
	} catch {
		return null;
	}
};

// Jarak garis-lurus (meter) haversine - taksiran "seberapa jauh dari saya" di tiap hasil
// pencarian, seperti Google Maps (#188). Pola sama dengan ReportCard/Petugas Dashboard.
function distanceMeters(lat1, lng1, lat2, lng2) {
	const R = 6371000;
	const toRad = (d) => (d * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(a));
}

const formatJarak = (meter) =>
	meter < 1000 ? `${Math.round(meter)} m` : `${(meter / 1000).toFixed(1).replace('.', ',')} km`;

const regionName = (list, code) => (code ? list.find((item) => item.code === code)?.name || '' : '');

export default function Create(props) {
	const auth = props.auth.user;

	// Pastikan Controller mengirim data 'provinces' agar sistem bisa memulai pencocokan
	const provinces = props.provinces || [];
	// Kabupaten yang sudah bekerjasama (TASK_17) → notice arah laporan berdasarkan pin.
	const registeredTenants = props.registered_tenants || [];
	// Yurisdiksi operator (TASK_28) — hanya dikirim server untuk Pusat Komando
	// (petugas/admin/superadmin). Sejak 2026-09-01 ia BUKAN LAGI GERBANG apa pun: kotak
	// cari, keempat dropdown wilayah, dan panel alamat otomatis tampil untuk semua pelapor.
	// Yang tersisa cuma perannya sebagai NILAI AWAL keempat kode wilayah, sehingga operator
	// tak perlu memilih provinsi/kabupatennya sendiri tiap kali. null = warga: keempatnya
	// mulai kosong lalu terisi dari titik peta. Jangan jadikan gerbang lagi.
	const regionPicker = props.region_picker || null;

	const [userLocation, setUserLocation] = useState(null);
	const [locationLoading, setLocationLoading] = useState(true);
	const [friendlyAddress, setFriendlyAddress] = useState('');
	// Kartu titik pin gaya Google Maps (#188): baris tebal = jalan + nomor, baris kedua =
	// desa, kecamatan, kota. Hanya tampil selama `data.geo_address` terisi (keduanya ditulis
	// bersamaan di resolveLocation), jadi nilai basi tak pernah terlihat.
	const [pinPlace, setPinPlace] = useState({ title: '', detail: '' });

	// POSISI PELAPOR yang sebenarnya, dipakai server untuk menetapkan `reports.location_source`
	// (TASK_52, #104). SENGAJA ref tersendiri dan BUKAN `userLocation` di atas: state itu
	// terbaca seolah "di mana penggunanya", padahal ia juga ditulis resolveLocation() —
	// yang dipanggil setiap kali pin DIGESER — dan selectRegion() saat pin melompat ke
	// centroid wilayah. Maknanya "titik yang terakhir dipakai", dan pembacanya cuma locState.
	// Menghitung jarak darinya memulangkan ~0 m untuk hampir semua laporan, sehingga lencana
	// kepercayaan di layar petugas akan SELALU hijau — jaminan palsu yang lebih buruk
	// daripada tidak ada lencana sama sekali.
	//
	// Karena itu ref ini hanya boleh ditulis di callback sukses getUserLocation(). Tetap
	// null bila izin lokasi ditolak/GPS gagal, dan itu keadaan yang sah (`tanpa_referensi`).
	const gpsFixRef = useRef(null);

	// SATU MODE SAJA (permintaan user 2026-09-01, mencabut dua mode TASK_28): TITIK PIN
	// selalu sumber kebenaran wilayah. Geser pin / klik peta / pilih hasil pencarian →
	// provinsi..desa diisi ulang dari reverse-geocode titik itu; memilih dropdown →
	// pin melompat ke titik tengah wilayah itu. Sinkron DUA ARAH, tanpa sakelar.
	//
	// Sakelar "Pilih manual / Ikuti pin peta" yang dulu ada di sini SENGAJA dibuang, bukan
	// disembunyikan: selama ia ada, mode 'manual' MEMBLOKIR penulisan kode wilayah dari pin,
	// sehingga pin dan dropdown bisa menunjuk dua tempat berbeda tanpa satu pun tanda di
	// layar. Jangan hidupkan lagi tanpa menanyakan user.
	//
	// Pemakai sudah menentukan titiknya sendiri (dropdown wilayah / hasil pencarian) →
	// deteksi GPS awal yang jalan asinkron sejak halaman dibuka tidak boleh lagi menarik pin
	// kembali ke posisi pemakai saat balasannya datang belakangan.
	const regionTouchedRef = useRef(false);
	const [cities, setCities] = useState([]);
	const [districts, setDistricts] = useState([]);
	const [villages, setVillages] = useState([]);
	const [mapZoom, setMapZoom] = useState(null);
	// Panel empat pilihan wilayah, dilipat di bawah peta (#188 lanjutan, permintaan user
	// 2026-10-07: kartu "Wilayah kejadian" terpisah boros tempat & membingungkan - dua kartu
	// seolah dua lokasi berbeda). Terbuka paksa saat desa belum terisi, lihat regionForced.
	const [regionOpen, setRegionOpen] = useState(false);

	// Pencarian tempat (pola Admin/Hydrants/Create): operator mengetik nama jalan/desa,
	// memilih hasilnya, lalu provinsi..desa terisi sendiri dari titik itu — tak perlu
	// menelusuri empat dropdown satu per satu. Hanya aktif untuk Pusat Komando.
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState([]);
	const [isSearching, setIsSearching] = useState(false);
	// 'idle' | 'loading' | 'done' | 'error' — dipakai agar hasil kosong dan permintaan gagal
	// punya pesan masing-masing, tidak sama-sama tampil sebagai layar kosong.
	const [searchStatus, setSearchStatus] = useState('idle');
	// Nomor urut permintaan terakhir; balasan yang bukan miliknya diabaikan (anti balapan).
	const searchSeqRef = useRef(0);
	// Pembeda ketikan user vs teks yang kita isi sendiri setelah sebuah hasil dipilih,
	// supaya pengisian itu tidak memicu pencarian baru (anti-loop).
	const skipSearchRef = useRef(false);

	const [previews, setPreviews] = useState([]); // galeri foto (FINDINGS #17)
	const previewsRef = useRef([]);
	const fileInputPhoto = useRef(null);

	// Foto disembunyikan default (collapsible) untuk kebakaran; dibuka manual/otomatis.
	const [showPhotoSection, setShowPhotoSection] = useState(false);
	// Selama foto dikompres (#132) tombol Kirim ditahan - tanpa itu foto yang baru dipilih
	// belum masuk `data.photos` saat pengguna langsung mengetuk Kirim, dan laporan
	// terkirim tanpa fotonya tanpa galat apa pun.
	const [compressingPhotos, setCompressingPhotos] = useState(false);

	const { data, setData, post, processing, errors, transform } = useForm({
		name: auth?.name || '',
		incident_type: '',
		address: '',
		// Alamat lengkap dari reverse-geocode (`display_name`), disaring alamatTerbaca() —
		// segmen beraksara non-Latin dibuang karena nama POI di OSM ditulis dalam aksara apa
		// pun dan pernah tampil sebagai huruf Korea di panel ini (FINDINGS #83). Dipisah dari
		// `friendlyAddress` (versi pendek untuk badge) dan dari `address` (patokan yang DIKETIK
		// user) — mesin tidak boleh menimpa apa yang diketik manusia. Sejak TASK_49 ia bukan
		// lagi state terpisah melainkan FIELD FORM: nilainya sudah lama dihitung di sini tapi
		// tak pernah dikirim, sehingga halaman detail tak punya alamat yang dijamin cocok
		// dengan pinnya dan terpaksa memakai patokan sebagai "Alamat Presisi".
		geo_address: '',
		title: '',
		description: '',
		lat: '',
		lng: '',
		// Untuk Pusat Komando, yurisdiksi operator jadi nilai awal (TASK_28) — akun Damkar
		// Bali otomatis terisi provinsi, akun tingkat kabupaten sekalian kabupatennya.
		province_code: regionPicker?.province_code || '',
		city_code: regionPicker?.city_code || '',
		district_code: regionPicker?.district_code || '',
		village_code: regionPicker?.village_code || '',
		road: '',
		phone: auth?.phone || '',
		photos: [],
		_method: props.page_settings.method,
	});

	// Tab jenis kejadian. Diturunkan dari data supaya tab yang terbuka selalu mencerminkan
	// jenis yang benar-benar akan terkirim - bukan dua sumber kebenaran yang bisa berselisih.
	const [incidentTab, setIncidentTab] = useState(
		data.incident_type === NON_FIRE_INCIDENT_TYPE.value ? INCIDENT_TAB.nonFire : INCIDENT_TAB.fire,
	);

	const fallbackLocation = (latitude, longitude) => {
		setFriendlyAddress('Titik GPS terdeteksi (Mode Darurat)');
		setData((prevData) => ({
			...prevData,
			lat: latitude,
			lng: longitude,
			geo_address: '',
		}));
	};

	// Titik dipakai tapi yurisdiksi TIDAK di-auto-isi (fix tak akurat / gagal deteksi).
	// User wajib menggeser pin merah ke titik kejadian agar wilayah terisi dari titik benar.
	const applyUntrustedPoint = (latitude, longitude, message) => {
		setFriendlyAddress(message);
		setData((prevData) => ({
			...prevData,
			lat: latitude,
			lng: longitude,
			// Titik ini tidak di-reverse-geocode: jangan tinggalkan alamat lama yang sudah basi.
			geo_address: '',
			// Kosongkan yurisdiksi: jangan percaya wilayah dari fix yang tidak akurat.
			// Aman dilakukan tanpa syarat: kedua pemanggilnya sudah lebih dulu keluar bila
			// regionTouchedRef menyala, jadi wilayah yang SUDAH dipilih pemakai tak pernah
			// sampai ke sini untuk dikosongkan.
			province_code: '',
			city_code: '',
			district_code: '',
			village_code: '',
			road: '',
		}));
	};

	// Reverse-geocode sebuah titik lalu auto-isi alamat & yurisdiksi (provinsi..desa).
	// Dipakai deteksi GPS awal, geser pin, klik peta, dan pemilihan hasil pencarian —
	// SEMUANYA berperilaku sama sejak sakelar mode dicabut (2026-09-01). Wilayah SELALU
	// ditulis ulang dari titik; itulah arti "data mengikuti lokasi pin".
	const resolveLocation = async (latitude, longitude) => {
		setUserLocation({ latitude, longitude });

		try {
			// 1. Ambil Data Reverse Geocoding lewat proxy backend (lihat GeocodeController)
			const response = await axios.get(route('api.geocode.reverse'), {
				params: { lat: latitude, lng: longitude },
			});

			const addr = response.data.address;

			if (addr) {
				// Siapkan Alamat Ramah Manusia untuk UI
				const roadName = addr.road || addr.street || addr.pedestrian || '';
				const villageName = addr.village || addr.suburb || addr.town || '';
				const districtName = addr.city_district || addr.district || '';
				const displayAddr = [roadName, villageName, districtName].filter(Boolean).join(', ');

				setFriendlyAddress(
					displayAddr || alamatTerbaca(response.data.display_name).split(',')[0] || 'Lokasi terdeteksi',
				);
				// Selalu disimpan & selalu ditampilkan, di KEDUA mode: dulu alamat hasil geser
				// pin dihitung lalu dibuang saat mode manual (locSubtitle memilih label wilayah),
				// sehingga menggeser pin terasa "tidak terjadi apa-apa".
				const geoAddress = alamatTerbaca(response.data.display_name);
				// Kartu titik: jalan + nomor sebagai judul; tanpa jalan, nama kelurahan yang naik
				// jadi judul. Kecamatan di data Bali tersimpan di `town` ("Denpasar Barat").
				const placeParts = [
					addr.village || addr.suburb,
					addr.city_district || addr.district || addr.town,
					addr.city || addr.county || addr.regency,
				]
					.map((part) => alamatTerbaca(part || ''))
					.filter(Boolean);
				const placeTitle =
					alamatTerbaca([roadName, addr.house_number].filter(Boolean).join(' ')) ||
					placeParts.shift() ||
					geoAddress.split(',')[0];
				setPinPlace({
					title: placeTitle,
					detail: [...new Set(placeParts)].filter((part) => part !== placeTitle).join(', '),
				});

				// 2. AUTO-FILL YURISDIKSI (OMNI-SEARCH GAIB)
				let pCode = '',
					cCode = '',
					dCode = '',
					vCode = '';

				const rawOsmNames = [
					addr.state,
					addr.region,
					addr.city,
					addr.county,
					addr.regency,
					addr.town,
					addr.city_district,
					addr.municipality,
					addr.district,
					addr.suburb,
					addr.village,
					addr.neighbourhood,
					addr.hamlet,
				];
				const osmNames = rawOsmNames.filter((n) => n && !n.toLowerCase().includes('no name'));
				const removeWords = [
					'provinsi',
					'prov',
					'kota',
					'kabupaten',
					'kab',
					'kecamatan',
					'kec',
					'kelurahan',
					'desa',
				];

				// Level 1: Provinsi
				if (osmNames.length > 0 && provinces.length > 0) {
					const matchedProv = matchRegionName(provinces, osmNames, removeWords);
					if (matchedProv) pCode = matchedProv.code;
				}

				// Level 2: Kota
				if (pCode) {
					const resCity = await axios.get(`/api/regions/cities/${pCode}`);
					const matchedCity = matchRegionName(resCity.data, osmNames, removeWords);
					if (matchedCity) cCode = matchedCity.code;
				}

				// Level 3: Kecamatan
				if (cCode) {
					const resDist = await axios.get(`/api/regions/districts/${cCode}`);
					const matchedDist = matchRegionName(resDist.data, osmNames, removeWords);
					if (matchedDist) dCode = matchedDist.code;
				}

				// Level 4: Desa
				if (dCode) {
					const resVill = await axios.get(`/api/regions/villages/${dCode}`);
					const matchedVill = matchRegionName(resVill.data, osmNames, removeWords);
					if (matchedVill) vCode = matchedVill.code;
				}

				// 3. Simpan semua kode ke State Formulir
				setData((prevData) => ({
					...prevData,
					lat: latitude,
					lng: longitude,
					geo_address: geoAddress,
					province_code: pCode,
					city_code: cCode,
					district_code: dCode,
					village_code: vCode,
					road: roadName,
				}));
			} else {
				fallbackLocation(latitude, longitude);
			}
		} catch (error) {
			console.error('Gagal mengambil data wilayah:', error);
			fallbackLocation(latitude, longitude);
		} finally {
			setLocationLoading(false);
		}
	};

	// AUTO DETECT LOKASI & YURISDIKSI SILENTLY.
	// Alur: fix akurat & segar dulu (getFreshPosition, fallback ke lokasi jaringan sekali).
	// Fix dengan akurasi buruk (> GEO_ACCURACY_THRESHOLD) TIDAK dipercaya untuk auto-isi
	// wilayah — mencegah gejala "lokasi lari ke kota lain" akibat lokasi berbasis IP/WiFi.
	const getUserLocation = () => {
		if (!navigator.geolocation) {
			toast.error('Browser Anda tidak mendukung deteksi lokasi.');
			setLocationLoading(false);
			return;
		}

		setLocationLoading(true);
		getFreshPosition()
			.then(({ coords }) => {
				// Operator keburu memilih wilayah sebelum GPS menjawab: jangan tarik pin
				// kembali ke posisi operator (TASK_28).
				if (regionTouchedRef.current) {
					setLocationLoading(false);
					return;
				}

				setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });

				// Satu-satunya tempat posisi pelapor dicatat (TASK_52). Fix yang AKURASINYA
				// BURUK pun ikut dicatat, bukan dibuang: ia tetap posisi pelapor, dan
				// angka akurasinya justru yang memberi tahu petugas bahwa jarak kecil di
				// laporan ini belum membuktikan apa-apa.
				gpsFixRef.current = {
					lat: coords.latitude,
					lng: coords.longitude,
					accuracy: coords.accuracy ?? null,
				};

				if (coords.accuracy != null && coords.accuracy > GEO_ACCURACY_THRESHOLD) {
					// Kemungkinan fix jaringan/IP (bisa meleset puluhan km): pakai titiknya
					// sebagai awalan pin, tapi minta user mengoreksi lewat geser pin.
					applyUntrustedPoint(
						coords.latitude,
						coords.longitude,
						'Lokasi kurang akurat - geser peta sampai pin merah tepat di titik kejadian.',
					);
					setLocationLoading(false);
					toast.warning('Lokasi kurang akurat. Geser peta sampai pin merah tepat di titik kejadian.');
					return;
				}

				resolveLocation(coords.latitude, coords.longitude);
			})
			.catch((error) => {
				console.error('Error getting user location:', error);

				// Wilayah sudah dipilih operator → pin sudah benar, GPS gagal tidak relevan.
				if (regionTouchedRef.current) {
					setLocationLoading(false);
					return;
				}

				// Gagal total: taruh pin di pusat peta agar user tetap bisa menandai manual.
				setUserLocation(null);
				applyUntrustedPoint(
					DEFAULT_MAP_CENTER.lat,
					DEFAULT_MAP_CENTER.lng,
					'Lokasi tak terdeteksi - geser peta sampai pin merah di titik kejadian.',
				);
				setLocationLoading(false);
				toast.error(
					'Gagal melacak lokasi. Pastikan izin/GPS aktif, lalu geser peta ke titik kejadian & isi patokan.',
				);
			});
	};

	// Dipanggil saat pin peta digeser manual -> koreksi titik + isi ulang yurisdiksi.
	const handleMarkerDrag = (latitude, longitude) => {
		setLocationLoading(true);
		resolveLocation(latitude, longitude);
	};

	// Tombol "Lokasi saya" di peta (#188): kembali ke posisi GPS pelapor. Mencabut tanda
	// "titik sudah dipilih pemakai" lebih dulu - di sinilah pemakai sendiri yang memintanya.
	const locateMe = () => {
		regionTouchedRef.current = false;
		getUserLocation();
	};

	useEffect(() => {
		getUserLocation();

		return () => {
			previewsRef.current.forEach((p) => URL.revokeObjectURL(p.url));
		};
	}, []);

	// ---------------------------------------------------------------------------
	// WILAYAH KEJADIAN — kini untuk SEMUA pelapor (permintaan user 2026-09-01)
	// ---------------------------------------------------------------------------
	// Rantai bertingkat provinsi→kabupaten→kecamatan→desa lewat endpoint yang sudah ada.
	// Dulu digerbangi prop `region_picker` sehingga hanya Pusat Komando yang melihatnya,
	// dan itu MENYEMBUNYIKAN satu-satunya jalan pemulihan dari warga: `ReportRequest`
	// mewajibkan village_code untuk SETIAP laporan baru (tanpa membedakan peran), sementara
	// pencocokan nama OSM ke tabel wilayah kerap berhenti di kecamatan. Warga yang mengalami
	// itu ditolak server pada field yang tak pernah dirender — galat tanpa tempat berpijak.
	// Sekarang keempat dropdown selalu ada sebagai koreksi.
	//
	// Prop `region_picker` TETAP dipakai, tapi cuma untuk NILAI AWAL (yurisdiksi operator),
	// bukan lagi gerbang tampil. Jangan dijadikan gerbang lagi.
	useEffect(() => {
		if (!data.province_code) {
			setCities([]);

			return;
		}

		axios
			.get(`/api/regions/cities/${data.province_code}`)
			.then((res) => setCities(res.data))
			.catch(() => setCities([]));
	}, [data.province_code]);

	useEffect(() => {
		if (!data.city_code) {
			setDistricts([]);

			return;
		}

		axios
			.get(`/api/regions/districts/${data.city_code}`)
			.then((res) => setDistricts(res.data))
			.catch(() => setDistricts([]));
	}, [data.city_code]);

	useEffect(() => {
		if (!data.district_code) {
			setVillages([]);

			return;
		}

		axios
			.get(`/api/regions/villages/${data.district_code}`)
			.then((res) => setVillages(res.data))
			.catch(() => setVillages([]));
	}, [data.district_code]);

	// Memilih wilayah = kosongkan tingkat di bawahnya lalu LOMPATKAN PIN ke titik tengah
	// wilayah terpilih, supaya tinggal digeser sedikit ke titik kejadian. Inilah arah kedua
	// dari "peta dan lokasi sinkron": pin mengikuti wilayah, sebagaimana wilayah mengikuti
	// pin. Ia tidak lagi mengunci apa pun — menggeser pin sesudahnya tetap menulis ulang
	// wilayah dari titik yang baru.
	//
	// Provinsi tidak punya koordinat (prop provinces hanya code+name) → pin diam.
	const selectRegion = (level, code) => {
		const list = { province: provinces, city: cities, district: districts, village: villages }[level];
		const coords = regionCoords(list.find((item) => item.code === code));

		regionTouchedRef.current = true;

		setData((prev) => ({
			...prev,
			province_code: level === 'province' ? code : prev.province_code,
			city_code: level === 'province' ? '' : level === 'city' ? code : prev.city_code,
			district_code:
				level === 'province' || level === 'city' ? '' : level === 'district' ? code : prev.district_code,
			village_code: level === 'village' ? code : '',
			...(coords ? { lat: coords.lat.toFixed(6), lng: coords.lng.toFixed(6) } : {}),
		}));

		if (coords) {
			setUserLocation({ latitude: coords.lat, longitude: coords.lng });
			setMapZoom(REGION_ZOOM[level]);
			setFriendlyAddress('');
			// Pin melompat ke centroid TANPA reverse-geocode (sengaja: alamat centroid bukan
			// alamat kejadian, menampilkannya justru menyesatkan) — jadi alamat lama yang
			// menggambarkan pin sebelumnya harus dibuang, bukan dibiarkan basi.
			setData('geo_address', '');
			// Titik sudah pasti dari wilayah terpilih: jangan biarkan tombol Kirim terkunci
			// menunggu GPS yang masih memindai (tombol disable-nya membaca locationLoading).
			setLocationLoading(false);
		}
	};

	// Satu pencarian ke proxy GeocodeController. Dipakai debounce DAN tombol Enter.
	const runSearch = (query) => {
		const q = query.trim();

		if (q.length < 3) return;

		// PENJAGA BALAPAN. Nominatim di-serialize ~1 request/detik di sisi server (lock +
		// jeda 1,1 detik), jadi balasan bisa datang TIDAK berurutan. Mengetik "gema merdeka"
		// melahirkan query antara yang sah-sah saja kosong ("gema mer" = 0 hasil), dan tanpa
		// penjaga ini balasan kosong yang datang telat MENIMPA hasil query terakhir yang
		// benar — persis gejala "cari gema merdeka tidak muncul, cari gema muncul".
		const seq = ++searchSeqRef.current;

		setIsSearching(true);
		setSearchStatus('loading');

		axios
			// Titik pin ikut dikirim: server mendahulukan hasil di sekitarnya (#188).
			.get(route('api.geocode.search'), { params: { q, lat: data.lat || undefined, lng: data.lng || undefined } })
			.then((res) => {
				if (seq !== searchSeqRef.current) return;

				const rows = Array.isArray(res.data) ? res.data : [];
				const gps = gpsFixRef.current;
				// Yang terdekat dari pelapor di atas (#188) - lima teratas Nominatim sama-sama
				// relevan (mis. lima ruas "Jalan Teuku Umar"), jarak yang memisahkannya.
				// Tanpa GPS urutan relevansi Nominatim dipertahankan.
				const jarakKe = (row) => {
					const meter = distanceMeters(gps.lat, gps.lng, parseFloat(row.lat), parseFloat(row.lon));
					return Number.isFinite(meter) ? meter : Infinity;
				};
				setSearchResults(gps ? [...rows].sort((a, b) => jarakKe(a) - jarakKe(b)) : rows);
				setSearchStatus('done');
			})
			.catch(() => {
				if (seq !== searchSeqRef.current) return;

				// Jangan telan galat diam-diam: kosong karena "tidak ketemu" dan kosong karena
				// "permintaan gagal" harus terlihat berbeda oleh operator.
				setSearchResults([]);
				setSearchStatus('error');
			})
			.finally(() => {
				if (seq === searchSeqRef.current) setIsSearching(false);
			});
	};

	// Pencarian tempat, debounce 500 ms (dulu 1 detik; #188 - terasa lamban dibanding Google
	// Maps). Lonjakan ketikan tetap aman: seluruh panggilan lewat proxy GeocodeController
	// (cache 24 jam + lock antrean) dan penjaga balapan searchSeqRef membuang balasan basi.
	useEffect(() => {
		if (searchQuery.trim().length < 3) {
			setSearchResults([]);
			setIsSearching(false);
			setSearchStatus('idle');

			return;
		}

		// Teks berubah karena hasil dipilih, bukan diketik → jangan cari ulang.
		if (skipSearchRef.current) {
			skipSearchRef.current = false;

			return;
		}

		setSearchStatus('loading');

		const timer = setTimeout(() => runSearch(searchQuery), 500);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	// Hasil pencarian dipilih: pin melompat ke titik itu lalu wilayah DIISI ULANG dari
	// reverse-geocode, persis alur Admin/Hydrants/Create. Pelapor tetap bisa mengoreksi
	// lewat dropdown di bawahnya.
	const selectSearchResult = (result) => {
		const latitude = parseFloat(result.lat);
		const longitude = parseFloat(result.lon);

		skipSearchRef.current = true;
		setSearchQuery(alamatTerbaca(result.name) || alamatTerbaca(result.display_name).split(',')[0] || '');
		setSearchResults([]);
		setSearchStatus('idle');
		// Batalkan permintaan yang masih di jalan supaya balasannya tidak memunculkan lagi
		// daftar hasil setelah operator memilih.
		searchSeqRef.current += 1;
		setIsSearching(false);

		if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

		// Titik sudah ditentukan pemakai: deteksi GPS awal yang masih berjalan tidak boleh
		// menarik pin kembali ke posisinya saat balasannya datang belakangan.
		regionTouchedRef.current = true;
		setMapZoom(SEARCH_ZOOM);
		setLocationLoading(true);
		resolveLocation(latitude, longitude);
	};

	// Wilayah terpilih (desa, kecamatan, kota) untuk baris di bawah peta - nama saja, tanpa
	// awalan "Desa/Kel."/"Kec." supaya muat di ponsel. Tabel laravolt menulis HURUF BESAR
	// ("KOTA DENPASAR"); dirapikan jadi huruf awal kapital agar tak terbaca berteriak.
	const regionParts = [
		regionName(villages, data.village_code),
		regionName(districts, data.district_code),
		regionName(cities, data.city_code),
	]
		.filter(Boolean)
		.map((name) => name.toLowerCase().replace(/(^|[\s(/-])\p{L}/gu, (c) => c.toUpperCase()));

	const onHandleChange = (e) => setData(e.target.name, e.target.value);

	// Darurat non-kebakaran → deskripsi/patokan wajib (foto sementara opsional). 'kebakaran_lainnya'
	// SENGAJA tidak ikut: ia kebakaran, jadi tetap darurat-first — yang membedakannya cuma
	// judul yang diketik sendiri. Aturan yang sama dipegang server di ReportRequest.
	const isOther = data.incident_type === NON_FIRE_INCIDENT_TYPE.value;
	// Judul teks bebas dipakai dua keadaan: darurat non-kebakaran & kebakaran "Lainnya".
	const needsFreeTitle = isOther || data.incident_type === 'kebakaran_lainnya';
	// 'lainnya': seksi foto selalu terbuka (sementara OPSIONAL, keputusan user 2026-09-29);
	// kebakaran collapsible; buka bila sudah ada foto.
	const photoExpanded = isOther || showPhotoSection || data.photos.length > 0;

	const selectIncidentType = (type) => {
		// Menekan tombol yang SEDANG aktif tidak boleh menghapus apa pun - di tombol
		// "Lainnya" itu berarti judul yang sudah diketik warga ikut terhapus.
		if (type.value === data.incident_type) return;

		setData((prev) => ({
			...prev,
			incident_type: type.value,
			// Judul terisi otomatis dari tombol; 'Lainnya' dikosongkan agar diketik warga.
			title: type.title,
		}));
	};

	// Berpindah tab MENGGANTI jenis kejadian: tab non-kebakaran hanya punya satu jenis
	// sehingga langsung terpilih, sedangkan tab kebakaran menunggu warga menekan tombol.
	// Judul ikut dikosongkan agar judul dari tab sebelumnya tidak terkirim bersama jenis baru.
	const selectIncidentTab = (tab) => {
		setIncidentTab(tab);
		setData((prev) => ({
			...prev,
			incident_type: tab === INCIDENT_TAB.nonFire ? NON_FIRE_INCIDENT_TYPE.value : '',
			title: '',
		}));
	};

	const MAX_PHOTOS = 6;

	const handlePhotosChange = async (e) => {
		const picked = Array.from(e.target.files || []);
		if (!picked.length) return;

		setCompressingPhotos(true);
		const compressed = await compressImages(picked.slice(0, MAX_PHOTOS - data.photos.length));
		setCompressingPhotos(false);

		const { accepted: files, rejected } = splitOversize(compressed);
		if (rejected.length) toast.error(oversizeMessage(rejected));

		const combined = [...data.photos, ...files].slice(0, MAX_PHOTOS);
		setData('photos', combined);

		// Buat ulang object URL untuk seluruh set (revoke yang lama agar tak bocor).
		previewsRef.current.forEach((p) => URL.revokeObjectURL(p.url));
		const nextPreviews = combined.map((f) => ({ url: URL.createObjectURL(f), name: f.name }));
		previewsRef.current = nextPreviews;
		setPreviews(nextPreviews);

		if (fileInputPhoto.current) fileInputPhoto.current.value = '';
	};

	const removePhoto = (index) => {
		const nextPhotos = data.photos.filter((_, i) => i !== index);
		setData('photos', nextPhotos);

		if (previews[index]) URL.revokeObjectURL(previews[index].url);
		const nextPreviews = previews.filter((_, i) => i !== index);
		previewsRef.current = nextPreviews;
		setPreviews(nextPreviews);
	};

	const onHandleSubmit = (e) => {
		e.preventDefault();

		if (!data.incident_type) {
			toast.warning('Pilih dulu jenis kejadian di atas.');
			return;
		}

		if (needsFreeTitle && !data.title.trim()) {
			toast.warning('Tulis dulu jenis kejadian yang terjadi.');
			return;
		}

		if (!data.lat || !data.lng) {
			toast.warning('Lokasi belum terisi. Geser peta sampai pin merah di titik kejadian.');
			return;
		}

		// `ReportRequest` mewajibkan provinsi..DESA untuk setiap laporan baru, TANPA
		// membedakan peran — sementara pencocokan nama OSM ke tabel wilayah kerap berhenti
		// di kecamatan. Dulu penjaga ini cuma berlaku bila dropdownnya tampil (Pusat
		// Komando); warga yang desanya tak tercocokkan lolos penjaga lalu ditolak server
		// pada field yang tak pernah dirender. Sekarang dropdownnya ada untuk semua orang,
		// jadi penjaganya pun berlaku untuk semua orang dan menunjuk ke sesuatu yang benar
		// benar bisa dibetulkan pelapor.
		if (data._method === 'POST' && !data.village_code) {
			setRegionOpen(true);
			toast.warning('Pilih desa/kelurahan kejadian di bawah peta.');
			return;
		}

		// Posisi pelapor & akurasinya ikut dikirim MENTAH (TASK_52) — server yang menghitung
		// jaraknya ke pin lalu menetapkan `location_source`. Sengaja lewat transform, bukan
		// field useForm: nilainya tidak boleh bisa tersentuh setData mana pun, dan tak ada
		// satu pun bagian layar yang menampilkannya. Ketiganya null bila GPS gagal/ditolak —
		// itu keadaan yang sah dan server membacanya sebagai "tanpa referensi".
		transform((payload) => ({
			...payload,
			reporter_lat: gpsFixRef.current?.lat ?? null,
			reporter_lng: gpsFixRef.current?.lng ?? null,
			gps_accuracy_m: gpsFixRef.current?.accuracy ?? null,
		}));

		post(props.page_settings.action, {
			preserveScroll: true,
			preserveState: true,
			onSuccess: (success) => {
				// flash_message selalu dibagikan sebagai objek {type, message} (lihat
				// HandleInertiaRequests) — bisa bernilai null saat tak ada flash, jadi
				// guard pada flash?.type, bukan sekadar objeknya (yang selalu truthy).
				const flash = flashMessage(success);
				if (flash?.type) toast[flash.type](flash.message);
			},
			// Penolakan server WAJIB bersuara (2026-09-29): tanpa ini galat pada isian yang tak
			// punya <InputError> (photos.N, lat/lng, phone) tak terlihat sama sekali, pelapor
			// mengetuk Kirim berulang, dan dulu setiap ketukan ikut dihitung limiter sampai 429.
			onError: (formErrors) => {
				const [field, message] = Object.entries(formErrors)[0] ?? [];
				if (!message) return;
				toast.error(message);
				const element = document.getElementById(field.split('.')[0]);
				element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
			},
		});
	};

	// Status lokasi 4-tingkat untuk badge GPS. Satu rumus untuk SEMUA pelapor sejak sakelar
	// mode dicabut (2026-09-01) — dulu ada tiga cabang yang menjawab pertanyaan yang sama
	// dengan ambang berbeda, dan yang untuk warga ('ready' begitu province_code terisi)
	// berbohong: server menuntut sampai DESA, jadi lencana hijau bisa berdiri di atas
	// laporan yang pasti ditolak. Ambangnya kini sama dengan yang dituntut `ReportRequest`.
	const locState = locationLoading ? 'scanning' : !userLocation ? 'failed' : data.village_code ? 'ready' : 'weak';

	const locTitle =
		locState === 'scanning'
			? 'Memindai lokasi...'
			: locState === 'ready'
				? 'Lokasi terdeteksi'
				: locState === 'weak'
					? 'Lengkapi wilayah kejadian'
					: 'GPS gagal';

	// Baris lokasi di bawah peta (#188): SATU baris menggantikan kepala status GPS, kartu alamat,
	// dan kartu Wilayah Kejadian yang dulu terpisah. Judul = alamat titik pin (atau pesan GPS
	// bila belum ada alamat); keterangan = wilayah yang akan tercatat.
	const placeTitle =
		!locationLoading && data.geo_address ? pinPlace.title || data.geo_address.split(',')[0] : locTitle;
	// Wilayah tanpa nama yang sudah jadi judul ("Dauh Puri Kelod" tak perlu ditulis dua kali).
	// Belum ada alamat → pesan GPS (mis. "Lokasi kurang akurat - geser peta...") yang tampil.
	const placeSubtitle = locationLoading
		? ''
		: data.village_code
			? regionParts.filter((name) => name.toLowerCase() !== placeTitle.toLowerCase()).join(', ') ||
				pinPlace.detail
			: !data.geo_address
				? friendlyAddress
				: '';
	// Desa belum terisi (pencocokan nama OSM kerap berhenti di kecamatan) atau server menolak
	// kode wilayah -> pilihan wilayah terbuka sendiri, tak bisa ditutup sampai beres.
	const regionForced =
		(!locationLoading && !!data.lat && !data.village_code) ||
		!!(errors.province_code || errors.city_code || errors.district_code || errors.village_code);
	const regionPanelOpen = regionOpen || regionForced;

	// Notice arah laporan (TASK_17): begitu kota (city_code) ter-resolve dari pin, tampilkan
	// tujuan. Kota tanpa tenant terdaftar → warga diarahkan ke 113 (jujur, tanpa jaminan palsu).
	const matchedTenant = data.city_code ? registeredTenants.find((t) => t.city_code === data.city_code) : null;

	const submitLabel = 'Kirim Laporan Darurat';

	return (
		<div className="relative w-full pb-40 lg:pb-8">
			<div className="mx-auto flex w-full max-w-3xl flex-col space-y-6">
				{/* Kepala ala iOS (TASK_69, apple-design): "Batal" bertint di kiri atas, judul besar di bawahnya. */}
				<div className="-mb-2 flex items-center">
					<Button
						variant="ghost"
						className="-ml-3 h-10 rounded-full px-3 text-[15px] font-medium text-primary hover:bg-primary/10 hover:text-primary"
						asChild
					>
						<Link href={route('dashboard')}>
							<IconArrowLeft className="h-5 w-5" />
							Batal
						</Link>
					</Button>
				</div>
				<div>
					<h1 className="text-[28px] font-bold leading-tight tracking-tight text-foreground lg:text-3xl">
						Kirim Laporan Darurat
					</h1>
					<p className="mt-1 text-[15px] text-muted-foreground">
						Mohon lengkapi formulir di bawah agar relawan dapat segera membantu Anda.
					</p>
				</div>

				<form id="reportForm" className={`space-y-7 ${filledFieldsClass}`} onSubmit={onHandleSubmit}>
					{/* --- BAGIAN LOKASI --- */}
					<section className="space-y-2">
						<h2 className="px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
							Lokasi kejadian
						</h2>
						<div className="space-y-3 rounded-2xl border border-border/70 bg-card p-3 shadow-sm">
							{/* Peta gaya Google Maps (#188): kolom cari menempel di atas peta, pin diam di
							    tengah & PETANYA yang digeser, tombol "Lokasi saya" di kanan bawah. Kolom
							    cari dulu berada di bagian Wilayah Kejadian, di bawah peta - tak terlihat
							    saat pelapor sedang memandangi peta. Wadah luar sengaja TANPA
							    overflow-hidden supaya daftar hasil boleh menjulur melewati tepi peta. */}
							<div className="relative">
								<div className="relative z-0 h-[280px] w-full overflow-hidden rounded-xl bg-muted sm:h-[340px]">
									<UserLeafletMap
										lat={data.lat}
										lng={data.lng}
										centerPin
										autoLocate={false}
										onLocationChange={handleMarkerDrag}
										onLocate={locateMe}
										zoom={mapZoom}
										clickToPlace
									/>
								</div>

								<div className="absolute inset-x-2 top-2 z-10">
									{/* Latar & bayangan di PEMBUNGKUS, bukan di Input: filledFieldsClass pada
									    <form> menimpa latar input (selektor leluhur lebih spesifik) sehingga
									    kolomnya tembus pandang di atas peta. */}
									<div className="relative w-full rounded-xl bg-card shadow-md">
										<IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											onKeyDown={(e) => {
												if (e.key !== 'Enter') return;

												// Kotak ini ada DI DALAM <form> laporan: tanpa
												// preventDefault, Enter mengirim laporan darurat.
												// Enter di sini artinya "cari sekarang".
												e.preventDefault();
												runSearch(searchQuery);
											}}
											enterKeyHint="search"
											aria-label="Cari lokasi kejadian"
											placeholder="Cari jalan, desa, atau tempat"
											className="h-11 rounded-xl pl-9 pr-10 focus-visible:ring-2 focus-visible:ring-primary/30"
										/>
										{isSearching && (
											<div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center">
												<IconLoader2 className="h-4 w-4 animate-spin text-destructive" />
											</div>
										)}
									</div>

									{/* Hasil kosong & permintaan gagal DITAMPILKAN, tidak dibiarkan
									    senyap: dulu keduanya sama-sama "tidak terjadi apa-apa".
									    Singkatan jl/jln/gg dan kata terakhir yang belum selesai
									    diketik sudah ditangani server (GeocodeController). */}
									{(searchStatus === 'done' || searchStatus === 'error') &&
										searchResults.length === 0 && (
											<div className="mt-1 rounded-xl border border-border bg-popover p-3 text-xs text-muted-foreground shadow-lg">
												{searchStatus === 'error' ? (
													<span className="text-destructive">
														Pencarian gagal. Tekan Enter untuk mencoba lagi, atau pilih
														wilayah lewat pilihan di bagian Wilayah Kejadian.
													</span>
												) : (
													<>
														Tidak ada hasil untuk
														<span className="font-semibold text-foreground">
															{' '}
															{searchQuery.trim()}
														</span>
														. Coba kata kunci lain, atau geser peta ke titik kejadian.
													</>
												)}
											</div>
										)}

									{searchResults.length > 0 && (
										<div className="mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-lg">
											{searchResults.map((res, idx) => {
												const resLat = parseFloat(res.lat);
												const resLng = parseFloat(res.lon);
												// Jarak dari posisi pelapor yang sebenarnya (GPS), bukan dari
												// pin - pin bisa saja sudah digeser ke mana-mana.
												const jarak =
													gpsFixRef.current &&
													Number.isFinite(resLat) &&
													Number.isFinite(resLng)
														? formatJarak(
																distanceMeters(
																	gpsFixRef.current.lat,
																	gpsFixRef.current.lng,
																	resLat,
																	resLng,
																),
															)
														: null;

												return (
													<button
														key={idx}
														type="button"
														onClick={() => selectSearchResult(res)}
														className="flex w-full gap-2 border-b border-border px-3 py-2.5 text-left text-xs transition-colors last:border-0 hover:bg-accent"
													>
														<IconMapPinFilled className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
														<div className="min-w-0 flex-1">
															<p className="truncate text-[13px] font-semibold">
																{alamatTerbaca(res.name) ||
																	alamatTerbaca(res.display_name).split(',')[0]}
															</p>
															<p className="mt-0.5 truncate text-muted-foreground">
																{alamatTerbaca(res.display_name)}
															</p>
														</div>
														{jarak && (
															<span className="mt-0.5 shrink-0 text-muted-foreground">
																{jarak}
															</span>
														)}
													</button>
												);
											})}
										</div>
									)}
								</div>
							</div>
							{/* Baris lokasi + wilayah (#188): menggantikan kepala status GPS, kartu alamat titik pin,
							    dan kartu "Wilayah kejadian" yang terpisah. Ikon = status lokasi (hijau siap /
							    kuning desa belum terisi / merah GPS gagal). Tombol "Salin ke patokan" DIBUANG
							    (2026-10-07): alamat mesin bukan patokan - patokan diketik manusia. */}
							<div className="flex items-start gap-3 px-1">
								<div
									className={cn(
										'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
										locState === 'scanning' && 'bg-info/10 text-info',
										locState === 'ready' && 'bg-success/10 text-success',
										locState === 'weak' && 'bg-warning/10 text-warning',
										locState === 'failed' && 'bg-destructive/10 text-destructive',
									)}
								>
									{locState === 'scanning' ? (
										<IconLoader2 className="h-4 w-4 animate-spin" />
									) : locState === 'ready' ? (
										<IconMapPinFilled className="h-4 w-4" />
									) : (
										<IconAlertTriangle className="h-4 w-4" />
									)}
								</div>
								<div className="min-w-0 flex-1">
									<p className="break-words text-[15px] font-semibold leading-snug text-foreground">
										{placeTitle}
									</p>
									{placeSubtitle && (
										<p className="mt-0.5 break-words text-[13px] text-muted-foreground">
											{placeSubtitle}
										</p>
									)}
									{!locationLoading && !data.village_code && data.geo_address && (
										<p className="mt-0.5 text-[13px] text-warning">
											Desa/kelurahan belum terisi - pilih di bawah.
										</p>
									)}
								</div>
								{!regionForced && !locationLoading && (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										aria-expanded={regionPanelOpen}
										onClick={() => setRegionOpen((open) => !open)}
										className="-mr-1 h-8 shrink-0 rounded-full px-3 text-[13px] font-medium text-primary hover:bg-primary/10 hover:text-primary"
									>
										{regionOpen ? 'Selesai' : 'Ubah'}
									</Button>
								)}
							</div>

							{/* WILAYAH KEJADIAN - untuk SEMUA pelapor sejak 2026-09-01. Satu mode: titik peta yang
							    menentukan wilayah, dan memilih wilayah melompatkan titiknya. Server mewajibkan desa
							    untuk SETIAP laporan, jadi pilihan ini harus selalu terjangkau - kini dilipat di
							    bawah baris lokasi, terbuka sendiri saat desa belum terisi (regionForced). */}
							{regionPanelOpen && (
								<div className="border-t border-border/70 px-1 pt-3">
									<div className="grid grid-cols-2 gap-x-2 gap-y-2.5">
										<div className="flex min-w-0 flex-col gap-1">
											<Label className="text-xs font-medium text-muted-foreground">
												Provinsi
											</Label>
											<Combobox
												items={provinces}
												value={data.province_code}
												onChange={(val) => selectRegion('province', val)}
												placeholder="Provinsi"
											/>
											{errors.province_code && <InputError message={errors.province_code} />}
										</div>

										<div className="flex min-w-0 flex-col gap-1">
											<Label className="text-xs font-medium text-muted-foreground">
												Kabupaten / Kota
											</Label>
											<Combobox
												items={cities}
												value={data.city_code}
												disabled={!data.province_code}
												onChange={(val) => selectRegion('city', val)}
												placeholder="Kabupaten/Kota"
											/>
											{errors.city_code && <InputError message={errors.city_code} />}
										</div>

										<div className="flex min-w-0 flex-col gap-1">
											<Label className="text-xs font-medium text-muted-foreground">
												Kecamatan
											</Label>
											<Combobox
												items={districts}
												value={data.district_code}
												disabled={!data.city_code}
												onChange={(val) => selectRegion('district', val)}
												placeholder="Kecamatan"
											/>
											{errors.district_code && <InputError message={errors.district_code} />}
										</div>

										<div className="flex min-w-0 flex-col gap-1">
											<Label className="text-xs font-medium text-muted-foreground">
												Desa / Kelurahan
											</Label>
											<Combobox
												items={villages}
												value={data.village_code}
												disabled={!data.district_code}
												onChange={(val) => selectRegion('village', val)}
												placeholder="Desa/Kelurahan"
											/>
											{errors.village_code && <InputError message={errors.village_code} />}
										</div>
									</div>
								</div>
							)}

							{/* Notice arah laporan berdasarkan kota kejadian (TASK_17) - satu baris tipis bila
							    ada tenantnya; kotak peringatan tetap untuk kota tanpa tenant (arahkan ke 113). */}
							{data.city_code &&
								(matchedTenant ? (
									<p className="flex items-start gap-1.5 px-1 text-xs text-muted-foreground">
										<IconSend className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
										<span>
											Diteruskan ke{' '}
											<span className="font-medium text-foreground">
												{matchedTenant.nama_instansi}
											</span>
										</span>
									</p>
								) : (
									<div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-2.5 text-[13px] text-warning">
										<IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
										<span>
											Kabupatenmu belum terdaftar di layanan ini. Laporan tetap tercatat, namun
											untuk darurat segera hubungi{' '}
											<span className="font-bold text-destructive">{NOMOR_DARURAT_NASIONAL}</span>
											.
										</span>
									</div>
								))}

							{/* Data Administratif (DISEMBUNYIKAN SEPENUHNYA DARI USER) */}
							<input type="hidden" name="lat" value={data.lat} />
							<input type="hidden" name="lng" value={data.lng} />
							<input type="hidden" name="province_code" value={data.province_code} />
							<input type="hidden" name="city_code" value={data.city_code} />
							<input type="hidden" name="district_code" value={data.district_code} />
							<input type="hidden" name="village_code" value={data.village_code} />
							<input type="hidden" name="road" value={data.road} />
						</div>
					</section>

					{/* --- BAGIAN FORM INFORMASI --- */}
					<section className="space-y-2">
						<h2 className="px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
							Jenis kejadian
						</h2>
						<div className="space-y-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
							{/* Jenis kejadian: dua tab (kebakaran / non kebakaran), masing-masing berikon
								    kendaraan yang diberangkatkan — permintaan user 2026-08-27. */}
							<div>
								<Tabs value={incidentTab} onValueChange={selectIncidentTab} className="w-full">
									<TabsList className="grid h-auto w-full grid-cols-2 rounded-xl bg-muted p-1">
										<TabsTrigger value={INCIDENT_TAB.fire} className={incidentTabClass}>
											<IconFiretruck size={18} stroke={1.5} /> Kebakaran
										</TabsTrigger>
										<TabsTrigger value={INCIDENT_TAB.nonFire} className={incidentTabClass}>
											<IconAmbulance size={18} stroke={1.5} /> Non Kebakaran
										</TabsTrigger>
									</TabsList>

									{/* TAB A: KEBAKARAN — pilihan cepat (tombol besar) agar warga tak mengetik */}
									<TabsContent
										value={INCIDENT_TAB.fire}
										className="mt-4 outline-none focus-visible:ring-0"
									>
										<h3 className="border-b border-border/70 pb-2 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
											Apa yang terbakar?
										</h3>
										<div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
											{FIRE_INCIDENT_TYPES.map((type) => {
												const Icon = type.icon;
												const active = data.incident_type === type.value;
												return (
													<button
														key={type.value}
														type="button"
														onClick={() => selectIncidentType(type)}
														aria-pressed={active}
														className={cn(
															'flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl border p-2 text-center transition-colors',
															active
																? 'border-destructive bg-destructive/10 text-destructive'
																: 'border-border bg-card text-foreground hover:bg-accent',
														)}
													>
														<Icon className="h-6 w-6" stroke={1.5} />
														<span className="text-xs font-semibold leading-tight">
															{type.label}
														</span>
													</button>
												);
											})}
										</div>
									</TabsContent>

									{/* TAB B: NON KEBAKARAN — jenisnya sudah ditentukan oleh tabnya sendiri,
										    jadi tak ada tombol pilihan; langsung diketik di isian bawah. */}
									<TabsContent
										value={INCIDENT_TAB.nonFire}
										className="mt-4 outline-none focus-visible:ring-0"
									>
										<h3 className="border-b border-border/70 pb-2 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
											Darurat apa yang terjadi?
										</h3>
									</TabsContent>
								</Tabs>

								{errors.incident_type && <InputError message={errors.incident_type} className="mt-1" />}

								{/* Judul teks bebas: darurat non-kebakaran & kebakaran "Lainnya". Ditulis
									    SEKALI di luar tab supaya kedua tab tidak memelihara isian kembar. */}
								{needsFreeTitle && (
									<div className="mt-3">
										<Label htmlFor="title" className="text-sm font-medium text-foreground/80">
											Jelaskan jenis kejadian
										</Label>
										<Input
											name="title"
											id="title"
											value={data.title}
											type="text"
											placeholder={
												isOther
													? 'Contoh: Pohon tumbang, evakuasi, kabel putus...'
													: 'Contoh: Kebakaran gudang, tumpukan sampah, tiang listrik...'
											}
											onChange={onHandleChange}
											className="mt-1.5 h-11 rounded-xl border-border bg-card focus-visible:ring-2 focus-visible:ring-primary/30"
										/>
									</div>
								)}
								{errors.title && <InputError message={errors.title} className="mt-1" />}
							</div>
						</div>
					</section>

					<section className="space-y-2">
						<h2 className="px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
							Keterangan
						</h2>
						<div className="space-y-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
							{/* Patokan Manual — wajib untuk darurat non-kebakaran, opsional untuk kebakaran */}
							<div>
								<Label htmlFor="address" className="text-sm font-medium text-foreground/80">
									Patokan Lokasi{' '}
									<span className="font-normal text-muted-foreground">
										{isOther ? '(Wajib)' : '(Opsional)'}
									</span>
								</Label>
								<Input
									name="address"
									id="address"
									value={data.address}
									onChange={onHandleChange}
									className="mt-1.5 h-11 rounded-xl border-border bg-card focus-visible:ring-2 focus-visible:ring-primary/30"
									placeholder="Contoh: Samping warung cat biru, gang buntu..."
								/>
								{errors.address && <InputError message={errors.address} className="mt-1" />}
							</div>

							<div>
								<Label htmlFor="description" className="text-sm font-medium text-foreground/80">
									Detail Kejadian{' '}
									<span className="font-normal text-muted-foreground">
										{isOther ? '(Wajib)' : '(Opsional)'}
									</span>
								</Label>
								<Textarea
									name="description"
									id="description"
									value={data.description}
									placeholder="Jelaskan detail situasi saat ini jika memungkinkan..."
									onChange={onHandleChange}
									className="mt-1.5 min-h-[100px] resize-y rounded-xl border-border bg-card p-3 text-sm focus-visible:ring-2 focus-visible:ring-primary/30"
								/>
								{errors.description && <InputError message={errors.description} className="mt-1" />}
							</div>
						</div>
					</section>

					<section className="space-y-2">
						<h2 className="px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
							Foto
						</h2>
						<div className="space-y-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
							{/* --- BAGIAN UPLOAD FOTO (collapsible) --- */}
							<div>
								{isOther ? (
									<Label className="text-sm font-medium text-foreground/80">
										Foto Bukti Kejadian{' '}
										<span className="font-normal text-muted-foreground">(Opsional)</span>
									</Label>
								) : (
									<button
										type="button"
										onClick={() => setShowPhotoSection((v) => !v)}
										className="flex w-full items-center justify-between rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-left transition-colors hover:bg-muted"
									>
										<span className="flex items-center gap-2 text-sm font-semibold text-foreground">
											<IconCloudUpload className="h-5 w-5 text-muted-foreground" stroke={1.5} />
											Tambah foto jika aman
										</span>
										<IconChevronDown
											className={cn(
												'h-4 w-4 text-muted-foreground transition-transform',
												photoExpanded && 'rotate-180',
											)}
										/>
									</button>
								)}

								{/* Pesan keselamatan — jangan ambil risiko demi foto */}
								<p className="mt-2 flex items-start gap-1.5 text-[13px] text-muted-foreground">
									<IconAlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
									{isOther
										? 'Foto opsional, tapi membantu petugas menilai situasi. Tetap utamakan keselamatan Anda.'
										: 'Foto opsional. Jangan mendekat ke api hanya untuk mengambil foto.'}
								</p>

								{/* Satu input file tersembunyi, dipakai upload box & tombol "Tambah" */}
								<input
									name="photos"
									id="photos"
									type="file"
									accept="image/*"
									multiple
									ref={fileInputPhoto}
									onChange={handlePhotosChange}
									className="sr-only"
								/>

								{photoExpanded && (
									<div className="mt-3">
										{previews.length > 0 ? (
											<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
												{previews.map((p, i) => (
													<div
														key={i}
														className="group relative h-32 w-full overflow-hidden rounded-xl border border-border shadow-sm"
													>
														<img
															src={p.url}
															alt={`Preview ${i + 1}`}
															className="h-full w-full object-cover"
														/>
														<button
															type="button"
															onClick={() => removePhoto(i)}
															className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg border border-transparent bg-card/90 text-destructive shadow-sm backdrop-blur-sm transition-colors hover:border-destructive/30 hover:bg-destructive/10"
															title="Hapus foto"
														>
															<IconX stroke={2.5} className="h-4 w-4" />
														</button>
													</div>
												))}
												{data.photos.length < MAX_PHOTOS && (
													<button
														type="button"
														onClick={() => fileInputPhoto.current?.click()}
														className="flex h-32 w-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 text-center text-muted-foreground transition-colors hover:bg-muted"
													>
														<IconCloudUpload className="mb-1 h-6 w-6" stroke={1.5} />
														<span className="text-xs font-semibold">Tambah foto</span>
													</button>
												)}
											</div>
										) : (
											<div
												onClick={() => fileInputPhoto.current?.click()}
												className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 p-8 text-center transition-colors hover:bg-muted"
											>
												<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
													<IconCloudUpload
														className="h-6 w-6 text-muted-foreground"
														stroke={1.5}
													/>
												</div>
												<p className="text-sm font-semibold text-foreground">
													Pilih foto kejadian
												</p>
												<p className="mb-5 mt-1 text-[13px] text-muted-foreground">
													Format PNG/JPG/WEBP (Maks. 2 MB / foto)
												</p>
												<span className="inline-flex h-9 items-center justify-center rounded-lg bg-destructive px-5 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90">
													Jelajahi File
												</span>
											</div>
										)}
									</div>
								)}
								{errors.photos && <InputError message={errors.photos} className="mt-1" />}
								{/* Galat per berkas bernama photos.0, photos.1, ... - bukan `photos`. */}
								{Object.entries(errors)
									.filter(([key]) => key.startsWith('photos.'))
									.map(([key, message]) => (
										<InputError key={key} message={message} className="mt-1" />
									))}
							</div>
						</div>
					</section>

					{/* --- ACTIONS (desktop; di mobile pakai sticky bar di bawah) --- */}
					<div className="pt-1">
						{/* Varian & ukuran dari `Components/ui/button.jsx`, bukan kelas warna
								    rakitan tangan: `destructive` + `xl` sudah persis inilah yang
								    dimaksud (h-12, rounded-xl, hover & disabled ikut). Bentuk lama
								    menyalin warnanya sendiri lalu memakai `rounded-lg`, sehingga
								    tombol utama halaman ini bersudut lebih tajam daripada tombol
								    utama halaman lain tanpa ada yang menyadarinya. Kembarannya di
								    sticky bar mobile memakai varian yang SAMA supaya keduanya tak
								    bisa menyimpang lagi. */}
						<Button
							type="submit"
							variant="destructive"
							size="xl"
							className="hidden w-full font-semibold sm:inline-flex"
							disabled={processing || locationLoading || compressingPhotos}
						>
							{processing || compressingPhotos ? <IconLoader2 className="animate-spin" /> : <IconSend />}
							{submitLabel}
						</Button>
					</div>
				</form>
			</div>

			{/* Sticky CTA mobile — tombol Kirim selalu terlihat tanpa perlu scroll ke bawah.
			    RAPAT ke MobileBottomNav (tepat 4rem + safe-area, tinggi bilah itu), bukan
			    melayang 8px di atasnya seperti sebelumnya: dengan celah, sepotong konten
			    halaman mengintip di antara dua bidang yang sama-sama selebar layar, dan itu
			    terbaca seperti tata letak yang meleset, bukan seperti disengaja. Rapat begini
			    keduanya jadi SATU blok kaki: garis atas bar ini menjadi satu-satunya batas,
			    sebab bilahnya sendiri sudah tak bergaris sejak model minimalis.
			    Karena itu pula `shadow` dibuang (bayangan naik di atas bilah yang tak bergaris
			    jadi satu-satunya benda berat di layar) dan latarnya `bg-card` PEKAT, bukan
			    `bg-card/95` + blur — dua bidang bersentuhan dengan tembus-pandang berbeda akan
			    memperlihatkan garis sambungan tiap kali konten gelap lewat di belakangnya.
			    Kalau tinggi bilah berubah, angka 4rem di sini WAJIB ikut — kalau tidak tombol
			    kirim laporan darurat tertutup tanpa galat apa pun.
			    Saat keyboard terbuka (#187) bilah bawah disembunyikan dan bar ini turun menempel tepat
			    di atas keyboard (--keyboard-inset: 0 di APK, setinggi keyboard di iOS) - laporan tetap
			    terkirim dengan satu ketukan tanpa menutup keyboard dulu. */}
			<div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 border-t border-border bg-card px-4 py-3 sm:hidden [html[data-keyboard=open]_&]:bottom-[var(--keyboard-inset,0px)]">
				<Button
					type="submit"
					form="reportForm"
					variant="destructive"
					size="xl"
					className="w-full text-base font-semibold"
					disabled={processing || locationLoading || compressingPhotos}
				>
					{processing || compressingPhotos ? <IconLoader2 className="animate-spin" /> : <IconSend />}
					{submitLabel}
				</Button>
			</div>
		</div>
	);
}

Create.layout = (page) => <AppLayout children={page} title="Buat Laporan Baru" />;

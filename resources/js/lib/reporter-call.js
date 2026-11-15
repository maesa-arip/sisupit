import axios from 'axios';
import { useSyncExternalStore } from 'react';

/**
 * Panggilan suara Pusat Komando -> pelapor lewat Sisupit (TASK_90). SATU panggilan per tab, dipegang
 * di tingkat MODUL, bukan di komponen: tiap halaman memasang AppLayout-nya sendiri, jadi state
 * React ikut lepas saat pindah halaman - koneksi WebRTC & mikrofon di sini tetap hidup, dan layar
 * panggilan (CallOverlay) cukup membaca ulang keadaan ini.
 *
 * Sinyal lewat server (ReporterCallController): offer dibuat lengkap di depan (ICE dikumpulkan dulu,
 * tanpa trickle), answer dikirim pelapor, siaran Reverb `.reporter-call.changed` hanya aba-aba ->
 * keadaan diambil lewat HTTP. Polling cadangan berjalan selama panggilan aktif karena AppLayout
 * melepas channel pribadi tiap pindah halaman dan aba-aba di sela itu bisa hilang.
 *
 * phase: idle | outgoing | incoming | connecting | connected | ended | nomic
 */

const OUTGOING_TIMEOUT_MS = 45000;
const ICE_GATHER_TIMEOUT_MS = 3000;
const POLL_ACTIVE_MS = 2000;
const POLL_CONNECTED_MS = 5000;
const DISCONNECT_GRACE_MS = 8000;
const ENDED_VISIBLE_MS = 5000;

const IDLE = { phase: 'idle', call: null, muted: false, connectedAt: null, endLabel: null };

let state = IDLE;
const listeners = new Set();

let pc = null;
let localStream = null;
let remoteAudio = null;
let pollTimer = null;
let outgoingTimer = null;
let disconnectTimer = null;
let endedTimer = null;
let tone = null;
// Akses tamu (halaman status bertanda tangan) - null = pelapor ber-akun / pemanggil.
let guest = null;
let busy = false;

function setState(patch) {
	state = { ...state, ...patch };
	listeners.forEach((fn) => fn());
}

export function useReporterCall() {
	return useSyncExternalStore(
		(fn) => {
			listeners.add(fn);
			return () => listeners.delete(fn);
		},
		() => state,
		() => IDLE,
	);
}

export function isCallBusy() {
	return !['idle', 'ended', 'nomic'].includes(state.phase);
}

// ---- transport ---------------------------------------------------------------------------

const api = {
	state: (id) =>
		guest ? axios.get(guest.stateUrl).then((r) => r.data.call) : axios.get(route('calls.state', id)).then((r) => r.data.call),
	answer: (id, sdp) =>
		guest
			? axios.post(guest.answerUrl, { call_id: id, answer_sdp: sdp })
			: axios.post(route('calls.answer', id), { answer_sdp: sdp }),
	end: (id, reason) =>
		guest ? axios.post(guest.endUrl, { call_id: id, reason }) : axios.post(route('calls.end', id), { reason }),
};

// ---- suara dering (WebAudio, tanpa berkas) -------------------------------------------------

function startTone(kind) {
	stopTone();
	let ctx;
	try {
		ctx = new (window.AudioContext || window.webkitAudioContext)();
		ctx.resume?.().catch(() => {});
	} catch {
		ctx = null;
	}
	const beep = () => {
		if (ctx) {
			const pairs = kind === 'incoming' ? [0, 0.45] : [0];
			pairs.forEach((offset) => {
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.frequency.value = kind === 'incoming' ? 880 : 440;
				gain.gain.setValueAtTime(kind === 'incoming' ? 0.25 : 0.08, ctx.currentTime + offset);
				gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.4);
				osc.connect(gain).connect(ctx.destination);
				osc.start(ctx.currentTime + offset);
				osc.stop(ctx.currentTime + offset + 0.4);
			});
		}
		if (kind === 'incoming') navigator.vibrate?.([400, 200, 400]);
	};
	beep();
	tone = { ctx, timer: setInterval(beep, kind === 'incoming' ? 2500 : 3000) };
}

function stopTone() {
	if (!tone) return;
	clearInterval(tone.timer);
	tone.ctx?.close?.().catch(() => {});
	navigator.vibrate?.(0);
	tone = null;
}

// ---- WebRTC ------------------------------------------------------------------------------

async function getMic() {
	if (!navigator.mediaDevices?.getUserMedia) throw new Error('nomic');
	try {
		return await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
	} catch {
		throw new Error('nomic');
	}
}

function createPeer(iceServers) {
	const peer = new RTCPeerConnection({ iceServers: iceServers || [] });
	remoteAudio = remoteAudio || new Audio();
	remoteAudio.autoplay = true;
	peer.ontrack = (e) => {
		remoteAudio.srcObject = e.streams[0];
		remoteAudio.play().catch(() => {});
	};
	peer.onconnectionstatechange = () => {
		const s = peer.connectionState;
		if (s === 'connected') {
			clearTimeout(disconnectTimer);
			if (state.phase !== 'connected') onConnected();
		} else if (s === 'failed') {
			hangUp('failed');
		} else if (s === 'disconnected') {
			clearTimeout(disconnectTimer);
			disconnectTimer = setTimeout(() => hangUp('failed'), DISCONNECT_GRACE_MS);
		}
	};
	return peer;
}

// Offer/answer lengkap: tunggu pengumpulan kandidat ICE selesai (atau batas waktu), lalu kirim
// SDP sekali jadi - sinyal cukup satu kali bolak-balik lewat server.
function gatherComplete(peer) {
	if (peer.iceGatheringState === 'complete') return Promise.resolve();
	return new Promise((resolve) => {
		const done = () => {
			peer.removeEventListener('icegatheringstatechange', check);
			clearTimeout(timer);
			resolve();
		};
		const check = () => peer.iceGatheringState === 'complete' && done();
		const timer = setTimeout(done, ICE_GATHER_TIMEOUT_MS);
		peer.addEventListener('icegatheringstatechange', check);
	});
}

function teardown() {
	stopTone();
	clearInterval(pollTimer);
	clearTimeout(outgoingTimer);
	clearTimeout(disconnectTimer);
	pollTimer = outgoingTimer = disconnectTimer = null;
	try {
		pc?.close();
	} catch {
		/* sudah tertutup */
	}
	pc = null;
	localStream?.getTracks().forEach((t) => t.stop());
	localStream = null;
	if (remoteAudio) remoteAudio.srcObject = null;
}

function finish(endLabel) {
	teardown();
	setState({ phase: 'ended', endLabel: endLabel || 'Panggilan berakhir', muted: false });
	clearTimeout(endedTimer);
	endedTimer = setTimeout(() => state.phase === 'ended' && setState(IDLE), ENDED_VISIBLE_MS);
}

function poll(ms) {
	clearInterval(pollTimer);
	pollTimer = setInterval(() => refresh(), ms);
}

function onConnected() {
	stopTone();
	setState({ phase: 'connected', connectedAt: Date.now() });
	poll(POLL_CONNECTED_MS);
	if (state.call?.side === 'caller') axios.post(route('calls.connected', state.call.id)).catch(() => {});
}

// ---- keadaan dari server -------------------------------------------------------------------

async function refresh(id = state.call?.id) {
	if (!id && !guest) return;
	let call;
	try {
		call = await api.state(id);
	} catch {
		return;
	}
	if (!call) {
		// Tamu: tak ada panggilan aktif lagi untuk laporan ini.
		if (guest && state.call && state.phase !== 'ended' && state.phase !== 'nomic') finish('Panggilan berakhir');
		return;
	}
	applyServer(call);
}

function applyServer(call) {
	const mine = state.call && state.call.id === call.id;

	if (call.status === 'ended') {
		if (mine && !['ended', 'nomic'].includes(state.phase)) finish(call.end_label);
		return;
	}

	if (call.side === 'callee' && call.status === 'ringing' && !mine && !isCallBusy()) {
		clearTimeout(endedTimer);
		setState({ ...IDLE, phase: 'incoming', call });
		startTone('incoming');
		poll(POLL_ACTIVE_MS);
		return;
	}

	if (!mine) return;

	if (call.side === 'caller' && call.status === 'answered' && call.answer_sdp && state.phase === 'outgoing' && pc) {
		clearTimeout(outgoingTimer);
		stopTone();
		setState({ phase: 'connecting', call });
		pc.setRemoteDescription({ type: 'answer', sdp: call.answer_sdp }).catch(() => hangUp('failed'));
	}
}

/** Aba-aba Reverb `.reporter-call.changed` ({ callId, status }) - dari AppLayout & halaman tamu. */
export function handleCallNudge(payload) {
	const id = payload?.callId;
	if (!id && !guest) return;
	refresh(id || state.call?.id);
}

/**
 * Halaman status TAMU memasang aksesnya (URL bertanda tangan) - null saat halamannya ditutup.
 * Mengembalikan fungsi pengecek berkala untuk polling saat belum ada panggilan.
 */
export function configureGuestCalls(config) {
	guest = config || null;
}

export function checkGuestIncoming() {
	if (guest && !isCallBusy()) refresh(null);
}

// ---- aksi pemanggil ------------------------------------------------------------------------

export async function startCall(reportId) {
	if (busy || isCallBusy()) throw new Error('Masih ada panggilan yang berjalan.');
	busy = true;
	try {
		clearTimeout(endedTimer);
		try {
			localStream = await getMic();
		} catch {
			throw new Error('Mikrofon tidak bisa dipakai. Izinkan akses mikrofon di browser lalu coba lagi.');
		}
		const { data } = await axios.get(route('calls.ice'));
		pc = createPeer(data.ice_servers);
		localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
		await pc.setLocalDescription(await pc.createOffer({ offerToReceiveAudio: true }));
		await gatherComplete(pc);

		let call;
		try {
			call = (await axios.post(route('reports.calls.start', reportId), { offer_sdp: pc.localDescription.sdp })).data.call;
		} catch (e) {
			throw new Error(e?.response?.data?.message || 'Panggilan gagal dimulai. Coba lagi.');
		}

		setState({ ...IDLE, phase: 'outgoing', call });
		startTone('outgoing');
		poll(POLL_ACTIVE_MS);
		outgoingTimer = setTimeout(() => state.phase === 'outgoing' && hangUp('no_answer'), OUTGOING_TIMEOUT_MS);
	} catch (e) {
		teardown();
		setState(IDLE);
		throw e;
	} finally {
		busy = false;
	}
}

// ---- aksi pelapor --------------------------------------------------------------------------

export async function acceptCall() {
	const call = state.call;
	if (!call || state.phase !== 'incoming' || busy) return;
	busy = true;
	stopTone();
	try {
		try {
			localStream = await getMic();
		} catch {
			// APK lama tanpa izin mikrofon / browser menolak: kabari Damkar & tawarkan telepon balik.
			await api.end(call.id, 'no_mic').catch(() => {});
			teardown();
			setState({ phase: 'nomic' });
			return;
		}
		setState({ phase: 'connecting' });
		pc = createPeer(call.ice_servers);
		localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
		await pc.setRemoteDescription({ type: 'offer', sdp: call.offer_sdp });
		await pc.setLocalDescription(await pc.createAnswer());
		await gatherComplete(pc);
		const res = await api.answer(call.id, pc.localDescription.sdp);
		setState({ call: { ...call, ...res.data.call } });
		poll(POLL_ACTIVE_MS);
	} catch (e) {
		const ended = e?.response?.status === 409;
		if (!ended) await api.end(call.id, 'failed').catch(() => {});
		finish(ended ? 'Panggilan sudah berakhir' : 'Gagal tersambung');
	} finally {
		busy = false;
	}
}

export function declineCall() {
	const call = state.call;
	if (!call) return;
	api.end(call.id, 'declined').catch(() => {});
	teardown();
	setState(IDLE);
}

// ---- bersama -------------------------------------------------------------------------------

export function hangUp(reason) {
	const call = state.call;
	if (!call || ['idle', 'ended'].includes(state.phase)) return;
	const why = reason || (state.phase === 'outgoing' ? 'cancelled' : 'completed');
	const send = call.side === 'caller' ? axios.post(route('calls.end', call.id), { reason: why }) : api.end(call.id, why);
	send.catch(() => {});
	finish(
		why === 'no_answer'
			? 'Tidak diangkat'
			: why === 'failed'
				? 'Gagal tersambung'
				: why === 'cancelled'
					? 'Dibatalkan'
					: 'Panggilan berakhir',
	);
}

export function toggleMute() {
	if (!localStream) return;
	const muted = !state.muted;
	localStream.getAudioTracks().forEach((t) => (t.enabled = !muted));
	setState({ muted });
}

export function dismissCall() {
	if (['ended', 'nomic'].includes(state.phase)) {
		clearTimeout(endedTimer);
		setState(IDLE);
	}
}

import { useEffect } from 'react';
import axios from 'axios';

export default function WebPushSubscribe() {
    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.register('/sw.js').then(function (registration) {
                console.log('Service Worker registered');

                // Ambil public key dari backend
                axios.get('/webpush/public-key').then(response => {
                    const vapidPublicKey = response.data.publicKey;
                    const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

                    // Subscribe user
                    registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: convertedKey
                    }).then(subscription => {
                        // Kirim ke server
                        axios.post('/webpush/subscribe', subscription);
                    });
                });
            });
        }
    }, []);

    return null;
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
}

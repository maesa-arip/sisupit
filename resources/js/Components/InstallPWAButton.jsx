import { useEffect, useState } from 'react';

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault(); // Prevent automatic prompt
      setDeferredPrompt(e);
      setCanInstall(true);
    });
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted install');
      } else {
        console.log('User dismissed install');
      }
      setDeferredPrompt(null);
    }
  };

  return (
    canInstall && (
        
      <button onClick={handleInstall} className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-white bg-gradient-to-r from-orange-500 via-orange-500 to-orange-500 h-12 rounded-xl px-8">
        Install Aplikasi
      </button>
    )
  );
}

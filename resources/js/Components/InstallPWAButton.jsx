import { useEffect, useState } from 'react';
import { Button } from '@/Components/ui/button';

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
      <Button onClick={handleInstall} variant="orange" size="xl" className="w-full rounded-xl">
        Install Aplikasi
      </Button>
    )
  );
}

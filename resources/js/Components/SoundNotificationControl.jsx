import { useEffect, useState, useRef } from 'react';

export default function SoundNotificationControl() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Global listener dari push (atau simulasikan untuk test)
  useEffect(() => {
    window.playCustomAlert = () => {
      const audio = new Audio('/sounds/alert.mp3');
      audio.loop = true;
      audioRef.current = audio;
      audio.play();
      setIsPlaying(true);
    };
  }, []);

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  if (!isPlaying) return null;

  return (
    <div className="fixed z-50 p-2 bg-white rounded shadow bottom-4 right-4">
      <button
        onClick={stopSound}
        className="font-bold text-red-600 hover:underline"
      >
        🔇 Matikan Notifikasi Suara
      </button>
    </div>
  );
}

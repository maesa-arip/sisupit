import React from 'react';
import { useTheme } from './ThemeProvider';
import { Button } from './ui/button';
import { Moon, Sun } from 'lucide-react';

export default function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();
    
    const toggleTheme = () => {
        if (theme === 'dark') {
            setTheme('light');
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            setTheme('dark');
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
    };

    return (
        <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            // PERBAIKAN: Hapus mr-auto, ubah jadi rounded-full, tambah efek hover Amber
            className="w-10 h-10 text-gray-500 transition-all bg-white border-gray-200 rounded-full shadow-sm outline-none dark:border-slate-700 dark:bg-slate-800 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-amber-500 shrink-0"
        >
            {/* LOGIKA UX: Jika dark mode, tampilkan Matahari. Jika light mode, tampilkan Bulan */}
            {theme === 'dark' ? (
                <Sun className="w-5 h-5 transition-transform hover:rotate-90" />
            ) : (
                <Moon className="w-5 h-5 transition-transform hover:-rotate-12" />
            )}
        </Button>
    );
}
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
            className="w-10 h-10 text-muted-foreground transition-all bg-card border-border rounded-full shadow-sm outline-none hover:text-amber-500 dark:hover:text-warning hover:bg-amber-50 dark:hover:bg-warning/10 focus-visible:ring-2 focus-visible:ring-amber-500 dark:focus-visible:ring-warning shrink-0"
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
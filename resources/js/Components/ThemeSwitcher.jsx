import React from 'react'
import { useTheme } from './ThemeProvider'
import { Button } from './ui/button';
import { Moon, Sun } from 'lucide-react';

export default function ThemeSwitcher() {
    const {theme, setTheme} = useTheme();
    const toggleTheme = () => {
        if (theme === 'dark') {
            setTheme('light');
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme','light');
        } else {
            setTheme('dark');
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme','dark');
        }
    };
  return (
    <Button variant='outline' size='icon' className='mr-auto ' onClick={toggleTheme}>
        {theme === 'dark' ? <Moon className='w-4 h-4'/> : <Sun className='w-4 h-4'/> }
    </Button>
  )
}

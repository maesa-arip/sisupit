import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { IconCheck, IconSelector } from '@tabler/icons-react';
import { useState } from 'react';

export default function ComboBox({ items = [], selectedItem, onSelect, placeholder = 'Pilih item...' }) {
    const [open, setOpen] = useState(false);

    const handleSelect = (currentValue) => {
        // cmdk (pembungkus command shadcn) mengubah value menjadi huruf kecil,
        // jadi kita perlu mencari nilai aslinya dari array items
        const selected = items.find((item) => item.value.toLowerCase() === currentValue.toLowerCase());
        
        if (selected) {
            onSelect(selected.value);
        }
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button 
                    variant="outline" 
                    role="combobox" 
                    aria-expanded={open} 
                    className={cn(
                        "justify-between w-full h-12 rounded-xl border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 text-left font-normal transition-colors outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-0",
                        !selectedItem && "text-gray-500 dark:text-slate-400"
                    )}
                >
                    <span className="truncate">
                        {selectedItem
                            ? items.find((item) => item.value === selectedItem)?.label
                            : placeholder}
                    </span>
                    <IconSelector className="w-5 h-5 ml-2 text-gray-400 shrink-0" />
                </Button>
            </PopoverTrigger>
            
            <PopoverContent
                className="max-h-[--radix-popover-content-available-height] w-[--radix-popover-trigger-width] p-0 rounded-xl border-gray-200 dark:border-slate-800 shadow-xl dark:bg-slate-900 overflow-hidden"
                align="start"
            >
                <Command className="bg-transparent">
                    <CommandInput 
                        placeholder="Ketik untuk mencari..." 
                        className="h-12 border-none outline-none focus:ring-0 dark:text-slate-200" 
                    />
                    <CommandList className="overflow-y-auto max-h-60">
                        <CommandEmpty className="py-6 text-sm text-center text-gray-500 dark:text-slate-400">
                            Item tidak ditemukan
                        </CommandEmpty>
                        <CommandGroup className="p-1.5">
                            {items.map((item, index) => (
                                <CommandItem 
                                    key={index} 
                                    value={item.value} 
                                    onSelect={(value) => handleSelect(value)}
                                    className="cursor-pointer rounded-lg px-3 py-2.5 mx-0.5 my-0.5 aria-selected:bg-amber-50 aria-selected:text-amber-700 dark:aria-selected:bg-amber-900/30 dark:aria-selected:text-amber-400"
                                >
                                    <span className="truncate">{item.label}</span>
                                    <IconCheck
                                        className={cn(
                                            'ml-auto h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0',
                                            selectedItem === item.value ? 'opacity-100' : 'opacity-0',
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
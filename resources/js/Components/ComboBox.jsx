import { Button } from '@/Components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/Components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
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
						'h-12 w-full justify-between rounded-xl border-border bg-muted text-left font-normal outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
						!selectedItem && 'text-muted-foreground',
					)}
				>
					<span className="truncate">
						{selectedItem ? items.find((item) => item.value === selectedItem)?.label : placeholder}
					</span>
					<IconSelector className="ml-2 h-5 w-5 shrink-0 text-muted-foreground" />
				</Button>
			</PopoverTrigger>

			<PopoverContent
				className="max-h-[--radix-popover-content-available-height] w-[--radix-popover-trigger-width] overflow-hidden rounded-xl border-border bg-popover p-0 shadow-xl"
				align="start"
			>
				<Command className="bg-transparent">
					<CommandInput
						placeholder="Ketik untuk mencari..."
						className="h-12 border-none text-popover-foreground outline-none focus:ring-0"
					/>
					<CommandList className="max-h-60 overflow-y-auto">
						<CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
							Item tidak ditemukan
						</CommandEmpty>
						<CommandGroup className="p-1.5">
							{items.map((item, index) => (
								<CommandItem
									key={index}
									value={item.value}
									onSelect={(value) => handleSelect(value)}
									className="mx-0.5 my-0.5 cursor-pointer rounded-lg px-3 py-2.5 aria-selected:bg-accent aria-selected:text-accent-foreground"
								>
									<span className="truncate">{item.label}</span>
									<IconCheck
										className={cn(
											'ml-auto h-4 w-4 shrink-0 text-primary',
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

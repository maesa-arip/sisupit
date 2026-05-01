import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { IconCheck, IconSelector } from '@tabler/icons-react';
import { useState } from 'react';

export default function ComboBox({ items, selectedItem, onSelect, placeholder = 'Pilih item...' }) {
	const [open, setOpen] = useState(false);

	const handleSelect = (value) => {
		onSelect(value);
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" role="combobox" aria-expanded={open} className="justify-between w-full">
					{items.find((item) => item.label == selectedItem)?.label ?? 'Pilih item'}
					<IconSelector className="w-4 h-4 ml-2 opacity-50 shrink-0" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="max-h-[--radix-popover-content-available-height] w-[--radix-popover-trigger-width] p-0"
				align="start"
			>
				<Command>
					<CommandInput placeholder={placeholder} className="my-2 h-9" />
					<CommandList>
						<CommandEmpty>Item tidak ditemukan</CommandEmpty>
						<CommandGroup>
							{items.map((item, index) => (
								<CommandItem key={index} value={item.value} onSelect={(value) => handleSelect(value)}>
									{item.label}
									<IconCheck
										className={cn(
											'ml-auto h-4 w-4',
											selectedItem === item.label ? 'opacity-100' : 'opacity-0',
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

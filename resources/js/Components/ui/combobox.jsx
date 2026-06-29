import { Check, ChevronDown } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/Components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/Components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import { cn } from '@/lib/utils';

export function Combobox({
	items = [],
	value,
	onChange,
	placeholder = 'Pilih opsi...',
	emptyText = 'Data tidak ditemukan.',
	disabled = false,
	className,
}) {
	const [open, setOpen] = React.useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					disabled={disabled}
					className={cn(
						'h-9 w-full justify-between px-3 font-normal shadow-none focus-visible:ring-ring',
						!value && 'text-muted-foreground',
						className,
					)}
				>
					<span className="truncate">
						{value ? items.find((item) => item.code === value)?.name : placeholder}
					</span>
					<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			{/* w-[var(--radix-popover-trigger-width)] memastikan lebar dropdown sama persis dengan tombolnya */}
			<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
				<Command>
					<CommandInput placeholder="Cari..." className="border-none shadow-none focus:ring-0" />
					<CommandList>
						<CommandEmpty>{emptyText}</CommandEmpty>
						<CommandGroup>
							{items.map((item) => (
								<CommandItem
									key={item.code}
									value={item.name}
									onSelect={() => {
										onChange(item.code === value ? '' : item.code);
										setOpen(false);
									}}
								>
									<Check
										className={cn(
											'mr-2 h-4 w-4',
											value === item.code ? 'opacity-100' : 'opacity-0',
										)}
									/>
									{item.name}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

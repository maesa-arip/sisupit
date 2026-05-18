import * as React from "react"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function Combobox({ 
    items = [], 
    value, 
    onChange, 
    placeholder = "Pilih opsi...", 
    emptyText = "Data tidak ditemukan.",
    disabled = false,
    className
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between h-9 px-3 shadow-none font-normal focus-visible:ring-teal-500",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {value ? items.find((item) => item.code === value)?.name : placeholder}
          </span>
          <ChevronDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
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
                    onChange(item.code === value ? "" : item.code)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.code ? "opacity-100" : "opacity-0"
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
  )
}
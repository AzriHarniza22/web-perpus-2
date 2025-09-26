"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { id } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  date?: DateRange
  onDateChange?: (date: DateRange | undefined) => void
  className?: string
  placeholder?: string
}

export function DateRangePicker({
  date,
  onDateChange,
  className,
  placeholder = "Pilih rentang tanggal",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const handleSelect = (range: DateRange | undefined) => {
    onDateChange?.(range)
    if (range?.from && range?.to) {
      setIsOpen(false)
    }
  }

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) return placeholder
    if (range.from && !range.to) {
      return format(range.from, "dd MMM yyyy", { locale: id })
    }
    if (range.from && range.to) {
      return `${format(range.from, "dd MMM yyyy", { locale: id })} - ${format(range.to, "dd MMM yyyy", { locale: id })}`
    }
    return placeholder
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange(date)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
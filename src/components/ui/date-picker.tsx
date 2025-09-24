"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

function formatDate(date: Date | undefined) {
    if (!date) {
        return ""
    }

    return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    })
}

function isValidDate(date: Date | undefined) {
    if (!date) {
        return false
    }
    return !isNaN(date.getTime())
}

interface DatePickerProps {
    date?: Date
    onDateChange?: (date: Date | undefined) => void
    placeholder?: string
    disabled?: boolean
    className?: string
}

export function DatePicker({
    date,
    onDateChange,
    placeholder = "Select date",
    disabled = false,
    className = ""
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false)
    const [month, setMonth] = React.useState<Date | undefined>(date || new Date())
    const [inputValue, setInputValue] = React.useState(formatDate(date))

    // Update input value when date prop changes
    React.useEffect(() => {
        setInputValue(formatDate(date))
        if (date) {
            setMonth(date)
        }
    }, [date])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setInputValue(value)

        // Try to parse the input as a date
        if (value.trim() === "") {
            onDateChange?.(undefined)
            return
        }

        const parsedDate = new Date(value)
        if (isValidDate(parsedDate)) {
            onDateChange?.(parsedDate)
            setMonth(parsedDate)
        }
    }

    const handleDateSelect = (selectedDate: Date | undefined) => {
        onDateChange?.(selectedDate)
        setInputValue(formatDate(selectedDate))
        if (selectedDate) {
            setMonth(selectedDate)
        }
        setOpen(false)
    }

    return (
        <div className={cn("relative", className)}>
            <Input
                value={inputValue}
                placeholder={placeholder}
                className="pr-10"
                disabled={disabled}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                    if (e.key === "ArrowDown" && !disabled) {
                        e.preventDefault()
                        setOpen(true)
                    }
                }}
            />
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={disabled}
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        type="button"
                    >
                        <CalendarIcon className="h-4 w-4" />
                        <span className="sr-only">Select date</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-auto p-0"
                    align="start"
                    sideOffset={4}
                >
                    <Calendar
                        mode="single"
                        selected={date}
                        captionLayout="dropdown"
                        month={month}
                        onMonthChange={setMonth}
                        onSelect={handleDateSelect}
                        disabled={disabled}
                        autoFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
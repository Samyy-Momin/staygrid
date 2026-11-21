"use client"

import * as React from"react"
import { ChevronLeft, ChevronRight } from"lucide-react"
import { DayPicker } from"react-day-picker"

import { cn } from"@/lib/utils"
import { buttonVariants } from"@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
 className,
 classNames,
 showOutsideDays = true,
 ...props
}: CalendarProps) {
 return (
 <DayPicker
 showOutsideDays={showOutsideDays}
 className={cn("p-3", className)}
 classNames={{
 months:"flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
 month:"space-y-4",
 caption:"flex justify-center pt-1 relative items-center",
 caption_label:"text-sm font-medium",
 nav:"space-x-1 flex items-center",
 nav_button: cn(
 buttonVariants({ variant:"outline" }),
"h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
 ),
 nav_button_previous:"absolute left-1",
 nav_button_next:"absolute right-1",
 table:"w-full border-collapse space-y-1",
 head_row:"flex",
 head_cell:
"text-muted rounded-md w-9 font-normal text-[0.8rem] dark:text-muted",
 row:"flex w-full mt-2",
 cell:"h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-surface [&:has([aria-selected])]:bg-surface first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 dark:[&:has([aria-selected].day-outside)]:bg-surface dark:[&:has([aria-selected])]:bg-surface",
 day: cn(
 buttonVariants({ variant:"ghost" }),
"h-9 w-9 p-0 font-normal aria-selected:opacity-100"
 ),
 day_range_end:"day-range-end",
 day_selected:
"bg-surface text-primary hover:bg-surface hover:text-primary focus:bg-surface focus:text-primary dark:bg-surface dark:text-primary dark:hover:bg-surface dark:hover:text-primary dark:focus:bg-surface dark:focus:text-primary",
 day_today:"bg-surface text-primary dark:bg-surface dark:text-primary",
 day_outside:
"day-outside text-muted opacity-50 aria-selected:bg-surface aria-selected:text-muted aria-selected:opacity-30 dark:text-muted dark:aria-selected:bg-surface dark:aria-selected:text-muted",
 day_disabled:"text-muted opacity-50 dark:text-muted",
 day_range_middle:
"aria-selected:bg-surface aria-selected:text-primary dark:aria-selected:bg-surface dark:aria-selected:text-primary",
 day_hidden:"invisible",
 ...classNames,
 }}
 components={{
 IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
 IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
 }}
 {...props}
 />
 )
}
Calendar.displayName ="Calendar"

export { Calendar }

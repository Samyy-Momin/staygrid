"use client";

import { useEffect, useState } from"react";
import { cn } from"@/lib/utils";

interface TimePickerProps {
 value: string; //"HH:MM" 24h format
 onChange: (value: string) => void;
 className?: string;
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
 const parseTime = (timeStr: string) => {
 if (!timeStr) return { h: 14, m: 0 };
 const [h, m] = timeStr.split(":").map(Number);
 return { h: isNaN(h) ? 14 : h, m: isNaN(m) ? 0 : m };
 };

 const initial = parseTime(value);
 const isPM = initial.h >= 12;
 const initialHour12 = initial.h % 12 === 0 ? 12 : initial.h % 12;

 const [hour, setHour] = useState(initialHour12.toString());
 const [minute, setMinute] = useState(initial.m.toString().padStart(2,"0"));
 const [ampm, setAmpm] = useState(isPM ?"PM" :"AM");

 useEffect(() => {
 const newInitial = parseTime(value);
 const newIsPM = newInitial.h >= 12;
 const newHour12 = newInitial.h % 12 === 0 ? 12 : newInitial.h % 12;
 setHour(newHour12.toString());
 setMinute(newInitial.m.toString().padStart(2,"0"));
 setAmpm(newIsPM ?"PM" :"AM");
 }, [value]);

 const handleChange = (h: string, m: string, ap: string) => {
 setHour(h);
 setMinute(m);
 setAmpm(ap);

 let h24 = parseInt(h, 10);
 if (ap ==="PM" && h24 !== 12) {
 h24 += 12;
 } else if (ap ==="AM" && h24 === 12) {
 h24 = 0;
 }

 onChange(`${h24.toString().padStart(2,"0")}:${m}`);
 };

 return (
 <div className={cn("flex items-center gap-1", className)}>
 <select
 value={hour}
 onChange={(e) => handleChange(e.target.value, minute, ampm)}
 className="flex h-10 rounded-md border border-border bg-surface px-2 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary bg-surface dark:text-primary"
 >
 {Array.from({ length: 12 }).map((_, i) => (
 <option key={i + 1} value={(i + 1).toString()}>
 {(i + 1).toString().padStart(2,"0")}
 </option>
 ))}
 </select>
 
 <span className="text-muted font-bold">:</span>

 <select
 value={minute}
 onChange={(e) => handleChange(hour, e.target.value, ampm)}
 className="flex h-10 rounded-md border border-border bg-surface px-2 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary bg-surface dark:text-primary"
 >
 <option value="00">00</option>
 <option value="15">15</option>
 <option value="30">30</option>
 <option value="45">45</option>
 </select>

 <select
 value={ampm}
 onChange={(e) => handleChange(hour, minute, e.target.value)}
 className="flex h-10 rounded-md border border-border bg-surface px-2 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary bg-surface dark:text-primary min-w-[170px]"
 >
 <option value="AM">AM (Morning/Night)</option>
 <option value="PM">PM (Afternoon/Evening)</option>
 </select>
 </div>
 );
}

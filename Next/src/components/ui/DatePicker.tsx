"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface DatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
}

const months = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

function toPersianDate(date: Date): { year: number; month: number; day: number } {
  const gd = date.getDate();
  const gm = date.getMonth() + 1;
  const gy = date.getFullYear();

  let jy = gy - 621;
  let jm = gm;
  let jd = gd;

  if (gm > 10 || (gm === 10 && gd > 12)) {
    jy += 1;
  }

  return { year: jy, month: jm, day: jd };
}

function toGregorianDate(jy: number, jm: number, jd: number): Date {
  let gy = jy + 621;
  let gm = jm;
  let gd = jd;

  if (jm > 10 || (jm === 10 && jd > 12)) {
    gy -= 1;
  }

  return new Date(gy, gm - 1, gd);
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  className,
  label,
  error,
  disabled = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  const [viewDate, setViewDate] = useState(new Date());
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const persianDate = selectedDate ? toPersianDate(selectedDate) : null;
  const displayValue = persianDate
    ? `${persianDate.year}/${String(persianDate.month).padStart(2, "0")}/${String(persianDate.day).padStart(2, "0")}`
    : "";

  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setSelectedDate(newDate);
    onChange?.(newDate.toISOString().split("T")[0]);
    setIsOpen(false);
  };

  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const persianViewYear = toPersianDate(viewDate).year;
  const persianViewMonth = months[toPersianDate(viewDate).month - 1];

  return (
    <div ref={pickerRef} className={`space-y-1.5 ${className}`}>
      {label && <label className="text-xs font-bold text-foreground-muted">{label}</label>}
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          readOnly
          disabled={disabled}
          placeholder={placeholder || "تاریخ را انتخاب کنید"}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`input h-11 text-sm pr-10 cursor-pointer ${error ? "border-error" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        />
        {displayValue && !disabled && (
          <button
            onClick={() => {
              setSelectedDate(null);
              onChange?.("");
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4 text-foreground-muted hover:text-foreground" />
          </button>
        )}
      </div>
      {error && <p className="text-xs text-error">{error}</p>}

      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 mt-2 w-72 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-lg)]">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                className="p-1 hover:bg-background-subtle rounded transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="font-bold text-foreground">
                {persianViewMonth} {persianViewYear}
              </span>
              <button
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                className="p-1 hover:bg-background-subtle rounded transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((d) => (
                <span key={d} className="text-xs font-bold text-foreground-muted py-1">{d}</span>
              ))}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = selectedDate?.toDateString() === date.toDateString();

                return (
                  <button
                    key={day}
                    onClick={() => handleDateSelect(day)}
                    className={`py-1.5 text-sm rounded-lg transition-all ${isSelected
                      ? "bg-primary text-primary-foreground"
                      : isToday
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-background-subtle text-foreground"
                      }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
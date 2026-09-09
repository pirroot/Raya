"use client";

import { useRef, useEffect, useState } from "react";

interface SliderProps {
  value?: number[];
  defaultValue?: number[];
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number[]) => void;
  label?: string;
  className?: string;
}

export function Slider({
  value,
  defaultValue = [0],
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  label,
  className = "",
}: SliderProps) {
  const [internalValue, setInternalValue] = useState(defaultValue[0]);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value[0] : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onValueChange?.([newValue]);
  };

  const percentage = ((currentValue - min) / (max - min)) * 100;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-bold text-foreground">{label}</label>
          <span className="text-sm font-bold text-foreground-muted">
            {currentValue.toLocaleString("fa-IR")}
          </span>
        </div>
      )}

      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleChange}
          className={`
            slider
            w-full h-2 appearance-none cursor-pointer
            rounded-full bg-background-subtle
            transition-all
            focus:outline-none focus:ring-2 focus:ring-primary-soft
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-primary
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-all
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-webkit-slider-thumb]:active:scale-95
            [&::-webkit-slider-thumb]:shadow-[var(--shadow)]
            [&::-moz-range-thumb]:appearance-none
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-primary
            [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:border-0
            dark:[&::-webkit-slider-thumb]:bg-primary
            dark:[&::-moz-range-thumb]:bg-primary
          `}
          style={{
            background: `linear-gradient(to right, var(--primary) ${percentage}%, var(--background-subtle) ${percentage}%)`,
          }}
        />
      </div>
    </div>
  );
}
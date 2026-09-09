'use client'

import { useTheme } from "@/lib/useTheme";
import { Moon, Sun, Monitor } from "lucide-react";
import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-10 w-10 rounded-full border border-border bg-card animate-pulse" />
    );
  }

  const getIcon = () => {
    if (theme === "dark") return <Sun className="h-5 w-5" />;
    if (theme === "light") return <Moon className="h-5 w-5" />;
    return <Monitor className="h-5 w-5" />;
  };

  const getLabel = () => {
    if (theme === "dark") return "تغییر به حالت روشن";
    if (theme === "light") return "تغییر به حالت تاریک";
    return "تغییر به حالت سیستم";
  };

  const themes = [
    { value: "light", label: "روشن", icon: Sun },
    { value: "dark", label: "تاریک", icon: Moon },
    { value: "system", label: "سیستم", icon: Monitor },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={getLabel()}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground-muted transition-all duration-200 hover:bg-background-subtle hover:text-primary active:scale-95"
      >
        {getIcon()}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full z-50 mt-2 min-w-[160px] overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-lg)] animate-in fade-in slide-in-from-top-2">
            {themes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => {
                  setTheme(value as "light" | "dark" | "system");
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-background-subtle ${theme === value ? "bg-primary-soft text-primary" : "text-foreground"
                  }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                {theme === value && (
                  <span className="mr-auto h-2 w-2 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
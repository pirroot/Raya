"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Store, User, Sparkles, PlusCircle } from "lucide-react";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

// ===== Types =====
interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

// ===== Constants =====
const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "خانه", icon: Home },
  { href: "/courses", label: "آموزش", icon: BookOpen },
  { href: "/market", label: "فروشگاه", icon: Store },
  { href: "/panel", label: "پنل", icon: User },
];

// ===== Component =====
export default function Navigation() {
  const pathname = usePathname();

  const isActive = (href: string): boolean => {
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };

  const handleAddAd = () => {
    // Check if user is logged in
    const isLoggedIn = true; // Replace with actual auth check

    if (isLoggedIn) {
      // Scroll to AdSubmissionForm or open modal
      const formElement = document.getElementById('ad-submission-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = '/market?showForm=true';
      }
    } else {
      window.location.href = '/auth/mobile';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 ai-hidden">
      {/* ===== Desktop Navigation ===== */}
      <nav className="hidden lg:block fixed top-0 left-0 right-0 z-50 border-b border-border bg-card/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-xl font-extrabold text-primary">
                رایا
              </span>
              <Sparkles className="h-4 w-4 text-primary/60 group-hover:rotate-12 transition-transform" />
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-1">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    className={`
                      group relative flex items-center gap-2 rounded-lg px-4 py-2.5 transition-all duration-200
                      ${active
                        ? "bg-primary-soft text-primary"
                        : "text-foreground-muted hover:bg-background-subtle/80 hover:text-foreground"
                      }
                    `}
                  >
                    <Icon
                      size={18}
                      className={`
                        transition-all duration-200
                        ${active ? "text-primary" : "group-hover:scale-105"}
                      `}
                    />
                    <span
                      className={`
                        text-sm font-medium
                        ${active ? "text-primary" : ""}
                      `}
                    >
                      {label}
                    </span>

                    {/* Active Indicator */}
                    {active && (
                      <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}


            </div>

            {/* Theme Toggle */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* ===== Mobile Bottom Navigation ===== */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-2xl border-t border-border bg-card/95 px-1.5 pt-1.5 backdrop-blur-xl lg:hidden"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.25rem)",
        }}
      >
        <div className="mx-auto grid grid-cols-4 gap-0.5 rounded-2xl bg-background-subtle/50 p-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);

            return (
              <Link
                key={href}
                href={href}
                className={`
                  group relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 transition-all duration-200
                  ${active
                    ? "bg-primary-soft text-primary shadow-sm"
                    : "text-foreground-muted hover:bg-background-subtle/80 hover:text-foreground"
                  }
                `}
              >
                {/* Active Indicator Dot */}
                {active && (
                  <span className="absolute -top-0.5 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-primary" />
                )}

                <Icon
                  size={20}
                  className={`
                    transition-all duration-200
                    sm:h-5 sm:w-5
                    ${active ? "scale-110 text-primary" : "group-hover:scale-105"}
                  `}
                />

                <span
                  className={`
                    text-[9px] font-medium leading-none truncate
                    sm:text-[10px]
                    ${active
                      ? "text-primary"
                      : "text-foreground-muted group-hover:text-foreground"
                    }
                  `}
                >
                  {label}
                </span>

                {/* Touch Ripple Effect */}
                <span className="absolute inset-0 rounded-xl bg-primary/0 transition-opacity duration-300 group-active:bg-primary/10" />
              </Link>
            );
          })}
        </div>

      </nav>
    </div>
  );
}
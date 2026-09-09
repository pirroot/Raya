'use client';

import Link from 'next/link';
import {
  ClipboardList,
  BookOpen,
  Lightbulb,
  Vote,
  Trophy,
  GraduationCap,
  CircleHelp,
  HeartPulse,
  Gift,
  Megaphone,
  Scale,
  Users,
  CalendarDays,
} from 'lucide-react';
import { Card } from '../ui/Card';

interface ServiceItem {
  id: string;
  title: string;
  icon: any;
  href: string;
  color: string;
  bg: string;
}

const services: ServiceItem[] = [
  {
    id: 'suggestions',
    title: 'پیشنهادات',
    icon: Lightbulb,
    href: '/suggestions',
    color: 'text-white',
    bg: 'bg-amber-500',
  },
  {
    id: 'competitions',
    title: 'مسابقات',
    icon: Trophy,
    href: '/competitions',
    color: 'text-white',
    bg: 'bg-orange-500',
  },
  // { id: "ideas", title: "ایده", icon: Lightbulb, href: "/ideas", color: "text-white", bg: "bg-pink-500" },
  {
    id: 'announcements',
    title: 'اطلاعیه',
    icon: Megaphone,
    href: '/announcements',
    color: 'text-white',
    bg: 'bg-red-500',
  },
  {
    id: 'rules',
    title: 'قوانین',
    icon: Scale,
    href: '/rules',
    color: 'text-white',
    bg: 'bg-slate-600',
  },
  {
    id: 'qna',
    title: 'Q&A',
    icon: CircleHelp,
    href: '/qna',
    color: 'text-white',
    bg: 'bg-sky-500',
  },
  {
    id: 'question-bank',
    title: 'بانک سوالات',
    icon: ClipboardList,
    href: '/question-bank',
    color: 'text-white',
    bg: 'bg-blue-600',
  },
  {
    id: 'gifts',
    title: 'هدیه',
    icon: Gift,
    href: '/gifts',
    color: 'text-white',
    bg: 'bg-fuchsia-500',
  },
  {
    id: 'schedule',
    title: 'برنامه کلاسی',
    icon: CalendarDays,
    href: '/schedule',
    color: 'text-white',
    bg: 'bg-teal-500',
  },
  {
    id: 'vote-box',
    title: 'صندوق',
    icon: Vote,
    href: '/vote-box',
    color: 'text-white',
    bg: 'bg-purple-500',
  },
  {
    id: 'psychology-test',
    title: 'تست روانشناسی',
    icon: HeartPulse,
    href: '/psychology-test',
    color: 'text-white',
    bg: 'bg-rose-500',
  },
];

export function ServiceGrid() {
  return (
    <Card className="mt-3 p-3 lg:mt-4 lg:p-4">
      <div className="grid grid-cols-4 gap-2 lg:grid-cols-6 lg:gap-2.5">
        {services.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group flex flex-col items-center gap-1.5 rounded-[var(--radius)] p-2.5 text-center transition-all hover:bg-background-subtle active:scale-[0.96]"
          >
            <div
              className={`rounded-[var(--radius-sm)] ${item.bg} p-2 text-foreground-muted transition-all text-white`}
            >
              <item.icon className="h-5 w-5" />
            </div>
            <p className="text-[9px] font-bold leading-3 text-foreground line-clamp-2 max-w-[56px] lg:text-[10px]">
              {item.title}
            </p>
          </Link>
        ))}
      </div>
    </Card>
  );
}

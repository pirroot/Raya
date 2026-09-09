'use client';

import { useState } from 'react';
import {
  Check,
  X,
  Plus,
  Music,
  Gamepad2,
  Book,
  Coffee,
  Code,
  Camera,
  Heart,
  Palette,
  Dumbbell,
  Film,
  Plane,
  Bike,
} from 'lucide-react';

interface StatusOption {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

interface ProfileStatusProps {
  initialStatus?: string;
  initialInterests?: string[];
  initialBio?: string;
  onStatusChange?: (status: string) => void;
  onInterestsChange?: (interests: string[]) => void;
  onBioChange?: (bio: string) => void;
}

const statusOptions: StatusOption[] = [
  { id: 'online', label: 'آنلاین', emoji: '🟢', color: 'text-emerald-400' },
  { id: 'busy', label: 'مشغول', emoji: '🔴', color: 'text-rose-400' },
  { id: 'chill', label: 'چیل', emoji: '😎', color: 'text-amber-400' },
  { id: 'studying', label: 'در حال مطالعه', emoji: '📚', color: 'text-blue-400' },
  { id: 'gaming', label: 'گیم', emoji: '🎮', color: 'text-purple-400' },
  { id: 'coffee', label: 'کافه', emoji: '☕', color: 'text-amber-600' },
  { id: 'music', label: 'موزیک', emoji: '🎵', color: 'text-pink-400' },
  { id: 'coding', label: 'کد زدن', emoji: '💻', color: 'text-cyan-400' },
];

const interestOptions = [
  { id: 'music', label: 'موزیک', icon: Music, color: 'text-pink-400' },
  { id: 'gaming', label: 'بازی', icon: Gamepad2, color: 'text-purple-400' },
  { id: 'reading', label: 'کتاب', icon: Book, color: 'text-amber-400' },
  { id: 'coffee', label: 'قهوه', icon: Coffee, color: 'text-amber-600' },
  { id: 'coding', label: 'برنامه‌نویسی', icon: Code, color: 'text-cyan-400' },
  { id: 'photography', label: 'عکاسی', icon: Camera, color: 'text-rose-400' },
  { id: 'art', label: 'هنر', icon: Palette, color: 'text-violet-400' },
  { id: 'sport', label: 'ورزش', icon: Dumbbell, color: 'text-emerald-400' },
  { id: 'movie', label: 'فیلم', icon: Film, color: 'text-indigo-400' },
  { id: 'travel', label: 'سفر', icon: Plane, color: 'text-sky-400' },
  { id: 'cycling', label: 'دوچرخه', icon: Bike, color: 'text-lime-400' },
  { id: 'heart', label: 'عشق', icon: Heart, color: 'text-rose-400' },
];

export function ProfileStatus({
  initialStatus = 'online',
  initialInterests = [],
  onStatusChange,
  onInterestsChange,
}: ProfileStatusProps) {
  const [status, setStatus] = useState(initialStatus);
  const [interests, setInterests] = useState<string[]>(initialInterests);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showInterestPicker, setShowInterestPicker] = useState(false);

  const currentStatus = statusOptions.find((s) => s.id === status);

  const handleStatusSelect = (id: string) => {
    setStatus(id);
    onStatusChange?.(id);
    setShowStatusPicker(false);
  };

  const toggleInterest = (id: string) => {
    const newInterests = interests.includes(id)
      ? interests.filter((i) => i !== id)
      : [...interests, id];
    setInterests(newInterests);
    onInterestsChange?.(newInterests);
  };

  return (
    <div className="space-y-4">
      {/* Status */}
      <div>
        <p className="text-xs font-bold text-foreground-muted mb-2">وضعیت</p>
        <div className="relative">
          <button
            onClick={() => setShowStatusPicker(!showStatusPicker)}
            className="flex items-center gap-2 rounded-full bg-background-subtle px-4 py-2 text-sm font-medium text-foreground hover:bg-background-subtle/80 transition-all"
          >
            <span className={currentStatus?.color}>{currentStatus?.emoji}</span>
            <span>{currentStatus?.label}</span>
          </button>

          {showStatusPicker && (
            <div className="absolute top-full left-0 z-20 mt-2 min-w-[200px] rounded-xl border border-border bg-card p-2 shadow-[var(--shadow-lg)]">
              {statusOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleStatusSelect(opt.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all ${
                    status === opt.id ? 'bg-primary/10 text-primary' : 'hover:bg-background-subtle'
                  }`}
                >
                  <span className={opt.color}>{opt.emoji}</span>
                  <span>{opt.label}</span>
                  {status === opt.id && <Check className="mr-auto h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interests */}
      <div>
        <p className="text-xs font-bold text-foreground-muted mb-2">علاقه‌مندی‌ها</p>
        <div className="flex flex-wrap gap-2">
          {interests.map((id) => {
            const opt = interestOptions.find((i) => i.id === id);
            if (!opt) return null;
            const Icon = opt.icon;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
              >
                <Icon className={`h-3.5 w-3.5 ${opt.color}`} />
                {opt.label}
                <button onClick={() => toggleInterest(id)} className="hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          <button
            onClick={() => setShowInterestPicker(!showInterestPicker)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-foreground-muted hover:border-primary transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            افزودن
          </button>
        </div>

        {showInterestPicker && (
          <div className="mt-2 flex flex-wrap gap-2 p-3 rounded-xl border border-border bg-background-subtle">
            {interestOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = interests.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleInterest(opt.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-foreground-muted hover:bg-background-subtle'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : opt.color}`} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

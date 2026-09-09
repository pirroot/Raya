'use client';

import Link from 'next/link';
import { Heart, Download, Eye, Bookmark, Star, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import type { Question } from '@/lib/question-bank/types';

interface QuestionCardProps {
  question: Question;
  variant?: 'default' | 'compact';
  onLike?: (id: string) => void;
  onSave?: (id: string) => void;
}

const currencyFormatter = new Intl.NumberFormat('fa-IR');

export function QuestionCard({ question, variant = 'default', onLike, onSave }: QuestionCardProps) {
  const [isLiked, setIsLiked] = useState(question.isLiked || false);
  const [isSaved, setIsSaved] = useState(question.isSaved || false);
  const [likesCount, setLikesCount] = useState(question.likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
    onLike?.(question.id);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    onSave?.(question.id);
  };

  // ✅ چک کن خریداری شده یا رایگانه
  const isPurchased = question.isPurchased || false;
  const isFree = question.priceType === 'free';
  const showPrice = !isPurchased && !isFree;

  // Compact variant for mobile / grid view
  if (variant === 'compact') {
    return (
      <div className="card overflow-hidden p-3 transition-all hover:scale-[1.02] hover:shadow-[var(--shadow-lg)]">
        <div className="flex gap-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius)] bg-gradient-to-br from-primary/10 to-secondary/10 sm:h-20 sm:w-20">
            {question.image ? (
              <img
                src={question.image}
                alt={question.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xl sm:text-2xl">📄</div>
            )}
            {question.discount && (
              <div className="absolute top-0.5 right-0.5 rounded-full bg-error px-1 py-0.5 text-[6px] font-black text-white sm:text-[8px]">
                {question.discount}%
              </div>
            )}
            {/* ✅ وضعیت خرید */}
            {isPurchased && (
              <div className="absolute bottom-0.5 right-0.5 rounded-full bg-emerald-500 px-1 py-0.5 text-[6px] font-black text-white">
                ✓
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Link href={`/question-bank/${question.id}`}>
              <h3 className="line-clamp-2 text-xs font-black text-foreground hover:text-primary transition-colors sm:text-sm">
                {question.title}
              </h3>
            </Link>
            <p className="mt-0.5 text-[9px] text-foreground-muted sm:text-[10px]">
              {question.teacher}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[9px] text-foreground-muted sm:gap-3 sm:text-[10px]">
              <span className="flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400 sm:h-3 sm:w-3" />
                {question.rating}
              </span>
              <span className="flex items-center gap-0.5">
                <Heart
                  className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`}
                />
                {likesCount}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1.5">
                {question.oldPrice && (
                  <span className="text-[8px] text-foreground-muted line-through sm:text-[10px]">
                    {currencyFormatter.format(question.oldPrice)}
                  </span>
                )}
                {/* ✅ قیمت یا وضعیت خرید */}
                {isPurchased ? (
                  <span className="text-[9px] font-black text-emerald-600 flex items-center gap-0.5">
                    <CheckCircle className="h-3 w-3" />
                    خریداری شده
                  </span>
                ) : isFree ? (
                  <span className="text-xs font-black text-emerald-600 sm:text-sm">رایگان</span>
                ) : (
                  <span className="text-xs font-black text-primary sm:text-sm">
                    {currencyFormatter.format(question.price)}
                  </span>
                )}
              </div>
              <Link
                href={`/question-bank/${question.id}`}
                className="btn btn-primary rounded-[var(--radius)] px-1.5 py-0.5 text-[8px] sm:px-2 sm:py-1 sm:text-[9px]"
              >
                {isPurchased ? 'مشاهده' : 'خرید'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="card overflow-hidden p-3 transition-all hover:scale-[1.02] hover:shadow-[var(--shadow-lg)] sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        {/* Image */}
        <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-[var(--radius)] bg-gradient-to-br from-primary/10 to-secondary/10 sm:h-28 sm:w-28">
          {question.image ? (
            <img src={question.image} alt={question.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl sm:text-3xl">📄</div>
          )}
          {question.discount && (
            <div className="absolute top-1 right-1 rounded-full bg-error px-1.5 py-0.5 text-[8px] font-black text-white sm:text-[9px]">
              {question.discount}%
            </div>
          )}
          {question.badge && (
            <div className="absolute bottom-1 right-1 rounded-full bg-primary/90 px-1.5 py-0.5 text-[7px] font-black text-white backdrop-blur-sm sm:text-[8px]">
              {question.badge}
            </div>
          )}
          {/* ✅ وضعیت خرید */}
          {isPurchased && (
            <div className="absolute bottom-1 left-1 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[7px] font-black text-white flex items-center gap-0.5">
              <CheckCircle className="h-3 w-3" />
              خریداری شده
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <Link href={`/question-bank/${question.id}`}>
            <h3 className="line-clamp-2 text-sm font-black text-foreground hover:text-primary transition-colors sm:text-base">
              {question.title}
            </h3>
          </Link>
          <p className="mt-0.5 text-[10px] text-foreground-muted sm:text-xs">{question.teacher}</p>

          {/* Stats */}
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-foreground-muted sm:gap-3 sm:text-[11px]">
            <span className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400 sm:h-3.5 sm:w-3.5" />
              {question.rating || 0} ({question.likes?.toLocaleString('fa-IR') || 0})
            </span>
            <span className="flex items-center gap-0.5">
              <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {question.downloads.toLocaleString('fa-IR')}
            </span>
            <span className="flex items-center gap-0.5">
              <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {question.views.toLocaleString('fa-IR')}
            </span>
            <span className="badge badge-primary text-[8px] sm:text-[9px]">
              {question.category.title}
            </span>
            {/* ✅ وضعیت رایگان */}
            {isFree && !isPurchased && (
              <span className="badge bg-emerald-100 text-emerald-700 text-[8px] sm:text-[9px]">
                رایگان
              </span>
            )}
          </div>

          {/* Price & Actions */}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {question.oldPrice && (
                <span className="text-[10px] text-foreground-muted line-through sm:text-xs">
                  {currencyFormatter.format(question.oldPrice)}
                </span>
              )}
              {/* ✅ قیمت یا وضعیت خرید */}
              {isPurchased ? (
                <span className="text-sm font-black text-emerald-600 flex items-center gap-1 sm:text-base">
                  <CheckCircle className="h-4 w-4" />
                  خریداری شده
                </span>
              ) : isFree ? (
                <span className="text-base font-black text-emerald-600 sm:text-lg">رایگان</span>
              ) : (
                <span className="text-base font-black text-primary sm:text-lg">
                  {currencyFormatter.format(question.price)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button
                onClick={handleLike}
                className={`rounded-full p-1.5 transition-all hover:bg-background-subtle ${
                  isLiked ? 'text-rose-500' : 'text-foreground-muted'
                }`}
              >
                <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isLiked ? 'fill-rose-500' : ''}`} />
              </button>
              <button
                onClick={handleSave}
                className={`rounded-full p-1.5 transition-all hover:bg-background-subtle ${
                  isSaved ? 'text-primary' : 'text-foreground-muted'
                }`}
              >
                <Bookmark
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isSaved ? 'fill-primary' : ''}`}
                />
              </button>
              <Link
                href={`/question-bank/${question.id}`}
                className="btn btn-primary rounded-[var(--radius)] px-2 py-1 text-[9px] sm:px-3 sm:py-1 sm:text-[10px]"
              >
                {isPurchased ? 'مشاهده' : 'خرید'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

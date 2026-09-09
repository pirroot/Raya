'use client';

import { CheckCircle } from 'lucide-react';

interface Option {
  id: string;
  label: string;
  is_correct?: boolean;
}

interface TestQuestionProps {
  question: {
    id: string;
    question: string;
    options: Option[];
  };
  index: number;
  selectedAnswer?: string;
  onSelect: (questionId: string, optionId: string) => void;
  totalQuestions: number;
  isLocked?: boolean;
}

export function TestQuestion({
  question,
  index,
  selectedAnswer,
  onSelect,
  totalQuestions,
  isLocked = false,
}: TestQuestionProps) {
  // ===== چک کردن وجود سوال و گزینه‌ها =====
  if (!question) {
    return <p className="text-foreground-muted">سوالی وجود ندارد</p>;
  }

  if (!question.options || question.options.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="badge badge-primary text-xs">
            سوال {index + 1} از {totalQuestions}
          </span>
        </div>
        <h3 className="text-lg font-black text-foreground">{question.question}</h3>
        <p className="text-sm text-foreground-muted">گزینه‌ای برای این سوال وجود ندارد</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="badge badge-primary text-xs">
          سوال {index + 1} از {totalQuestions}
        </span>
      </div>

      <h3 className="text-lg font-black text-foreground">{question.question}</h3>

      <div className="mt-4 space-y-3">
        {question.options.map((option) => {
          const isSelected = selectedAnswer === option.id;
          return (
            <button
              key={option.id}
              onClick={() => !isLocked && onSelect(question.id, option.id)}
              disabled={isLocked}
              className={`w-full rounded-[var(--radius)] border-2 p-4 text-right transition-all ${
                isSelected
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50 hover:bg-background-subtle'
              } ${isLocked ? 'cursor-default opacity-70' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background-subtle text-foreground-muted'
                  }`}
                >
                  {String.fromCharCode(65 + question.options.indexOf(option))}
                </span>
                <span className="text-sm">{option.label}</span>
                {isSelected && <CheckCircle className="mr-auto h-4 w-4 text-primary" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

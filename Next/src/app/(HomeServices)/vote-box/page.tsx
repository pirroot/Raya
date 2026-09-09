'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Vote, CheckCircle, BarChart3, Clock, Users, Loader2 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import api, { API_ENDPOINTS } from '@/lib/api';
import { isAuthError } from '@/lib/api-error';

// ===== Types =====
interface VoteOption {
  id: string;
  label: string;
  votes: number;
}

interface Poll {
  id: string;
  title: string;
  description: string;
  options: VoteOption[];
  total_votes: number;
  is_active: boolean;
  is_voted: boolean;
  user_vote: string | null;
  starts_at: string;
  ends_at: string;
}

// ===== Components =====
function VoteOptionItem({
  option,
  totalVotes,
  isVoted,
  isActive,
  userVote,
  onVote,
}: {
  option: VoteOption;
  totalVotes: number;
  isVoted: boolean;
  isActive: boolean;
  userVote?: string | null;
  onVote: (optionId: string) => void;
}) {
  const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
  const isSelected = userVote === option.id;

  return (
    <button
      onClick={() => isActive && !isVoted && onVote(option.id)}
      disabled={!isActive || isVoted}
      className={`w-full rounded-[var(--radius)] border-2 p-4 text-right transition-all ${
        isSelected
          ? 'border-primary bg-primary/10'
          : isVoted
            ? 'border-border bg-background-subtle cursor-default'
            : 'border-border hover:border-primary/50 hover:bg-background-subtle cursor-pointer'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-sm font-medium text-foreground">{option.label}</span>
          {isSelected && <CheckCircle className="h-4 w-4 text-primary shrink-0" />}
        </div>
        {isVoted && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-foreground-muted">
              {option.votes.toLocaleString('fa-IR')} رأی
            </span>
            <span className="text-xs font-bold text-primary">{percentage.toFixed(1)}%</span>
          </div>
        )}
      </div>

      {isVoted && (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-background-subtle">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isSelected ? 'bg-primary' : 'bg-primary/40'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </button>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// ===== Main Page =====
export default function VoteBoxPage() {
  const router = useRouter();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [pastPolls, setPastPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ===== Load Polls =====
  useEffect(() => {
    const loadPolls = async () => {
      try {
        const [activeRes, pastRes] = await Promise.all([
          api.get(API_ENDPOINTS.POLLS.LIST),
          api.get(API_ENDPOINTS.POLLS.PAST),
        ]);

        const activePolls = activeRes.data?.results || [];
        setPoll(activePolls.length > 0 ? activePolls[0] : null);
        setPastPolls(pastRes.data?.results || []);
      } catch (error) {
        if (isAuthError(error)) {
          router.replace('/auth/mobile');
          return;
        }
        console.error('Error loading polls:', error);
        setPoll(null);
        setPastPolls([]);
      } finally {
        setLoading(false);
      }
    };

    loadPolls();
  }, [router]);

  // ===== Handle Vote =====
  const handleVote = (optionId: string) => {
    if (poll?.is_voted) return;
    setSelectedOption(optionId);
  };

  const handleSubmitVote = async () => {
    if (!selectedOption || !poll) return;

    setSubmitting(true);
    try {
      await api.post(API_ENDPOINTS.POLLS.VOTE(poll.id), {
        option_id: selectedOption,
      });

      // Reload polls
      const [activeRes, pastRes] = await Promise.all([
        api.get(API_ENDPOINTS.POLLS.LIST),
        api.get(API_ENDPOINTS.POLLS.PAST),
      ]);

      const activePolls = activeRes.data?.results || [];
      setPoll(activePolls.length > 0 ? activePolls[0] : null);
      setPastPolls(pastRes.data?.results || []);
      setSelectedOption(null);
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // ===== Loading =====
  if (loading) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Container>
    );
  }

  const totalVotes = poll?.total_votes || 0;

  return (
    <Container className="pb-28 pt-4 lg:pb-16 lg:pt-8">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="btn btn-secondary rounded-[var(--radius)] p-2">
            <ArrowRight className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-black text-foreground">🗳️ صندوق نظرسنجی</h1>
        </div>
        <span className="badge badge-primary text-xs">{poll?.is_active ? 'فعال' : 'بسته شده'}</span>
      </div>

      {/* Active Poll */}
      {poll ? (
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-black text-foreground">{poll.title}</h2>
              <p className="mt-1 text-sm text-foreground-muted">{poll.description}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground-muted">
              <Users className="h-4 w-4" />
              {totalVotes.toLocaleString('fa-IR')} رأی
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {poll.options.map((option) => (
              <VoteOptionItem
                key={option.id}
                option={option}
                totalVotes={totalVotes}
                isVoted={poll.is_voted}
                isActive={poll.is_active}
                userVote={poll.user_vote}
                onVote={handleVote}
              />
            ))}
          </div>

          {!poll.is_voted && poll.is_active && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-foreground-muted">
                {selectedOption ? 'گزینه مورد نظر را انتخاب کردید' : 'یک گزینه را انتخاب کنید'}
              </p>
              <button
                onClick={handleSubmitVote}
                disabled={!selectedOption || submitting}
                className="btn btn-primary disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Vote className="h-4 w-4" />
                )}
                ثبت رأی
              </button>
            </div>
          )}

          {poll.is_voted && (
            <div className="mt-4 flex items-center gap-2 rounded-[var(--radius)] bg-success/10 px-4 py-2 text-sm text-success">
              <CheckCircle className="h-4 w-4" />
              رأی شما با موفقیت ثبت شد
            </div>
          )}

          <div className="mt-4 flex items-center gap-4 text-xs text-foreground-muted">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              شروع: {formatDate(poll.starts_at)}
            </span>
            {poll.ends_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                پایان: {formatDate(poll.ends_at)}
              </span>
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-sm font-bold text-foreground-muted">نظرسنجی فعالی وجود ندارد</p>
          <p className="text-xs text-foreground-muted/60">به زودی اضافه می‌شود</p>
        </Card>
      )}

      {/* Past Polls */}
      {pastPolls.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-base font-black text-foreground">نظرسنجی‌های قبلی</h2>
            <span className="badge bg-background-subtle text-foreground-muted text-xs">
              {pastPolls.length} مورد
            </span>
          </div>

          <div className="space-y-3">
            {pastPolls.map((pastPoll) => {
              const total = pastPoll.total_votes;
              return (
                <Card
                  key={pastPoll.id}
                  className="p-4 opacity-80 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-black text-foreground">{pastPoll.title}</h3>
                      <p className="text-xs text-foreground-muted">{pastPoll.description}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-foreground-muted">
                      <Users className="h-3.5 w-3.5" />
                      {total.toLocaleString('fa-IR')}
                    </div>
                  </div>

                  <div className="mt-2 space-y-1.5">
                    {pastPoll.options.map((opt) => {
                      const percentage = total > 0 ? (opt.votes / total) * 100 : 0;
                      const isUserVote = pastPoll.user_vote === opt.id;
                      return (
                        <div key={opt.id} className="flex items-center gap-3">
                          <span className="text-xs text-foreground-muted w-20 truncate">
                            {opt.label}
                          </span>
                          <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-background-subtle">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isUserVote ? 'bg-primary' : 'bg-primary/40'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-foreground-muted whitespace-nowrap">
                            {percentage.toFixed(0)}%
                          </span>
                          {isUserVote && (
                            <span className="badge badge-primary text-[8px]">شما</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-[10px] text-foreground-muted">
                    <span>{formatDate(pastPoll.starts_at)}</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span className="flex items-center gap-0.5">
                      <BarChart3 className="h-3 w-3" />
                      {pastPoll.options.length} گزینه
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </Container>
  );
}

'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Trophy, Medal, Clock, Users, Sparkles, ChevronLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import api, { API_ENDPOINTS } from "@/lib/api";
import { isAuthError } from "@/lib/api-error";

// ===== Types =====
interface Competition {
  id: string;
  title: string;
  description: string;
  prize: string;
  participants_count: number;
  deadline: string;
  status: "active" | "upcoming" | "ended";
  is_registered: boolean;
}

// ===== Constants =====
const statusLabels: Record<Competition["status"], { label: string; color: string }> = {
  active: { label: "در حال برگزاری", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" },
  upcoming: { label: "به زودی", color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30" },
  ended: { label: "پایان یافته", color: "text-slate-500 bg-slate-50 dark:bg-slate-800/30" },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function CompetitionsPage() {
  const router = useRouter();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Competition["status"]>("all");
  const [registering, setRegistering] = useState<string | null>(null);

  // ===== Load Competitions =====
  useEffect(() => {
    const loadCompetitions = async () => {
      try {
        const response = await api.get(API_ENDPOINTS.COMPETITIONS.LIST);
        const data = Array.isArray(response.data?.results) ? response.data.results : [];
        setCompetitions(data);
      } catch (error) {
        if (isAuthError(error)) {
          router.replace('/auth/mobile');
          return;
        }
        console.error('Error loading competitions:', error);
        setCompetitions([]);
      } finally {
        setLoading(false);
      }
    };

    loadCompetitions();
  }, [router]);

  // ===== Register =====
  const handleRegister = async (id: string) => {
    setRegistering(id);
    try {
      await api.post(API_ENDPOINTS.COMPETITIONS.REGISTER(id));
      setCompetitions((prev) =>
        prev.map((comp) =>
          comp.id === id
            ? { ...comp, is_registered: true, participants_count: comp.participants_count + 1 }
            : comp
        )
      );
    } catch (error) {
      console.error('Error registering:', error);
    } finally {
      setRegistering(null);
    }
  };

  // ===== Unregister =====
  const handleUnregister = async (id: string) => {
    setRegistering(id);
    try {
      await api.delete(API_ENDPOINTS.COMPETITIONS.UNREGISTER(id));
      setCompetitions((prev) =>
        prev.map((comp) =>
          comp.id === id
            ? { ...comp, is_registered: false, participants_count: comp.participants_count - 1 }
            : comp
        )
      );
    } catch (error) {
      console.error('Error unregistering:', error);
    } finally {
      setRegistering(null);
    }
  };

  // ===== Filter =====
  const filtered = competitions.filter((c) =>
    filter === "all" ? true : c.status === filter
  );

  // ===== Loading =====
  if (loading) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </Container>
    );
  }

  return (
    <Container className="pb-28 pt-2 lg:pb-16 lg:pt-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <Link href="/" className="btn btn-secondary rounded-[var(--radius)] p-2">
          <ArrowRight className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-black text-foreground">مسابقات</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setFilter("all")}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-all ${filter === "all"
            ? "bg-primary text-primary-foreground"
            : "bg-background-subtle text-foreground-muted hover:bg-background-subtle/80"
            }`}
        >
          همه
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-all ${filter === "active"
            ? "bg-emerald-500 text-white"
            : "bg-background-subtle text-foreground-muted hover:bg-background-subtle/80"
            }`}
        >
          در حال برگزاری
        </button>
        <button
          onClick={() => setFilter("upcoming")}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-all ${filter === "upcoming"
            ? "bg-blue-500 text-white"
            : "bg-background-subtle text-foreground-muted hover:bg-background-subtle/80"
            }`}
        >
          به زودی
        </button>
        <button
          onClick={() => setFilter("ended")}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-all ${filter === "ended"
            ? "bg-slate-500 text-white"
            : "bg-background-subtle text-foreground-muted hover:bg-background-subtle/80"
            }`}
        >
          پایان یافته
        </button>
      </div>

      {/* Competitions */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <Trophy className="mx-auto h-10 w-10 text-foreground-muted/30" />
            <p className="mt-2 text-sm font-bold text-foreground-muted">مسابقه‌ای پیدا نشد</p>
          </Card>
        ) : (
          filtered.map((comp) => {
            const statusInfo = statusLabels[comp.status];
            return (
              <Card key={comp.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius)] ${statusInfo.color}`}>
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="truncate text-sm font-black text-foreground">{comp.title}</p>
                        <p className="text-xs text-foreground-muted">{comp.description}</p>
                      </div>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-foreground-muted">
                      <span className="flex items-center gap-0.5">
                        <Trophy className="h-3 w-3" />
                        {comp.prize}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Users className="h-3 w-3" />
                        {comp.participants_count} شرکت‌کننده
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {formatDate(comp.deadline)}
                      </span>
                    </div>
                    {comp.status !== "ended" && (
                      <button
                        onClick={() =>
                          comp.is_registered
                            ? handleUnregister(comp.id)
                            : handleRegister(comp.id)
                        }
                        disabled={registering === comp.id}
                        className={`mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold transition-all ${
                          comp.is_registered
                            ? "bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-950/30"
                            : "bg-primary/10 text-primary hover:bg-primary/20"
                        } disabled:opacity-50`}
                      >
                        {registering === comp.id ? (
                          "در حال..."
                        ) : comp.is_registered ? (
                          "انصراف"
                        ) : (
                          "ثبت نام"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </Container>
  );
}

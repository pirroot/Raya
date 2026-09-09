'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowRight, MessageSquare, ThumbsUp, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import api, { API_ENDPOINTS } from '@/lib/api';

// ===== Types =====
interface QAItem {
  id: string;
  question: string;
  answer: string;
  author: string;
  likes: number;
  views: number;
  created_at: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function QnAPage() {
  const [qaData, setQaData] = useState<QAItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ===== Load Q&A =====
  useEffect(() => {
    const loadQA = async () => {
      try {
        const response = await api.get(API_ENDPOINTS.QNA.LIST);
        const data = Array.isArray(response.data?.results) ? response.data.results : [];
        setQaData(data);
      } catch (error) {
        console.error('Error loading Q&A:', error);
        setQaData([]);
      } finally {
        setLoading(false);
      }
    };

    loadQA();
  }, []);

  // ===== Like =====
  const handleLike = async (id: string) => {
    try {
      const response = await api.post(API_ENDPOINTS.QNA.LIKE(id));
      setQaData((prev) =>
        prev.map((item) => (item.id === id ? { ...item, likes: response.data.likes } : item))
      );
    } catch (error) {
      console.error('Error liking:', error);
    }
  };

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
      <div className="mb-4 flex items-center gap-3">
        <Link href="/" className="btn btn-secondary rounded-[var(--radius)] p-2">
          <ArrowRight className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-black text-foreground">پرسش و پاسخ</h1>
      </div>

      <div className="space-y-3">
        {qaData.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm font-bold text-foreground-muted">پرسشی وجود ندارد</p>
            <p className="text-xs text-foreground-muted/60">به زودی اضافه می‌شود</p>
          </Card>
        ) : (
          qaData.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <Card key={item.id} className="p-4">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full text-right"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-md font-black text-foreground">{item.question}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[12px] text-foreground-muted">
                        <span className="flex items-center gap-0.5">
                          <MessageSquare className="h-3 w-3" />
                          {item.author}
                        </span>
                        {/* <span className="flex items-center gap-0.5">
                          <ThumbsUp className="h-3 w-3" />
                          {item.likes}
                        </span> */}
                        {/* <span className="flex items-center gap-0.5">
                          <Eye className="h-3 w-3" />
                          {item.views}
                        </span> */}
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-foreground-muted shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-foreground-muted shrink-0" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-sm text-foreground-muted leading-6">{item.answer}</p>
                    {/* <button
                      onClick={() => handleLike(item.id)}
                      className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary transition-all hover:bg-primary/20"
                    >
                      <ThumbsUp className="h-3 w-3" />
                      مفید بود
                    </button> */}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </Container>
  );
}

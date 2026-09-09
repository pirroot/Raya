'use client';

import { X, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
}

const currencyFormatter = new Intl.NumberFormat('fa-IR');

export function CartDrawer({ isOpen, onClose, items, onRemove }: CartDrawerProps) {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const totalItems = items.length;

  if (!isOpen) return null;

  const handleCheckout = () => {
    const productIds = items.map((item) => item.id).join(',');
    onClose();
    window.location.href = `/market/checkout?product=${productIds}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <div
        className="h-full w-full max-w-md bg-card shadow-[var(--shadow-xl)] animate-in slide-in-from-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-black text-foreground">سبد خرید</h2>
            <span className="badge badge-primary text-xs">{totalItems} کالا</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-background-subtle transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-3"
          style={{ maxHeight: 'calc(100vh - 200px)' }}
        >
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-16 w-16 text-foreground-muted/30" />
              <p className="mt-3 text-sm font-bold text-foreground-muted">سبد خرید خالی است</p>
              <p className="text-xs text-foreground-muted/60">کالاهای مورد نظر خود را اضافه کنید</p>
              <Link href="/market" onClick={onClose} className="mt-4 btn btn-secondary text-sm">
                <ArrowLeft className="h-4 w-4" />
                مرور کالاها
              </Link>
            </div>
          ) : (
            items.map((item) => {
              return (
                <div
                  key={item.id}
                  className="flex gap-3 rounded-[var(--radius)] border border-border p-3"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-background-subtle">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl">📦</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-black text-foreground">{item.title}</p>
                    <p className="text-sm font-bold text-primary">
                      {currencyFormatter.format(item.price)} تومان
                    </p>

                    <div className="mt-2">
                      <button
                        onClick={() => onRemove(item.id)}
                        className="rounded-full p-1 text-error hover:bg-error/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border p-4 space-y-3 bg-background-subtle/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground-muted">جمع کل</span>
              <div className="text-right">
                <span className="text-xl font-black text-primary">
                  {currencyFormatter.format(total)}
                </span>
                <span className="mr-1 text-xs text-foreground-muted">تومان</span>
              </div>
            </div>

            <button onClick={handleCheckout} className="btn btn-primary w-full text-sm">
              ادامه فرآیند خرید
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

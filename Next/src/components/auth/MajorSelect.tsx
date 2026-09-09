"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Loader2, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { MajorCategory, MajorOption, PaginatedResponse } from "./education-types";

const SUGGESTED_MAJORS = [
  "پزشکی",
  "مهندسی کامپیوتر",
  "مهندسی عمران",
  "پرستاری",
  "حسابداری",
  "مدیریت بازرگانی",
  "روانشناسی",
  "معماری",
] as const;

const MAJOR_CATEGORIES: Array<{ value: MajorCategory; label: string }> = [
  { value: "engineering", label: "مهندسی" },
  { value: "medical", label: "پزشکی" },
  { value: "humanities", label: "علوم انسانی" },
  { value: "management", label: "مدیریت" },
  { value: "science", label: "علوم پایه" },
  { value: "art", label: "هنر" },
];
const PERSIAN_TEXT_PATTERN = /[آ-ی]/;

type MajorSelectProps = {
  selectedMajor: MajorOption | null;
  onSelect: (major: MajorOption) => void;
};

async function fetchMajors(
  params: {
    search?: string;
    category?: MajorCategory;
    page: number;
    limit: number;
  },
  signal?: AbortSignal,
): Promise<PaginatedResponse<MajorOption>> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.search) {
    searchParams.set("search", params.search);
  }

  if (params.category) {
    searchParams.set("category", params.category);
  }

  const response = await fetch(`/api/backend/majors?${searchParams}`, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });

  const payload = (await response.json().catch(() => ({}))) as
    | PaginatedResponse<MajorOption>
    | { message?: string };

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : "دریافت رشته‌ها انجام نشد.";
    throw new Error(message);
  }

  return payload as PaginatedResponse<MajorOption>;
}

export default function MajorSelect({ selectedMajor, onSelect }: MajorSelectProps) {
  const listboxId = useId();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<MajorCategory | "">("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggestedLoading, setSuggestedLoading] = useState<string | null>(null);
  const [suggestedError, setSuggestedError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLLIElement | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  const majorsQuery = useInfiniteQuery({
    queryKey: ["majors", debouncedSearch, category],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      fetchMajors(
        {
          search: debouncedSearch || undefined,
          category: category || undefined,
          page: pageParam,
          limit: 20,
        },
        signal,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const options = useMemo(() => {
    const optionMap = new Map<string, MajorOption>();
    const pages = majorsQuery.data?.pages ?? [];

    for (const page of pages) {
      for (const item of page.data) {
        optionMap.set(item.majorId, item);
      }
    }

    return Array.from(optionMap.values()).filter(
      (item) =>
        PERSIAN_TEXT_PATTERN.test(item.majorNameFa) &&
        PERSIAN_TEXT_PATTERN.test(item.majorCategoryNameFa),
    );
  }, [majorsQuery.data]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    if (!open || !loadMoreRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          majorsQuery.hasNextPage &&
          !majorsQuery.isFetchingNextPage
        ) {
          void majorsQuery.fetchNextPage();
        }
      },
      { rootMargin: "120px" },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [open, majorsQuery]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [debouncedSearch, category]);

  const pickMajor = (major: MajorOption) => {
    onSelect(major);
    setSearch(major.majorNameFa);
    setOpen(false);
    setSuggestedError(null);
  };

  const handlePickSuggested = async (majorNameFa: string) => {
    setSuggestedError(null);
    setSuggestedLoading(majorNameFa);

    try {
      const payload = await queryClient.fetchQuery({
        queryKey: ["suggested-major", majorNameFa],
        queryFn: ({ signal }) =>
          fetchMajors(
            {
              search: majorNameFa,
              page: 1,
              limit: 20,
            },
            signal,
          ),
        staleTime: 5 * 60_000,
      });

      const exact =
        payload.data.find((item) => item.majorNameFa.trim() === majorNameFa.trim()) ??
        payload.data[0];

      if (!exact) {
        throw new Error("رشته پیشنهادی در دیتابیس پیدا نشد.");
      }

      pickMajor(exact);
    } catch (error: unknown) {
      setSuggestedError(getApiErrorMessage(error, "انتخاب رشته پیشنهادی انجام نشد."));
    } finally {
      setSuggestedLoading(null);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) =>
        options.length === 0 ? -1 : Math.min(prev + 1, options.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0 && options[activeIndex]) {
      event.preventDefault();
      pickMajor(options[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <section className="space-y-2">
      <label className="text-xs font-semibold text-slate-700">انتخاب رشته</label>
      <div ref={rootRef} className="relative">
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setSearch(event.target.value);
              setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            placeholder="نام رشته..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-9 pl-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="mt-2 relative">
          <ChevronDown className="pointer-events-none absolute left-2.5 top-3 h-4 w-4 text-slate-400" />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as MajorCategory | "")}
            className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">دسته‌بندی رشته</option>
            {MAJOR_CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {open ? (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            {majorsQuery.isLoading ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-9 animate-pulse rounded-lg bg-slate-100"
                  />
                ))}
              </div>
            ) : null}

            {majorsQuery.isError ? (
              <div className="px-3 py-4 text-center text-xs text-rose-600">
                {getApiErrorMessage(majorsQuery.error, "خطا در دریافت رشته‌ها")}
              </div>
            ) : null}

            {!majorsQuery.isLoading && !majorsQuery.isError && options.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-500">
                نتیجه‌ای پیدا نشد.
              </div>
            ) : null}

            {options.length > 0 ? (
              <ul
                id={listboxId}
                role="listbox"
                className="max-h-52 overflow-y-auto border-b border-slate-100 p-2"
              >
                {options.map((item, index) => {
                  const isActive = activeIndex === index;
                  const isSelected = selectedMajor?.majorId === item.majorId;
                  const displaySubCategory =
                    item.subCategory && PERSIAN_TEXT_PATTERN.test(item.subCategory)
                      ? item.subCategory
                      : null;

                  return (
                    <li key={item.majorId} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => pickMajor(item)}
                        className={`w-full rounded-lg px-2.5 py-2 text-right transition ${
                          isSelected
                            ? "bg-blue-50 text-blue-700"
                            : isActive
                              ? "bg-slate-100 text-slate-800"
                              : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <p className="text-xs font-semibold">{item.majorNameFa}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {item.majorCategoryNameFa}
                          {displaySubCategory ? ` • ${displaySubCategory}` : ""}
                        </p>
                      </button>
                    </li>
                  );
                })}
                <li ref={loadMoreRef} className="h-5" />
              </ul>
            ) : null}

            <div className="space-y-2 bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-semibold text-slate-600">رشته‌های پیشنهادی</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_MAJORS.map((majorNameFa) => (
                  <button
                    key={majorNameFa}
                    type="button"
                    onClick={() => {
                      void handlePickSuggested(majorNameFa);
                    }}
                    disabled={Boolean(suggestedLoading)}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 disabled:opacity-60"
                  >
                    {suggestedLoading === majorNameFa ? (
                      <span className="inline-flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        ...
                      </span>
                    ) : (
                      majorNameFa
                    )}
                  </button>
                ))}
              </div>
              {suggestedError ? (
                <p className="text-[11px] text-rose-600">{suggestedError}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {selectedMajor ? (
        <p className="truncate text-[11px] text-slate-600">
          انتخاب شده: {selectedMajor.majorNameFa}
        </p>
      ) : null}
    </section>
  );
}

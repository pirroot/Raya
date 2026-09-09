"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Loader2, MapPin, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type {
  PaginatedResponse,
  UniversityOption,
  UniversityType,
} from "./education-types";

const UNIVERSITY_TYPES: Array<{ value: UniversityType; label: string }> = [
  { value: "state", label: "دولتی" },
  { value: "azad", label: "آزاد" },
  { value: "medical", label: "علوم پزشکی" },
  { value: "payame_noor", label: "پیام نور" },
  { value: "nonprofit", label: "غیرانتفاعی" },
];

const SUGGESTED_UNIVERSITY = "دانشگاه تست";
const PERSIAN_TEXT_PATTERN = /[آ-ی]/;

type UniversitySelectProps = {
  selectedUniversity: UniversityOption | null;
  onSelect: (university: UniversityOption) => void;
};

async function fetchUniversities(
  params: {
    search?: string;
    city?: string;
    type?: UniversityType;
    page: number;
    limit: number;
  },
  signal?: AbortSignal,
): Promise<PaginatedResponse<UniversityOption>> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.search) {
    searchParams.set("search", params.search);
  }

  if (params.city) {
    searchParams.set("city", params.city);
  }

  if (params.type) {
    searchParams.set("type", params.type);
  }

  const response = await fetch(`/api/backend/universities?${searchParams}`, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });

  const payload = (await response.json().catch(() => ({}))) as
    | PaginatedResponse<UniversityOption>
    | { message?: string };

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : "دریافت دانشگاه‌ها انجام نشد.";
    throw new Error(message);
  }

  return payload as PaginatedResponse<UniversityOption>;
}

export default function UniversitySelect({
  selectedUniversity,
  onSelect,
}: UniversitySelectProps) {
  const listboxId = useId();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState<UniversityType | "">("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggestedLoading, setSuggestedLoading] = useState(false);
  const [suggestedError, setSuggestedError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLLIElement | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);
  const debouncedCity = useDebouncedValue(city, 300);

  const universitiesQuery = useInfiniteQuery({
    queryKey: ["universities", debouncedSearch, debouncedCity, type],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      fetchUniversities(
        {
          search: debouncedSearch || undefined,
          city: debouncedCity || undefined,
          type: type || undefined,
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
    const optionMap = new Map<string, UniversityOption>();
    const pages = universitiesQuery.data?.pages ?? [];

    for (const page of pages) {
      for (const item of page.data) {
        optionMap.set(item.universityBranchId, item);
      }
    }

    return Array.from(optionMap.values()).filter(
      (item) =>
        PERSIAN_TEXT_PATTERN.test(item.universityBranchNameFa) &&
        PERSIAN_TEXT_PATTERN.test(item.universityNameFa) &&
        PERSIAN_TEXT_PATTERN.test(item.cityNameFa),
    );
  }, [universitiesQuery.data]);

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
          universitiesQuery.hasNextPage &&
          !universitiesQuery.isFetchingNextPage
        ) {
          void universitiesQuery.fetchNextPage();
        }
      },
      { rootMargin: "120px" },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [open, universitiesQuery]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [debouncedSearch, debouncedCity, type]);

  const pickUniversity = (option: UniversityOption) => {
    onSelect(option);
    setSearch(option.universityBranchNameFa);
    setOpen(false);
    setSuggestedError(null);
  };

  const handlePickSuggested = async () => {
    setSuggestedLoading(true);
    setSuggestedError(null);

    try {
      const payload = await queryClient.fetchQuery({
        queryKey: ["suggested-university", SUGGESTED_UNIVERSITY],
        queryFn: ({ signal }) =>
          fetchUniversities(
            {
              search: SUGGESTED_UNIVERSITY,
              page: 1,
              limit: 20,
            },
            signal,
          ),
        staleTime: 5 * 60_000,
      });

      const exact =
        payload.data.find(
          (item) =>
            item.universityBranchNameFa.trim() === SUGGESTED_UNIVERSITY.trim(),
        ) ?? payload.data[0];

      if (!exact) {
        throw new Error("دانشگاه پیشنهادی در دیتابیس پیدا نشد.");
      }

      pickUniversity(exact);
    } catch (error: unknown) {
      setSuggestedError(getApiErrorMessage(error, "انتخاب دانشگاه پیشنهادی انجام نشد."));
    } finally {
      setSuggestedLoading(false);
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
      pickUniversity(options[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <section className="space-y-2">
      <label className="text-xs font-semibold text-slate-700">انتخاب دانشگاه</label>
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
            placeholder="نام دانشگاه یا واحد..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-9 pl-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="relative">
            <MapPin className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="فیلتر شهر"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-9 pl-3 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="relative">
            <ChevronDown className="pointer-events-none absolute left-2.5 top-3 h-4 w-4 text-slate-400" />
            <select
              value={type}
              onChange={(event) => setType(event.target.value as UniversityType | "")}
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">نوع دانشگاه</option>
              {UNIVERSITY_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {open ? (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            {universitiesQuery.isLoading ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-9 animate-pulse rounded-lg bg-slate-100"
                  />
                ))}
              </div>
            ) : null}

            {universitiesQuery.isError ? (
              <div className="px-3 py-4 text-center text-xs text-rose-600">
                {getApiErrorMessage(universitiesQuery.error, "خطا در دریافت دانشگاه‌ها")}
              </div>
            ) : null}

            {!universitiesQuery.isLoading &&
            !universitiesQuery.isError &&
            options.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-500">
                نتیجه‌ای پیدا نشد.
              </div>
            ) : null}

            {options.length > 0 ? (
              <ul
                id={listboxId}
                role="listbox"
                className="max-h-56 overflow-y-auto border-b border-slate-100 p-2"
              >
                {options.map((item, index) => {
                  const isActive = index === activeIndex;
                  const isSelected =
                    selectedUniversity?.universityBranchId === item.universityBranchId;

                  return (
                    <li key={item.universityBranchId} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => pickUniversity(item)}
                        className={`w-full rounded-lg px-2.5 py-2 text-right transition ${
                          isSelected
                            ? "bg-blue-50 text-blue-700"
                            : isActive
                              ? "bg-slate-100 text-slate-800"
                              : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <p className="text-xs font-semibold">{item.universityBranchNameFa}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {item.cityNameFa} • {item.universityNameFa}
                        </p>
                      </button>
                    </li>
                  );
                })}
                <li ref={loadMoreRef} className="h-5" />
              </ul>
            ) : null}

            <div className="space-y-2 bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-semibold text-slate-600">
                پیشنهاد: {SUGGESTED_UNIVERSITY}
              </p>
              <button
                type="button"
                onClick={() => {
                  void handlePickSuggested();
                }}
                disabled={suggestedLoading}
                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-60"
              >
                {suggestedLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    در حال انتخاب...
                  </>
                ) : (
                  "انتخاب پیشنهاد"
                )}
              </button>
              {suggestedError ? (
                <p className="text-[11px] text-rose-600">{suggestedError}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {selectedUniversity ? (
        <p className="truncate text-[11px] text-slate-600">
          انتخاب شده: {selectedUniversity.universityBranchNameFa}
        </p>
      ) : null}
    </section>
  );
}

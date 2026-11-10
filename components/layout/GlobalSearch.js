"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, X } from "lucide-react";
import { appNav } from "@/lib/nav.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";

const SEARCH_TERMS = {
  "/dashboard": "overview home ড্যাশবোর্ড সারসংক্ষেপ",
  "/my-farm": "farm farms field fields খামার জমি",
  "/assistant": "ai chat chatbot সহকারী প্রশ্ন",
  "/handoff": "handoff window sowing বপন সময়",
  "/climate": "climate weather power জলবায়ু আবহাওয়া",
  "/rainfall": "rain rainwater precipitation বৃষ্টি বৃষ্টিপাত",
  "/soil-moisture": "soil moisture smap মাটির আর্দ্রতা",
  "/vegetation": "vegetation ndvi evi crop health গাছ ফসল",
  "/map": "gis map layers মানচিত্র",
  "/crop-calendar": "crop calendar season ফসল ক্যালেন্ডার",
  "/data-sources": "sources nasa data source ডেটা উৎস",
  "/settings": "preferences profile সেটিংস পছন্দ",
};

export function GlobalSearch() {
  const router = useRouter();
  const { locale, t } = useLang();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);
  const isBn = locale === "bn";

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const pages = appNav.map(({ href, key }) => ({
      href,
      label: t(key),
      searchText: `${t(key)} ${href.replaceAll("/", " ")} ${SEARCH_TERMS[href] || ""}`.toLocaleLowerCase(),
    }));
    if (!normalized) return pages.slice(0, 6);
    return pages.filter((page) => page.searchText.includes(normalized)).slice(0, 8);
  }, [query, t]);

  useEffect(() => {
    const openSearch = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setActiveIndex(0);
        setOpen(true);
      }
    };
    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      } else if (event.key === "Tab" && dialogRef.current) {
        const focusable = [...dialogRef.current.querySelectorAll('input:not([disabled]), button:not([disabled]), a[href]')];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", closeOnEscape);
      trigger?.focus();
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const navigateTo = (href) => {
    close();
    router.push(href);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown" && results.length) {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp" && results.length) {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      navigateTo(results[activeIndex].href);
    }
  };

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => {
          setActiveIndex(0);
          setOpen(true);
        }}
        aria-label={isBn ? "সারা অ্যাপে খুঁজুন" : "Search across the app"}
        className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-muted shadow-sm transition hover:border-emerald/30 hover:bg-surface-2 hover:text-emerald focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald sm:h-10 sm:w-auto sm:min-w-44 sm:max-w-[25rem] sm:flex-1 sm:justify-start sm:gap-2.5 sm:px-3.5"
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="hidden min-w-0 flex-1 truncate text-left text-sm sm:block">
          {isBn ? "পেজ ও ফিচার খুঁজুন..." : "Search pages and features..."}
        </span>
        <span className="hidden shrink-0 items-center gap-0.5 rounded-md border border-line bg-bg px-1.5 py-0.5 text-[10px] font-medium text-muted sm:inline-flex">
          Ctrl K
        </span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[70] bg-slate-950/35 px-3 pt-16 backdrop-blur-[2px] sm:pt-[18vh]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={isBn ? "গ্লোবাল সার্চ" : "Global search"}
            className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface text-content shadow-2xl shadow-slate-950/20 ring-1 ring-black/5"
          >
            <div className="flex h-14 items-center gap-3 border-b border-line px-4">
              <Search className="h-5 w-5 shrink-0 text-emerald" aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
                role="combobox"
                aria-expanded="true"
                aria-controls="global-search-results"
                aria-activedescendant={results[activeIndex] ? `global-search-result-${activeIndex}` : undefined}
                aria-label={isBn ? "পেজ ও ফিচার খুঁজুন" : "Search pages and features"}
                placeholder={isBn ? "কোন পেজ বা ফিচার খুঁজছেন?" : "What are you looking for?"}
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
              />
              <button type="button" onClick={close} aria-label={isBn ? "বন্ধ করুন" : "Close search"} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-content">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div id="global-search-results" role="listbox" className="max-h-[min(60vh,28rem)] overflow-y-auto p-2">
              <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                {query.trim() ? (isBn ? "সার্চ ফলাফল" : "Search results") : (isBn ? "দ্রুত প্রবেশ" : "Quick access")}
              </p>
              {results.length ? results.map((result, index) => (
                <Link
                  key={result.href}
                  id={`global-search-result-${index}`}
                  href={result.href}
                  role="option"
                  aria-selected={activeIndex === index}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={close}
                  className={`flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 text-sm transition ${activeIndex === index ? "bg-emerald/10 text-emerald" : "text-content hover:bg-surface-2"}`}
                >
                  <span className="truncate font-medium">{result.label}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
                </Link>
              )) : (
                <div className="px-3 py-8 text-center">
                  <Search className="mx-auto h-5 w-5 text-muted/70" aria-hidden="true" />
                  <p className="mt-2 text-sm font-medium">{isBn ? "কোনো মিল পাওয়া যায়নি" : "No matching pages found"}</p>
                  <p className="mt-1 text-xs text-muted">{isBn ? "অন্য শব্দ দিয়ে চেষ্টা করুন" : "Try a different search term"}</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-line bg-bg/60 px-4 py-2 text-[10px] text-muted">
              <span>{isBn ? "নেভিগেট করতে ↑ ↓, খুলতে Enter" : "Navigate ↑ ↓ · Open Enter"}</span>
              <span className="hidden sm:inline">ESC {isBn ? "বন্ধ করতে" : "to close"}</span>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

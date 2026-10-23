import { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicJournal, getPublicJournals } from "../lib/journals";
import { isSupabaseConfigured } from "../lib/supabase";
import {
  CalendarIcon,
  ClockIcon,
  BookOpenIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CopyIcon,
  CheckIcon,
  ZoomInIcon,
  QuoteIcon,
  FeatherIcon,
  HeartIcon,
  XIcon,
} from "../components/icons";

function formatDateFull(value) {
  if (!value) return "";
  const date = new Date(value);
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateShort(value) {
  if (!value) return "";
  const date = new Date(value);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function parseContentToBlocks(content) {
  if (!content) return [];
  const rawParagraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return rawParagraphs.map((paragraph, index) => {
    // Check if the paragraph has an intro followed by quotes
    const quoteMatch = paragraph.match(/^(.+?)\s*["“]([^"”]{15,})["”](.*)$/s);
    if (quoteMatch) {
      const [, prefix, quoteText, suffix] = quoteMatch;
      return {
        id: `block-${index}`,
        type: "quote-inline",
        prefix: prefix.trim(),
        quote: quoteText.trim(),
        suffix: suffix ? suffix.trim() : "",
        raw: paragraph,
      };
    }

    // Check if the entire paragraph is wrapped in quotes
    if (/^["“][^"”]+["”]$/.test(paragraph)) {
      return {
        id: `block-${index}`,
        type: "blockquote",
        quote: paragraph.replace(/^["“]|["”]$/g, "").trim(),
        raw: paragraph,
      };
    }

    // Check if it's the final short closing declaration
    const isClosing =
      index === rawParagraphs.length - 1 &&
      (paragraph.length < 120 ||
        /just so you know|my heart|pilihan hatiku|selamanya|terima kasih/i.test(
          paragraph
        ));

    if (isClosing) {
      return {
        id: `block-${index}`,
        type: "closing",
        text: paragraph.replace(/^["“]|["”]$/g, "").trim(),
        raw: paragraph,
      };
    }

    return {
      id: `block-${index}`,
      type: "paragraph",
      text: paragraph,
      isLead: index === 0,
      raw: paragraph,
    };
  });
}

function JurnalDetail() {
  const { id } = useParams();

  const [journal, setJournal] = useState(null);
  const [allJournals, setAllJournals] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const [copied, setCopied] = useState(false);
  const [isLargeText, setIsLargeText] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  // Local heart reaction
  const [isHearted, setIsHearted] = useState(false);

  // Load reaction state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`rara_journal_reaction_${id}`);
      setIsHearted(saved === "hearted");
    } catch {
      setIsHearted(false);
    }
  }, [id]);

  const toggleHeart = () => {
    setIsHearted((prev) => {
      const next = !prev;
      try {
        if (next) {
          localStorage.setItem(`rara_journal_reaction_${id}`, "hearted");
        } else {
          localStorage.removeItem(`rara_journal_reaction_${id}`);
        }
      } catch {
        // fallback
      }
      return next;
    });
  };

  // Scroll reading progress
  useEffect(() => {
    const handleScroll = () => {
      const total =
        document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 0) {
        setReadingProgress(100);
        return;
      }
      const progress = (window.scrollY / total) * 100;
      setReadingProgress(Math.min(100, Math.max(0, Math.round(progress))));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lightbox keyboard trap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsLightboxOpen(false);
    };
    if (isLightboxOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isLightboxOpen]);

  // Fetch journal and adjacent list
  useEffect(() => {
    let isMounted = true;
    window.scrollTo({ top: 0, behavior: "smooth" });

    async function loadData() {
      setStatus("loading");
      const [singleRes, listRes] = await Promise.all([
        getPublicJournal(id),
        getPublicJournals(),
      ]);

      if (!isMounted) return;

      if (singleRes.error) {
        setErrorMessage(singleRes.error.message);
        setStatus("error");
        return;
      }

      setJournal(singleRes.data);
      if (listRes.data) {
        setAllJournals(listRes.data);
      }
      setStatus("ready");
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Reading time & word count
  const wordCount = useMemo(() => {
    if (!journal?.content) return 0;
    return journal.content.trim().split(/\s+/).filter(Boolean).length;
  }, [journal?.content]);

  const readingTimeMinutes = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 160));
  }, [wordCount]);

  // Adjacent journals (prev/next)
  const { prevJournal, nextJournal } = useMemo(() => {
    if (!allJournals.length || !journal) {
      return { prevJournal: null, nextJournal: null };
    }
    const currentIndex = allJournals.findIndex(
      (j) => String(j.id) === String(journal.id)
    );
    if (currentIndex === -1) {
      return { prevJournal: null, nextJournal: null };
    }
    // allJournals is sorted newest first
    // nextJournal: newer (index - 1)
    // prevJournal: older (index + 1)
    return {
      nextJournal: currentIndex > 0 ? allJournals[currentIndex - 1] : null,
      prevJournal:
        currentIndex < allJournals.length - 1
          ? allJournals[currentIndex + 1]
          : null,
    };
  }, [allJournals, journal]);

  const contentBlocks = useMemo(() => {
    if (!journal?.content) return [];
    return parseContentToBlocks(journal.content);
  }, [journal?.content]);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div className="relative w-full">
      {/* Reading Progress Indicator */}
      <div
        className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-transparent"
        aria-hidden="true"
      >
        <div
          className="h-full bg-gradient-to-r from-[#6C40E5] via-[#8659F5] to-[#6C40E5] transition-all duration-150 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <div className="mx-auto w-full max-w-4xl px-4 pt-6 pb-24 sm:px-6 sm:pt-8 md:px-8 md:pt-10">
        {/* Top Utility & Navigation Bar */}
        <nav
          aria-label="Navigasi Jurnal"
          className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/70 pb-4"
        >
          <Link
            to="/jurnal"
            className="group inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition-all hover:border-[#6C40E5]/30 hover:bg-[#F9F7FF] hover:text-[#6C40E5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C40E5]"
          >
            <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Kembali ke Jurnal</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Font Size Toggle */}
            <button
              type="button"
              onClick={() => setIsLargeText((prev) => !prev)}
              aria-label={
                isLargeText
                  ? "Ubah ukuran teks ke normal"
                  : "Ubah ukuran teks ke lebih besar"
              }
              title={
                isLargeText ? "Ukuran Teks: Nyaman" : "Ukuran Teks: Standar"
              }
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C40E5] ${isLargeText
                ? "border-[#6C40E5] bg-[#F4F0FF] text-[#6C40E5]"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
                }`}
            >
              <span className="font-serif font-bold text-xs">Aa</span>
              <span className="hidden sm:inline">
                {isLargeText ? "Teks Nyaman" : "Teks Normal"}
              </span>
            </button>

            {/* Copy Link Button */}
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Salin tautan jurnal ini"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C40E5]"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-medium">Tersalin</span>
                </>
              ) : (
                <>
                  <CopyIcon className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="hidden sm:inline">Salin Tautan</span>
                </>
              )}
            </button>
          </div>
        </nav>

        {/* Database Config Banner */}
        {!isSupabaseConfigured && (
          <div className="mb-8 rounded-2xl border border-purple-200 bg-purple-50/70 p-4 text-xs font-medium text-purple-900">
            Jurnal belum terhubung ke database. Harap lengkapi{" "}
            <code>VITE_SUPABASE_URL</code> di <code>.env.local</code>.
          </div>
        )}

        {/* Loading State: Elegant Pulse Skeleton */}
        {status === "loading" && (
          <div className="w-full animate-pulse space-y-6">
            <div className="space-y-3">
              <div className="h-6 w-32 rounded-full bg-zinc-200" />
              <div className="h-10 w-4/5 rounded-xl bg-zinc-200" />
              <div className="h-10 w-2/3 rounded-xl bg-zinc-200" />
              <div className="flex gap-4 pt-2">
                <div className="h-4 w-28 rounded bg-zinc-200" />
                <div className="h-4 w-24 rounded bg-zinc-200" />
              </div>
            </div>
            <div className="aspect-[16/9] w-full rounded-3xl bg-zinc-200" />
            <div className="mx-auto max-w-2xl space-y-4 pt-6">
              <div className="h-4 w-full rounded bg-zinc-200" />
              <div className="h-4 w-full rounded bg-zinc-200" />
              <div className="h-4 w-5/6 rounded bg-zinc-200" />
              <div className="h-20 w-full rounded-2xl bg-zinc-100" />
              <div className="h-4 w-full rounded bg-zinc-200" />
              <div className="h-4 w-4/5 rounded bg-zinc-200" />
            </div>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <XIcon className="h-6 w-6" />
            </div>
            <h2 className="font-['Satoshi'] text-xl font-bold text-zinc-900">
              Catatan Tidak Dapat Dibuka
            </h2>
            <p className="mt-2 text-sm text-zinc-500">{errorMessage}</p>
            <Link
              to="/jurnal"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#6C40E5] px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-[#5931CC]"
            >
              <ArrowLeftIcon className="h-4 w-4" /> Kembali ke Daftar Jurnal
            </Link>
          </div>
        )}

        {/* Ready State: Editorial Article */}
        {status === "ready" && journal && (
          <article className="w-full">
            {/* Editorial Header */}
            <header className="mb-8">
              {/* Category & Badge */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#6C40E5]/20 bg-[#F5F2FF] px-3 py-1 font-['Satoshi'] text-[11px] font-semibold uppercase tracking-wider text-[#6C40E5]">
                  <FeatherIcon className="h-3 w-3" />
                  Catatan Hati
                </span>

                <span className="text-zinc-300 font-light">•</span>

                <span className="font-['Satoshi'] text-xs font-medium text-zinc-500">
                  Untuk Rara
                </span>
              </div>

              {/* Title */}
              <h1 className="mt-4 font-['Satoshi'] text-3xl font-extrabold leading-[1.2] tracking-[-0.025em] text-zinc-900 sm:text-4xl md:text-[42px] lg:text-[46px]">
                {journal.title}
              </h1>

              {/* Meta Row: Tabular Date, Reading Time, Word Count */}
              <div className="mt-5 flex flex-wrap items-center gap-y-2 gap-x-4 border-y border-zinc-100 py-3 text-xs text-zinc-500">
                <div className="flex items-center gap-1.5 font-medium text-zinc-700">
                  <CalendarIcon className="h-3.5 w-3.5 text-[#6C40E5]" />
                  <time
                    dateTime={journal.published_at || journal.created_at}
                    className="tabular-nums"
                  >
                    {formatDateFull(
                      journal.published_at || journal.created_at
                    )}
                  </time>
                </div>

                <span className="text-zinc-300">•</span>

                <div className="flex items-center gap-1.5 font-medium text-zinc-600">
                  <ClockIcon className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="tabular-nums">
                    {readingTimeMinutes} menit membaca
                  </span>
                </div>

                <span className="text-zinc-300">•</span>

                <div className="flex items-center gap-1.5 font-medium text-zinc-600">
                  <BookOpenIcon className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="tabular-nums">{wordCount} kata</span>
                </div>
              </div>
            </header>

            {/* Featured Image (Framed Magazine Layout) */}
            {journal.image_url && (
              <figure className="group relative mb-10 overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-950 shadow-[0_16px_40px_rgba(20,15,35,0.08)] sm:rounded-3xl">
                <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden">
                  <img
                    src={journal.image_url}
                    alt={journal.title}
                    className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  />
                  {/* Subtle Top & Bottom Cinematic Vignette */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
                </div>

                {/* Interactive Expand Button */}
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  aria-label="Lihat foto resolusi penuh"
                  className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-all hover:bg-black/80 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ZoomInIcon className="h-3.5 w-3.5" />
                  <span>Lihat Foto Penuh</span>
                </button>
              </figure>
            )}

            {/* Editorial Content Container */}
            <div className="mx-auto max-w-2xl">
              <div
                className={`prose-zinc transition-all ${isLargeText
                  ? "text-lg md:text-[21px] leading-[2.0]"
                  : "text-base md:text-[18px] leading-[1.85]"
                  }`}
              >
                {contentBlocks.map((block) => {
                  if (block.type === "quote-inline") {
                    return (
                      <div key={block.id} className="my-6">
                        {block.prefix && (
                          <p className="mb-4 text-zinc-700">{block.prefix}</p>
                        )}
                        <blockquote className="relative my-6 rounded-2xl border-l-[3.5px] border-[#6C40E5] bg-gradient-to-r from-purple-50/70 via-stone-50/40 to-transparent py-4 pr-5 pl-5 sm:pl-6 shadow-[inset_0_1px_2px_rgba(108,64,229,0.03)]">
                          <QuoteIcon className="mb-2 h-5 w-5 text-[#6C40E5]/40" />
                          <p className="font-['Satoshi'] text-lg md:text-xl font-medium italic leading-relaxed text-zinc-900 tracking-[-0.01em]">
                            "{block.quote}"
                          </p>
                        </blockquote>
                        {block.suffix && (
                          <p className="mt-4 text-zinc-700">{block.suffix}</p>
                        )}
                      </div>
                    );
                  }

                  if (block.type === "blockquote") {
                    return (
                      <blockquote
                        key={block.id}
                        className="relative my-6 rounded-2xl border-l-[3.5px] border-[#6C40E5] bg-purple-50/50 py-4 pr-5 pl-6"
                      >
                        <QuoteIcon className="mb-2 h-5 w-5 text-[#6C40E5]/40" />
                        <p className="font-['Satoshi'] text-lg md:text-xl font-medium italic leading-relaxed text-zinc-900">
                          "{block.quote}"
                        </p>
                      </blockquote>
                    );
                  }

                  if (block.type === "closing") {
                    return (
                      <div
                        key={block.id}
                        className="my-10 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/60 via-white to-stone-50/40 p-6 text-center shadow-[0_8px_24px_rgba(108,64,229,0.04)] md:p-8"
                      >
                        <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#6C40E5]/10 text-[#6C40E5]">
                          <HeartIcon className="h-4 w-4" filled={true} />
                        </div>
                        <p className="font-['Satoshi'] text-lg font-semibold italic tracking-tight text-zinc-900 sm:text-xl">
                          "{block.text}"
                        </p>
                        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold tracking-wider text-[#6C40E5] uppercase">
                          <span>Janji Hati</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <p
                      key={block.id}
                      className={`my-5 text-zinc-700 ${block.isLead
                        ? "font-normal text-zinc-900 md:text-[19px]"
                        : ""
                        }`}
                    >
                      {block.text}
                    </p>
                  );
                })}
              </div>

              {/* End Ornament */}
              <div
                className="my-12 flex items-center justify-center gap-2 text-zinc-300"
                aria-hidden="true"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                <span className="h-2 w-2 rounded-full bg-[#6C40E5]/50" />
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
              </div>

              {/* Author & Heart Reaction Card */}
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#6C40E5] font-['Satoshi'] text-sm font-bold text-white shadow-sm">
                      FZ
                    </div>
                    <div>
                      <p className="font-['Satoshi'] text-sm font-bold text-zinc-900">
                        Ditulis oleh Faiz
                      </p>
                      <p className="text-xs text-zinc-500">
                        Sebuah catatan tulus untuk Rara
                      </p>
                    </div>
                  </div>

                  {/* Reaction Button */}
                  <button
                    type="button"
                    onClick={toggleHeart}
                    aria-label={
                      isHearted
                        ? "Batal menyukai catatan ini"
                        : "Sukai catatan ini"
                    }
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C40E5] ${isHearted
                      ? "bg-rose-50 text-rose-600 border border-rose-200 shadow-sm"
                      : "bg-zinc-50 text-zinc-700 border border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900"
                      }`}
                  >
                    <HeartIcon
                      className={`h-4 w-4 transition-transform active:scale-125 ${isHearted ? "text-rose-500" : "text-zinc-400"
                        }`}
                      filled={isHearted}
                    />
                    <span>{isHearted ? "Tersimpan di Hati" : "Simpan Rasa"}</span>
                  </button>
                </div>
              </div>

              {/* Adjacent Journals Navigation (Prev / Next Story) */}
              <div className="mt-10 grid grid-cols-1 gap-4 pt-4 border-t border-zinc-200/70 sm:grid-cols-2">
                {prevJournal ? (
                  <Link
                    to={`/jurnal/${prevJournal.id}`}
                    className="group flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-4 transition-all hover:border-[#6C40E5]/40 hover:bg-[#FAF9FF] hover:shadow-sm"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6C40E5]">
                      <ArrowLeftIcon className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                      <span>Catatan Sebelumnya</span>
                    </div>
                    <p className="mt-2 line-clamp-2 font-['Satoshi'] text-sm font-bold text-zinc-800 group-hover:text-zinc-900">
                      {prevJournal.title}
                    </p>
                    <time className="mt-3 block text-[11px] text-zinc-400 tabular-nums">
                      {formatDateShort(
                        prevJournal.published_at || prevJournal.created_at
                      )}
                    </time>
                  </Link>
                ) : (
                  <div className="rounded-2xl border border-dashed border-zinc-200 p-4 text-xs text-zinc-400 flex items-center justify-center">
                    Awal dari linimasa catatan
                  </div>
                )}

                {nextJournal ? (
                  <Link
                    to={`/jurnal/${nextJournal.id}`}
                    className="group flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-4 text-right transition-all hover:border-[#6C40E5]/40 hover:bg-[#FAF9FF] hover:shadow-sm sm:items-end"
                  >
                    <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-[#6C40E5]">
                      <span>Catatan Selanjutnya</span>
                      <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                    <p className="mt-2 line-clamp-2 font-['Satoshi'] text-sm font-bold text-zinc-800 group-hover:text-zinc-900">
                      {nextJournal.title}
                    </p>
                    <time className="mt-3 block text-[11px] text-zinc-400 tabular-nums">
                      {formatDateShort(
                        nextJournal.published_at || nextJournal.created_at
                      )}
                    </time>
                  </Link>
                ) : (
                  <div className="rounded-2xl border border-dashed border-zinc-200 p-4 text-xs text-zinc-400 flex items-center justify-center">
                    Catatan terbaru saat ini
                  </div>
                )}
              </div>
            </div>
          </article>
        )}
      </div>

      {/* Lightbox Modal (Full Resolution View) */}
      {isLightboxOpen && journal?.image_url && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tampilan penuh foto"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Tutup tampilan penuh"
            className="absolute top-5 right-5 z-[101] flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <XIcon className="h-5 w-5" />
          </button>

          <div
            className="relative max-h-[88vh] max-w-[92vw] overflow-hidden rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={journal.image_url}
              alt={journal.title}
              className="max-h-[85vh] max-w-[90vw] object-contain"
            />
            <div className="bg-zinc-900/90 px-4 py-3 text-center text-xs font-medium text-zinc-300">
              {journal.title}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JurnalDetail;

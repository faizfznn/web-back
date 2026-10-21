import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { createGoogleCalendarUrl, downloadIcsFile } from "../lib/calendarHelper";
import {
  CalendarIcon,
  ClockIcon,
  HeartIcon,
  SparklesIcon,
  ExternalLinkIcon,
  RingIcon,
  CrownIcon,
  CakeIcon,
  SunIcon,
  UserIcon,
  CompassIcon,
  ChevronRightIcon,
  MessageSquareHeartIcon,
  CheckCircleIcon,
} from "./icons";

// Konfigurasi Tanggal Jadian: 14 September 2024
const TANGGAL_JADIAN = new Date(2024, 8, 14, 0, 0, 0);

const MOMEN_LIST = [
  {
    id: "anniv",
    title: "Anniversary Jadian Kita",
    month: 8, // September
    day: 14,
    IconComponent: RingIcon,
    category: "Milestone Utama",
    themeColor: "#6C40E5",
    description: "Titik awal 14 September 2024 saat kita resmi memulai cerita indah berdua.",
    getPassedText: (count) => `Sudah ${count}x merayakan Anniversary Tahunan bersama`,
    getPendingText: () => "Menuju Anniversary berikutnya bersama",
  },
  {
    id: "ultah-rara",
    title: "Ulang Tahun Rara",
    month: 4, // Mei
    day: 18,
    birthYear: 2005,
    IconComponent: CrownIcon,
    category: "Hari Spesial Rara",
    themeColor: "#D946EF",
    description: "Hari lahir perempuanku tercantik, paling manis, dan paling berarti di hidup Faiz.",
    getPassedText: (count) => `Sudah ${count}x Faiz menemani hari lahir Rara`,
    getPendingText: () => "Menuju hari ulang tahun Rara bersama Faiz",
  },
  {
    id: "ultah-faiz",
    title: "Ulang Tahun Faiz",
    month: 5, // Juni
    day: 15,
    birthYear: 2005,
    IconComponent: CakeIcon,
    category: "Hari Spesial Faiz",
    themeColor: "#3B82F6",
    description: "Pertambahan usia Faiz yang terasa jauh lebih lengkap dan bahagia dengan kehadiran Rara.",
    getPassedText: (count) => `Sudah ${count}x Rara menemani hari ulang tahun Faiz`,
    getPendingText: () => "Menuju hari ulang tahun Faiz bersama Rara",
  },
  {
    id: "valentine",
    title: "Hari Valentine",
    month: 1, // Februari
    day: 14,
    IconComponent: HeartIcon,
    category: "Momen Kasih Sayang",
    themeColor: "#F43F5E",
    description: "Hari spesial penuh rasa syukur karena Faiz punya Rara di setiap langkah.",
    getPassedText: (count) => `Sudah ${count}x menjalani Valentine bareng`,
    getPendingText: () => "Menuju perayaan Valentine berikutnya",
  },
  {
    id: "gf-day",
    title: "National Girlfriend Day",
    month: 7, // Agustus
    day: 1,
    IconComponent: SparklesIcon,
    category: "Apresiasi Rara",
    themeColor: "#EC4899",
    description: "Hari khusus untuk mengapresiasi dan merayakan pacar terbaik di dunia.",
    getPassedText: (count) => `Sudah ${count}x kita merayakan Girlfriend Day bersama`,
    getPendingText: () => "Menuju Girlfriend Day berikutnya",
  },
  {
    id: "bf-day",
    title: "National Boyfriend Day",
    month: 9, // Oktober
    day: 3,
    IconComponent: UserIcon,
    category: "Apresiasi Faiz",
    themeColor: "#0284C7",
    description: "Hari di mana Faiz selalu berjanji untuk terus jadi pendamping terbaik bagi Rara.",
    getPassedText: (count) => `Sudah ${count}x kita merayakan Boyfriend Day bersama`,
    getPendingText: () => "Menuju Boyfriend Day berikutnya",
  },
  {
    id: "new-year",
    title: "Malam Tahun Baru",
    month: 0, // Januari
    day: 1,
    IconComponent: SunIcon,
    category: "Awal Lembaran Baru",
    themeColor: "#F59E0B",
    description: "Menatap masa depan dan menutup lembaran tahun dengan terus bergandengan tangan.",
    getPassedText: (count) => `Sudah ${count}x kita menyambut Tahun Baru bersama`,
    getPendingText: () => "Menuju Tahun Baru berikutnya bersama",
  },
];

function formatNumber(num) {
  return num.toString().padStart(2, "0");
}

function calculatePassedMoments(item, now) {
  let count = 0;
  const currentYear = now.getFullYear();

  for (let y = 2024; y <= currentYear; y++) {
    const momentDate = new Date(y, item.month, item.day, 23, 59, 59);
    if (momentDate >= TANGGAL_JADIAN && momentDate <= now) {
      count++;
    }
  }
  return count;
}

function calculateNextOccurrence(item, now) {
  const currentYear = now.getFullYear();
  let next = new Date(currentYear, item.month, item.day, 0, 0, 0);

  if (now > new Date(currentYear, item.month, item.day, 23, 59, 59)) {
    next = new Date(currentYear + 1, item.month, item.day, 0, 0, 0);
  }

  const diffTime = next.getTime() - now.getTime();
  const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const isToday =
    now.getDate() === item.day && now.getMonth() === item.month;

  return { nextDate: next, diffDays, isToday };
}

export default function MomenBersama() {
  const [now, setNow] = useState(new Date());
  const [filterTab, setFilterTab] = useState("all"); // 'all' | 'upcoming' | 'passed'
  const [copiedLink, setCopiedLink] = useState(null);

  // Live Timer Update
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Perhitungan Waktu Bersama (Hari, Jam, Menit, Detik)
  const diffMs = Math.max(0, now.getTime() - TANGGAL_JADIAN.getTime());
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const totalHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const totalMinutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const totalSeconds = Math.floor((diffMs / 1000) % 60);

  // Perhitungan Tahun & Bulan
  const startYear = TANGGAL_JADIAN.getFullYear();
  const startMonth = TANGGAL_JADIAN.getMonth();
  const startDay = TANGGAL_JADIAN.getDate();

  const curYear = now.getFullYear();
  const curMonth = now.getMonth();
  const curDay = now.getDate();
  let diffYears = curYear - startYear;
  let diffMonths = curMonth - startMonth;
  if (curDay < startDay) {
    diffMonths--;
  }
  if (diffMonths < 0) {
    diffYears--;
    diffMonths += 12;
  }
  const totalMonthsTogether = diffYears * 12 + diffMonths;

  // Next Upcoming Anniversary Target Date
  const nextAnnivYear = curYear + (now > new Date(curYear, 8, 14, 23, 59, 59) ? 1 : 0);
  const nextAnnivDate = new Date(nextAnnivYear, 8, 14, 0, 0, 0);
  const daysUntilAnniv = Math.max(
    0,
    Math.ceil((nextAnnivDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Process and sort moments
  const processedMoments = useMemo(() => {
    return MOMEN_LIST.map((item) => {
      const passedCount = calculatePassedMoments(item, now);
      const { nextDate, diffDays, isToday } = calculateNextOccurrence(item, now);
      const dateLabel = new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
      }).format(new Date(2024, item.month, item.day));

      return {
        ...item,
        passedCount,
        nextDate,
        diffDays,
        isToday,
        dateLabel,
      };
    });
  }, [now]);

  // Spotlight Nearest Moment
  const nearestMoment = useMemo(() => {
    const sorted = [...processedMoments].sort((a, b) => a.diffDays - b.diffDays);
    return sorted[0] || null;
  }, [processedMoments]);

  // Filtered moments list
  const filteredMoments = useMemo(() => {
    if (filterTab === "upcoming") {
      return [...processedMoments].sort((a, b) => a.diffDays - b.diffDays);
    }
    if (filterTab === "passed") {
      return [...processedMoments]
        .filter((m) => m.passedCount > 0)
        .sort((a, b) => b.passedCount - a.passedCount);
    }
    return processedMoments;
  }, [processedMoments, filterTab]);

  const handleSaveToCalendar = (moment) => {
    const eventYear = moment.nextDate.getFullYear();
    const startDate = new Date(eventYear, moment.month, moment.day, 9, 0, 0);
    const endDate = new Date(eventYear, moment.month, moment.day, 21, 0, 0);

    const title = `${moment.title} - Rara & Faiz`;
    const description = `${moment.description}\n\nMomen spesial Faiz & Rara sejak 14 September 2024.`;

    downloadIcsFile({
      title,
      description,
      location: "Bersama Rara Tercinta",
      startDate,
      endDate,
      filename: `${moment.id}-rara-faiz.ics`,
    });

    setCopiedLink(moment.id);
    setTimeout(() => setCopiedLink(null), 3000);
  };

  const handleOpenGoogleCalendar = (moment) => {
    const eventYear = moment.nextDate.getFullYear();
    const startDate = new Date(eventYear, moment.month, moment.day, 9, 0, 0);
    const endDate = new Date(eventYear, moment.month, moment.day, 21, 0, 0);

    const title = `${moment.title} - Rara & Faiz`;
    const description = `${moment.description}\n\nMomen spesial Faiz & Rara sejak 14 September 2024.`;

    const url = createGoogleCalendarUrl({
      title,
      description,
      location: "Bersama Rara Tercinta",
      startDate,
      endDate,
    });

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-20">
      {/* Editorial Header */}
      <header className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-zinc-200/90 shadow-2xs mb-5">
          <span className="flex h-2 w-2 rounded-full bg-[#6C40E5] animate-ping" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 font-['Satoshi']">
            Jejak Waktu & Milestone
          </span>
          <span className="text-zinc-300">•</span>
          <span className="text-[11px] font-semibold text-[#6C40E5] font-['Satoshi']">
            Faiz & Rara
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 font-['Satoshi'] leading-tight">
          Momen Indah Bersama
        </h1>
        <p className="mt-3 text-sm sm:text-base text-zinc-600 max-w-xl mx-auto leading-relaxed">
          Setiap detik sejak{" "}
          <strong className="text-zinc-900 font-semibold underline decoration-[#6C40E5]/30 underline-offset-4">
            14 September 2024
          </strong>
          , dirangkum rapi dalam hitungan waktu dan perayaan yang kita nantikan bersama.
        </p>
      </header>

      {/* Hero Live Counter Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-zinc-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_20px_45px_-15px_rgba(108,64,229,0.08)] p-6 sm:p-8 mb-10 transition-all">
        {/* Top Meta Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-purple-50 text-[#6C40E5]">
              <ClockIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 font-['Satoshi']">
                Total Perjalanan Cinta
              </p>
              <p className="text-xs font-semibold text-zinc-900 font-['Satoshi']">
                Sejak Sabtu, 14 September 2024
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-purple-50/80 border border-purple-100 px-3.5 py-1 text-xs font-bold text-[#6C40E5] font-['Satoshi']">
            <SparklesIcon className="w-3.5 h-3.5 text-[#6C40E5]" />
            <span>Bulan ke-{totalMonthsTogether} (Monthlyversary)</span>
          </div>
        </div>

        {/* Big Counter Value */}
        <div className="mt-6 text-center">
          <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-zinc-900 tracking-tight font-['Satoshi']">
            {diffYears > 0 ? `${diffYears} Tahun ` : ""}
            {diffMonths > 0 ? `${diffMonths} Bulan ` : ""}
            <span className="text-[#6C40E5]">
              {totalDays.toLocaleString("id-ID")} Hari Bersama
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500 font-['Satoshi']">
            Tinggal {daysUntilAnniv} hari lagi menuju Anniversary ke-{nextAnnivYear - 2024} tahun kita
          </p>

          {/* Precision Tabular Clocks */}
          <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-xl mx-auto mt-7">
            <div className="rounded-2xl bg-zinc-50/80 border border-zinc-200/70 p-3 sm:p-4 flex flex-col items-center shadow-2xs hover:border-purple-200 transition-colors">
              <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 font-mono tabular-nums tracking-tight">
                {totalDays}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider mt-1 font-['Satoshi']">
                Hari
              </span>
            </div>

            <div className="rounded-2xl bg-zinc-50/80 border border-zinc-200/70 p-3 sm:p-4 flex flex-col items-center shadow-2xs hover:border-purple-200 transition-colors">
              <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 font-mono tabular-nums tracking-tight">
                {formatNumber(totalHours)}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider mt-1 font-['Satoshi']">
                Jam
              </span>
            </div>

            <div className="rounded-2xl bg-zinc-50/80 border border-zinc-200/70 p-3 sm:p-4 flex flex-col items-center shadow-2xs hover:border-purple-200 transition-colors">
              <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 font-mono tabular-nums tracking-tight">
                {formatNumber(totalMinutes)}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider mt-1 font-['Satoshi']">
                Menit
              </span>
            </div>

            <div className="rounded-2xl bg-purple-50/60 border border-purple-200/80 p-3 sm:p-4 flex flex-col items-center shadow-2xs hover:border-[#6C40E5] transition-colors">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#6C40E5] font-mono tabular-nums tracking-tight">
                {formatNumber(totalSeconds)}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-[#6C40E5] uppercase tracking-wider mt-1 font-['Satoshi']">
                Detik
              </span>
            </div>
          </div>

          {/* Heartfelt Quote Note */}
          <div className="mt-8 rounded-2xl bg-gradient-to-r from-purple-50/60 via-pink-50/30 to-purple-50/60 border border-purple-100/90 p-4 text-left max-w-2xl mx-auto flex items-start gap-3">
            <MessageSquareHeartIcon className="w-5 h-5 text-[#6C40E5] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs sm:text-[13px] text-zinc-700 leading-relaxed font-['Satoshi']">
                <span className="font-semibold text-zinc-900">Pesan dari Faiz untuk Rara:</span>{" "}
                "Dari tanggal 14 September 2024 sampai hari ini, rasa sayangnya tidak pernah berkurang.
                Terima kasih sudah selalu jadi rumah paling hangat dan partner hidup paling spesial, sayang."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Spotlight: Nearest Upcoming Milestone */}
      {nearestMoment && (
        <div className="mb-10 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-purple-950 text-white p-5 sm:p-6 border border-zinc-800 shadow-[0_15px_35px_rgba(0,0,0,0.12)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white border border-white/10 shadow-inner">
                <nearestMoment.IconComponent className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-400/30 uppercase tracking-wider font-['Satoshi']">
                  <SparklesIcon className="w-3 h-3 text-purple-300" />
                  <span>Momen Terdekat Berikutnya</span>
                </div>
                <h3 className="mt-1 text-lg sm:text-xl font-bold font-['Satoshi'] text-white">
                  {nearestMoment.title}
                </h3>
                <p className="text-xs text-zinc-400 font-['Satoshi'] mt-0.5">
                  Setiap {nearestMoment.dateLabel} • {nearestMoment.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2.5 shrink-0 border-t border-white/10 pt-3 sm:border-0 sm:pt-0">
              {nearestMoment.isToday ? (
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-300 animate-pulse font-['Satoshi']">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Hari ini dirayakan!</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 px-3 py-1.5 text-xs font-bold text-purple-200 font-['Satoshi']">
                  <ClockIcon className="w-3.5 h-3.5 text-purple-300" />
                  <span>Tinggal </span>
                  <strong className="text-white font-mono tabular-nums">
                    {nearestMoment.diffDays}
                  </strong>
                  <span> hari lagi</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveToCalendar(nearestMoment)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-1.5 text-[11px] font-bold text-white transition-colors font-['Satoshi']"
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>{copiedLink === nearestMoment.id ? "Tersimpan! ✓" : "Simpan iCal (.ics)"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenGoogleCalendar(nearestMoment)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#6C40E5] hover:bg-[#5B21B6] px-3 py-1.5 text-[11px] font-bold text-white transition-colors font-['Satoshi']"
                >
                  <span>Google Cal</span>
                  <ExternalLinkIcon className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Section Heading */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 font-['Satoshi']">
            Daftar Momen Spesial Kita
          </h2>
          <p className="text-xs text-zinc-500 font-['Satoshi'] mt-0.5">
            Hari-hari penting yang kita rayakan bersama setiap tahun
          </p>
        </div>

        {/* Clean Segmented Control */}
        <div className="inline-flex rounded-xl bg-zinc-100 p-1 border border-zinc-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all font-['Satoshi'] ${filterTab === "all"
              ? "bg-white text-zinc-900 shadow-xs"
              : "text-zinc-600 hover:text-zinc-900"
              }`}
          >
            Semua ({MOMEN_LIST.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("upcoming")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all font-['Satoshi'] ${filterTab === "upcoming"
              ? "bg-white text-zinc-900 shadow-xs"
              : "text-zinc-600 hover:text-zinc-900"
              }`}
          >
            Mendatang
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("passed")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all font-['Satoshi'] ${filterTab === "passed"
              ? "bg-white text-zinc-900 shadow-xs"
              : "text-zinc-600 hover:text-zinc-900"
              }`}
          >
            Telah Dirayakan
          </button>
        </div>
      </div>

      {/* Grid Momen Spesial */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {filteredMoments.map((item) => {
          const MomentIcon = item.IconComponent;
          return (
            <article
              key={item.id}
              className="group relative rounded-2xl bg-white border border-zinc-200/80 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-purple-300 hover:shadow-[0_10px_25px_-5px_rgba(108,64,229,0.08)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Header Row: Category Badge & Countdown Pill */}
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 bg-zinc-100 px-2.5 py-0.5 rounded-md font-['Satoshi']">
                    {item.category}
                  </span>

                  {item.isToday ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-['Satoshi']">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Hari Ini!</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-600 bg-zinc-50 border border-zinc-200/80 px-2.5 py-0.5 rounded-full font-['Satoshi']">
                      <ClockIcon className="w-3 h-3 text-zinc-400" />
                      <span className="font-mono tabular-nums">{item.diffDays}</span>
                      <span>hari lagi</span>
                    </span>
                  )}
                </div>

                {/* Title & Vector Icon */}
                <div className="flex items-start gap-3.5 mb-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-2xs border border-zinc-100 text-[#6C40E5]"
                    style={{ backgroundColor: `${item.themeColor}12` }}
                  >
                    <MomentIcon className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 font-['Satoshi'] leading-snug group-hover:text-[#6C40E5] transition-colors truncate">
                      {item.title}
                    </h3>
                    <p className="text-xs font-semibold text-zinc-500 font-['Satoshi']">
                      Setiap {item.dateLabel}
                      {item.birthYear && (
                        <span className="ml-1 text-[#6C40E5] font-bold">
                          • Lahir {item.birthYear}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Milestone Count Badge */}
                <div
                  className={`rounded-xl p-3 border mb-3 flex items-center gap-2.5 ${item.passedCount > 0
                    ? "bg-purple-50/60 text-[#6C40E5] border-purple-100"
                    : "bg-zinc-50 text-zinc-600 border-zinc-200/80"
                    }`}
                >
                  <div className="shrink-0">
                    {item.passedCount > 0 ? (
                      <CheckCircleIcon className="w-4 h-4 text-[#6C40E5]" />
                    ) : (
                      <ClockIcon className="w-4 h-4 text-zinc-400" />
                    )}
                  </div>
                  <p className="text-xs sm:text-[13px] font-bold leading-snug font-['Satoshi']">
                    {item.passedCount > 0
                      ? item.getPassedText(item.passedCount)
                      : item.getPendingText()}
                  </p>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-[13px] text-zinc-600 leading-relaxed font-['Satoshi'] mb-4">
                  {item.description}
                </p>
              </div>

              {/* Bottom Actions: Calendar Integration */}
              <div className="pt-3.5 border-t border-zinc-100 flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium font-['Satoshi']">
                  Simpan Jadwal:
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveToCalendar(item)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-zinc-50 hover:bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-700 transition-colors font-['Satoshi']"
                    title="Unduh file kalender .ics"
                  >
                    <CalendarIcon className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{copiedLink === item.id ? "Disimpan! ✓" : "iCal (.ics)"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenGoogleCalendar(item)}
                    className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50/70 hover:bg-purple-100 px-2.5 py-1 text-[11px] font-bold text-[#6C40E5] transition-colors font-['Satoshi']"
                    title="Tambah langsung ke Google Calendar"
                  >
                    <span>Google Cal</span>
                    <ExternalLinkIcon className="w-3 h-3 text-[#6C40E5]" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Footer Navigation Link to Agenda / Jurnal */}
      <div className="mt-12 rounded-2xl bg-white border border-zinc-200/80 p-5 sm:p-6 text-center shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left">
          <h4 className="text-sm font-bold text-zinc-900 font-['Satoshi']">
            Punya rencana kencan seru untuk momen berikutnya?
          </h4>
          <p className="text-xs text-zinc-500 font-['Satoshi'] mt-0.5">
            Bikin jadwal kencan dan rute jalan berdua di fitur Agenda Date.
          </p>
        </div>

        <Link
          to="/agenda"
          className="inline-flex items-center gap-2 rounded-xl bg-[#6C40E5] hover:bg-[#5B21B6] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-transform hover:-translate-y-0.5 font-['Satoshi'] shrink-0"
        >
          <CompassIcon className="w-4 h-4 text-white" />
          <span>Buka Agenda Date Kita</span>
          <ChevronRightIcon className="w-4 h-4 text-white" />
        </Link>
      </div>
    </section>
  );
}

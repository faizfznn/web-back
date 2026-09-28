import React, { useState, useEffect } from "react";

// Konfigurasi Tanggal Penting
const TANGGAL_JADIAN = new Date(2024, 8, 14, 0, 0, 0); // 14 September 2024

const MOMEN_LIST = [
  {
    id: "valentine",
    title: "Hari Kasih Sayang (Valentine)",
    month: 1, // Februari (0-indexed)
    day: 14,
    icon: "💖",
    color: "from-pink-500/20 to-rose-500/10 text-rose-600 border-rose-200",
    badgeBg: "bg-rose-50 text-rose-600 border-rose-200",
    accentColor: "#F43F5E",
    description: "Hari kasih sayang penuh rasa syukur karena memiliki Rara di hidup Faiz.",
    getPassedText: (count) => `Sudah ${count}x kita merayakan Valentine bersama`,
    getPendingText: () => "Menuju Valentine pertama kita bersama",
  },
  {
    id: "ultah-rara",
    title: "Ulang Tahun Rara",
    month: 4, // Mei
    day: 18,
    birthYear: 2005,
    icon: "👑",
    color: "from-purple-500/20 to-indigo-500/10 text-purple-600 border-purple-200",
    badgeBg: "bg-purple-50 text-purple-600 border-purple-200",
    accentColor: "#8B5CF6",
    description: "Hari lahirnya perempuan tercantik, paling spesial, dan paling Faiz sayangi.",
    getPassedText: (count) => `Sudah ${count}x Faiz mendampingi hari lahir Rara`,
    getPendingText: () => "Menuju ulang tahun Rara pertama sejak kita jadian",
  },
  {
    id: "ultah-faiz",
    title: "Ulang Tahun Faiz",
    month: 5, // Juni
    day: 15,
    birthYear: 2005,
    icon: "🎉",
    color: "from-blue-500/20 to-cyan-500/10 text-blue-600 border-blue-200",
    badgeBg: "bg-blue-50 text-blue-600 border-blue-200",
    accentColor: "#3B82F6",
    description: "Pertambahan usia Faiz yang terasa jauh lebih lengkap dan bahagia dengan kehadiran Rara.",
    getPassedText: (count) => `Sudah ${count}x Rara menemani hari ulang tahun Faiz`,
    getPendingText: () => "Menuju ulang tahun Faiz pertama bersama Rara",
  },
  {
    id: "gf-day",
    title: "National Girlfriend Day",
    month: 7, // Agustus
    day: 1,
    icon: "🌸",
    color: "from-fuchsia-500/20 to-pink-500/10 text-fuchsia-600 border-fuchsia-200",
    badgeBg: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200",
    accentColor: "#D946EF",
    description: "Hari khusus untuk mengapresiasi dan merayakan pacar terbaik di dunia.",
    getPassedText: (count) => `Sudah ${count}x kita merayakan Girlfriend Day bersama`,
    getPendingText: () => "Menuju Girlfriend Day pertama kita bersama",
  },
  {
    id: "anniv",
    title: "Anniversary Jadian Kita",
    month: 8, // September
    day: 14,
    icon: "💍",
    color: "from-violet-500/20 to-purple-500/10 text-[#6C40E5] border-violet-200",
    badgeBg: "bg-violet-50 text-[#6C40E5] border-violet-200",
    accentColor: "#6C40E5",
    description: "Titik awal tanggal 14 September 2024 saat kita resmi memulai cerita indah ini.",
    getPassedText: (count) => `Sudah ${count}x kita merayakan Anniversary Tahunan`,
    getPendingText: () => "Menuju Anniversary 1 Tahun kita bersama",
  },
  {
    id: "bf-day",
    title: "National Boyfriend Day",
    month: 9, // Oktober
    day: 3,
    icon: "👔",
    color: "from-sky-500/20 to-teal-500/10 text-sky-600 border-sky-200",
    badgeBg: "bg-sky-50 text-sky-600 border-sky-200",
    accentColor: "#0284C7",
    description: "Hari spesial di mana Faiz selalu berjanji untuk jadi pendamping terbaik bagi Rara.",
    getPassedText: (count) => `Sudah ${count}x kita merayakan Boyfriend Day bersama`,
    getPendingText: () => "Menuju Boyfriend Day pertama kita bersama",
  },
  {
    id: "new-year",
    title: "Malam Tahun Baru",
    month: 0, // Januari
    day: 1,
    icon: "🎆",
    color: "from-amber-500/20 to-orange-500/10 text-amber-600 border-amber-200",
    badgeBg: "bg-amber-50 text-amber-600 border-amber-200",
    accentColor: "#F59E0B",
    description: "Menatap masa depan dan menutup lembaran tahun bergandengan tangan.",
    getPassedText: (count) => `Sudah ${count}x kita menyambut Tahun Baru bersama`,
    getPendingText: () => "Menuju Tahun Baru pertama kita bersama",
  },
];

function formatNumber(num) {
  return num.toString().padStart(2, "0");
}

function calculatePassedMoments(item, now) {
  let count = 0;
  const currentYear = now.getFullYear();

  for (let y = 2024; y <= currentYear; y++) {
    // Akhir hari dari momen di tahun tersebut
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

  // Jika hari ini sudah melewati momen tahun ini
  if (now > new Date(currentYear, item.month, item.day, 23, 59, 59)) {
    next = new Date(currentYear + 1, item.month, item.day, 0, 0, 0);
  }

  const diffTime = next.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isToday =
    now.getDate() === item.day && now.getMonth() === item.month;

  return { nextDate: next, diffDays, isToday };
}

export default function MomenBersama() {
  const [now, setNow] = useState(new Date());

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

  // Perhitungan Bulan dan Hari
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

  return (
    <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-16">
      {/* Divider Romantis */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent to-purple-300"></div>
        <span className="text-xl sm:text-2xl animate-pulse">✨🤍✨</span>
        <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-l from-transparent to-purple-300"></div>
      </div>

      {/* Header Section */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200/80 mb-3 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#6C40E5] animate-ping"></span>
          <span className="font-['Satoshi'] text-xs font-semibold text-[#6C40E5] tracking-wide uppercase">
            Jejak Waktu Bersama
          </span>
        </div>
        <h2 className="font-['Satoshi'] text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-3">
          Momen Indah yang Kita Lalui
        </h2>
        <p className="font-['Satoshi'] text-sm sm:text-base text-gray-500 max-w-xl mx-auto">
          Dihitung otomatis sejak pertama kali kita resmi bersama pada{" "}
          <span className="font-semibold text-[#6C40E5]">14 September 2024</span>
        </p>
      </div>

      {/* Hero Live Counter Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-purple-50/40 to-white border border-purple-100 shadow-[0_10px_35px_rgba(108,64,229,0.08)] p-6 sm:p-8 mb-10 backdrop-blur-sm">
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-purple-200/40 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-pink-200/40 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 text-center">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#6C40E5] mb-2 font-['Satoshi']">
            Total Perjalanan Cinta Kita
          </p>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-['Satoshi'] mb-6">
            {diffYears > 0 ? `${diffYears} Tahun ` : ""}
            {diffMonths > 0 ? `${diffMonths} Bulan ` : ""}
            <span className="text-[#6C40E5]">
              {totalDays.toLocaleString("id-ID")} Hari Bersama
            </span>
          </div>

          {/* Grid Ticking Clock */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-lg mx-auto">
            <div className="bg-white/90 rounded-2xl p-3 sm:p-4 border border-purple-100/80 shadow-sm flex flex-col items-center">
              <span className="text-xl sm:text-3xl font-black text-gray-900 font-['Satoshi']">
                {totalDays}
              </span>
              <span className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">
                Hari
              </span>
            </div>
            <div className="bg-white/90 rounded-2xl p-3 sm:p-4 border border-purple-100/80 shadow-sm flex flex-col items-center">
              <span className="text-xl sm:text-3xl font-black text-gray-900 font-['Satoshi']">
                {formatNumber(totalHours)}
              </span>
              <span className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">
                Jam
              </span>
            </div>
            <div className="bg-white/90 rounded-2xl p-3 sm:p-4 border border-purple-100/80 shadow-sm flex flex-col items-center">
              <span className="text-xl sm:text-3xl font-black text-gray-900 font-['Satoshi']">
                {formatNumber(totalMinutes)}
              </span>
              <span className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">
                Menit
              </span>
            </div>
            <div className="bg-white/90 rounded-2xl p-3 sm:p-4 border border-purple-100/80 shadow-sm flex flex-col items-center">
              <span className="text-xl sm:text-3xl font-black text-[#6C40E5] font-['Satoshi']">
                {formatNumber(totalSeconds)}
              </span>
              <span className="text-[10px] sm:text-xs font-medium text-purple-600 uppercase tracking-wider mt-1">
                Detik
              </span>
            </div>
          </div>

          <div className="mt-5 inline-flex items-center gap-1.5 text-xs text-gray-500 bg-white/70 px-3 py-1 rounded-full border border-gray-100">
            <span>✨</span>
            <span>Atau sudah melewati <b>{totalMonthsTogether} kali Monthlyversary</b> bersama</span>
          </div>
        </div>
      </div>

      {/* Grid Momen Spesial */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {MOMEN_LIST.map((item) => {
          const passedCount = calculatePassedMoments(item, now);
          const { diffDays, isToday } = calculateNextOccurrence(item, now);

          // Format tanggal bulan untuk display
          const dateLabel = new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "long",
          }).format(new Date(2024, item.month, item.day));

          return (
            <div
              key={item.id}
              className="group relative bg-white/95 rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(108,64,229,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Top Row: Icon & Tag */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr flex items-center justify-center text-2xl shadow-inner border border-gray-50">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-['Satoshi'] text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                        {item.title}
                      </h3>
                      <span className="text-xs font-medium text-gray-400">
                        Setiap {dateLabel}
                        {item.birthYear && (
                          <span className="ml-1 text-purple-600 font-semibold">
                            (Lahir {item.birthYear})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Badge Highlight "Sudah X kali..." */}
                <div
                  className={`rounded-xl p-3.5 border mb-3 flex items-center gap-2.5 transition-colors ${passedCount > 0
                      ? item.badgeBg
                      : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                >
                  <span className="text-lg">
                    {passedCount > 0 ? "🎉" : "⏳"}
                  </span>
                  <p className="font-['Satoshi'] text-sm sm:text-[15px] font-bold leading-snug">
                    {passedCount > 0
                      ? item.getPassedText(passedCount)
                      : item.getPendingText()}
                  </p>
                </div>

                {/* Deskripsi */}
                <p className="font-['Satoshi'] text-xs sm:text-sm text-gray-500 leading-relaxed mb-4">
                  {item.description}
                </p>
              </div>

              {/* Bottom Row / Status Perayaan Berikutnya */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-400 font-medium">Status</span>
                {isToday ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full animate-bounce">
                    <span>🌟</span> Hari ini dirayakan!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-gray-600 font-medium bg-gray-50 px-2.5 py-1 rounded-full">
                    <span>⏳</span>
                    {diffDays === 0 ? "Besok" : `${diffDays} hari lagi`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quote / Catatan Manis di Bawah */}
      <div className="mt-10 text-center p-6 rounded-2xl bg-white/70 border border-purple-100/60 shadow-sm">
        <p className="font-['Satoshi'] text-xs sm:text-sm text-[#5B526F] italic">
          &ldquo;Setiap detik yang terlewat bersamamu adalah momen terbaik, dan
          setiap momen yang akan datang adalah alasan Faiz untuk terus menjadi
          yang terbaik untuk Rara.&rdquo;
        </p>
        <span className="inline-block mt-2 font-['Satoshi'] text-xs font-bold text-[#6C40E5]">
          — Faiz untuk Rara 🤍
        </span>
      </div>
    </section>
  );
}

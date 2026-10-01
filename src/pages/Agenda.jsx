import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  getDatePlans,
  saveDatePlan,
  deleteDatePlan,
  saveDateStop,
  deleteDateStop,
  updateStopStatus,
  saveStopReview,
  getWheelIdeas,
  saveWheelIdea,
  deleteWheelIdea,
} from "../lib/agenda";
import { uploadJournalImage } from "../lib/journals";
import { isSupabaseConfigured } from "../lib/supabase";

function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function getCurrentTimeStr() {
  const now = new Date();
  const time = now
    .toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(".", ":");
  return `${time} WIB`;
}

function formatTimeInput(raw) {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length === 0) return "";
  if (digits.length <= 2) {
    if (digits.length === 2 && Number(digits) > 23) return "23";
    return digits;
  }
  let h = digits.slice(0, 2);
  let m = digits.slice(2, 4);
  if (Number(h) > 23) h = "23";
  if (m.length === 2 && Number(m) > 59) m = "59";
  return `${h}:${m}`;
}

function addMinutesToTime(timeStr, minutesToAdd) {
  if (!timeStr || !timeStr.includes(":")) return "13:30";
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return "13:30";
  const totalMins = (h * 60 + m + minutesToAdd) % (24 * 60);
  const newH = Math.floor(totalMins / 60).toString().padStart(2, "0");
  const newM = (totalMins % 60).toString().padStart(2, "0");
  return `${newH}:${newM}`;
}

const CATEGORY_OPTIONS = [
  { id: "Casual", label: "Casual", icon: "☕" },
  { id: "Romantic", label: "Romantic", icon: "💖" },
  { id: "Culinary", label: "Kuliner", icon: "🍜" },
  { id: "Cinema", label: "Bioskop", icon: "🎬" },
  { id: "Adventure", label: "Jalan/Seru", icon: "🎡" },
];

const STATUS_OPTIONS = [
  { id: "upcoming", label: "Upcoming", icon: "⏳" },
  { id: "ongoing", label: "Ongoing", icon: "🚀" },
  { id: "completed", label: "Selesai", icon: "✅" },
];

const ACTIVITY_PRESETS = [
  { id: "Photobooth", label: "Photobooth", icon: "📸" },
  { id: "Kuliner", label: "Kuliner/Makan", icon: "🍽️" },
  { id: "Cafe", label: "Nongkrong Cafe", icon: "☕" },
  { id: "Bioskop", label: "Nonton Bioskop", icon: "🎬" },
  { id: "OTW/Perjalanan", label: "OTW / Perjalanan", icon: "🛵" },
  { id: "Custom activity", label: "Aktivitas Lain", icon: "✨" },
];

function Agenda() {
  const [datePlans, setDatePlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeReviewStop, setActiveReviewStop] = useState(null);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [showNewStopModal, setShowNewStopModal] = useState(false);
  const [showWheelModal, setShowWheelModal] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  // Review Form State
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    would_go_again: "Yes, definitely!",
    what_did_we_order: "",
    favorite_moment: "",
    memory_note: "",
    photos: [],
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // New Plan Form State
  const [newPlanForm, setNewPlanForm] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    location: "Malang",
    category: "Casual",
    status: "upcoming",
  });

  // New Stop Form State
  const [newStopForm, setNewStopForm] = useState({
    title: "",
    activity_type: "Custom activity",
    time_start: "12:00",
    time_end: "13:30",
    transport_note: "",
    maps_url: "",
  });

  // Spin Wheel State
  const [wheelIdeas, setWheelIdeas] = useState([]);
  const [newIdeaText, setNewIdeaText] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelWinner, setWheelWinner] = useState(null);
  const canvasRef = useRef(null);
  const spinRotationRef = useRef(0);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    const { data } = await getDatePlans();
    setDatePlans(data || []);
    if (data && data.length > 0 && !selectedPlanId) {
      setSelectedPlanId(data[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Active Plan
  const activePlan =
    datePlans.find((p) => p.id === selectedPlanId) || datePlans[0] || null;

  // Tracking Actions
  const handleStartStop = async (stop) => {
    const timeNow = getCurrentTimeStr();
    await updateStopStatus(stop.id, "ongoing", { actual_started_at: timeNow });
    loadData();
  };

  const handleFinishStop = async (stop) => {
    const timeNow = getCurrentTimeStr();
    await updateStopStatus(stop.id, "completed", { actual_finished_at: timeNow });
    loadData();
  };

  const handleSkipStop = async (stop) => {
    await updateStopStatus(stop.id, "skipped");
    loadData();
  };

  // Open Review Modal
  const openReview = (stop) => {
    setActiveReviewStop(stop);
    setReviewForm({
      rating: stop.rating || 5,
      would_go_again: stop.would_go_again || "Yes, definitely!",
      what_did_we_order: stop.what_did_we_order || "",
      favorite_moment: stop.favorite_moment || "",
      memory_note: stop.memory_note || "",
      photos: stop.photos || [],
    });
    setShowReviewModal(true);
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (!activeReviewStop) return;
    await saveStopReview(activeReviewStop.id, reviewForm);
    setShowReviewModal(false);
    loadData();
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const { data, error } = await uploadJournalImage(file);
    if (!error && data?.publicUrl) {
      setReviewForm((prev) => ({
        ...prev,
        photos: [...prev.photos, data.publicUrl],
      }));
    }
    setUploadingPhoto(false);
  };

  // Create New Plan
  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!newPlanForm.title.trim()) return;
    const { data } = await saveDatePlan(newPlanForm);
    if (data) {
      setShowNewPlanModal(false);
      setNewPlanForm({
        title: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        location: "Malang",
        category: "Casual",
        status: "upcoming",
      });
      await loadData();
      setSelectedPlanId(data.id);
    }
  };

  // Add Stop
  const handleCreateStop = async (e) => {
    e.preventDefault();
    if (!activePlan || !newStopForm.title.trim()) return;
    await saveDateStop({
      ...newStopForm,
      date_plan_id: activePlan.id,
      order_index: (activePlan.date_stops || []).length,
    });
    setShowNewStopModal(false);
    setNewStopForm({
      title: "",
      activity_type: "Custom activity",
      time_start: "12:00",
      time_end: "13:30",
      transport_note: "",
      maps_url: "",
    });
    loadData();
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm("Yakin ingin menghapus agenda date ini?")) return;
    await deleteDatePlan(id);
    setSelectedPlanId(null);
    loadData();
  };

  const handleDeleteStop = async (id) => {
    if (!window.confirm("Hapus aktivitas ini dari timeline?")) return;
    await deleteDateStop(id);
    loadData();
  };

  // Wheel Ideas Setup
  useEffect(() => {
    if (showWheelModal) {
      getWheelIdeas().then(({ data }) => {
        setWheelIdeas(data || []);
      });
    }
  }, [showWheelModal]);

  // Draw Canvas Wheel
  useEffect(() => {
    if (!showWheelModal || wheelIdeas.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const numSegments = wheelIdeas.length;
    const arc = (2 * Math.PI) / numSegments;
    const radius = canvas.width / 2;

    const colors = [
      "#7C3AED", // Violet
      "#EC4899", // Pink
      "#3B82F6", // Blue
      "#10B981", // Emerald
      "#F59E0B", // Amber
      "#8B5CF6", // Purple
      "#06B6D4", // Cyan
      "#F43F5E", // Rose
    ];

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(spinRotationRef.current);

    for (let i = 0; i < numSegments; i++) {
      const angle = i * arc;
      ctx.beginPath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius - 6, angle, angle + arc);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.strokeStyle = "#ffffff44";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Text along slice
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 4;
      ctx.font = "bold 12px 'Satoshi', sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.rotate(angle + arc / 2);
      ctx.fillText(wheelIdeas[i].place_name.slice(0, 16), radius - 20, 0);
      ctx.restore();
    }

    ctx.restore();

    // Center Pin Ring
    ctx.beginPath();
    ctx.arc(radius, radius, 22, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(108,64,229,0.25)";
    ctx.shadowBlur = 10;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(radius, radius, 14, 0, 2 * Math.PI);
    ctx.fillStyle = "#6C40E5";
    ctx.fill();
  }, [showWheelModal, wheelIdeas]);

  // Spin Wheel Function
  const spinWheel = () => {
    if (isSpinning || wheelIdeas.length === 0) return;
    setIsSpinning(true);
    setWheelWinner(null);

    const extraRounds = 5 + Math.random() * 4;
    const randomAngle = Math.random() * 2 * Math.PI;
    const totalSpin = extraRounds * 2 * Math.PI + randomAngle;
    const duration = 4200;
    const startTime = performance.now();
    const initialRotation = spinRotationRef.current;

    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3.5);
      spinRotationRef.current = initialRotation + totalSpin * ease;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        const numSegments = wheelIdeas.length;
        const arc = (2 * Math.PI) / numSegments;
        const radius = canvas.width / 2;
        const colors = [
          "#7C3AED",
          "#EC4899",
          "#3B82F6",
          "#10B981",
          "#F59E0B",
          "#8B5CF6",
          "#06B6D4",
          "#F43F5E",
        ];

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(spinRotationRef.current);

        for (let i = 0; i < numSegments; i++) {
          const angle = i * arc;
          ctx.beginPath();
          ctx.fillStyle = colors[i % colors.length];
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, radius - 6, angle, angle + arc);
          ctx.lineTo(0, 0);
          ctx.fill();
          ctx.strokeStyle = "#ffffff44";
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.save();
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "rgba(0,0,0,0.3)";
          ctx.shadowBlur = 4;
          ctx.font = "bold 12px 'Satoshi', sans-serif";
          ctx.textAlign = "right";
          ctx.textBaseline = "middle";
          ctx.rotate(angle + arc / 2);
          ctx.fillText(wheelIdeas[i].place_name.slice(0, 16), radius - 20, 0);
          ctx.restore();
        }

        ctx.restore();

        ctx.beginPath();
        ctx.arc(radius, radius, 22, 0, 2 * Math.PI);
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(108,64,229,0.25)";
        ctx.shadowBlur = 10;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(radius, radius, 14, 0, 2 * Math.PI);
        ctx.fillStyle = "#6C40E5";
        ctx.fill();
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        const numSegments = wheelIdeas.length;
        const arc = (2 * Math.PI) / numSegments;
        const normalizedAngle =
          ((spinRotationRef.current % (2 * Math.PI)) + 2 * Math.PI) %
          (2 * Math.PI);
        const pointerAngle = (2 * Math.PI - normalizedAngle) % (2 * Math.PI);
        const winningIndex = Math.floor(pointerAngle / arc) % numSegments;
        setWheelWinner(wheelIdeas[winningIndex]);
      }
    };

    requestAnimationFrame(animate);
  };

  const handleAddIdea = async (e) => {
    e.preventDefault();
    if (!newIdeaText.trim()) return;
    const { data } = await saveWheelIdea({ place_name: newIdeaText });
    if (data) {
      setWheelIdeas((prev) => [...prev, data]);
      setNewIdeaText("");
    }
  };

  const handleDeleteIdea = async (id) => {
    await deleteWheelIdea(id);
    setWheelIdeas((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddWinnerToTimeline = () => {
    if (!wheelWinner) return;
    setNewStopForm((prev) => ({
      ...prev,
      title: wheelWinner.place_name,
      activity_type: "Spin Wheel Choice",
    }));
    setShowWheelModal(false);
    setShowNewStopModal(true);
  };

  return (
    <>
      <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-16 animate-fade-in-up">
        {/* Romantic Divider */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent to-purple-300"></div>
          <span className="text-xl sm:text-2xl animate-pulse">✨🤍✨</span>
          <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-l from-transparent to-purple-300"></div>
        </div>

        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200/80 mb-3 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#6C40E5] animate-ping"></span>
            <span className="font-['Satoshi'] text-xs font-semibold text-[#6C40E5] tracking-wide uppercase">
              Date Planner & Itinerary
            </span>
          </div>
          <h1 className="font-['Satoshi'] text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-3">
            Agenda Date Kita
          </h1>
          <p className="font-['Satoshi'] text-sm sm:text-base text-gray-500 max-w-xl mx-auto">
            Rencana kencan seru, jadwal aktivitas, dan kenangan manis di setiap tempat yang kita lalui berdua.
          </p>
        </div>

        {/* Action Buttons Top */}
        <div className="flex flex-wrap items-center justify-center sm:justify-between gap-3 mb-8 pb-4 border-b border-gray-200/80">
          <div className="flex items-center gap-2">
            {datePlans.length > 0 && (
              <span className="font-['Satoshi'] text-xs font-bold text-gray-400 uppercase tracking-wider">
                Pilihan Tanggal ({datePlans.length})
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowWheelModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-purple-200 text-[#6C40E5] font-['Satoshi'] text-xs font-bold shadow-xs hover:bg-purple-50 hover:border-[#6C40E5] hover:-translate-y-0.5 transition-all duration-300"
            >
              <span className="text-base">🎡</span>
              Spin Wheel ("Terserah")
            </button>

            <button
              onClick={() => setShowNewPlanModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6C40E5] text-white font-['Satoshi'] text-xs font-bold shadow-[0_7px_16px_rgba(62,24,197,0.20)] hover:-translate-y-0.5 transition-all duration-300"
              style={{
                backgroundImage:
                  "radial-gradient(44.33% 44.33% at 50.2% 0%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.00) 100%), #6C40E5",
              }}
            >
              <span>+</span> Buat Date Baru
            </button>
          </div>
        </div>

        {/* Plan Selector Pills */}
        {datePlans.length > 1 && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {datePlans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`shrink-0 rounded-xl px-4 py-2 font-['Satoshi'] text-xs transition-all ${selectedPlanId === plan.id
                  ? "bg-[#6C40E5] text-white font-bold shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-purple-200 hover:text-gray-900"
                  }`}
              >
                {plan.title} •{" "}
                {new Date(plan.date).toLocaleDateString("id-ID", {
                  month: "short",
                  day: "numeric",
                })}
              </button>
            ))}
          </div>
        )}

        {/* Supabase Notice */}
        {!isSupabaseConfigured && (
          <div className="mb-6 rounded-2xl border border-[#E6DFFF] bg-[#F7F4FF] px-5 py-4 text-sm text-[#5B526F]">
            Supabase belum tersambung. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di file `.env.local` untuk menyimpan agenda secara permanen.
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center font-['Satoshi'] text-sm text-gray-500">
            Membuka rencana date...
          </div>
        ) : !activePlan ? (
          /* Empty State */
          <div className="my-10 rounded-3xl border border-gray-200 bg-white/95 p-10 text-center shadow-[0_10px_35px_rgba(108,64,229,0.06)]">
            <p className="text-4xl animate-bounce">💌</p>
            <h3 className="mt-4 font-['Satoshi'] text-xl font-bold text-gray-900">
              Belum Ada Agenda Date
            </h3>
            <p className="mt-2 font-['Satoshi'] text-sm text-gray-500 max-w-md mx-auto">
              Yuk buat rencana kencan romantis pertama atau putar Spin Wheel saat Rara bingung mau ke mana!
            </p>
            <button
              onClick={() => setShowNewPlanModal(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#6C40E5] px-6 py-3 font-['Satoshi'] text-xs font-bold text-white shadow-md hover:-translate-y-0.5 transition-transform"
            >
              + Rencanakan Date Pertama
            </button>
          </div>
        ) : (
          /* Active Plan Card */
          <div className="space-y-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-purple-50/30 to-white border border-purple-100 shadow-[0_10px_35px_rgba(108,64,229,0.08)] p-6 sm:p-8 backdrop-blur-sm">
              <div className="absolute -top-16 -right-16 w-44 h-44 bg-purple-200/30 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-pink-200/30 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 font-['Satoshi'] text-[11px] font-bold uppercase tracking-wider ${activePlan.status === "completed"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : activePlan.status === "ongoing"
                          ? "bg-purple-50 text-[#6C40E5] border border-purple-200 animate-pulse"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                    >
                      {activePlan.status || "UPCOMING"}
                    </span>
                    <span className="font-['Satoshi'] text-xs font-medium text-purple-700 bg-purple-50/80 px-2.5 py-1 rounded-full border border-purple-100">
                      {activePlan.category || "Casual"}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeletePlan(activePlan.id)}
                    className="font-['Satoshi'] text-xs text-red-500 hover:text-red-700 transition-colors"
                    title="Hapus Agenda Ini"
                  >
                    Hapus Agenda
                  </button>
                </div>

                <h2 className="mt-4 font-['Satoshi'] text-2xl sm:text-3xl font-bold leading-tight text-gray-900">
                  {activePlan.title}
                </h2>
                {activePlan.description && (
                  <p className="mt-2 font-['Satoshi'] text-sm leading-relaxed text-gray-600">
                    {activePlan.description}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-gray-600 border-t border-purple-100/80 pt-4">
                  <div className="inline-flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-full border border-gray-200/80 shadow-xs">
                    <span className="text-[#6C40E5]">📅</span>
                    <span className="font-medium">{formatDateDisplay(activePlan.date)}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-full border border-gray-200/80 shadow-xs">
                    <span className="text-[#6C40E5]">📍</span>
                    <span className="font-medium">{activePlan.location || "Malang"}</span>
                  </div>
                </div>

                {/* Balloon Note */}
                <div className="mt-6 rounded-2xl border border-[#E6DFFF] bg-[#F7F4FF] p-4 text-left shadow-xs">
                  <span className="font-['Satoshi'] text-[11px] font-bold uppercase tracking-[0.16em] text-[#6C40E5]">
                    Catatan untuk Rara 💌
                  </span>
                  <p className="mt-1 font-['Satoshi'] text-xs sm:text-sm leading-relaxed text-[#5B526F]">
                    "Tugas Rara cuma dandan cantik dan mikirin outfit, jadwal dan tempatnya udah Faiz siapin dengan rapi. Enjoy the date, sayang!" ✨🤍
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    to="/jurnal"
                    className="inline-flex items-center gap-2 rounded-xl bg-white border border-purple-200 px-4 py-2.5 font-['Satoshi'] text-xs font-bold text-[#6C40E5] shadow-xs hover:bg-purple-50 transition-colors"
                  >
                    <span>✨</span> Buka Jurnal
                  </Link>
                  <button
                    onClick={() => setShowNewStopModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#6C40E5] px-4 py-2.5 font-['Satoshi'] text-xs font-bold text-white shadow-sm hover:-translate-y-0.5 transition-transform"
                  >
                    <span>+</span> Tambah Tempat / Aktivitas
                  </button>
                </div>
              </div>
            </div>

            {/* Timeline Itinerary Stepper */}
            <div className="relative space-y-6 pl-4 sm:pl-8">
              <div className="absolute left-[27px] top-6 bottom-6 w-[2px] bg-purple-200/80 sm:left-[43px]" />

              {(activePlan.date_stops || []).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-purple-200 bg-white/80 p-8 text-center font-['Satoshi'] text-xs text-gray-500">
                  Belum ada rute tempat pada tanggal ini. Klik <strong>"+ Tambah Tempat / Aktivitas"</strong> untuk memulai timeline.
                </div>
              ) : (
                activePlan.date_stops.map((stop, idx) => {
                  const isCompleted = stop.status === "completed";
                  const isOngoing = stop.status === "ongoing";
                  const isSkipped = stop.status === "skipped";

                  return (
                    <div key={stop.id} className="relative flex items-start gap-4 sm:gap-6">
                      <div
                        className={`relative z-10 flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all shadow-sm ${isCompleted
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : isOngoing
                            ? "border-[#6C40E5] bg-[#6C40E5] text-white animate-pulse ring-4 ring-purple-100"
                            : isSkipped
                              ? "border-gray-300 bg-gray-100 text-gray-400"
                              : "border-purple-300 bg-white text-[#6C40E5]"
                          }`}
                      >
                        {isCompleted ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : isOngoing ? (
                          <span className="text-[10px] font-black">▶</span>
                        ) : isSkipped ? (
                          <span className="text-xs font-bold">—</span>
                        ) : (
                          <span className="font-['Satoshi'] text-[11px] font-bold">{idx + 1}</span>
                        )}
                      </div>

                      <div className="w-full rounded-2xl bg-white/95 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(108,64,229,0.09)] transition-all p-5 sm:p-6">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-md px-2 py-0.5 font-['Satoshi'] text-[10px] font-extrabold uppercase tracking-wider ${isCompleted
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : isOngoing
                                  ? "bg-purple-50 text-[#6C40E5] border border-purple-200"
                                  : isSkipped
                                    ? "bg-gray-100 text-gray-500 border border-gray-200"
                                    : "bg-purple-50/60 text-purple-700 border border-purple-100"
                                }`}
                            >
                              {stop.status || "UPCOMING"}
                            </span>
                            {(stop.time_start || stop.time_end) && (
                              <span className="font-['Satoshi'] text-xs font-bold text-gray-700">
                                {stop.time_start ? stop.time_start.replace(/wib/i, "").trim() : "??:??"} –{" "}
                                {stop.time_end ? stop.time_end.replace(/wib/i, "").trim() : "??:??"} WIB
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {stop.maps_url && (
                              <a
                                href={stop.maps_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 font-['Satoshi'] text-[11px] font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
                              >
                                <span>📍</span> Open Maps
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteStop(stop.id)}
                              className="text-xs text-gray-300 hover:text-red-500 transition-colors p-1"
                              title="Hapus aktivitas"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        <h3 className="mt-3 font-['Satoshi'] text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                          {stop.title}
                        </h3>
                        <p className="font-['Satoshi'] text-xs text-gray-400 mt-0.5">
                          {stop.activity_type || "Custom activity"}
                        </p>

                        <div className="mt-3.5 flex flex-wrap items-center gap-2.5 text-xs text-gray-600">
                          {stop.actual_started_at && (
                            <span className="bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg font-['Satoshi']">
                              Started:{" "}
                              <strong className="text-gray-900">
                                {stop.actual_started_at.includes("WIB")
                                  ? stop.actual_started_at
                                  : `${stop.actual_started_at} WIB`}
                              </strong>
                            </span>
                          )}
                          {stop.actual_finished_at && (
                            <span className="bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg font-['Satoshi']">
                              Finished:{" "}
                              <strong className="text-gray-900">
                                {stop.actual_finished_at.includes("WIB")
                                  ? stop.actual_finished_at
                                  : `${stop.actual_finished_at} WIB`}
                              </strong>
                            </span>
                          )}
                          {stop.transport_note && (
                            <span className="inline-flex items-center gap-1 text-[#6C40E5] font-semibold font-['Satoshi'] bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                              🛵 {stop.transport_note}
                            </span>
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3.5">
                          {!isCompleted && !isOngoing && (
                            <button
                              onClick={() => handleStartStop(stop)}
                              className="rounded-xl bg-purple-50 border border-purple-200 px-3 py-1.5 font-['Satoshi'] text-xs font-bold text-[#6C40E5] hover:bg-purple-100 transition-colors"
                            >
                              ▶️ Mulai Sekarang
                            </button>
                          )}
                          {isOngoing && (
                            <button
                              onClick={() => handleFinishStop(stop)}
                              className="rounded-xl bg-emerald-500 text-white px-3.5 py-1.5 font-['Satoshi'] text-xs font-bold shadow-sm hover:bg-emerald-600 transition-colors"
                            >
                              ✅ Selesai ({getCurrentTimeStr()})
                            </button>
                          )}
                          {!isCompleted && !isSkipped && (
                            <button
                              onClick={() => handleSkipStop(stop)}
                              className="rounded-xl bg-gray-50 px-2.5 py-1.5 font-['Satoshi'] text-xs text-gray-400 hover:text-gray-700 transition-colors"
                            >
                              Lewati
                            </button>
                          )}

                          <button
                            onClick={() => openReview(stop)}
                            className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50/60 px-3.5 py-1.5 font-['Satoshi'] text-xs font-bold text-[#6C40E5] hover:bg-[#6C40E5] hover:text-white transition-all shadow-xs"
                          >
                            <span>⭐</span> {stop.rating ? "Edit Review & Foto" : "Tulis Review & Rating"}
                          </button>
                        </div>

                        {(stop.rating || stop.favorite_moment || stop.what_did_we_order) && (
                          <div className="mt-4 rounded-2xl border border-purple-100/90 bg-purple-50/30 p-4 text-xs text-gray-700 font-['Satoshi']">
                            {stop.rating && (
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex text-amber-400 text-sm">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <span key={i}>{i < stop.rating ? "★" : "☆"}</span>
                                  ))}
                                </div>
                                {stop.would_go_again && (
                                  <span className="rounded-full bg-white border border-purple-200 px-2.5 py-0.5 text-[10px] font-bold text-[#6C40E5]">
                                    {stop.would_go_again}
                                  </span>
                                )}
                              </div>
                            )}
                            {stop.what_did_we_order && (
                              <p className="mt-1">
                                <span className="text-gray-400 font-medium">Pesan apa:</span>{" "}
                                <strong className="text-gray-800">{stop.what_did_we_order}</strong>
                              </p>
                            )}
                            {stop.favorite_moment && (
                              <p className="mt-1.5 font-medium text-gray-900">
                                <span className="text-purple-600 font-bold">Fav moment:</span> "{stop.favorite_moment}"
                              </p>
                            )}
                            {stop.memory_note && (
                              <p className="mt-1.5 italic text-gray-500 leading-relaxed">
                                &ldquo;{stop.memory_note}&rdquo;
                              </p>
                            )}
                            {stop.photos && stop.photos.length > 0 && (
                              <div className="mt-3 flex gap-2 overflow-x-auto">
                                {stop.photos.map((img, photoIdx) => (
                                  <img
                                    key={photoIdx}
                                    src={img}
                                    alt="Date memory"
                                    onClick={() => setPreviewPhoto(img)}
                                    className="h-16 w-16 shrink-0 rounded-xl object-cover border border-purple-100 cursor-pointer hover:scale-105 transition-transform"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </section>

      {/* =========================================================
          MODAL 1: SPIN WHEEL MODAL ("TERSERAH" PICKER) - REDESIGNED
         ========================================================= */}
      {showWheelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[28px] bg-white border border-[#E9E4F5] p-6 sm:p-8 text-gray-800 shadow-[0_25px_70px_rgba(108,64,229,0.18)] animate-slide-up scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent">
            {/* Header with gradient badge */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-[#6C40E5] font-['Satoshi'] text-[11px] font-bold uppercase tracking-wider mb-1.5">
                  <span>🎡</span> Solusi Saat Rara Bilang "Terserah"
                </div>
                <h3 className="font-['Satoshi'] text-2xl font-extrabold text-gray-900 tracking-tight">
                  Spin Wheel Tempat Date
                </h3>
              </div>
              <button
                onClick={() => setShowWheelModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 2-Column Desktop Grid */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
              {/* Left Column: Canvas Wheel */}
              <div className="relative flex flex-col items-center justify-center py-2">
                {/* Pointer Needle */}
                <div className="absolute top-[-4px] z-30 flex flex-col items-center filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.2)]">
                  <div className="w-0 h-0 border-x-[12px] border-x-transparent border-t-[20px] border-t-[#6C40E5]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 -mt-2 border-2 border-white" />
                </div>

                <div className="relative p-2 rounded-full bg-gradient-to-tr from-purple-100 via-white to-pink-100 shadow-[0_15px_40px_rgba(108,64,229,0.18)] border border-purple-200/80">
                  <canvas
                    ref={canvasRef}
                    width={290}
                    height={290}
                    className="rounded-full"
                  />
                </div>

                <p className="mt-3 font-['Satoshi'] text-[11px] text-gray-400 text-center">
                  ✨ Putar rodanya untuk menentukan destinasi kencan hari ini
                </p>
              </div>

              {/* Right Column: Controls & Result */}
              <div className="flex flex-col justify-center space-y-4">
                {/* Winner Card */}
                {wheelWinner ? (
                  <div className="rounded-2xl border-2 border-[#6C40E5] bg-gradient-to-br from-purple-50 via-pink-50/40 to-white p-5 text-center shadow-md animate-slide-up">
                    <span className="font-['Satoshi'] text-xs font-bold uppercase tracking-wider text-[#6C40E5]">
                      🎉 Destinasi Terpilih!
                    </span>
                    <h4 className="mt-1 font-['Satoshi'] text-2xl font-extrabold text-gray-900">
                      {wheelWinner.place_name}
                    </h4>
                    <p className="mt-1 text-xs text-gray-500 font-['Satoshi']">
                      Gimana, siap berangkat ke sini bareng Faiz? 💖
                    </p>
                    <button
                      onClick={handleAddWinnerToTimeline}
                      className="mt-3.5 inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-[#6C40E5] py-2.5 font-['Satoshi'] text-xs font-bold text-white shadow-sm hover:bg-[#5930c8] transition-colors"
                    >
                      <span>📍</span> Tambah ke Timeline Date
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-purple-100 bg-[#FAF9FD] p-5 text-center">
                    <p className="font-['Satoshi'] text-sm font-bold text-gray-800">
                      Belum diputar nih! 👀
                    </p>
                    <p className="mt-1 text-xs text-gray-500 font-['Satoshi']">
                      Klik tombol ungu di bawah buat muter rodanya secara acak.
                    </p>
                  </div>
                )}

                {/* Big Spin CTA Button */}
                <button
                  onClick={spinWheel}
                  disabled={isSpinning || wheelIdeas.length === 0}
                  className="w-full rounded-2xl bg-[#6C40E5] py-3.5 font-['Satoshi'] text-sm font-extrabold text-white shadow-[0_10px_25px_rgba(108,64,229,0.28)] transition-all hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(108,64,229,0.35)] disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    backgroundImage:
                      "radial-gradient(44.33% 44.33% at 50.2% 0%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.00) 100%), #6C40E5",
                  }}
                >
                  {isSpinning ? (
                    <>
                      <span className="animate-spin text-lg">🌀</span>
                      <span>Sedang Memutar Roda...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">🎯</span>
                      <span>PUTAR SEKARANG</span>
                    </>
                  )}
                </button>

                {/* Place Ideas Manager */}
                <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-['Satoshi'] text-xs font-bold uppercase tracking-wider text-gray-500">
                      Pilihan Tempat ({wheelIdeas.length})
                    </span>
                  </div>

                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 text-xs scrollbar-thin">
                    {wheelIdeas.map((idea) => (
                      <div
                        key={idea.id}
                        className="flex items-center justify-between rounded-xl bg-white border border-gray-200/70 px-3 py-1.5 font-['Satoshi'] text-gray-700 shadow-2xs"
                      >
                        <span className="truncate pr-2 font-medium">{idea.place_name}</span>
                        <button
                          onClick={() => handleDeleteIdea(idea.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                          title="Hapus pilihan ini"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddIdea} className="mt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="+ Ide tempat date baru..."
                      value={newIdeaText}
                      onChange={(e) => setNewIdeaText(e.target.value)}
                      className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 font-['Satoshi'] text-xs text-gray-800 placeholder-gray-400 focus:border-[#6C40E5] focus:ring-2 focus:ring-[#6C40E5]/15 focus:outline-none transition-all"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-[#6C40E5] px-3.5 py-2 font-['Satoshi'] text-xs font-bold text-white hover:bg-[#5930c8] transition-colors"
                    >
                      Tambah
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: BUAT AGENDA DATE BARU - REDESIGNED
         ========================================================= */}
      {showNewPlanModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[28px] bg-white border border-[#E9E4F5] p-6 sm:p-8 text-gray-800 shadow-[0_25px_70px_rgba(108,64,229,0.18)] animate-slide-up scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent">
            {/* Header with pill */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-[#6C40E5] font-['Satoshi'] text-[11px] font-bold uppercase tracking-wider mb-1.5">
                  <span>💌</span> Rencana Kencan Baru
                </div>
                <h3 className="font-['Satoshi'] text-2xl font-extrabold text-gray-900 tracking-tight">
                  Buat Agenda Date
                </h3>
              </div>
              <button
                onClick={() => setShowNewPlanModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="mt-6 space-y-5 font-['Satoshi']">
              {/* Judul */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Judul Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nonton bioskop, potong rambut, dan jajan street food"
                  value={newPlanForm.title}
                  onChange={(e) =>
                    setNewPlanForm({ ...newPlanForm, title: e.target.value })
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-[#FAFAFD] px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-[#6C40E5] focus:ring-4 focus:ring-[#6C40E5]/10 focus:outline-none transition-all"
                />
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Keterangan / Deskripsi Singkat
                </label>
                <input
                  type="text"
                  placeholder="e.g. Quality time berdua keliling Malang seharian..."
                  value={newPlanForm.description}
                  onChange={(e) =>
                    setNewPlanForm({ ...newPlanForm, description: e.target.value })
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-[#FAFAFD] px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-[#6C40E5] focus:ring-4 focus:ring-[#6C40E5]/10 focus:outline-none transition-all"
                />
              </div>

              {/* Tanggal & Lokasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Tanggal
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={newPlanForm.date}
                      onChange={(e) =>
                        setNewPlanForm({ ...newPlanForm, date: e.target.value })
                      }
                      className="w-full rounded-2xl border border-gray-200 bg-[#FAFAFD] px-4 py-2.5 text-sm text-gray-800 focus:bg-white focus:border-[#6C40E5] focus:ring-4 focus:ring-[#6C40E5]/10 focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Kota / Lokasi
                  </label>
                  <input
                    type="text"
                    value={newPlanForm.location}
                    onChange={(e) =>
                      setNewPlanForm({ ...newPlanForm, location: e.target.value })
                    }
                    placeholder="e.g. Malang"
                    className="w-full rounded-2xl border border-gray-200 bg-[#FAFAFD] px-4 py-2.5 text-sm text-gray-800 focus:bg-white focus:border-[#6C40E5] focus:ring-4 focus:ring-[#6C40E5]/10 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Kategori (Interactive Chips) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                  Kategori Date
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const isSelected = newPlanForm.category === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() =>
                          setNewPlanForm({ ...newPlanForm, category: cat.id })
                        }
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${isSelected
                          ? "bg-[#6C40E5] text-white shadow-sm ring-2 ring-purple-300"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status (Interactive Chips) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                  Status Agenda
                </label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((st) => {
                    const isSelected = newPlanForm.status === st.id;
                    return (
                      <button
                        type="button"
                        key={st.id}
                        onClick={() =>
                          setNewPlanForm({ ...newPlanForm, status: st.id })
                        }
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${isSelected
                          ? "bg-[#6C40E5] text-white shadow-sm ring-2 ring-purple-300"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                      >
                        <span>{st.icon}</span>
                        <span>{st.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={() => setShowNewPlanModal(false)}
                  className="rounded-2xl border border-gray-200 px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-[#6C40E5] px-6 py-2.5 text-xs font-bold text-white shadow-[0_10px_20px_rgba(108,64,229,0.25)] hover:-translate-y-0.5 transition-all"
                  style={{
                    backgroundImage:
                      "radial-gradient(44.33% 44.33% at 50.2% 0%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.00) 100%), #6C40E5",
                  }}
                >
                  Buat Agenda Sekarang ✨
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: TAMBAH TEMPAT / AKTIVITAS STOP - REDESIGNED
         ========================================================= */}
      {showNewStopModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[28px] bg-white border border-[#E9E4F5] p-6 sm:p-8 text-gray-800 shadow-[0_25px_70px_rgba(108,64,229,0.18)] animate-slide-up scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent">
            <div className="flex items-start justify-between border-b border-gray-100 pb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-[#6C40E5] font-['Satoshi'] text-[11px] font-bold uppercase tracking-wider mb-1.5">
                  <span>📍</span> Rute Perjalanan
                </div>
                <h3 className="font-['Satoshi'] text-2xl font-extrabold text-gray-900 tracking-tight">
                  Tambah Tempat / Aktivitas
                </h3>
              </div>
              <button
                onClick={() => setShowNewStopModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStop} className="mt-6 space-y-5 font-['Satoshi']">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Nama Tempat / Aktivitas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lenscape Studio Photobooth / Jajan Street Food"
                  value={newStopForm.title}
                  onChange={(e) =>
                    setNewStopForm({ ...newStopForm, title: e.target.value })
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-[#FAFAFD] px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-[#6C40E5] focus:ring-4 focus:ring-[#6C40E5]/10 focus:outline-none transition-all"
                />
              </div>

              {/* Preset Activity Chips */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                  Jenis Aktivitas
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {ACTIVITY_PRESETS.map((act) => {
                    const isSelected = newStopForm.activity_type === act.id;
                    return (
                      <button
                        type="button"
                        key={act.id}
                        onClick={() =>
                          setNewStopForm({ ...newStopForm, activity_type: act.id })
                        }
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${isSelected
                          ? "bg-[#6C40E5] text-white shadow-xs"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                      >
                        <span>{act.icon}</span>
                        <span>{act.label}</span>
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  placeholder="Atau tulis jenis aktivitas custom..."
                  value={newStopForm.activity_type}
                  onChange={(e) =>
                    setNewStopForm({ ...newStopForm, activity_type: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-200 bg-[#FAFAFD] px-3.5 py-2 text-xs text-gray-800 focus:bg-white focus:border-[#6C40E5] focus:outline-none"
                />
              </div>

              {/* Jadwal Jam 24-Jam (WIB) */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      Jam Mulai (WIB)
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="12:00"
                        value={newStopForm.time_start}
                        onChange={(e) =>
                          setNewStopForm({
                            ...newStopForm,
                            time_start: formatTimeInput(e.target.value),
                          })
                        }
                        className="w-full rounded-2xl border border-gray-200 bg-[#FAFAFD] px-4 py-2.5 pr-14 text-sm font-bold text-gray-800 placeholder-gray-400 focus:bg-white focus:border-[#6C40E5] focus:ring-4 focus:ring-[#6C40E5]/10 focus:outline-none transition-all"
                      />
                      <span className="absolute right-3 text-[11px] font-bold text-[#6C40E5] bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 pointer-events-none">
                        WIB
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      Jam Selesai (WIB)
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="13:30"
                        value={newStopForm.time_end}
                        onChange={(e) =>
                          setNewStopForm({
                            ...newStopForm,
                            time_end: formatTimeInput(e.target.value),
                          })
                        }
                        className="w-full rounded-2xl border border-gray-200 bg-[#FAFAFD] px-4 py-2.5 pr-14 text-sm font-bold text-gray-800 placeholder-gray-400 focus:bg-white focus:border-[#6C40E5] focus:ring-4 focus:ring-[#6C40E5]/10 focus:outline-none transition-all"
                      />
                      <span className="absolute right-3 text-[11px] font-bold text-[#6C40E5] bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 pointer-events-none">
                        WIB
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Presets & Duration Helper */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 text-[11px] font-['Satoshi']">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-gray-400 font-medium">Preset:</span>
                    {["10:00", "12:00", "13:30", "16:00", "19:00"].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() =>
                          setNewStopForm((prev) => ({
                            ...prev,
                            time_start: preset,
                            time_end: addMinutesToTime(preset, 90),
                          }))
                        }
                        className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-[#6C40E5] transition-colors font-medium"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-gray-400 font-medium">Durasi:</span>
                    {[
                      { label: "+30m", mins: 30 },
                      { label: "+1j", mins: 60 },
                      { label: "+1.5j", mins: 90 },
                      { label: "+2j", mins: 120 },
                    ].map((dur) => (
                      <button
                        type="button"
                        key={dur.label}
                        onClick={() =>
                          setNewStopForm((prev) => ({
                            ...prev,
                            time_end: addMinutesToTime(
                              prev.time_start || "12:00",
                              dur.mins
                            ),
                          }))
                        }
                        className="px-2 py-0.5 rounded-md bg-purple-50 text-[#6C40E5] border border-purple-100 hover:bg-purple-100 transition-colors font-bold text-[10px]"
                      >
                        {dur.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Catatan Perjalanan (Transport)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 30 min motorcycle / Jalan santai 5 menit"
                  value={newStopForm.transport_note}
                  onChange={(e) =>
                    setNewStopForm({ ...newStopForm, transport_note: e.target.value })
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-[#FAFAFD] px-4 py-2.5 text-sm text-gray-800 focus:bg-white focus:border-[#6C40E5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Link Google Maps (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="https://maps.app.goo.gl/..."
                  value={newStopForm.maps_url}
                  onChange={(e) =>
                    setNewStopForm({ ...newStopForm, maps_url: e.target.value })
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-[#FAFAFD] px-4 py-2.5 text-sm text-gray-800 focus:bg-white focus:border-[#6C40E5] focus:outline-none"
                />
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={() => setShowNewStopModal(false)}
                  className="rounded-2xl border border-gray-200 px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-[#6C40E5] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:-translate-y-0.5 transition-transform"
                >
                  Tambahkan ke Timeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 4: REVIEW & MEMORI MODAL (SCREENSHOT 4) - REDESIGNED
         ========================================================= */}
      {showReviewModal && activeReviewStop && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[28px] bg-white border border-[#E9E4F5] p-6 sm:p-8 text-gray-800 shadow-[0_25px_70px_rgba(108,64,229,0.18)] animate-slide-up scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent">
            <div className="flex items-start justify-between border-b border-gray-100 pb-5">
              <div>
                <span className="font-['Satoshi'] text-[11px] font-bold uppercase tracking-wider text-[#6C40E5]">
                  {activeReviewStop.activity_type || "Review Tempat"}
                </span>
                <h3 className="font-['Satoshi'] text-2xl font-extrabold text-gray-900 tracking-tight">
                  {activeReviewStop.title}
                </h3>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="mt-6 space-y-5 font-['Satoshi']">
              {/* Star Rating Interactive */}
              <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-4 text-center">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                  Rating Pengalaman di Tempat Ini
                </label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className={`text-3xl sm:text-4xl transition-all duration-200 hover:scale-125 ${star <= reviewForm.rating ? "text-amber-400 drop-shadow-sm" : "text-gray-200"
                        }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs font-bold text-[#6C40E5]">
                  {reviewForm.rating === 5
                    ? "Sempurna & Berkesan Banget! 🥰"
                    : reviewForm.rating === 4
                      ? "Seru & Asyik Banget! 😊"
                      : reviewForm.rating === 3
                        ? "Cukup Oke / Lumayan 👍"
                        : "Biasa Aja / Kurang Suka 😕"}
                </p>
              </div>

              {/* Would Go Again? Card Options */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                  Would Go Again? (Mau Balik Lagi ke Sini?)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: "Yes, definitely! ❤️", label: "Pasti Balik! ❤️" },
                    { id: "Maybe 🤔", label: "Boleh Aja 🤔" },
                    { id: "Not really 🙅", label: "Cukup Sekali 🙅" },
                  ].map((opt) => {
                    const isSelected = reviewForm.would_go_again === opt.id;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() =>
                          setReviewForm({ ...reviewForm, would_go_again: opt.id })
                        }
                        className={`rounded-xl p-3 text-xs font-bold transition-all ${isSelected
                          ? "bg-[#6C40E5] text-white shadow-sm ring-2 ring-purple-300"
                          : "bg-[#FAFAFD] border border-gray-200 text-gray-600 hover:bg-gray-100"
                          }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* What did we order */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  What Did We Order? (Pesan apa aja?)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Matcha Latte, Popcorn Caramel, Ramen Tori Paitan..."
                  value={reviewForm.what_did_we_order}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, what_did_we_order: e.target.value })
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-[#FAFAFD] px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-[#6C40E5] focus:outline-none"
                />
              </div>

              {/* Favorite Moment */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Favorite Moment
                </label>
                <textarea
                  rows={2}
                  placeholder="Momen paling lucu, manis, atau berkesan pas di sini..."
                  value={reviewForm.favorite_moment}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, favorite_moment: e.target.value })
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-[#FAFAFD] px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-[#6C40E5] focus:outline-none"
                />
              </div>

              {/* Memory Note */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Memory & Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="A personal memory from this stop..."
                  value={reviewForm.memory_note}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, memory_note: e.target.value })
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-[#FAFAFD] px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-[#6C40E5] focus:outline-none"
                />
              </div>

              {/* Foto Kenangan */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                  Foto Kenangan
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {reviewForm.photos.map((photo, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={photo}
                        alt="Uploaded"
                        className="h-16 w-16 rounded-xl object-cover border border-purple-200 shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setReviewForm({
                            ...reviewForm,
                            photos: reviewForm.photos.filter((_, idx) => idx !== i),
                          })
                        }
                        className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50/60 text-xs font-bold text-[#6C40E5] hover:bg-purple-100/60 transition-colors">
                    <span>+ Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      className="hidden"
                    />
                  </label>
                </div>
                {uploadingPhoto && (
                  <p className="mt-1.5 text-xs text-[#6C40E5]">Mengunggah foto kenangan...</p>
                )}
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="rounded-2xl border border-gray-200 px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-[#6C40E5] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:-translate-y-0.5 transition-transform"
                >
                  Simpan Review & Foto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Preview Lightbox */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md cursor-pointer animate-fade-in"
          onClick={() => setPreviewPhoto(null)}
        >
          <img
            src={previewPhoto}
            alt="Enlarged preview"
            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}

export default Agenda;

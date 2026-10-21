import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
import { downloadIcsFile, createGoogleCalendarUrl } from "../lib/calendarHelper";
import {
  CalendarIcon,
  ClockIcon,
  HeartIcon,
  SparklesIcon,
  MapPinIcon,
  CompassIcon,
  PlayIcon,
  CheckIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  StarIcon,
  CameraIcon,
  UtensilsIcon,
  CoffeeIcon,
  FilmIcon,
  BikeIcon,
  WalkIcon,
  BookOpenIcon,
  PlusIcon,
  XIcon,
  RotateCwIcon,
  MessageSquareHeartIcon,
} from "../components/icons";

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

function getDurationLabel(start, end) {
  if (!start || !end || !start.includes(":") || !end.includes(":")) return "";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return "";
  let totalMin = eh * 60 + em - (sh * 60 + sm);
  if (totalMin < 0) totalMin += 24 * 60;
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours > 0 && mins > 0) return `${hours}j ${mins}m`;
  if (hours > 0) return `${hours} jam`;
  return `${mins} menit`;
}

const CATEGORY_OPTIONS = [
  { id: "Casual", label: "Casual", IconComponent: CoffeeIcon },
  { id: "Romantic", label: "Romantic", IconComponent: HeartIcon },
  { id: "Culinary", label: "Kuliner", IconComponent: UtensilsIcon },
  { id: "Cinema", label: "Bioskop", IconComponent: FilmIcon },
  { id: "Adventure", label: "Jalan / Seru", IconComponent: CompassIcon },
];

const STATUS_OPTIONS = [
  { id: "upcoming", label: "Upcoming", IconComponent: ClockIcon },
  { id: "ongoing", label: "Sedang Berjalan", IconComponent: PlayIcon },
  { id: "completed", label: "Selesai", IconComponent: CheckCircleIcon },
];

const ACTIVITY_PRESETS = [
  { id: "Photobooth", label: "Photobooth", IconComponent: CameraIcon },
  { id: "Kuliner", label: "Kuliner / Makan", IconComponent: UtensilsIcon },
  { id: "Cafe", label: "Nongkrong Cafe", IconComponent: CoffeeIcon },
  { id: "Bioskop", label: "Nonton Bioskop", IconComponent: FilmIcon },
  { id: "OTW/Perjalanan", label: "OTW / Perjalanan", IconComponent: BikeIcon },
  { id: "Jalan Santai", label: "Jalan Santai", IconComponent: WalkIcon },
  { id: "Custom activity", label: "Aktivitas Lain", IconComponent: SparklesIcon },
];

const WHEEL_PALETTE = [
  "#6C40E5", // Signature Violet
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#F43F5E", // Rose
  "#0284C7", // Sky
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#0D9488", // Teal
];

function Agenda() {
  const [datePlans, setDatePlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stopFilter, setStopFilter] = useState("all"); // 'all' | 'pending' | 'completed'

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
  const loadData = useCallback(async () => {
    const { data } = await getDatePlans();
    if (data) {
      setDatePlans(data);
      if (data.length > 0) {
        setSelectedPlanId((prev) => (prev ? prev : data[0].id));
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      const { data } = await getDatePlans();
      if (!ignore) {
        setDatePlans(data || []);
        if (data && data.length > 0) {
          setSelectedPlanId((prev) => (prev ? prev : data[0].id));
        }
        setLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  // Active Plan
  const activePlan = useMemo(() => {
    return (
      datePlans.find((p) => p.id === selectedPlanId) ||
      datePlans[0] ||
      null
    );
  }, [datePlans, selectedPlanId]);

  // Stops Progress Metrics
  const stopsProgress = useMemo(() => {
    if (!activePlan || !activePlan.date_stops || activePlan.date_stops.length === 0) {
      return { total: 0, completed: 0, ongoing: 0, percentage: 0 };
    }
    const total = activePlan.date_stops.length;
    const completed = activePlan.date_stops.filter((s) => s.status === "completed").length;
    const ongoing = activePlan.date_stops.filter((s) => s.status === "ongoing").length;
    const percentage = Math.round((completed / total) * 100);
    return { total, completed, ongoing, percentage };
  }, [activePlan]);

  // Filtered Stops
  const filteredStops = useMemo(() => {
    if (!activePlan || !activePlan.date_stops) return [];
    if (stopFilter === "pending") {
      return activePlan.date_stops.filter((s) => s.status !== "completed");
    }
    if (stopFilter === "completed") {
      return activePlan.date_stops.filter((s) => s.status === "completed");
    }
    return activePlan.date_stops;
  }, [activePlan, stopFilter]);

  // Optimistic in-place updater (never triggers page unmount or scroll jumps)
  const updateStopLocally = useCallback((stopId, updates) => {
    setDatePlans((prevPlans) =>
      prevPlans.map((plan) => {
        if (!plan.date_stops) return plan;
        return {
          ...plan,
          date_stops: plan.date_stops.map((s) =>
            s.id === stopId ? { ...s, ...updates } : s
          ),
        };
      })
    );
  }, []);

  // Tracking Actions with instant optimistic state update
  const handleStartStop = async (stop) => {
    const timeNow = getCurrentTimeStr();
    // 1. Update UI instantly without scroll jump or loading flash
    updateStopLocally(stop.id, {
      status: "ongoing",
      actual_started_at: timeNow,
    });
    // 2. Persist in background
    await updateStopStatus(stop.id, "ongoing", { actual_started_at: timeNow });
  };

  const handleFinishStop = async (stop) => {
    const timeNow = getCurrentTimeStr();
    // 1. Update UI instantly without scroll jump or loading flash
    updateStopLocally(stop.id, {
      status: "completed",
      actual_finished_at: timeNow,
    });
    // 2. Persist in background
    await updateStopStatus(stop.id, "completed", { actual_finished_at: timeNow });

    // 3. Cek apakah SELURUH acara pada agenda date ini sudah selesai
    const currentStops = activePlan?.date_stops || [];
    const otherStops = currentStops.filter((s) => s.id !== stop.id);
    const areAllStopsFinished =
      currentStops.length > 0 &&
      otherStops.every((s) => s.status === "completed" || s.status === "skipped");

    // Popup review HANYA keluar otomatis jika seluruh rangkaian acara sudah selesai!
    if (areAllStopsFinished) {
      if (activePlan && activePlan.status !== "completed") {
        saveDatePlan({ ...activePlan, status: "completed" });
        setDatePlans((prevPlans) =>
          prevPlans.map((p) =>
            p.id === activePlan.id ? { ...p, status: "completed" } : p
          )
        );
      }
      openReview({ ...stop, status: "completed", actual_finished_at: timeNow });
    }
  };

  const handleSkipStop = async (stop) => {
    // 1. Update UI instantly
    updateStopLocally(stop.id, { status: "skipped" });
    // 2. Persist in background
    await updateStopStatus(stop.id, "skipped");
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
    // 1. Update UI instantly without scroll jump
    updateStopLocally(activeReviewStop.id, {
      rating: reviewForm.rating,
      would_go_again: reviewForm.would_go_again,
      what_did_we_order: reviewForm.what_did_we_order,
      favorite_moment: reviewForm.favorite_moment,
      memory_note: reviewForm.memory_note,
      photos: reviewForm.photos,
    });
    setShowReviewModal(false);
    // 2. Persist in background
    await saveStopReview(activeReviewStop.id, reviewForm);
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
    // 1. Remove stop locally immediately
    setDatePlans((prevPlans) =>
      prevPlans.map((plan) => ({
        ...plan,
        date_stops: (plan.date_stops || []).filter((s) => s.id !== id),
      }))
    );
    // 2. Persist in background
    await deleteDateStop(id);
  };

  // Export Date Plan to .ics Calendar File
  const handleExportPlanIcs = () => {
    if (!activePlan) return;
    const planDate = new Date(activePlan.date);
    let startHour = 10;
    let startMin = 0;

    if (activePlan.date_stops && activePlan.date_stops.length > 0) {
      const firstStart = activePlan.date_stops[0].time_start;
      if (firstStart && firstStart.includes(":")) {
        const [h, m] = firstStart.split(":").map(Number);
        if (!isNaN(h)) startHour = h;
        if (!isNaN(m)) startMin = m;
      }
    }

    const startDate = new Date(
      planDate.getFullYear(),
      planDate.getMonth(),
      planDate.getDate(),
      startHour,
      startMin,
      0
    );
    const endDate = new Date(startDate.getTime() + 6 * 60 * 60 * 1000);

    const stopsText = (activePlan.date_stops || [])
      .map(
        (s, i) =>
          `${i + 1}. [${s.time_start || "??:??"} - ${s.time_end || "??:??"}] ${s.title} (${s.activity_type || "Aktivitas"})`
      )
      .join("\n");

    const description = `${activePlan.description || "Agenda kencan spesial berdua."}\n\nRute Itinerary:\n${stopsText}\n\nDibuat dengan penuh cinta untuk Rara.`;

    downloadIcsFile({
      title: `Date: ${activePlan.title} - Rara & Faiz`,
      description,
      location: activePlan.location || "Malang",
      startDate,
      endDate,
      filename: `date-${activePlan.title.toLowerCase().replace(/\s+/g, "-")}.ics`,
    });
  };

  // Open Date Plan in Google Calendar
  const handleOpenPlanGoogleCalendar = () => {
    if (!activePlan) return;
    const planDate = new Date(activePlan.date);
    let startHour = 10;
    let startMin = 0;

    if (activePlan.date_stops && activePlan.date_stops.length > 0) {
      const firstStart = activePlan.date_stops[0].time_start;
      if (firstStart && firstStart.includes(":")) {
        const [h, m] = firstStart.split(":").map(Number);
        if (!isNaN(h)) startHour = h;
        if (!isNaN(m)) startMin = m;
      }
    }

    const startDate = new Date(
      planDate.getFullYear(),
      planDate.getMonth(),
      planDate.getDate(),
      startHour,
      startMin,
      0
    );
    const endDate = new Date(startDate.getTime() + 6 * 60 * 60 * 1000);

    const stopsText = (activePlan.date_stops || [])
      .map(
        (s, i) =>
          `${i + 1}. [${s.time_start || "??:??"} - ${s.time_end || "??:??"}] ${s.title} (${s.activity_type || "Aktivitas"})`
      )
      .join("\n");

    const description = `${activePlan.description || "Agenda kencan spesial berdua."}\n\nRute Itinerary:\n${stopsText}\n\nDibuat dengan penuh cinta untuk Rara.`;

    const url = createGoogleCalendarUrl({
      title: `Date: ${activePlan.title} - Rara & Faiz`,
      description,
      location: activePlan.location || "Malang",
      startDate,
      endDate,
    });

    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Google Maps Helper for Stops
  const getMapsUrlForStop = (stop) => {
    if (stop.maps_url && stop.maps_url.trim()) return stop.maps_url.trim();
    const query = `${stop.title} ${activePlan?.location || "Malang"}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
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
  const renderWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || wheelIdeas.length === 0) return;
    const ctx = canvas.getContext("2d");
    const numSegments = wheelIdeas.length;
    const arc = (2 * Math.PI) / numSegments;
    const radius = canvas.width / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(spinRotationRef.current);

    for (let i = 0; i < numSegments; i++) {
      const angle = i * arc;
      ctx.beginPath();
      ctx.fillStyle = WHEEL_PALETTE[i % WHEEL_PALETTE.length];
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius - 4, angle, angle + arc);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.strokeStyle = "#ffffff40";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text along slice
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = 4;
      ctx.font = "bold 11px 'Satoshi', sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.rotate(angle + arc / 2);
      ctx.fillText(wheelIdeas[i].place_name.slice(0, 16), radius - 18, 0);
      ctx.restore();
    }

    ctx.restore();

    // Outer edge rim
    ctx.beginPath();
    ctx.arc(radius, radius, radius - 3, 0, 2 * Math.PI);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Center Hub
    ctx.beginPath();
    ctx.arc(radius, radius, 22, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.18)";
    ctx.shadowBlur = 8;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(radius, radius, 14, 0, 2 * Math.PI);
    ctx.fillStyle = "#6C40E5";
    ctx.fill();
  }, [wheelIdeas]);

  useEffect(() => {
    if (showWheelModal && wheelIdeas.length > 0) {
      renderWheel();
    }
  }, [showWheelModal, wheelIdeas, renderWheel]);

  // Spin Wheel Function
  const spinWheel = () => {
    if (isSpinning || wheelIdeas.length === 0) return;
    setIsSpinning(true);
    setWheelWinner(null);

    const extraRounds = 5 + Math.random() * 4;
    const randomAngle = Math.random() * 2 * Math.PI;
    const totalSpin = extraRounds * 2 * Math.PI + randomAngle;
    const duration = 4000;
    const startTime = performance.now();
    const initialRotation = spinRotationRef.current;

    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3.8);
      spinRotationRef.current = initialRotation + totalSpin * ease;

      renderWheel();

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
      <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-20">
        {/* Editorial Header */}
        <header className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-zinc-200/90 shadow-2xs mb-5">
            <span className="flex h-2 w-2 rounded-full bg-[#6C40E5] animate-ping" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 font-['Satoshi']">
              Date Planner & Itinerary
            </span>
            <span className="text-zinc-300">•</span>
            <span className="text-[11px] font-semibold text-[#6C40E5] font-['Satoshi']">
              Faiz & Rara
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 font-['Satoshi'] leading-tight">
            Agenda Date Kita
          </h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-600 max-w-xl mx-auto leading-relaxed font-['Satoshi']">
            Rute perjalanan kencan, jadwal aktivitas yang tersusun rapi, dan wadah untuk merekam memori manis setiap tempat yang kita singgahi.
          </p>
        </header>

        {/* Action Bar: Quick Tools */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-['Satoshi']">
              Rencana Kencan ({datePlans.length})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowWheelModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-purple-200/90 text-[#6C40E5] font-['Satoshi'] text-xs font-bold shadow-2xs hover:bg-purple-50 hover:border-[#6C40E5] transition-all"
            >
              <CompassIcon className="w-3.5 h-3.5 text-[#6C40E5]" />
              <span>Spin Wheel "Terserah"</span>
            </button>

            <button
              type="button"
              onClick={() => setShowNewPlanModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6C40E5] hover:bg-[#5B21B6] text-white font-['Satoshi'] text-xs font-bold shadow-xs transition-transform hover:-translate-y-0.5"
            >
              <PlusIcon className="w-3.5 h-3.5 text-white" />
              <span>Buat Date Baru</span>
            </button>
          </div>
        </div>

        {/* Date Selector Tabs */}
        {datePlans.length > 0 && (
          <div className="mb-8 flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
            {datePlans.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const stopCount = plan.date_stops ? plan.date_stops.length : 0;
              const completedCount = (plan.date_stops || []).filter(
                (s) => s.status === "completed"
              ).length;

              return (
                <button
                  type="button"
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`shrink-0 rounded-2xl px-4 py-2.5 text-left border transition-all font-['Satoshi'] ${isSelected
                    ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                    : "bg-white text-zinc-700 border-zinc-200/90 hover:border-purple-200 hover:text-zinc-900"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold truncate max-w-[150px]">
                      {plan.title}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${isSelected
                        ? "bg-white/20 text-white"
                        : "bg-zinc-100 text-zinc-600"
                        }`}
                    >
                      {completedCount}/{stopCount}
                    </span>
                  </div>
                  <p
                    className={`text-[11px] mt-0.5 ${isSelected ? "text-zinc-300" : "text-zinc-400"
                      }`}
                  >
                    {new Date(plan.date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    • {plan.location || "Malang"}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Notice Supabase Offline */}
        {!isSupabaseConfigured && (
          <div className="mb-6 rounded-2xl border border-purple-200/80 bg-purple-50/60 px-5 py-4 text-xs sm:text-sm text-purple-900 font-['Satoshi'] flex items-start gap-3">
            <span className="text-base shrink-0 mt-0.5">ℹ️</span>
            <div>
              <p className="font-semibold">Mode Simulasi Offline Aktif</p>
              <p className="text-purple-700 mt-0.5">
                Konfigurasi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di `.env.local` untuk menyimpan data permanen ke database Supabase.
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center font-['Satoshi'] text-sm text-zinc-500">
            <RotateCwIcon className="w-5 h-5 text-[#6C40E5] animate-spin inline-block mr-2" />
            Membuka rencana date...
          </div>
        ) : !activePlan ? (
          /* Empty State */
          <div className="my-12 rounded-3xl border border-zinc-200/90 bg-white p-10 text-center shadow-2xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-[#6C40E5]">
              <CalendarIcon className="w-7 h-7 text-[#6C40E5]" />
            </div>
            <h3 className="mt-4 font-['Satoshi'] text-xl font-bold text-zinc-900">
              Belum Ada Agenda Date
            </h3>
            <p className="mt-2 font-['Satoshi'] text-xs sm:text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
              Mulai rencanakan kencan spesial pertama untuk Rara, atau gunakan fitur Spin Wheel saat bingung menentukan tempat tujuan.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowWheelModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-50 border border-purple-200 px-5 py-2.5 font-['Satoshi'] text-xs font-bold text-[#6C40E5] hover:bg-purple-100 transition-colors"
              >
                <CompassIcon className="w-3.5 h-3.5 text-[#6C40E5]" />
                <span>Putar Roda Pilihan</span>
              </button>
              <button
                type="button"
                onClick={() => setShowNewPlanModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#6C40E5] hover:bg-[#5B21B6] px-5 py-2.5 font-['Satoshi'] text-xs font-bold text-white shadow-xs transition-transform hover:-translate-y-0.5"
              >
                <PlusIcon className="w-3.5 h-3.5 text-white" />
                <span>Rencanakan Date Baru</span>
              </button>
            </div>
          </div>
        ) : (
          /* Active Plan Hub */
          <div className="space-y-8">
            {/* Active Plan Overview Card */}
            <div className="rounded-3xl bg-white border border-zinc-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_20px_45px_-15px_rgba(108,64,229,0.06)] p-6 sm:p-8">
              {/* Meta Tags Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-['Satoshi'] text-[10px] font-extrabold uppercase tracking-wider ${activePlan.status === "completed"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : activePlan.status === "ongoing"
                        ? "bg-purple-50 text-[#6C40E5] border border-purple-200"
                        : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                      }`}
                  >
                    {activePlan.status === "ongoing" ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6C40E5] animate-ping" />
                        <span>Sedang Berjalan</span>
                      </>
                    ) : activePlan.status === "completed" ? (
                      <>
                        <CheckIcon className="w-3 h-3 text-emerald-600" />
                        <span>Selesai Dirayakan</span>
                      </>
                    ) : (
                      <>
                        <ClockIcon className="w-3 h-3 text-zinc-400" />
                        <span>Upcoming Date</span>
                      </>
                    )}
                  </span>

                  <span className="font-['Satoshi'] text-xs font-semibold text-[#6C40E5] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                    {activePlan.category || "Casual"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportPlanIcs}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-700 transition-colors font-['Satoshi']"
                    title="Simpan seluruh jadwal date ke Apple/Outlook/Google Calendar (.ics)"
                  >
                    <CalendarIcon className="w-3.5 h-3.5 text-zinc-500" />
                    <span>iCal (.ics)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenPlanGoogleCalendar}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/70 hover:bg-purple-100 px-2.5 py-1 text-[11px] font-bold text-[#6C40E5] transition-colors font-['Satoshi']"
                    title="Buka langsung di Google Calendar"
                  >
                    <span>Google Cal</span>
                    <ExternalLinkIcon className="w-3 h-3 text-[#6C40E5]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeletePlan(activePlan.id)}
                    className="font-['Satoshi'] text-xs text-red-500 hover:text-red-700 hover:underline transition-colors px-2 py-1"
                    title="Hapus Agenda Ini"
                  >
                    Hapus
                  </button>
                </div>
              </div>

              {/* Title & Description */}
              <div className="mt-5">
                <h2 className="font-['Satoshi'] text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 leading-tight">
                  {activePlan.title}
                </h2>
                {activePlan.description && (
                  <p className="mt-2 font-['Satoshi'] text-sm leading-relaxed text-zinc-600">
                    {activePlan.description}
                  </p>
                )}
              </div>

              {/* Location & Date Pills */}
              <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs text-zinc-600 font-['Satoshi']">
                <div className="inline-flex items-center gap-1.5 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200/80 font-medium">
                  <CalendarIcon className="w-3.5 h-3.5 text-[#6C40E5]" />
                  <span>{formatDateDisplay(activePlan.date)}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200/80 font-medium">
                  <MapPinIcon className="w-3.5 h-3.5 text-[#6C40E5]" />
                  <span>{activePlan.location || "Malang"}</span>
                </div>
              </div>

              {/* Progress Meter */}
              {stopsProgress.total > 0 && (
                <div className="mt-6 rounded-2xl bg-zinc-50 border border-zinc-200/70 p-4">
                  <div className="flex items-center justify-between text-xs font-['Satoshi'] mb-2">
                    <span className="font-bold text-zinc-700">
                      Progress Kencan Berdua
                    </span>
                    <span className="font-mono font-bold text-[#6C40E5]">
                      {stopsProgress.completed} dari {stopsProgress.total} Tempat Selesai ({stopsProgress.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-200/80 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#6C40E5] transition-all duration-500"
                      style={{ width: `${stopsProgress.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Note for Rara */}
              <div className="mt-6 rounded-2xl bg-gradient-to-r from-purple-50/70 via-pink-50/40 to-purple-50/70 border border-purple-100 p-4 text-left flex items-start gap-3">
                <MessageSquareHeartIcon className="w-4 h-4 text-[#6C40E5] shrink-0 mt-0.5" />
                <div>
                  <span className="font-['Satoshi'] text-[11px] font-extrabold uppercase tracking-wider text-[#6C40E5]">
                    Catatan untuk Rara
                  </span>
                  <p className="mt-1 font-['Satoshi'] text-xs sm:text-[13px] leading-relaxed text-zinc-700">
                    "Tugas Rara cuma dandan cantik dan siapin senyuman manis, jadwal dan tempatnya sudah Faiz siapin dengan rapi. Enjoy our date, sayang!"
                  </p>
                </div>
              </div>

              {/* CTAs Bar */}
              <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowNewStopModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#6C40E5] hover:bg-[#5B21B6] px-4 py-2.5 font-['Satoshi'] text-xs font-bold text-white shadow-xs transition-transform hover:-translate-y-0.5"
                >
                  <PlusIcon className="w-3.5 h-3.5 text-white" />
                  <span>Tambah Tempat / Aktivitas</span>
                </button>

                <Link
                  to="/jurnal"
                  className="inline-flex items-center gap-2 rounded-xl bg-white border border-zinc-200/90 hover:bg-zinc-50 px-4 py-2.5 font-['Satoshi'] text-xs font-bold text-zinc-700 transition-colors"
                >
                  <BookOpenIcon className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Buka Jurnal Kenangan</span>
                </Link>
              </div>
            </div>

            {/* Timeline Filter Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold font-['Satoshi'] text-zinc-900">
                  Rute & Jadwal Timeline
                </h3>
                <p className="text-xs text-zinc-500 font-['Satoshi'] mt-0.5">
                  Ikuti jadwal tempat per tempat secara real-time
                </p>
              </div>

              {/* Segmented control for stops */}
              <div className="inline-flex rounded-xl bg-zinc-100 p-1 border border-zinc-200/80 shadow-2xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setStopFilter("all")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all font-['Satoshi'] ${stopFilter === "all"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900"
                    }`}
                >
                  Semua Rute ({activePlan.date_stops ? activePlan.date_stops.length : 0})
                </button>
                <button
                  type="button"
                  onClick={() => setStopFilter("pending")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all font-['Satoshi'] ${stopFilter === "pending"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900"
                    }`}
                >
                  Belum Selesai
                </button>
                <button
                  type="button"
                  onClick={() => setStopFilter("completed")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all font-['Satoshi'] ${stopFilter === "completed"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900"
                    }`}
                >
                  Selesai & Review
                </button>
              </div>
            </div>

            {/* Timeline Itinerary Stepper */}
            <div className="relative space-y-6 pl-4 sm:pl-8">
              {/* Connecting line */}
              <div className="absolute left-[27px] top-6 bottom-6 w-[2px] bg-zinc-200 sm:left-[43px]" />

              {filteredStops.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center font-['Satoshi'] text-xs text-zinc-500">
                  {stopFilter === "completed"
                    ? "Belum ada aktivitas yang selesai di agenda date ini."
                    : stopFilter === "pending"
                      ? "Semua aktivitas pada agenda ini sudah selesai."
                      : "Belum ada rute tempat pada agenda ini. Klik '+ Tambah Tempat / Aktivitas' untuk mulai menyusun itinerary."}
                </div>
              ) : (
                filteredStops.map((stop, idx) => {
                  const isCompleted = stop.status === "completed";
                  const isOngoing = stop.status === "ongoing";
                  const isSkipped = stop.status === "skipped";
                  const durationLabel = getDurationLabel(
                    stop.time_start,
                    stop.time_end
                  );

                  return (
                    <div
                      key={stop.id}
                      className="relative flex items-start gap-4 sm:gap-6"
                    >
                      {/* Step Indicator Dot */}
                      <div
                        className={`relative z-10 flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all shadow-2xs ${isCompleted
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : isOngoing
                            ? "border-[#6C40E5] bg-[#6C40E5] text-white ring-4 ring-purple-100 animate-pulse"
                            : isSkipped
                              ? "border-zinc-300 bg-zinc-100 text-zinc-400"
                              : "border-purple-300 bg-white text-[#6C40E5]"
                          }`}
                      >
                        {isCompleted ? (
                          <CheckIcon className="w-3.5 h-3.5 text-white" />
                        ) : isOngoing ? (
                          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        ) : isSkipped ? (
                          <span className="text-xs font-bold">—</span>
                        ) : (
                          <span className="font-['Satoshi'] text-[11px] font-bold">
                            {idx + 1}
                          </span>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="w-full rounded-2xl bg-white border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-purple-300 hover:shadow-[0_10px_25px_-5px_rgba(108,64,229,0.08)] transition-all p-5 sm:p-6">
                        {/* Top row */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-['Satoshi'] text-[10px] font-extrabold uppercase tracking-wider ${isCompleted
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : isOngoing
                                  ? "bg-purple-50 text-[#6C40E5] border border-purple-200"
                                  : isSkipped
                                    ? "bg-zinc-100 text-zinc-500 border border-zinc-200"
                                    : "bg-purple-50/70 text-[#6C40E5] border border-purple-100"
                                }`}
                            >
                              {isOngoing ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#6C40E5] animate-ping" />
                                  <span>Sedang Di Sini</span>
                                </>
                              ) : isCompleted ? (
                                <>
                                  <CheckIcon className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>Selesai</span>
                                </>
                              ) : isSkipped ? (
                                <span>Dilewati</span>
                              ) : (
                                <span>Jadwal</span>
                              )}
                            </span>

                            {(stop.time_start || stop.time_end) && (
                              <span className="font-mono text-xs font-bold text-zinc-800 tabular-nums">
                                {stop.time_start
                                  ? stop.time_start.replace(/wib/i, "").trim()
                                  : "??:??"}{" "}
                                –{" "}
                                {stop.time_end
                                  ? stop.time_end.replace(/wib/i, "").trim()
                                  : "??:??"}{" "}
                                WIB
                                {durationLabel && (
                                  <span className="ml-1 text-[11px] font-normal text-zinc-400 font-['Satoshi']">
                                    ({durationLabel})
                                  </span>
                                )}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={getMapsUrlForStop(stop)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-zinc-50 hover:bg-zinc-100 px-2.5 py-1 font-['Satoshi'] text-[11px] font-bold text-zinc-700 transition-colors"
                              title="Buka lokasi di Google Maps"
                            >
                              <MapPinIcon className="w-3 h-3 text-zinc-500" />
                              <span>Open Maps</span>
                              <ExternalLinkIcon className="w-2.5 h-2.5 text-zinc-400" />
                            </a>

                            <button
                              type="button"
                              onClick={() => handleDeleteStop(stop.id)}
                              className="text-xs text-zinc-300 hover:text-red-500 transition-colors p-1"
                              title="Hapus aktivitas ini"
                            >
                              <XIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title & Activity Type */}
                        <div className="mt-3">
                          <h4 className="font-['Satoshi'] text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
                            {stop.title}
                          </h4>
                          <p className="font-['Satoshi'] text-xs font-medium text-zinc-500 mt-0.5">
                            {stop.activity_type || "Custom activity"}
                          </p>
                        </div>

                        {/* Meta: Started, Finished, Transit */}
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-600 font-['Satoshi']">
                          {stop.actual_started_at && (
                            <span className="bg-zinc-50 border border-zinc-200/80 px-2.5 py-1 rounded-lg">
                              Mulai:{" "}
                              <strong className="text-zinc-900 font-mono">
                                {stop.actual_started_at}
                              </strong>
                            </span>
                          )}
                          {stop.actual_finished_at && (
                            <span className="bg-zinc-50 border border-zinc-200/80 px-2.5 py-1 rounded-lg">
                              Selesai:{" "}
                              <strong className="text-zinc-900 font-mono">
                                {stop.actual_finished_at}
                              </strong>
                            </span>
                          )}
                          {stop.transport_note && (
                            <span className="inline-flex items-center gap-1.5 text-[#6C40E5] font-semibold bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                              <BikeIcon className="w-3.5 h-3.5 text-[#6C40E5]" />
                              <span>{stop.transport_note}</span>
                            </span>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3.5">
                          {!isCompleted && !isOngoing && (
                            <button
                              type="button"
                              onClick={() => handleStartStop(stop)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 border border-purple-200 px-3.5 py-1.5 font-['Satoshi'] text-xs font-bold text-[#6C40E5] hover:bg-purple-100 transition-colors"
                            >
                              <PlayIcon className="w-3 h-3 text-[#6C40E5]" />
                              <span>Mulai Aktivitas</span>
                            </button>
                          )}

                          {isOngoing && (
                            <button
                              type="button"
                              onClick={() => handleFinishStop(stop)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-3.5 py-1.5 font-['Satoshi'] text-xs font-bold shadow-xs transition-colors"
                            >
                              <CheckIcon className="w-3.5 h-3.5 text-white" />
                              <span>Selesai Sekarang ({getCurrentTimeStr()})</span>
                            </button>
                          )}

                          {!isCompleted && !isSkipped && (
                            <button
                              type="button"
                              onClick={() => handleSkipStop(stop)}
                              className="rounded-xl bg-zinc-50 px-2.5 py-1.5 font-['Satoshi'] text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                            >
                              Lewati
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openReview(stop)}
                            className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-purple-200/90 bg-purple-50/70 hover:bg-[#6C40E5] hover:text-white px-3.5 py-1.5 font-['Satoshi'] text-xs font-bold text-[#6C40E5] transition-all shadow-2xs"
                          >
                            <StarIcon className="w-3.5 h-3.5" />
                            <span>
                              {stop.rating
                                ? "Lihat / Edit Review"
                                : "Tulis Review & Foto"}
                            </span>
                          </button>
                        </div>

                        {/* Completed Review Showcase Card */}
                        {(stop.rating ||
                          stop.favorite_moment ||
                          stop.what_did_we_order ||
                          (stop.photos && stop.photos.length > 0)) && (
                            <div className="mt-4 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/40 via-white to-pink-50/20 p-4 text-xs text-zinc-700 font-['Satoshi']">
                              {stop.rating && (
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-1.5">
                                    <div className="flex text-amber-400 gap-0.5">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <StarIcon
                                          key={i}
                                          filled={i < stop.rating}
                                          className="w-3.5 h-3.5 text-amber-400"
                                        />
                                      ))}
                                    </div>
                                    <span className="font-bold text-zinc-900 ml-1">
                                      {stop.rating}.0
                                    </span>
                                  </div>

                                  {stop.would_go_again && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white border border-purple-200 px-2.5 py-0.5 text-[10px] font-bold text-[#6C40E5] shadow-2xs">
                                      <HeartIcon filled className="w-2.5 h-2.5 text-rose-500" />
                                      <span>{stop.would_go_again}</span>
                                    </span>
                                  )}
                                </div>
                              )}

                              {stop.what_did_we_order && (
                                <p className="mt-1 text-zinc-600">
                                  <span className="font-semibold text-zinc-900">
                                    Pesan apa:
                                  </span>{" "}
                                  {stop.what_did_we_order}
                                </p>
                              )}

                              {stop.favorite_moment && (
                                <p className="mt-1.5 text-zinc-800">
                                  <span className="font-semibold text-[#6C40E5]">
                                    Fav moment:
                                  </span>{" "}
                                  "{stop.favorite_moment}"
                                </p>
                              )}

                              {stop.memory_note && (
                                <p className="mt-1.5 italic text-zinc-500 leading-relaxed">
                                  &ldquo;{stop.memory_note}&rdquo;
                                </p>
                              )}

                              {/* Photo Polaroid Strip */}
                              {stop.photos && stop.photos.length > 0 && (
                                <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                                  {stop.photos.map((img, photoIdx) => (
                                    <div
                                      key={photoIdx}
                                      onClick={() => setPreviewPhoto(img)}
                                      className="relative group shrink-0 cursor-pointer"
                                    >
                                      <img
                                        src={img}
                                        alt="Date memory"
                                        className="h-18 w-18 rounded-xl object-cover border border-purple-200/80 shadow-2xs group-hover:scale-105 group-hover:shadow-md transition-all"
                                      />
                                      <span className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/30 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        <CameraIcon className="w-4 h-4 text-white" />
                                      </span>
                                    </div>
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
          MODAL 1: SPIN WHEEL MODAL ("TERSERAH" PICKER)
         ========================================================= */}
      {showWheelModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setShowWheelModal(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 text-zinc-800 shadow-[0_25px_70px_rgba(0,0,0,0.2)] animate-slide-up scrollbar-thin"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-[#6C40E5] font-['Satoshi'] text-[11px] font-bold uppercase tracking-wider mb-1">
                  <CompassIcon className="w-3.5 h-3.5 text-[#6C40E5]" />
                  <span>Solusi Saat Rara Menjawab "Terserah"</span>
                </div>
                <h3 className="font-['Satoshi'] text-2xl font-extrabold text-zinc-900 tracking-tight">
                  Spin Wheel Destinasi Date
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWheelModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Grid layout */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Wheel Canvas */}
              <div className="relative flex flex-col items-center justify-center py-2">
                {/* Pointer Needle */}
                <div className="absolute top-0 z-30 flex flex-col items-center filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.25)]">
                  <div className="w-0 h-0 border-x-[11px] border-x-transparent border-t-[18px] border-t-[#6C40E5]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 -mt-1.5 border border-white" />
                </div>

                <div className="relative p-1.5 rounded-full bg-zinc-100 shadow-md border border-zinc-200">
                  <canvas
                    ref={canvasRef}
                    width={280}
                    height={280}
                    className="rounded-full"
                  />
                </div>

                <p className="mt-3 font-['Satoshi'] text-[11px] text-zinc-400 text-center">
                  Putar roda untuk menentukan tempat kencan hari ini
                </p>
              </div>

              {/* Controls & Winner Banner */}
              <div className="flex flex-col space-y-4">
                {wheelWinner ? (
                  <div className="rounded-2xl border-2 border-[#6C40E5] bg-gradient-to-br from-purple-50 via-white to-pink-50/40 p-4 text-center shadow-xs">
                    <div className="inline-flex items-center gap-1 font-['Satoshi'] text-xs font-bold uppercase tracking-wider text-[#6C40E5]">
                      <SparklesIcon className="w-3.5 h-3.5 text-[#6C40E5]" />
                      <span>Destinasi Terpilih</span>
                    </div>
                    <h4 className="mt-1 font-['Satoshi'] text-xl sm:text-2xl font-extrabold text-zinc-900">
                      {wheelWinner.place_name}
                    </h4>
                    <p className="mt-1 text-xs text-zinc-500 font-['Satoshi']">
                      Siap berangkat ke sini bersama Faiz?
                    </p>
                    <button
                      type="button"
                      onClick={handleAddWinnerToTimeline}
                      className="mt-3 inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-[#6C40E5] hover:bg-[#5B21B6] py-2.5 font-['Satoshi'] text-xs font-bold text-white shadow-xs transition-colors"
                    >
                      <PlusIcon className="w-3.5 h-3.5 text-white" />
                      <span>Tambah ke Timeline Date</span>
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-center">
                    <p className="font-['Satoshi'] text-sm font-bold text-zinc-800">
                      Belum diputar
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 font-['Satoshi']">
                      Klik tombol ungu di bawah untuk memutar rodanya secara acak.
                    </p>
                  </div>
                )}

                {/* Big Spin CTA Button */}
                <button
                  type="button"
                  onClick={spinWheel}
                  disabled={isSpinning || wheelIdeas.length === 0}
                  className="w-full rounded-2xl bg-[#6C40E5] hover:bg-[#5B21B6] py-3.5 font-['Satoshi'] text-sm font-extrabold text-white shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSpinning ? (
                    <>
                      <RotateCwIcon className="w-4 h-4 animate-spin text-white" />
                      <span>Sedang Memutar Roda...</span>
                    </>
                  ) : (
                    <>
                      <CompassIcon className="w-4 h-4 text-white" />
                      <span>PUTAR SEKARANG</span>
                    </>
                  )}
                </button>

                {/* Place Ideas Manager */}
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-['Satoshi'] text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      Pilihan Tempat ({wheelIdeas.length})
                    </span>
                  </div>

                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 text-xs scrollbar-thin">
                    {wheelIdeas.map((idea) => (
                      <div
                        key={idea.id}
                        className="flex items-center justify-between rounded-xl bg-white border border-zinc-200/80 px-3 py-1.5 font-['Satoshi'] text-zinc-700 shadow-2xs"
                      >
                        <span className="truncate pr-2 font-medium">
                          {idea.place_name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteIdea(idea.id)}
                          className="text-zinc-300 hover:text-red-500 transition-colors"
                          title="Hapus opsi ini"
                        >
                          <XIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddIdea} className="mt-2.5 flex gap-2">
                    <input
                      type="text"
                      placeholder="+ Tambah ide tempat baru..."
                      value={newIdeaText}
                      onChange={(e) => setNewIdeaText(e.target.value)}
                      className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 font-['Satoshi'] text-xs text-zinc-800 placeholder-zinc-400 focus:border-[#6C40E5] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-[#6C40E5] hover:bg-[#5B21B6] px-3.5 py-1.5 font-['Satoshi'] text-xs font-bold text-white transition-colors"
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
          MODAL 2: BUAT AGENDA DATE BARU
         ========================================================= */}
      {showNewPlanModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setShowNewPlanModal(false)}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 text-zinc-800 shadow-[0_25px_70px_rgba(0,0,0,0.2)] animate-slide-up scrollbar-thin"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-[#6C40E5] font-['Satoshi'] text-[11px] font-bold uppercase tracking-wider mb-1">
                  <CalendarIcon className="w-3 h-3 text-[#6C40E5]" />
                  <span>Rencana Kencan Baru</span>
                </div>
                <h3 className="font-['Satoshi'] text-2xl font-extrabold text-zinc-900 tracking-tight">
                  Buat Agenda Date
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewPlanModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreatePlan}
              className="mt-6 space-y-4 font-['Satoshi']"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                  Judul Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nonton bioskop XXI, photobooth, dan kuliner street food"
                  value={newPlanForm.title}
                  onChange={(e) =>
                    setNewPlanForm({ ...newPlanForm, title: e.target.value })
                  }
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/60 px-4 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-[#6C40E5] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                  Keterangan / Pesan Singkat
                </label>
                <input
                  type="text"
                  placeholder="e.g. Quality time berdua seharian di Malang..."
                  value={newPlanForm.description}
                  onChange={(e) =>
                    setNewPlanForm({
                      ...newPlanForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/60 px-4 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-[#6C40E5] focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={newPlanForm.date}
                    onChange={(e) =>
                      setNewPlanForm({ ...newPlanForm, date: e.target.value })
                    }
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/60 px-4 py-2 text-sm text-zinc-800 focus:bg-white focus:border-[#6C40E5] focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                    Kota / Lokasi
                  </label>
                  <input
                    type="text"
                    value={newPlanForm.location}
                    onChange={(e) =>
                      setNewPlanForm({
                        ...newPlanForm,
                        location: e.target.value,
                      })
                    }
                    placeholder="e.g. Malang"
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/60 px-4 py-2 text-sm text-zinc-800 focus:bg-white focus:border-[#6C40E5] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">
                  Kategori Date
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const isSelected = newPlanForm.category === cat.id;
                    const CatIcon = cat.IconComponent;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() =>
                          setNewPlanForm({ ...newPlanForm, category: cat.id })
                        }
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${isSelected
                          ? "bg-[#6C40E5] text-white shadow-2xs"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                          }`}
                      >
                        <CatIcon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-zinc-500"}`} />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">
                  Status Agenda
                </label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((st) => {
                    const isSelected = newPlanForm.status === st.id;
                    const StIcon = st.IconComponent;
                    return (
                      <button
                        type="button"
                        key={st.id}
                        onClick={() =>
                          setNewPlanForm({ ...newPlanForm, status: st.id })
                        }
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${isSelected
                          ? "bg-[#6C40E5] text-white shadow-2xs"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                          }`}
                      >
                        <StIcon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-zinc-500"}`} />
                        <span>{st.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-zinc-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewPlanModal(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#6C40E5] hover:bg-[#5B21B6] px-5 py-2 text-xs font-bold text-white shadow-xs transition-transform hover:-translate-y-0.5"
                >
                  Buat Agenda Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: TAMBAH TEMPAT / AKTIVITAS STOP
         ========================================================= */}
      {showNewStopModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setShowNewStopModal(false)}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 text-zinc-800 shadow-[0_25px_70px_rgba(0,0,0,0.2)] animate-slide-up scrollbar-thin"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-[#6C40E5] font-['Satoshi'] text-[11px] font-bold uppercase tracking-wider mb-1">
                  <MapPinIcon className="w-3 h-3 text-[#6C40E5]" />
                  <span>Rute Perjalanan</span>
                </div>
                <h3 className="font-['Satoshi'] text-2xl font-extrabold text-zinc-900 tracking-tight">
                  Tambah Tempat / Aktivitas
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewStopModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreateStop}
              className="mt-6 space-y-4 font-['Satoshi']"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
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
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/60 px-4 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-[#6C40E5] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">
                  Jenis Aktivitas
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {ACTIVITY_PRESETS.map((act) => {
                    const isSelected = newStopForm.activity_type === act.id;
                    const ActIcon = act.IconComponent;
                    return (
                      <button
                        type="button"
                        key={act.id}
                        onClick={() =>
                          setNewStopForm({
                            ...newStopForm,
                            activity_type: act.id,
                          })
                        }
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${isSelected
                          ? "bg-[#6C40E5] text-white shadow-2xs"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                          }`}
                      >
                        <ActIcon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-zinc-500"}`} />
                        <span>{act.label}</span>
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  placeholder="Atau tulis jenis aktivitas khusus..."
                  value={newStopForm.activity_type}
                  onChange={(e) =>
                    setNewStopForm({
                      ...newStopForm,
                      activity_type: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 px-3.5 py-1.5 text-xs text-zinc-800 focus:bg-white focus:border-[#6C40E5] focus:outline-none"
                />
              </div>

              {/* Jadwal Jam */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
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
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/60 px-4 py-2 pr-12 text-sm font-bold text-zinc-800 font-mono tabular-nums focus:bg-white focus:border-[#6C40E5] focus:outline-none transition-all"
                      />
                      <span className="absolute right-3 text-[10px] font-bold text-[#6C40E5] bg-purple-50 px-1.5 py-0.5 rounded pointer-events-none">
                        WIB
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
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
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/60 px-4 py-2 pr-12 text-sm font-bold text-zinc-800 font-mono tabular-nums focus:bg-white focus:border-[#6C40E5] focus:outline-none transition-all"
                      />
                      <span className="absolute right-3 text-[10px] font-bold text-[#6C40E5] bg-purple-50 px-1.5 py-0.5 rounded pointer-events-none">
                        WIB
                      </span>
                    </div>
                  </div>
                </div>

                {/* Duration shortcuts */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400 font-medium">Preset:</span>
                    {["10:00", "12:00", "13:30", "16:00", "19:00"].map(
                      (preset) => (
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
                          className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 hover:bg-purple-100 hover:text-[#6C40E5] transition-colors font-mono text-[11px]"
                        >
                          {preset}
                        </button>
                      )
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-zinc-400 font-medium">Durasi:</span>
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
                        className="px-1.5 py-0.5 rounded-md bg-purple-50 text-[#6C40E5] border border-purple-100 hover:bg-purple-100 transition-colors font-bold text-[10px]"
                      >
                        {dur.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                  Catatan Perjalanan (Transport)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Naik motor 15 menit / Jalan santai 5 menit..."
                  value={newStopForm.transport_note}
                  onChange={(e) =>
                    setNewStopForm({
                      ...newStopForm,
                      transport_note: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/60 px-4 py-2 text-sm text-zinc-800 focus:bg-white focus:border-[#6C40E5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                  Link Google Maps (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="https://maps.app.goo.gl/..."
                  value={newStopForm.maps_url}
                  onChange={(e) =>
                    setNewStopForm({ ...newStopForm, maps_url: e.target.value })
                  }
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/60 px-4 py-2 text-sm text-zinc-800 focus:bg-white focus:border-[#6C40E5] focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-zinc-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewStopModal(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#6C40E5] hover:bg-[#5B21B6] px-5 py-2 text-xs font-bold text-white shadow-xs transition-transform hover:-translate-y-0.5"
                >
                  Tambahkan ke Timeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 4: REVIEW & MEMORI MODAL
         ========================================================= */}
      {showReviewModal && activeReviewStop && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setShowReviewModal(false)}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 text-zinc-800 shadow-[0_25px_70px_rgba(0,0,0,0.2)] animate-slide-up scrollbar-thin"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
              <div>
                {stopsProgress.percentage === 100 && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-['Satoshi'] text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Seluruh Acara Date Selesai</span>
                  </div>
                )}
                <div>
                  <span className="font-['Satoshi'] text-[11px] font-bold uppercase tracking-wider text-[#6C40E5]">
                    {activeReviewStop.activity_type || "Review Tempat"}
                  </span>
                </div>
                <h3 className="font-['Satoshi'] text-2xl font-extrabold text-zinc-900 tracking-tight">
                  {activeReviewStop.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSaveReview}
              className="mt-6 space-y-4 font-['Satoshi']"
            >
              {/* Star Rating Interactive */}
              <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-4 text-center">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">
                  Rating Pengalaman di Tempat Ini
                </label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() =>
                        setReviewForm({ ...reviewForm, rating: star })
                      }
                      className="p-1 transition-all duration-200 hover:scale-125 focus:outline-none"
                    >
                      <StarIcon
                        filled={star <= reviewForm.rating}
                        className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${star <= reviewForm.rating
                          ? "text-amber-400"
                          : "text-zinc-200"
                          }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs font-bold text-[#6C40E5]">
                  {reviewForm.rating === 5
                    ? "Sempurna & Berkesan Banget!"
                    : reviewForm.rating === 4
                      ? "Seru & Asyik Banget"
                      : reviewForm.rating === 3
                        ? "Cukup Oke / Lumayan"
                        : "Biasa Aja / Kurang Suka"}
                </p>
              </div>

              {/* Would Go Again? */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">
                  Would Go Again? (Mau Balik Lagi ke Sini?)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: "Yes, definitely!", label: "Pasti Balik!" },
                    { id: "Maybe", label: "Boleh Aja" },
                    { id: "Not really", label: "Cukup Sekali" },
                  ].map((opt) => {
                    const isSelected = reviewForm.would_go_again === opt.id;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() =>
                          setReviewForm({
                            ...reviewForm,
                            would_go_again: opt.id,
                          })
                        }
                        className={`rounded-xl p-2.5 text-xs font-bold transition-all ${isSelected
                          ? "bg-[#6C40E5] text-white shadow-2xs"
                          : "bg-zinc-50 border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                          }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                  What Did We Order? (Pesan apa saja)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Matcha Latte, Popcorn Caramel, Ramen Tori Paitan..."
                  value={reviewForm.what_did_we_order}
                  onChange={(e) =>
                    setReviewForm({
                      ...reviewForm,
                      what_did_we_order: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/60 px-4 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-[#6C40E5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                  Favorite Moment
                </label>
                <textarea
                  rows={2}
                  placeholder="Momen paling berkesan atau lucu saat di tempat ini..."
                  value={reviewForm.favorite_moment}
                  onChange={(e) =>
                    setReviewForm({
                      ...reviewForm,
                      favorite_moment: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/60 px-4 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-[#6C40E5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                  Memory & Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Catatan kenangan pribadi dari Faiz untuk tempat ini..."
                  value={reviewForm.memory_note}
                  onChange={(e) =>
                    setReviewForm({
                      ...reviewForm,
                      memory_note: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/60 px-4 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-[#6C40E5] focus:outline-none"
                />
              </div>

              {/* Foto Kenangan */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">
                  Foto Kenangan
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {reviewForm.photos.map((photo, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={photo}
                        alt="Uploaded"
                        className="h-16 w-16 rounded-xl object-cover border border-purple-200 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setReviewForm({
                            ...reviewForm,
                            photos: reviewForm.photos.filter(
                              (_, idx) => idx !== i
                            ),
                          })
                        }
                        className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow-xs"
                      >
                        <XIcon className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50/60 text-xs font-bold text-[#6C40E5] hover:bg-purple-100/60 transition-colors">
                    <CameraIcon className="w-4 h-4 text-[#6C40E5]" />
                    <span className="text-[10px]">+ Foto</span>
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
                  <p className="mt-1.5 text-xs text-[#6C40E5]">
                    Mengunggah foto kenangan...
                  </p>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-zinc-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#6C40E5] hover:bg-[#5B21B6] px-5 py-2 text-xs font-bold text-white shadow-xs transition-transform hover:-translate-y-0.5"
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

import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  deleteJournal,
  getAdminJournals,
  saveJournal,
  uploadJournalImage,
} from "../lib/journals";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import {
  EditIcon,
  TrashIcon,
  LogOutIcon,
  UploadIcon,
  LockIcon,
  EyeIcon,
  FileTextIcon,
  FeatherIcon,
  ExternalLinkIcon,
  CheckCircleIcon,
  XIcon,
  RotateCwIcon,
  GlobeIcon,
} from "../components/icons";

const emptyJournal = {
  id: null,
  title: "",
  content: "",
  image_url: "",
  visibility_mode: "admin_only", // 'public' | 'admin_only' | 'draft'
  published_at: null,
};

function getJournalStatus(j) {
  if (j.is_public) return "public";
  if (j.published_at) return "admin_only";
  return "draft";
}

function getStatusBadge(status) {
  switch (status) {
    case "public":
      return {
        label: "Publik",
        colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
        dotClass: "bg-emerald-500",
        description: "Terbit untuk Rara & publik",
      };
    case "admin_only":
      return {
        label: "Khusus Admin",
        colorClass: "bg-purple-50 text-purple-700 border-purple-200/80",
        dotClass: "bg-[#6C40E5]",
        description: "Terbit privat hanya untuk Admin",
      };
    case "draft":
    default:
      return {
        label: "Draf",
        colorClass: "bg-zinc-100 text-zinc-600 border-zinc-200",
        dotClass: "bg-zinc-400",
        description: "Konsep belum diterbitkan",
      };
  }
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function AdminJurnal() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [journal, setJournal] = useState(emptyJournal);
  const [journals, setJournals] = useState([]);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [filter, setFilter] = useState("all"); // 'all' | 'public' | 'admin_only' | 'draft'
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => setSession(nextSession)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    loadJournals();
  }, [session]);

  async function loadJournals() {
    const { data, error } = await getAdminJournals();
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setJournals(data ?? []);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage({
          type: "error",
          text: "Gagal masuk: " + (error.message || "Periksa email dan password."),
        });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: "Gagal masuk: " + (err.message || "Terjadi kesalahan jaringan."),
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      let is_public = false;
      let published_at = null;

      if (journal.visibility_mode === "public") {
        is_public = true;
        published_at = journal.published_at || new Date().toISOString();
      } else if (journal.visibility_mode === "admin_only") {
        is_public = false;
        published_at = journal.published_at || new Date().toISOString();
      } else {
        // draft
        is_public = false;
        published_at = null;
      }

      const payload = {
        id: journal.id,
        title: journal.title,
        content: journal.content,
        image_url: journal.image_url,
        is_public,
        published_at,
      };

      const { error } = await saveJournal(payload);
      if (error) {
        setMessage({ type: "error", text: error.message || "Gagal menyimpan jurnal." });
      } else {
        const modeLabel =
          journal.visibility_mode === "public"
            ? "diterbitkan untuk Rara & Publik"
            : journal.visibility_mode === "admin_only"
              ? "diterbitkan khusus Admin (Privat)"
              : "disimpan sebagai Draf";

        setMessage({
          type: "success",
          text: journal.id
            ? `Catatan berhasil diperbarui (${modeLabel}).`
            : `Catatan baru berhasil ${modeLabel}.`,
        });
        setJournal(emptyJournal);
        await loadJournals();
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Terjadi kesalahan saat menyimpan catatan.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Hapus catatan "${title}"?`)) return;
    setMessage({ type: "", text: "" });

    try {
      const { error } = await deleteJournal(id);
      if (error) {
        setMessage({ type: "error", text: error.message || "Gagal menghapus catatan." });
      } else {
        setMessage({ type: "success", text: "Catatan berhasil dihapus." });
        if (journal.id === id) setJournal(emptyJournal);
        await loadJournals();
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Terjadi kesalahan saat menghapus catatan.",
      });
    }
  }

  async function handleImageUpload(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "File harus berupa format gambar (JPG, PNG, WebP)." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Ukuran gambar maksimal adalah 5 MB." });
      return;
    }

    setUploadingImage(true);
    setMessage({ type: "", text: "" });

    try {
      const { data, error } = await uploadJournalImage(file);
      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setJournal((current) => ({ ...current, image_url: data.publicUrl }));
        setMessage({ type: "success", text: "Gambar berhasil diunggah." });
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Upload gambar gagal." });
    } finally {
      setUploadingImage(false);
    }
  }

  // Filtered & Searched Journals
  const filteredJournals = useMemo(() => {
    return journals.filter((item) => {
      const status = getJournalStatus(item);
      const matchesFilter = filter === "all" ? true : status === filter;

      const matchesSearch = item.title
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [journals, filter, searchQuery]);

  // Counts
  const stats = useMemo(() => {
    const total = journals.length;
    const publicCount = journals.filter((j) => j.is_public).length;
    const adminCount = journals.filter((j) => !j.is_public && j.published_at).length;
    const draftCount = journals.filter((j) => !j.is_public && !j.published_at).length;
    return { total, publicCount, adminCount, draftCount };
  }, [journals]);

  // Metrics for current editing content
  const wordCount = useMemo(() => {
    if (!journal.content) return 0;
    return journal.content.trim().split(/\s+/).filter(Boolean).length;
  }, [journal.content]);

  // Supabase not configured screen
  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
          <LockIcon className="h-6 w-6" />
        </div>
        <h1 className="font-['Satoshi'] text-3xl font-extrabold text-zinc-900">
          Koneksi Database Belum Siap
        </h1>
        <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
          Kunci konfigurasi Supabase belum terdeteksi. Silakan tambahkan{" "}
          <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code> di
          file <code>.env.local</code>.
        </p>
      </div>
    );
  }

  // Login Screen
  if (!session) {
    return (
      <div className="mx-auto w-full max-w-md px-4 pt-10 pb-20 animate-fade-in-up">
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-8 shadow-[0_16px_40px_rgba(20,15,35,0.06)]">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5F2FF] text-[#6C40E5] border border-[#6C40E5]/20 shadow-xs">
              <LockIcon className="h-6 w-6" />
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
              Admin Studio
            </span>
            <h1 className="mt-3 font-['Satoshi'] text-2xl font-bold tracking-tight text-zinc-900">
              Masuk ke Jurnal
            </h1>
            <p className="mt-1.5 text-xs text-zinc-500">
              Gunakan akun admin untuk menulis dan mengatur catatan Rara.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-700">
                Email Admin
              </label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
                placeholder="nama@email.com"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-all placeholder:text-zinc-400 focus:border-[#6C40E5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6C40E5]/15"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-700">
                Password
              </label>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-all placeholder:text-zinc-400 focus:border-[#6C40E5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6C40E5]/15"
              />
            </div>

            <button
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#6C40E5] px-4 py-3 font-['Satoshi'] text-sm font-bold text-white shadow-sm transition-all hover:bg-[#5831CC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C40E5] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RotateCwIcon className="h-4 w-4 animate-spin" />
                  <span>Memeriksa Akun...</span>
                </>
              ) : (
                <span>Masuk ke Studio</span>
              )}
            </button>
          </form>

          {message.text && (
            <div
              className={`mt-5 rounded-xl border p-3.5 text-xs font-medium ${message.type === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
            >
              {message.text}
            </div>
          )}

          <div className="mt-6 border-t border-zinc-100 pt-4 text-center">
            <Link
              to="/jurnal"
              className="text-xs font-semibold text-zinc-500 hover:text-[#6C40E5]"
            >
              ← Kembali ke Beranda Jurnal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard / Editor Studio
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6 md:px-8 animate-fade-in">
      {/* Studio Top Navigation & Status */}
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#6C40E5]/20 bg-[#F5F2FF] px-2.5 py-0.5 font-['Satoshi'] text-[11px] font-semibold uppercase tracking-wider text-[#6C40E5]">
              <FeatherIcon className="h-3 w-3" />
              Studio Admin
            </span>
            <span className="text-xs text-zinc-400 font-mono">/admin</span>
          </div>
          <h1 className="mt-2 font-['Satoshi'] text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
            Kelola Catatan & Jurnal
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            Tulis, sunting, dan tentukan catatan yang dibagikan untuk Rara.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/jurnal"
            target="_blank"
            rel="noopener noreferrer"
            title="Lihat halaman jurnal publik di tab baru"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-xs transition-all hover:border-zinc-300 hover:bg-zinc-50"
          >
            <span>Lihat Halaman Publik</span>
            <ExternalLinkIcon className="h-3.5 w-3.5 text-zinc-400" />
          </Link>

          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            title="Keluar dari sesi admin"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-600 shadow-xs transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOutIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* Global Status Message Toast */}
      {message.text && (
        <div
          className={`mb-6 flex items-center justify-between rounded-2xl border p-4 text-xs font-semibold shadow-xs transition-all ${message.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "error" ? (
              <XIcon className="h-4 w-4 text-red-500 shrink-0" />
            ) : (
              <CheckCircleIcon className="h-4 w-4 text-emerald-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage({ type: "", text: "" })}
            className="rounded p-1 hover:bg-black/5"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Grid Layout: Left = Editor Form, Right = Journal Directory */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Form Editor (7 cols) */}
        <section className="lg:col-span-7">
          <form
            onSubmit={handleSave}
            className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm md:p-8"
          >
            <div className="mb-6 flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-[#6C40E5]">
                  {journal.id ? (
                    <EditIcon className="h-4 w-4" />
                  ) : (
                    <FileTextIcon className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <h2 className="font-['Satoshi'] text-base font-bold text-zinc-900">
                    {journal.id ? `Edit Catatan #${journal.id}` : "Tulis Catatan Baru"}
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    {journal.id
                      ? "Mengubah isi catatan yang sudah ada."
                      : "Buat cerita atau kenangan baru."}
                  </p>
                </div>
              </div>

              {journal.id && (
                <button
                  type="button"
                  onClick={() => {
                    setJournal(emptyJournal);
                    setMessage({ type: "", text: "" });
                  }}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
                >
                  Batal Edit
                </button>
              )}
            </div>

            <div className="space-y-5">
              {/* Judul Field */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700">
                  Judul Catatan <span className="text-red-500">*</span>
                </label>
                <input
                  value={journal.title}
                  onChange={(event) =>
                    setJournal({ ...journal, title: event.target.value })
                  }
                  required
                  placeholder="Misal: Ketika memperbaiki sebuah rasa berarti rela menelan ego..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-all placeholder:text-zinc-400 focus:border-[#6C40E5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6C40E5]/15"
                />
              </div>

              {/* Isi Field */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Isi Catatan <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-zinc-400 tabular-nums">
                    {wordCount} kata • {journal.content?.length || 0} karakter
                  </span>
                </div>
                <textarea
                  value={journal.content}
                  onChange={(event) =>
                    setJournal({ ...journal, content: event.target.value })
                  }
                  required
                  placeholder="Tuliskan ungkapan pikiran, kenangan, atau pesan untuk Rara..."
                  rows="9"
                  className="w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 text-sm leading-relaxed text-zinc-900 transition-all placeholder:text-zinc-400 focus:border-[#6C40E5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6C40E5]/15"
                />
              </div>

              {/* Foto Sampul */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-zinc-700">
                  Foto Sampul (Opsional)
                </label>

                {/* Direct URL input */}
                <input
                  value={journal.image_url || ""}
                  onChange={(event) =>
                    setJournal({ ...journal, image_url: event.target.value })
                  }
                  placeholder="https://... (atau upload berkas di bawah)"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-xs text-zinc-900 transition-all placeholder:text-zinc-400 focus:border-[#6C40E5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6C40E5]/15"
                />

                {/* Upload Zone */}
                <label
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleImageUpload(event.dataTransfer.files[0]);
                  }}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-purple-200 bg-[#FAF9FF] px-4 py-5 text-center transition-all hover:border-[#6C40E5] hover:bg-[#F5F2FF]"
                >
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100/70 text-[#6C40E5]">
                    <UploadIcon className="h-4 w-4" />
                  </div>
                  <span className="font-['Satoshi'] text-xs font-bold text-[#6C40E5]">
                    {uploadingImage ? "Mengunggah gambar..." : "Klik untuk pilih berkas gambar"}
                  </span>
                  <span className="mt-1 text-[11px] text-zinc-400">
                    Atau tarik dan jatuhkan gambar ke area ini (maksimal 5 MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingImage}
                    onChange={(event) => {
                      handleImageUpload(event.target.files[0]);
                      event.target.value = "";
                    }}
                    className="sr-only"
                  />
                </label>

                {/* Image Preview */}
                {journal.image_url && (
                  <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-900 shadow-xs">
                    <img
                      src={journal.image_url}
                      alt="Pratinjau Foto"
                      className="h-44 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setJournal((curr) => ({ ...curr, image_url: "" }))
                      }
                      aria-label="Hapus gambar"
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/70 text-white backdrop-blur-md transition hover:bg-black"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Status Publikasi & Hak Akses Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Status Publikasi & Hak Akses <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] font-medium text-zinc-400">
                    Pilih siapa yang dapat membaca
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Option 1: Khusus Admin */}
                  <button
                    type="button"
                    onClick={() =>
                      setJournal({ ...journal, visibility_mode: "admin_only" })
                    }
                    className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all ${
                      journal.visibility_mode === "admin_only"
                        ? "border-[#6C40E5] bg-[#F7F4FF] shadow-xs ring-1 ring-[#6C40E5]"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#6C40E5]">
                      <LockIcon className="h-3.5 w-3.5" />
                      <span>Khusus Admin</span>
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500 leading-normal">
                      Terbit privat untuk Admin saja. Rara & publik tidak dapat melihat.
                    </p>
                  </button>

                  {/* Option 2: Publik */}
                  <button
                    type="button"
                    onClick={() =>
                      setJournal({ ...journal, visibility_mode: "public" })
                    }
                    className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all ${
                      journal.visibility_mode === "public"
                        ? "border-emerald-500 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-500"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700">
                      <GlobeIcon className="h-3.5 w-3.5" />
                      <span>Publik (Rara)</span>
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500 leading-normal">
                      Diterbitkan langsung di menu Jurnal untuk Rara dan publik.
                    </p>
                  </button>

                  {/* Option 3: Draf */}
                  <button
                    type="button"
                    onClick={() =>
                      setJournal({ ...journal, visibility_mode: "draft" })
                    }
                    className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all ${
                      journal.visibility_mode === "draft"
                        ? "border-zinc-600 bg-zinc-100/80 shadow-xs ring-1 ring-zinc-600"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-700">
                      <FileTextIcon className="h-3.5 w-3.5" />
                      <span>Draf Konsep</span>
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500 leading-normal">
                      Simpan sebagai konsep tulisan yang belum siap terbit.
                    </p>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || uploadingImage}
                  className="flex-1 rounded-xl bg-[#6C40E5] px-5 py-3 font-['Satoshi'] text-sm font-bold text-white shadow-sm transition-all hover:bg-[#5831CC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C40E5] disabled:opacity-60"
                >
                  {loading
                    ? "Menyimpan ke Database..."
                    : journal.id
                      ? journal.visibility_mode === "public"
                        ? "Perbarui & Terbitkan untuk Publik"
                        : journal.visibility_mode === "admin_only"
                          ? "Perbarui & Terbitkan Khusus Admin"
                          : "Perbarui sebagai Draf"
                      : journal.visibility_mode === "public"
                        ? "Simpan & Terbitkan untuk Publik"
                        : journal.visibility_mode === "admin_only"
                          ? "Simpan & Terbitkan Khusus Admin"
                          : "Simpan sebagai Draf"}
                </button>

                {journal.id && (
                  <button
                    type="button"
                    onClick={() => setJournal(emptyJournal)}
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                  >
                    Batal
                  </button>
                )}
              </div>
            </div>
          </form>
        </section>

        {/* Right Column: Journal Directory & Management (5 cols) */}
        <section className="space-y-4 lg:col-span-5">
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm">
            {/* Header & Stats */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h2 className="font-['Satoshi'] text-base font-bold text-zinc-900">
                  Daftar Catatan
                </h2>
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-zinc-600 tabular-nums">
                  {stats.total} total
                </span>
              </div>

              {/* Filter Tabs */}
              <div className="mt-3 grid grid-cols-4 gap-1 rounded-xl bg-zinc-100 p-1 text-[11px] sm:text-xs">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`rounded-lg py-1.5 font-semibold transition text-center truncate ${filter === "all"
                      ? "bg-white text-zinc-900 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-800"
                    }`}
                >
                  Semua ({stats.total})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("public")}
                  className={`rounded-lg py-1.5 font-semibold transition text-center truncate ${filter === "public"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-800"
                    }`}
                >
                  Publik ({stats.publicCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("admin_only")}
                  className={`rounded-lg py-1.5 font-semibold transition text-center truncate ${filter === "admin_only"
                      ? "bg-white text-[#6C40E5] shadow-xs"
                      : "text-zinc-500 hover:text-zinc-800"
                    }`}
                >
                  Admin ({stats.adminCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("draft")}
                  className={`rounded-lg py-1.5 font-semibold transition text-center truncate ${filter === "draft"
                      ? "bg-white text-zinc-900 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-800"
                    }`}
                >
                  Draf ({stats.draftCount})
                </button>
              </div>

              {/* Search Field */}
              <div className="mt-3">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari judul catatan..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:border-[#6C40E5]"
                />
              </div>
            </div>

            {/* List Entries */}
            <div className="divide-y divide-zinc-100 overflow-y-auto max-h-[600px] pr-1">
              {filteredJournals.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-400">
                  Tidak ada catatan yang sesuai filter.
                </div>
              ) : (
                filteredJournals.map((item) => {
                  const isEditingThis = journal.id === item.id;
                  const itemStatus = getJournalStatus(item);
                  const badge = getStatusBadge(itemStatus);

                  return (
                    <article
                      key={item.id}
                      className={`py-3.5 transition-colors ${isEditingThis
                          ? "rounded-xl bg-[#F8F6FF] px-2 -mx-2 border border-[#6C40E5]/20"
                          : ""
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${badge.colorClass}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${badge.dotClass}`}
                              />
                              {badge.label}
                            </span>
                            <span className="text-[11px] text-zinc-400 tabular-nums">
                              {formatDate(item.published_at || item.created_at)}
                            </span>
                          </div>

                          <h3
                            onClick={() => setSelectedDetail(item)}
                            className="mt-1.5 line-clamp-2 font-['Satoshi'] text-xs font-bold leading-snug text-zinc-900 hover:text-[#6C40E5] cursor-pointer transition-colors"
                          >
                            {item.title}
                          </h3>

                          <p className="mt-1 line-clamp-1 text-[11px] text-zinc-500">
                            {item.content}
                          </p>
                        </div>

                        {/* Row Actions */}
                        <div className="flex items-center gap-1 shrink-0 pt-1">
                          {/* View Detail Button - Always Available */}
                          <button
                            type="button"
                            onClick={() => setSelectedDetail(item)}
                            title="Lihat detail catatan ini"
                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 shadow-xs transition hover:border-[#6C40E5]/40 hover:bg-[#F5F2FF] hover:text-[#6C40E5]"
                          >
                            <EyeIcon className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Detail</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const mode = getJournalStatus(item);
                              setJournal({
                                id: item.id,
                                title: item.title || "",
                                content: item.content || "",
                                image_url: item.image_url || "",
                                visibility_mode: mode,
                                published_at: item.published_at || null,
                              });
                              window.scrollTo({ top: 120, behavior: "smooth" });
                            }}
                            title="Edit catatan ini"
                            className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-600 shadow-xs transition hover:border-[#6C40E5]/40 hover:bg-[#F5F2FF] hover:text-[#6C40E5]"
                          >
                            <EditIcon className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.title)}
                            title="Hapus catatan ini"
                            className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-400 shadow-xs transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>

      {/* View Detail Modal for Admin */}
      {selectedDetail && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
          onClick={() => setSelectedDetail(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-zinc-200 bg-white shadow-2xl overflow-hidden animate-fade-in-up"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 bg-zinc-50/70">
              <div className="flex items-center gap-2">
                {(() => {
                  const badge = getStatusBadge(getJournalStatus(selectedDetail));
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${badge.colorClass}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${badge.dotClass}`} />
                      {badge.label}
                    </span>
                  );
                })()}
                <span className="text-xs text-zinc-400 tabular-nums">
                  {formatDate(selectedDetail.published_at || selectedDetail.created_at)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                aria-label="Tutup pratinjau"
                className="rounded-xl border border-zinc-200 p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 space-y-5">
              <h2 className="font-['Satoshi'] text-2xl font-bold tracking-tight text-zinc-900 leading-snug">
                {selectedDetail.title}
              </h2>

              {selectedDetail.image_url && (
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-900">
                  <img
                    src={selectedDetail.image_url}
                    alt={selectedDetail.title}
                    className="max-h-72 w-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-4 text-sm leading-relaxed text-zinc-700 font-sans whitespace-pre-wrap">
                {selectedDetail.content}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-6 py-4 bg-zinc-50/70">
              <Link
                to={`/jurnal/${selectedDetail.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6C40E5] hover:underline"
              >
                <span>Buka di Halaman Penuh</span>
                <ExternalLinkIcon className="h-3.5 w-3.5" />
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const item = selectedDetail;
                    const mode = getJournalStatus(item);
                    setJournal({
                      id: item.id,
                      title: item.title || "",
                      content: item.content || "",
                      image_url: item.image_url || "",
                      visibility_mode: mode,
                      published_at: item.published_at || null,
                    });
                    setSelectedDetail(null);
                    window.scrollTo({ top: 120, behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-xs hover:bg-zinc-50"
                >
                  <EditIcon className="h-3.5 w-3.5" />
                  <span>Edit Catatan Ini</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDetail(null)}
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminJurnal;

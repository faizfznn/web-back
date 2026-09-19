import { useEffect, useState } from "react";
import {
  deleteJournal,
  getAdminJournals,
  saveJournal,
  uploadJournalImage,
} from "../lib/journals";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const emptyJournal = {
  id: null,
  title: "",
  content: "",
  image_url: "",
  is_public: false,
  published_at: null,
};

function AdminJurnal() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [journal, setJournal] = useState(emptyJournal);
  const [journals, setJournals] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => setSession(nextSession),
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    loadJournals();
  }, [session]);

  async function loadJournals() {
    const { data, error } = await getAdminJournals();
    if (error) setMessage(error.message);
    else setJournals(data ?? []);
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setMessage(error?.message || "");
    setLoading(false);
  }

  async function handleSave(event) {
    event.preventDefault();
    setLoading(true);
    const { error } = await saveJournal(journal);
    setMessage(error?.message || "Jurnal tersimpan.");
    if (!error) {
      setJournal(emptyJournal);
      await loadJournals();
    }
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!window.confirm("Hapus jurnal ini?")) return;
    const { error } = await deleteJournal(id);
    setMessage(error?.message || "Jurnal dihapus.");
    if (!error) await loadJournals();
  }

  async function handleImageUpload(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("File harus berupa gambar.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Ukuran gambar maksimal 5 MB.");
      return;
    }

    setUploadingImage(true);
    setMessage("");
    try {
      const { data, error } = await uploadJournalImage(file);
      if (error) setMessage(error.message);
      else setJournal((current) => ({ ...current, image_url: data.publicUrl }));
    } catch (error) {
      setMessage(error.message || "Upload gambar gagal.");
    } finally {
      setUploadingImage(false);
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto w-full max-w-xl px-6 py-16">
        <h1 className="font-['Satoshi'] text-4xl font-bold">Admin Jurnal</h1>
        <p className="mt-4 text-[#666]">
          Supabase belum dikonfigurasi. Tambahkan environment variable terlebih
          dahulu.
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <form
        onSubmit={handleLogin}
        className="mx-auto w-full max-w-md px-6 py-16 animate-fade-in-up"
      >
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#6C40E5]">
          Ruang pribadi
        </p>
        <h1 className="font-['Satoshi'] text-5xl font-bold tracking-[-2px]">
          Masuk ke jurnal
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[#666]">
          Gunakan akun admin Supabase untuk menulis dan memilih jurnal yang
          tampil di halaman publik.
        </p>
        <div className="mt-8 space-y-4">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-xl border border-[#DDD] px-4 py-3 outline-none focus:border-[#6C40E5]"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            required
            placeholder="Password"
            className="w-full rounded-xl border border-[#DDD] px-4 py-3 outline-none focus:border-[#6C40E5]"
          />
          <button
            disabled={loading}
            className="w-full rounded-xl bg-[#6C40E5] px-4 py-3 font-bold text-white disabled:opacity-60"
          >
            {loading ? "Memeriksa..." : "Masuk"}
          </button>
        </div>
        {message && <p className="mt-4 text-sm text-red-600">{message}</p>}
      </form>
    );
  }

  return (
    <section className="w-full max-w-5xl px-6 py-8 md:px-10 md:py-14 animate-fade-in-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#6C40E5]">
            Admin
          </p>
          <h1 className="font-['Satoshi'] text-5xl font-bold tracking-[-2px]">
            Tulis jurnal
          </h1>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="rounded-xl border border-[#DDD] px-4 py-2 text-sm text-[#555]"
        >
          Keluar
        </button>
      </div>
      <form
        onSubmit={handleSave}
        className="mt-10 rounded-2xl border border-[#E5E0D9] bg-white p-6 shadow-[0_12px_35px_rgba(35,25,15,0.06)] md:p-8"
      >
        <div className="grid gap-4">
          <input
            value={journal.title}
            onChange={(event) =>
              setJournal({ ...journal, title: event.target.value })
            }
            required
            placeholder="Judul jurnal"
            className="rounded-xl border border-[#DDD] px-4 py-3 outline-none focus:border-[#6C40E5]"
          />
          <textarea
            value={journal.content}
            onChange={(event) =>
              setJournal({ ...journal, content: event.target.value })
            }
            required
            placeholder="Tulis isi jurnal..."
            rows="8"
            className="resize-y rounded-xl border border-[#DDD] px-4 py-3 outline-none focus:border-[#6C40E5]"
          />
          <div className="grid gap-3">
            <input
              value={journal.image_url}
              onChange={(event) =>
                setJournal({ ...journal, image_url: event.target.value })
              }
              placeholder="URL gambar (opsional)"
              className="rounded-xl border border-[#DDD] px-4 py-3 outline-none focus:border-[#6C40E5]"
            />
            <label
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                handleImageUpload(event.dataTransfer.files[0]);
              }}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#CFC7E8] bg-[#FAF9FF] px-4 py-5 text-center text-sm text-[#666] transition hover:border-[#6C40E5]"
            >
              <span className="font-semibold text-[#4D32A8]">
                {uploadingImage ? "Mengunggah gambar..." : "Upload gambar"}
              </span>
              <span className="mt-1 text-xs">
                Klik untuk memilih atau drop gambar di sini (maks. 5 MB)
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
            {journal.image_url && (
              <img
                src={journal.image_url}
                alt="Pratinjau gambar jurnal"
                className="h-40 w-full rounded-xl object-cover"
              />
            )}
          </div>
          <label className="flex items-center gap-3 text-sm text-[#555]">
            <input
              type="checkbox"
              checked={journal.is_public}
              onChange={(event) =>
                setJournal({ ...journal, is_public: event.target.checked })
              }
              className="h-4 w-4 accent-[#6C40E5]"
            />{" "}
            Tampilkan untuk Rara / publik
          </label>
          <button
            disabled={loading || uploadingImage}
            className="mt-2 rounded-xl bg-[#6C40E5] px-4 py-3 font-bold text-white disabled:opacity-60"
          >
            {loading
              ? "Menyimpan..."
              : journal.id
                ? "Perbarui jurnal"
                : "Simpan jurnal"}
          </button>
        </div>
      </form>
      {message && <p className="mt-4 text-sm text-[#666]">{message}</p>}
      <div className="mt-10 space-y-3">
        {journals.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E0D9] py-4"
          >
            <div>
              <p className="font-bold text-[#303030]">{item.title}</p>
              <p className="mt-1 text-xs text-[#777]">
                {item.is_public ? "Public" : "Draft"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setJournal(item)}
                className="rounded-lg border border-[#DDD] px-3 py-2 text-xs"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-600"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default AdminJurnal;

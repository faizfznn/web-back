import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPublicJournals } from "../lib/journals";
import { isSupabaseConfigured } from "../lib/supabase";

function formatDate(value) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function Jurnal() {
  const [journals, setJournals] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadJournals() {
      const { data, error } = await getPublicJournals();
      if (!isMounted) return;

      if (error) {
        setErrorMessage(error.message);
        setStatus("error");
        return;
      }

      setJournals(data ?? []);
      setStatus("ready");
    }

    loadJournals();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="w-full max-w-5xl px-6 py-8 md:px-10 md:py-14 animate-fade-in-up">
      <div className="mb-12 max-w-2xl">
        <p className="mb-4 font-['Satoshi'] text-xs font-bold uppercase tracking-[0.24em] text-[#6C40E5]">
          Catatan yang aku bagikan
        </p>
        <h1 className="font-['Satoshi'] text-5xl font-bold leading-[0.95] tracking-[-2px] text-[#202020] md:text-7xl">
          Jurnal Tentang Rara
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-[#6A6A6A] md:text-lg">
          Potongan cerita dan perasaan yang ingin aku simpan, lalu dibaca
          bersama
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-8 rounded-2xl border border-[#E6DFFF] bg-[#F7F4FF] px-5 py-4 text-sm text-[#5B526F]">
          Jurnal belum tersambung. Isi `VITE_SUPABASE_URL` dan
          `VITE_SUPABASE_ANON_KEY` di file `.env.local` untuk menampilkan
          catatan.
        </div>
      )}

      {status === "loading" && (
        <p className="text-sm text-[#777]">Membuka jurnal...</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
      {status === "ready" && journals.length === 0 && (
        <div className="border-y border-[#E5E0D9] py-16 text-center">
          <p className="font-['Satoshi'] text-2xl font-bold text-[#303030]">
            Belum ada jurnal yang dibagikan.
          </p>
          <p className="mt-2 text-sm text-[#777]">
            Nanti catatan yang kamu tandai public akan muncul di sini.
          </p>
        </div>
      )}

      <div className="flex w-full flex-col gap-6">
        {journals.map((journal) => (
          <article
            key={journal.id}
            className="w-full overflow-hidden rounded-2xl border border-[#E5E0D9] bg-white shadow-[0_12px_35px_rgba(35,25,15,0.06)] transition-shadow hover:shadow-[0_18px_42px_rgba(35,25,15,0.1)]"
          >
            {journal.image_url && (
              <img
                src={journal.image_url}
                alt=""
                className="h-56 w-full object-cover"
              />
            )}
            <div className="p-6 md:p-8">
              <time className="text-xs font-bold uppercase tracking-[0.18em] text-[#6C40E5]">
                {formatDate(journal.published_at || journal.created_at)}
              </time>
              <h2 className="mt-4 font-['Satoshi'] text-2xl font-bold leading-tight text-[#252525]">
                {journal.title}
              </h2>
              <p className="mt-4 line-clamp-4 whitespace-pre-wrap text-sm leading-7 text-[#626262]">
                {journal.content}
              </p>
              <Link
                to={`/jurnal/${journal.id}`}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#6C40E5] px-4 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
              >
                Lihat selengkapnya
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>{" "}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Jurnal;

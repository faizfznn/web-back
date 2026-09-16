import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicJournal } from "../lib/journals";
import { isSupabaseConfigured } from "../lib/supabase";

function formatDate(value) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function JurnalDetail() {
  const { id } = useParams();
  const [journal, setJournal] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadJournal() {
      const { data, error } = await getPublicJournal(id);
      if (!isMounted) return;

      if (error) {
        setErrorMessage(error.message);
        setStatus("error");
        return;
      }

      setJournal(data);
      setStatus("ready");
    }

    loadJournal();
    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <section className="w-full max-w-4xl px-6 py-8 md:px-10 md:py-14 animate-fade-in-up">
      <Link
        to="/jurnal"
        className="mb-10 inline-flex items-center gap-2 text-sm font-bold text-[#6C40E5] transition-transform hover:-translate-x-1"
      >
        <span aria-hidden="true">←</span> Kembali ke jurnal
      </Link>

      {!isSupabaseConfigured && (
        <div className="rounded-2xl border border-[#E6DFFF] bg-[#F7F4FF] px-5 py-4 text-sm text-[#5B526F]">
          Jurnal belum tersambung. Isi `VITE_SUPABASE_URL` dan
          `VITE_SUPABASE_ANON_KEY` di file `.env.local`.
        </div>
      )}
      {status === "loading" && (
        <p className="text-sm text-[#777]">Membuka jurnal...</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
      {status === "ready" && journal && (
        <article className="overflow-hidden rounded-2xl border border-[#E5E0D9] bg-white shadow-[0_12px_35px_rgba(35,25,15,0.06)]">
          {journal.image_url && (
            <img
              src={journal.image_url}
              alt=""
              className="max-h-[32rem] w-full object-cover"
            />
          )}
          <div className="p-6 md:p-12">
            <time className="text-xs font-bold uppercase tracking-[0.18em] text-[#6C40E5]">
              {formatDate(journal.published_at || journal.created_at)}
            </time>
            <h1 className="mt-5 font-['Satoshi'] text-4xl font-bold leading-tight tracking-[-1px] text-[#252525] md:text-6xl">
              {journal.title}
            </h1>
            <p className="mt-8 whitespace-pre-wrap text-base leading-8 text-[#626262] md:text-lg md:leading-9">
              {journal.content}
            </p>
          </div>
        </article>
      )}
    </section>
  );
}

export default JurnalDetail;

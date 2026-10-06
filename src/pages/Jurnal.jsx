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
      <div className="mb-12 max-w">
        <div className="flex justify-center items-center">
          {/* Badge */}
          <div className="flex inline-flex items-center gap-2 pl-2 pr-3 py-2 rounded-full bg-white border border-[#DCDCDC] mb-8 md:mb-10 hover:shadow-md transition-shadow cursor-default mt-8 md:mt-0">
            <span className="inline-flex items-center justify-center rounded-full bg-[#6C40E5] px-2 py-1 text-center font-['Satoshi'] text-[10px] md:text-[12px] font-medium leading-normal tracking-[0.24px] text-white shadow-[0_7px_16px_0_rgba(62,24,197,0.20)]">
              Rara
            </span>

            <span className="font-['Satoshi'] text-[12px] md:text-[14px] font-medium leading-[100%] tracking-[-0.28px] text-[#505050]">
              Catatan yang aku bagikan
            </span>
          </div>
        </div>

        <h1 className="font-['Satoshi'] text-center text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-3">
          Jurnal Tentang Rara
        </h1>
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

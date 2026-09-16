import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logoRara from "../assets/logo-rara.png";
import logoFaiz from "../assets/logo-faiz.png";

function isMobileOrTablet() {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent || "";
  const isIpad =
    /iPad/i.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isPhone =
    /Android|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  return isPhone || isIpad || window.matchMedia("(max-width: 768px)").matches;
}

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = location.pathname;
  const [showMemoriReminder, setShowMemoriReminder] = useState(false);

  const openMemori = () => {
    if (isMobileOrTablet()) {
      setShowMemoriReminder(true);
      return;
    }

    navigate("/memori");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 pt-6">
      <div
        className="
      flex
      w-full max-w-[875px]
      px-2 md:px-[12px] py-2 md:py-[8px]
      justify-between
      items-center
      rounded-[20px]
      border-[0.901px]
      border-[#E0E0E0]
      bg-white
    "
      >
        {/* Logo */}
        <div
          className="flex items-center gap-1 md:gap-2 cursor-pointer shrink-0"
          onClick={() => navigate("/poin-inti")}
        >
          <img className="h-[24px] md:h-[32px]" src={logoFaiz} alt="" />
          <img className="h-[28px] md:h-[36px]" src={logoRara} alt="" />
        </div>

        {/* Center Nav */}
        <div className="flex items-center gap-0.5 md:gap-1">
          {/* Point Inti */}
          <button
            onClick={() => navigate("/poin-inti")}
            style={
              currentPage === "/poin-inti" || currentPage === "/"
                ? {
                    background:
                      "radial-gradient(44.33% 44.33% at 50.2% 0%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.00) 100%), #6C40E5",
                  }
                : undefined
            }
            className={`
      flex justify-center items-center
      text-center
      font-['Satoshi']
      text-[12px] md:text-[14.408px]
      not-italic
      font-medium
      leading-normal
      tracking-[-0.432px]
      transition-all duration-300

      ${
        currentPage === "/poin-inti" || currentPage === "/"
          ? `
            px-3 md:px-[16px] py-1.5 md:py-[8px]
            gap-1 md:gap-[12.732px]
            rounded-[12px]
            text-[#F5F5F5]
            shadow-[0_185px_52px_0_rgba(62,24,197,0),0_119px_47px_0_rgba(62,24,197,0.03),0_67px_40px_0_rgba(62,24,197,0.10),0_30px_30px_0_rgba(62,24,197,0.17),0_7px_16px_0_rgba(62,24,197,0.20)]
          `
          : `
            px-2 md:px-[6px] py-1 md:py-[4px]
            gap-[10px]
            text-[#505050]
            hover:text-[#303030]
          `
      }
    `}
          >
            Poin Inti
          </button>

          {/* Memori */}
          <button
            onClick={openMemori}
            style={
              currentPage === "/memori"
                ? {
                    background:
                      "radial-gradient(44.33% 44.33% at 50.2% 0%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.00) 100%), #6C40E5",
                  }
                : undefined
            }
            className={`
      flex justify-center items-center
      text-center
      font-['Satoshi']
      text-[12px] md:text-[14.408px]
      not-italic
      font-medium
      leading-normal
      tracking-[-0.432px]
      transition-all duration-300

      ${
        currentPage === "/memori"
          ? `
            px-3 md:px-[16px] py-1.5 md:py-[8px]
            gap-1 md:gap-[12.732px]
            rounded-[12px]
            text-[#F5F5F5]
            shadow-[0_185px_52px_0_rgba(62,24,197,0),0_119px_47px_0_rgba(62,24,197,0.03),0_67px_40px_0_rgba(62,24,197,0.10),0_30px_30px_0_rgba(62,24,197,0.17),0_7px_16px_0_rgba(62,24,197,0.20)]
          `
          : `
            px-2 md:px-[6px] py-1 md:py-[4px]
            gap-[10px]
            text-[#505050]
            hover:text-[#303030]
          `
      }
    `}
          >
            Memori
          </button>

          <button
            onClick={() => navigate("/jurnal")}
            className={`flex items-center justify-center px-2 py-1 text-center font-['Satoshi'] text-[12px] font-medium tracking-[-0.432px] transition-all duration-300 md:px-[6px] md:py-[4px] md:text-[14.408px] ${
              currentPage === "/jurnal"
                ? "rounded-[12px] bg-[#6C40E5] px-3 py-1.5 text-[#F5F5F5] shadow-[0_7px_16px_rgba(62,24,197,0.20)] md:px-[16px] md:py-[8px]"
                : "text-[#505050] hover:text-[#303030]"
            }`}
          >
            Jurnal
          </button>
        </div>

        <a
          href="http://clips.id/effort"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background:
              "radial-gradient(44.33% 44.33% at 50.2% 0%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.00) 100%), #6C40E5",
          }}
          className="
    group
    flex
    px-3 md:px-[16px] py-1.5 md:py-[12px]
    justify-center
    items-center
    gap-1 md:gap-[12.732px]
    rounded-[12px]
    text-[#F5F5F5]
    text-center
    font-['Satoshi']
    text-[12px] md:text-[16px]
    not-italic
    font-medium
    leading-normal
    tracking-tight md:tracking-[-0.48px]
    shadow-[0_185px_52px_0_rgba(62,24,197,0),0_119px_47px_0_rgba(62,24,197,0.03),0_67px_40px_0_rgba(62,24,197,0.10),0_30px_30px_0_rgba(62,24,197,0.17),0_7px_16px_0_rgba(62,24,197,0.20)]
    transition-all
    duration-300
    hover:-translate-y-0.5
  "
        >
          Lihat Effort
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
          </svg>
        </a>
      </div>

      {showMemoriReminder && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-5 backdrop-blur-sm"
          role="presentation"
          onClick={() => setShowMemoriReminder(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-left shadow-2xl animate-slide-up"
            role="dialog"
            aria-modal="true"
            aria-labelledby="memori-reminder-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="mb-2 font-['Satoshi'] text-xs font-bold uppercase tracking-[0.18em] text-[#6C40E5]">
              Sebelum masuk
            </p>
            <h2
              id="memori-reminder-title"
              className="font-['Satoshi'] text-xl font-bold leading-tight text-gray-900"
            >
              Halaman Memori cukup berat
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Isinya kumpulan memori kita dari awal sampai sekarang, termasuk
              foto dan video. Pastikan koneksi internetmu cukup stabil sebelum
              melanjutkan.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowMemoriReminder(false)}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 font-['Satoshi'] text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMemoriReminder(false);
                  navigate("/memori");
                }}
                className="flex-1 rounded-xl bg-[#6C40E5] px-4 py-3 font-['Satoshi'] text-sm font-medium text-white transition-colors hover:bg-[#5930c8]"
              >
                Lanjut ke Memori
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;

import { useLocation, useNavigate } from "react-router-dom";
import logoRara from "../assets/logo-rara.png";
import logoFaiz from "../assets/logo-faiz.png";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = location.pathname;

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
            onClick={() => navigate("/memori")}
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
        </div>

        <a
          href="https://drive.google.com/"
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
    </nav>
  );
}

export default Navbar;

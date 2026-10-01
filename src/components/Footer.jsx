import { Link } from "react-router-dom";
import footerImage from "../assets/Footer-Image.png";
import heartImage from "../assets/hati.png";

function Footer() {
  return (
    <footer className="w-full text-white">
      <div className="mx-auto w-full max-w-[1344px] overflow-hidden">
        <img
          src={footerImage}
          alt="Thank you, sayang"
          className="block h-auto w-full"
        />
      </div>

      {/* Navigasi Footer (5 Kolom Penuh) */}
      <div className="grid min-h-[58px] grid-cols-5 border-t border-[#dedede] bg-white text-[#292929]">
        <Link
          to="/poin-inti"
          className="flex items-center justify-center border-r border-[#e4e4e4] px-2 py-4 text-center font-['Satoshi'] text-[11px] transition-colors hover:bg-[#f4f0ff] md:px-3 md:text-sm"
        >
          Poin Inti
        </Link>
        <Link
          to="/momen"
          className="flex items-center justify-center border-r border-[#e4e4e4] px-2 py-4 text-center font-['Satoshi'] text-[11px] transition-colors hover:bg-[#f4f0ff] md:px-3 md:text-sm"
        >
          Momen
        </Link>
        <Link
          to="/memori"
          className="flex items-center justify-center border-r border-[#e4e4e4] px-2 py-4 text-center font-['Satoshi'] text-[11px] transition-colors hover:bg-[#f4f0ff] md:px-3 md:text-sm"
        >
          Memori
        </Link>
        <Link
          to="/jurnal"
          className="flex items-center justify-center border-r border-[#e4e4e4] px-2 py-4 text-center font-['Satoshi'] text-[11px] transition-colors hover:bg-[#f4f0ff] md:px-3 md:text-sm"
        >
          Jurnal
        </Link>
        <Link
          to="/agenda"
          className="flex items-center justify-center px-2 py-4 text-center font-['Satoshi'] text-[11px] transition-colors hover:bg-[#f4f0ff] md:px-3 md:text-sm"
        >
          Agenda
        </Link>
      </div>

      {/* Made with Faiz Fauzan (Full Width dengan Border) */}
      <div className="flex w-full items-center justify-center gap-1.5 border-t border-[#dedede] bg-white px-4 py-4 text-center font-['Satoshi'] text-xs text-[#292929] md:text-sm">
        <span>Made with</span>
        <img src={heartImage} alt="love" className="h-6 w-6 object-contain md:h-8 md:w-8" />
        <span>By Faiz Fauzan in Malang.</span>
      </div>
    </footer>
  );
}

export default Footer;

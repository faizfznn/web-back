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

      <div className="grid min-h-[58px] grid-cols-3 border-t border-[#dedede] bg-white text-[#292929] md:grid-cols-4">
        <Link
          to="/poin-inti"
          className="flex items-center justify-center border-r border-[#e4e4e4] px-3 py-4 text-center font-['Satoshi'] text-[11px] transition-colors hover:bg-[#f4f0ff] md:text-sm"
        >
          Poin Inti
        </Link>
        <Link
          to="/memori"
          className="flex items-center justify-center border-r border-[#e4e4e4] px-3 py-4 text-center font-['Satoshi'] text-[11px] transition-colors hover:bg-[#f4f0ff] md:text-sm"
        >
          Memori
        </Link>
        <Link
          to="/jurnal"
          className="flex items-center justify-center border-r border-[#e4e4e4] px-3 py-4 text-center font-['Satoshi'] text-[11px] transition-colors hover:bg-[#f4f0ff] md:text-sm"
        >
          Jurnal
        </Link>
        <div className="col-span-3 flex items-center justify-center gap-1.5 px-3 py-2 text-center font-['Satoshi'] text-[10px] md:col-span-1 md:text-sm">
          <span>Made with</span>
          <img src={heartImage} alt="love" className="h-8 w-8 object-contain" />
          <span>By Faiz Fauzan in Malang.</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

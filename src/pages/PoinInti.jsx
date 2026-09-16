import { useState } from "react";
import handshakeImg from "../assets/handshake.png";

function PoinInti() {
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // Pakai Formspree untuk notifikasi Email
  // const FORMSPREE_ID = "xyeyvvey";

  // Pakai CallMeBot API untuk ngirim pesen WA
  // 1. Add nomor +34 693 54 27 68 ke kontak HP
  // 2. Kirim chat WA ke nomor diatas dengan teks: I allow callmebot to send me messages
  // 3. Bot akan bales dengan ngasi API Key.
  // 4. Masukin nomor Saya (kode negara, contoh 628...) dan API Key ke bawah ini:
  const WA_PHONE = "YOUR_PHONE_NUMBER"; // contoh: "6287874690756"
  const WA_API_KEY = "YOUR_API_KEY"; // contoh: "123456"

  const handleChoice = async (choice) => {
    const timestamp = new Date().toLocaleString("id-ID");
    const message = `Pilihan Rara: **${choice}** pada ${timestamp}`;

    // Set pesan modal sesuai pilihan
    if (choice === "Mau") {
      setModalMessage(
        "Terima kasih sayang sudah mau ngasih kesempatan lagi. Faiz janji bakal jadi tempat pulang yang terbaik buat Rara 🤍",
      );
    } else {
      setModalMessage(
        "Gak apa-apa, Faiz ngerti kok. Take your time ya. Faiz akan selalu ada di sini nunggu Rara siap 🤍",
      );
    }
    setShowModal(true);

    // Kirim notifikasi diam-diam ke WhatsApp dan Email secara bersamaan (parallel)
    const notifyPromises = [];

    if (WA_PHONE !== "YOUR_PHONE_NUMBER" && WA_API_KEY !== "YOUR_API_KEY") {
      const waUrl = `https://api.callmebot.com/whatsapp.php?phone=${WA_PHONE}&text=${encodeURIComponent(message)}&apikey=${WA_API_KEY}`;
      notifyPromises.push(
        fetch(waUrl, { method: "GET", mode: "no-cors" }).catch((err) =>
          console.error("Gagal kirim WA:", err),
        ),
      );
    }

    if (FORMSPREE_ID !== "YOUR_FORMSPREE_ID_HERE") {
      notifyPromises.push(
        fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: `Jawaban Rara: ${choice}`,
            pesan: message,
          }),
        }).catch((err) => console.error("Gagal kirim Email:", err)),
      );
    }

    if (notifyPromises.length > 0) {
      await Promise.allSettled(notifyPromises);
    } else {
      console.log(
        "Nomor WA/API Key atau Formspree ID belum disetel. Pesan simulasi:",
        message,
      );
    }
  };

  return (
    <>
      <div className="flex flex-col items-center text-center animate-fade-in-up w-full max-w-3xl mx-auto px-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 pl-2 pr-3 py-2 rounded-full bg-white border border-[#DCDCDC] mb-8 md:mb-10 hover:shadow-md transition-shadow cursor-default mt-8 md:mt-0">
          <span className="inline-flex items-center justify-center rounded-full bg-[#6C40E5] px-2 py-1 text-center font-['Satoshi'] text-[10px] md:text-[12px] font-medium leading-normal tracking-[0.24px] text-white shadow-[0_7px_16px_0_rgba(62,24,197,0.20)]">
            Baru
          </span>

          <span className="font-['Satoshi'] text-[12px] md:text-[14px] font-medium leading-[100%] tracking-[-0.28px] text-[#505050]">
            Versi Terbaik dari Diri Faiz
          </span>
        </div>

        {/* Heading */}
        <h1 className="mb-4 md:mb-6 text-center font-['Satoshi'] text-5xl sm:text-6xl md:text-[100px] font-bold leading-tight md:leading-[110px] tracking-tight md:tracking-[-5px] bg-black bg-clip-text text-transparent">
          Pilihan di Tangan Kamu
        </h1>

        {/* Description */}
        <p className="mb-10 md:mb-14 max-w-2xl text-center font-['Satoshi'] text-base md:text-[20px] font-medium leading-relaxed md:leading-[145%] tracking-[-0.6px] text-[#6A6A6A]">
          Faiz sudah Evaluasi diri, perbaiki kesalahan, dan siap menjadi tempat
          bersandar dan tempat pulang yang paling tepat
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center">
          <button
            onClick={() => handleChoice("Mau")}
            className="w-full sm:w-auto h-[61px] px-6 md:px-8 py-4 rounded-2xl flex justify-center items-center gap-[12.73px] text-white text-center font-medium text-[16px] md:text-[20px] tracking-[-0.6px] bg-[#6C40E5] shadow-[0_7px_16px_0_rgba(62,24,197,0.20),0_30px_30px_0_rgba(62,24,197,0.17),0_67px_40px_0_rgba(62,24,197,0.10),0_119px_47px_0_rgba(62,24,197,0.03)] hover:-translate-y-1 transition-all duration-300 group"
            style={{
              fontFamily: "Satoshi, sans-serif",
              backgroundImage:
                "radial-gradient(44.33% 44.33% at 50.2% 0%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.00) 100%), #6C40E5",
            }}
          >
            Mau, pulang ke rumah lagi
            <span className="group-hover:scale-125 transition-transform">
              🤍
            </span>
          </button>

          <button
            onClick={() => handleChoice("Masih butuh waktu")}
            className="w-full sm:w-auto h-[61px] px-6 md:px-8 py-4 rounded-2xl flex justify-center items-center gap-[10px] text-black text-center font-medium text-[16px] md:text-[20px] tracking-[-0.6px] shadow-[0_2px_5px_0_rgba(0,0,0,0.04),0_9px_9px_0_rgba(0,0,0,0.03),0_20px_12px_0_rgba(0,0,0,0.02),0_35px_14px_0_rgba(0,0,0,0.01)] hover:-translate-y-1 transition-all duration-300"
            style={{
              fontFamily: "Satoshi, sans-serif",
              backgroundImage:
                "linear-gradient(0deg, #FFF 25.81%, #F0F0F0 125.41%)",
            }}
          >
            Masih butuh waktu / Belum bisa
          </button>
        </div>
        <div className="mt-8 mb-6 rounded-xl border border-[#E6DFFF] bg-[#F7F4FF] px-4 py-3 text-left">
          <span className="font-['Satoshi'] text-[11px] font-bold tracking-[0.16em] text-[#6C40E5]">
            Reminder
          </span>
          <p className="mt-1 font-['Satoshi'] text-xs leading-relaxed text-[#5B526F]">
            Kalau enggak mau jawab di web, tapi mau ngobrol langsung terkait
            ini, bisa tunggu Faiz berhenti atau sampai di tempat tujuan, ya.
          </p>
        </div>
      </div>

      {/* Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[10px] w-full max-w-md shadow-[0_15px_30px_rgba(0,0,0,0.15)] transform scale-100 animate-slide-up text-center relative border border-gray-100 overflow-hidden">
            {/* Gambar full-width edge-to-edge */}
            <img
              src={handshakeImg}
              alt="Handshake"
              className="w-full h-48 object-cover"
            />

            <div className="p-8">
              <div className="mb-6 rounded-xl border border-[#E6DFFF] bg-[#F7F4FF] px-4 py-3 text-left">
                <span className="font-['Satoshi'] text-[11px] font-bold uppercase tracking-[0.16em] text-[#6C40E5]">
                  Reminder
                </span>
                <p className="mt-1 font-['Satoshi'] text-xs leading-relaxed text-[#5B526F]">
                  Kalau mau kasih alasannya, kita bisa ngobrol langsung setelah
                  Faiz berhenti atau sampai di lokasi tujuan.
                </p>
              </div>
              <h3 className="text-[24px] font-bold text-gray-800 font-['Satoshi'] mb-4">
                Pesan Terkirim
              </h3>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed font-['Satoshi']">
                {modalMessage}
              </p>
              <button
                onClick={() => setShowModal(false)}
                className="flex w-full h-[55px] justify-center items-center gap-[10px] rounded-[10px] bg-[#6C40E5] shadow-[0_20px_40px_0_rgba(108,64,229,0.25)] hover:scale-105 transition-transform text-white font-['Satoshi'] text-[16px] font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PoinInti;

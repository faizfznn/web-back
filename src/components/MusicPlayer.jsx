import { useEffect, useRef } from "react";

const SONG_URL = "/Sal_Priadi_Rumah.mp3";

function MusicPlayer() {
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const tryPlay = () => {
      audio
        .play()
        .then(removeInteractionListeners)
        .catch(() => {});
    };
    const removeInteractionListeners = () => {
      window.removeEventListener("pointerdown", tryPlay);
      window.removeEventListener("keydown", tryPlay);
      window.removeEventListener("touchstart", tryPlay);
    };

    window.addEventListener("pointerdown", tryPlay, { passive: true });
    window.addEventListener("keydown", tryPlay);
    window.addEventListener("touchstart", tryPlay, { passive: true });
    tryPlay();

    return () => {
      audio.pause();
      removeInteractionListeners();
    };
  }, []);

  return <audio ref={audioRef} src={SONG_URL} autoPlay preload="auto" />;
}

export default MusicPlayer;

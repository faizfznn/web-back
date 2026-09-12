import VIDEO_1 from "./video-1.mp4";
import VIDEO_2 from "./video-2.mp4";
import FOTO_1 from "./foto-1.jpg";
import FOTO_2 from "./foto-2.jpg";
import FOTO_3 from "./foto-3.jpg";
import FOTO_4 from "./foto-4.jpg";
import FOTO_5 from "./foto-5.jpg";
import FOTO_6 from "./foto-6.jpg";
import FOTO_7 from "./foto-7.jpg";

const MEMORI_MEDIA = [
  { src: FOTO_2, title: "MC Bareng", caption: "Kamu cantik banget sayang" },
  {
    src: VIDEO_2,
    mediaType: "video",
    title: "Video Awal Kamu Mengirim Ke Aku",
    caption: "Memperagakan Emot 💁🏻",
  },
  { src: FOTO_1, title: "Rara Nakal #1", caption: "Faiz Request Emot Fuck" },
  { src: FOTO_3, title: "Study Date #2", caption: "Gutenham kesayangan rara" },
  {
    src: FOTO_7,
    title: "Pulang Study Date #1",
    caption: "Aku sangat happy, kamu pinter sekali",
  },
  { src: FOTO_4, title: "Wallpaper Akuh", caption: "😘" },
  {
    src: FOTO_5,
    title: "Gelang lego aku dipaakai kamu",
    caption: "Faiz Happy Sekali",
  },
  {
    src: FOTO_6,
    title: "Memegang tangan kamu",
    caption: "Perasaannya getar tegang",
  },

  {
    src: VIDEO_1,
    mediaType: "video",
    title: "Merayakan Ultah Aku",
    caption: "Aku di prank",
  },
];

const ROTATION_CLASSES = [
  "-rotate-12",
  "-rotate-6",
  "-rotate-3",
  "rotate-2",
  "rotate-3",
  "rotate-6",
  "rotate-12",
];

const LAYOUT_CLASSES = [
  "-translate-x-4 -translate-y-5 -mx-2",
  "translate-x-4 translate-y-3 -mx-2",
  "-translate-x-2 translate-y-6 -mx-3",
  "translate-x-3 -translate-y-4 -mx-3",
  "translate-y-1 -mx-4",
  "-translate-y-6 mx-1",
  "translate-x-5 translate-y-5 -mx-3",
  "-translate-x-5 -translate-y-2 -mx-2",
  "translate-x-2 -translate-y-7 -mx-4",
  "-translate-x-3 translate-y-4 mx-1",
  "translate-y-7 -mx-2",
  "-translate-y-4 -mx-3",
];

function getRandomRotation() {
  return ROTATION_CLASSES[Math.floor(Math.random() * ROTATION_CLASSES.length)];
}

function getRandomLayout() {
  return LAYOUT_CLASSES[Math.floor(Math.random() * LAYOUT_CLASSES.length)];
}

export {
  MEMORI_MEDIA,
  ROTATION_CLASSES,
  getRandomRotation,
  LAYOUT_CLASSES,
  getRandomLayout,
};

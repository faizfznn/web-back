import FOTO_1 from "./foto-1.png";
import FOTO_2 from "./foto-2.jpeg";
import FOTO_3 from "./foto-3.JPG";
import FOTO_4 from "./foto-4.JPG";
import FOTO_5 from "./foto-5.JPG";
import FOTO_6 from "./foto-6.JPG";
import FOTO_7 from "./foto-7.JPG";
import FOTO_8 from "./foto-8.JPG";
import FOTO_9 from "./foto-9.JPG";
import FOTO_10 from "./foto-10.JPG";
import FOTO_11 from "./foto-11.png";
import FOTO_12 from "./foto-12.png";
import FOTO_13 from "./foto-13.jpeg";
import FOTO_14 from "./foto-14.jpg";
import VIDEO_1 from "./video-1.mp4";

const MEMORI_MEDIA = [
  { src: FOTO_1, title: "Happy Girlfriend Day", caption: "💖" },
  { src: FOTO_2, title: "Senyum bareng terus ya", caption: "✨🌻💛" },
  { src: FOTO_3, title: "Selalu sama kamu", caption: "🫶🏻🫶🏻🫶🏻" },
  { src: FOTO_4, title: "Memori #4", caption: "💙💜🤎" },
  { src: FOTO_5, title: "Memori #5", caption: "✨🤍✨" },
  { src: FOTO_6, title: "Memori #6", caption: "🌻💛🌻" },
  { src: FOTO_7, title: "Memori #7", caption: "🫶🏻💖🫶🏻" },
  { src: FOTO_8, title: "Memori #8", caption: "💙🤍💙" },
  { src: FOTO_9, title: "Memori #9", caption: "✨💜✨" },
  { src: FOTO_10, title: "Memori #10", caption: "🤎🖤🤍" },
  { src: FOTO_11, title: "Memori #11", caption: "💖🌻💖" },
  { src: FOTO_12, title: "Memori #12", caption: "🫶🏻✨🫶🏻" },
  { src: FOTO_13, title: "Memori #13", caption: "💛🤍💛" },
  { src: FOTO_14, title: "Memori #14", caption: "💙💜💙" },
  { src: VIDEO_1, mediaType: "video", title: "Memori video", caption: "🎞️💖" },
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
  FOTO_1,
  FOTO_2,
  FOTO_3,
  FOTO_4,
  FOTO_5,
  FOTO_6,
  FOTO_7,
  FOTO_8,
  FOTO_9,
  FOTO_10,
  FOTO_11,
  FOTO_12,
  FOTO_13,
  FOTO_14,
  VIDEO_1,
  MEMORI_MEDIA,
  ROTATION_CLASSES,
  getRandomRotation,
  LAYOUT_CLASSES,
  getRandomLayout,
};

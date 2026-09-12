// import React from "react";
import { motion } from "framer-motion";

function PhotoCard({
  imageUrl,
  mediaType = "image",
  title,
  caption,
  rotationClass,
  extraClasses = "",
  constraintsRef,
  zIndex,
  onBringToFront,
}) {
  return (
    <motion.div
      drag
      dragConstraints={constraintsRef}
      onPointerDown={onBringToFront}
      whileDrag={{ scale: 1.05, cursor: "grabbing" }}
      style={{ zIndex }}
      className={`group relative w-full max-w-48 md:max-w-56 bg-white p-3 pb-5 shadow-[0_10px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:rotate-0 hover:-translate-y-2 transition-shadow duration-300 transition-transform cursor-grab rounded-sm border border-gray-100 ${rotationClass} ${extraClasses}`}
    >
      <div className="aspect-[4/5] bg-gray-100 w-full mb-3 overflow-hidden rounded-sm relative pointer-events-none">
        {mediaType === "video" ? (
          <video
            src={imageUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover transition-transform duration-700"
          />
        ) : (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700"
          />
        )}
      </div>
      <div className="text-left w-full pointer-events-none">
        <p className="text-[14px] font-bold text-gray-800 font-['Satoshi'] leading-snug">
          {title}
        </p>
        <div className="text-[10px] mt-1 tracking-widest">{caption}</div>
      </div>
    </motion.div>
  );
}

export default PhotoCard;

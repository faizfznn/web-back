import { useRef, useState } from "react";
import PhotoCard from "../components/PhotoCard";
import {
  getRandomLayout,
  getRandomRotation,
  MEMORI_MEDIA,
} from "../assets/memori";

function Memori() {
  const constraintsRef = useRef(null);

  const [memories] = useState(() =>
    MEMORI_MEDIA.map((memory, index) => ({
      ...memory,
      id: index + 1,
      rotationClass: getRandomRotation(),
      layoutClass: getRandomLayout(),
    })),
  );
  const [maxZIndex, setMaxZIndex] = useState(10);
  const [zIndexes, setZIndexes] = useState(() =>
    Object.fromEntries(memories.map((memory, index) => [memory.id, index + 1])),
  );

  const bringToFront = (id) => {
    setMaxZIndex((prev) => prev + 1);
    setZIndexes((prev) => ({ ...prev, [id]: maxZIndex + 1 }));
  };

  return (
    <div
      className="w-full relative min-h-[70vh] flex items-center justify-center animate-fade-in"
      ref={constraintsRef}
    >
      <div className="relative w-full px-10 mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-x-0 gap-y-0 py-10 md:py-16 mt-10 md:mt-0 justify-items-center">
        {memories.map((memory) => (
          <PhotoCard
            key={memory.id}
            imageUrl={memory.src}
            mediaType={memory.mediaType}
            flipVideo={memory.flipVideo}
            title={memory.title}
            caption={memory.caption}
            rotationClass={`${memory.rotationClass} ${memory.layoutClass}`}
            extraClasses={memory.extraClasses}
            constraintsRef={constraintsRef}
            zIndex={zIndexes[memory.id]}
            onBringToFront={() => bringToFront(memory.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default Memori;

import React, { useRef, useState } from 'react';
import PhotoCard from '../components/PhotoCard';

function Memori() {
  const constraintsRef = useRef(null);
  
  // State for z-index management
  const [maxZIndex, setMaxZIndex] = useState(10);
  const [zIndexes, setZIndexes] = useState({ 1: 1, 2: 2, 3: 3 });

  const bringToFront = (id) => {
    setMaxZIndex(prev => prev + 1);
    setZIndexes(prev => ({ ...prev, [id]: maxZIndex + 1 }));
  };

  const memories = [
    {
      id: 1,
      imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1000&auto=format&fit=crop",
      title: "Happy Girlfriend Day 💖",
      caption: "💙💜🤎🖤🤍",
      rotationClass: "-rotate-6"
    },
    {
      id: 2,
      imageUrl: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=1000&auto=format&fit=crop",
      title: "Senyum bareng terus ya",
      caption: "✨🌻💛",
      rotationClass: "rotate-3",
      extraClasses: "md:-mt-12"
    },
    {
      id: 3,
      imageUrl: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=1000&auto=format&fit=crop",
      title: "Selalu sama kamu",
      caption: "🫶🏻🫶🏻🫶🏻",
      rotationClass: "-rotate-3",
      extraClasses: "md:mt-16 md:-ml-8"
    }
  ];

  return (
    <div className="w-full relative min-h-[70vh] flex items-center justify-center animate-fade-in" ref={constraintsRef}>
      <div className="relative w-full max-w-4xl mx-auto flex flex-wrap justify-center items-center gap-8 py-10 md:py-20 mt-10 md:mt-0">
        {memories.map((memory) => (
          <PhotoCard 
            key={memory.id}
            imageUrl={memory.imageUrl}
            title={memory.title}
            caption={memory.caption}
            rotationClass={memory.rotationClass}
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

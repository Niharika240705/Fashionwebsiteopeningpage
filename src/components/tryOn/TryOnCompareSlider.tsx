import { useRef, useState } from 'react';
import { MoveHorizontal } from 'lucide-react';

interface TryOnCompareSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
}

/**
 * Classic drag-to-reveal before/after comparison. The "after" (AI result) image fills the
 * frame; a clipped copy of the "before" (original photo) is revealed to the left of the handle.
 */
export function TryOnCompareSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = 'Before',
  afterLabel = 'After',
}: TryOnCompareSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [position, setPosition] = useState(50);

  function updateFromClientX(clientX: number) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none touch-none cursor-ew-resize"
      onPointerDown={(e) => {
        draggingRef.current = true;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        updateFromClientX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (draggingRef.current) updateFromClientX(e.clientX);
      }}
      onPointerUp={(e) => {
        draggingRef.current = false;
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      }}
    >
      <img src={afterSrc} alt={afterLabel} className="absolute inset-0 w-full h-full object-cover" draggable={false} />

      <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
        <img
          src={beforeSrc}
          alt={beforeLabel}
          draggable={false}
          className="absolute inset-0 h-full object-cover"
          style={{ width: position > 0 ? `${(100 / position) * 100}%` : '100%', maxWidth: 'none' }}
        />
      </div>

      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none" style={{ left: `${position}%` }}>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-black">
          <MoveHorizontal size={14} />
        </div>
      </div>

      <span className="absolute top-2 left-2 text-[10px] uppercase tracking-widest bg-black/60 text-white px-2 py-1">
        {beforeLabel}
      </span>
      <span className="absolute top-2 right-2 text-[10px] uppercase tracking-widest bg-black/60 text-white px-2 py-1">
        {afterLabel}
      </span>
    </div>
  );
}

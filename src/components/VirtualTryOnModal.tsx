import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Camera, CameraOff, X, ZoomIn, ZoomOut } from 'lucide-react';
import { ProductSummary } from '../types/product';

interface VirtualTryOnModalProps {
  isOpen: boolean;
  product: ProductSummary | null;
  onClose: () => void;
}

/**
 * Camera-based virtual try-on MVP:
 * requests front-camera permission, mirrors the feed, and overlays the garment image
 * on the torso with scale controls. Not a physics-accurate AR fit.
 */
export function VirtualTryOnModal({ isOpen, product, onClose }: VirtualTryOnModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [scale, setScale] = useState(1);
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    let cancelled = false;

    async function startCamera() {
      setError(null);
      setReady(false);
      setScale(1);
      setOffsetY(0);

      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera access is not supported in this browser.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch (err: any) {
        if (err?.name === 'NotAllowedError') {
          setError('Camera permission denied. Allow camera access to try clothes on.');
        } else {
          setError(err?.message || 'Unable to start the camera.');
        }
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [isOpen]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setReady(false);
  }

  const garmentImage = product?.images?.[0];

  return (
    <AnimatePresence>
      {isOpen && product && (
        <>
          <motion.div
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[91] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="w-full max-w-lg bg-white overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-black/10">
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-black/45">Virtual try-on</p>
                  <h2 className="text-sm font-medium line-clamp-1">{product.name}</h2>
                </div>
                <button type="button" onClick={onClose} className="p-2 hover:bg-black/5" aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              <div className="relative aspect-[3/4] bg-black overflow-hidden">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                />

                {ready && garmentImage && (
                  <img
                    src={garmentImage}
                    alt=""
                    className="absolute left-1/2 pointer-events-none mix-blend-multiply opacity-90"
                    style={{
                      width: `${58 * scale}%`,
                      top: `${18 + offsetY}%`,
                      transform: 'translateX(-50%)',
                    }}
                  />
                )}

                {!ready && !error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3">
                    <Camera className="animate-pulse" />
                    <p className="text-sm">Requesting camera permission…</p>
                  </div>
                )}

                {error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3 px-6 text-center">
                    <CameraOff />
                    <p className="text-sm">{error}</p>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                <p className="text-xs text-black/50">
                  Preview only — scale and position the garment. Final fit depends on the retailer.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!ready}
                    onClick={() => setScale((s) => Math.max(0.6, s - 0.1))}
                    className="flex-1 inline-flex items-center justify-center gap-2 border border-black px-3 py-2 text-xs uppercase tracking-widest disabled:opacity-40"
                  >
                    <ZoomOut size={14} /> Smaller
                  </button>
                  <button
                    type="button"
                    disabled={!ready}
                    onClick={() => setScale((s) => Math.min(1.8, s + 0.1))}
                    className="flex-1 inline-flex items-center justify-center gap-2 border border-black px-3 py-2 text-xs uppercase tracking-widest disabled:opacity-40"
                  >
                    <ZoomIn size={14} /> Larger
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!ready}
                    onClick={() => setOffsetY((y) => Math.max(-12, y - 4))}
                    className="flex-1 border border-black/20 px-3 py-2 text-xs uppercase tracking-widest disabled:opacity-40"
                  >
                    Move up
                  </button>
                  <button
                    type="button"
                    disabled={!ready}
                    onClick={() => setOffsetY((y) => Math.min(24, y + 4))}
                    className="flex-1 border border-black/20 px-3 py-2 text-xs uppercase tracking-widest disabled:opacity-40"
                  >
                    Move down
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

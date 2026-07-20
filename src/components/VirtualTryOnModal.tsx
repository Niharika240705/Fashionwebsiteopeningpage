import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Camera,
  Download,
  ImageUp,
  Info,
  Loader2,
  LogOut,
  RotateCcw,
  Sparkles,
  Video,
  X,
} from 'lucide-react';
import { ProductSummary } from '../types/product';
import { requestTryOn } from '../utils/api';
import { trackEvent } from '../utils/analytics';
import { TryOnCameraStage } from './tryOn/TryOnCameraStage';
import { TryOnCompareSlider } from './tryOn/TryOnCompareSlider';

interface VirtualTryOnModalProps {
  isOpen: boolean;
  product: ProductSummary | null;
  onClose: () => void;
}

type Stage = 'source' | 'preview' | 'generating' | 'result';
type SourceMode = 'camera' | 'upload';
type SizeHint = 'S' | 'M' | 'L' | 'XL';

const SIZE_OPTIONS: SizeHint[] = ['S', 'M', 'L', 'XL'];

/**
 * Premium virtual try-on studio.
 *
 * Honest by design: the live camera view provides real-time MediaPipe pose/segmentation
 * guidance to help frame a full-body shot — it does NOT draw the garment on the video feed.
 * The photorealistic result is produced by a generative AI model on the backend
 * (POST /api/try-on -> Replicate/fal.ai IDM-VTON) from a single captured/uploaded photo.
 */
export function VirtualTryOnModal({ isOpen, product, onClose }: VirtualTryOnModalProps) {
  const [stage, setStage] = useState<Stage>('source');
  const [sourceMode, setSourceMode] = useState<SourceMode>('camera');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultMeta, setResultMeta] = useState<{
    mode: 'photorealistic' | 'demo';
    provider: string;
    message?: string;
  } | null>(null);
  const [sizeHint, setSizeHint] = useState<SizeHint>('M');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStage('source');
    setSourceMode('camera');
    setFacingMode('user');
    setCapturedImage(null);
    setResultImage(null);
    setResultMeta(null);
    setErrorMsg(null);
    setSizeHint('M');
  }, [isOpen, product?.id]);

  if (!product) return null;

  const garmentImage = product.images?.[0];

  function handleCapture(dataUrl: string) {
    setCapturedImage(dataUrl);
    setErrorMsg(null);
    setStage('preview');
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please choose an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCapturedImage(reader.result);
        setErrorMsg(null);
        setStage('preview');
      }
    };
    reader.onerror = () => setErrorMsg('Could not read that photo. Please try another.');
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleRetake() {
    setCapturedImage(null);
    setResultImage(null);
    setResultMeta(null);
    setErrorMsg(null);
    setStage('source');
  }

  async function handleGenerate() {
    if (!capturedImage || !product) return;
    if (!garmentImage) {
      setErrorMsg('This product has no garment image available for try-on.');
      return;
    }

    setGenerating(true);
    setStage('generating');
    setErrorMsg(null);

    try {
      const response = await requestTryOn({
        productId: product.id,
        garmentImageUrl: garmentImage,
        humanImageBase64: capturedImage,
        category: product.subcategory || product.category,
        sizeHint,
        garmentDescription: [product.brand, product.name].filter(Boolean).join(' '),
      });

      setResultImage(response.resultImageUrl);
      setResultMeta({ mode: response.mode, provider: response.provider, message: response.message });
      setStage('result');
      trackEvent('try_on_generated', {
        productId: product.id,
        category: product.category,
        mode: response.mode,
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Try-on generation failed. Please try again.');
      setStage('preview');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveImage() {
    if (!resultImage) return;
    try {
      const res = await fetch(resultImage);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `try-on-${product?.id || 'result'}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(resultImage, '_blank', 'noopener,noreferrer');
    }
  }

  function handleClose() {
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && product && (
        <>
          <motion.div
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <div className="fixed inset-0 z-[91] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="w-full max-w-lg bg-white overflow-hidden flex flex-col max-h-[92vh]"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-black/45 flex items-center gap-1.5">
                    <Sparkles size={11} /> Photorealistic try-on
                  </p>
                  <h2 className="text-sm font-medium line-clamp-1">{product.name}</h2>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-2 hover:bg-black/5 shrink-0"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-4 py-2 bg-black/[0.03] border-b border-black/5">
                <p className="text-[11px] text-black/55 flex items-start gap-1.5 leading-snug">
                  <Info size={12} className="mt-0.5 shrink-0" />
                  AI-generated fit preview. Live camera gives real-time pose guidance to help you
                  frame the shot — the photorealistic garment render is generated from your
                  captured photo, not drawn on the live video.
                </p>
              </div>

              <div className="relative aspect-[3/4] bg-black overflow-hidden shrink-0">
                {stage === 'source' && (
                  <>
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex bg-black/50 backdrop-blur-sm">
                      <button
                        type="button"
                        onClick={() => setSourceMode('camera')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] uppercase tracking-widest ${
                          sourceMode === 'camera' ? 'bg-white text-black' : 'text-white'
                        }`}
                      >
                        <Video size={12} /> Camera
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSourceMode('upload');
                          fileInputRef.current?.click();
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] uppercase tracking-widest ${
                          sourceMode === 'upload' ? 'bg-white text-black' : 'text-white'
                        }`}
                      >
                        <ImageUp size={12} /> Upload
                      </button>
                    </div>

                    {sourceMode === 'camera' ? (
                      <TryOnCameraStage
                        facingMode={facingMode}
                        onCapture={handleCapture}
                        onSwitchCamera={() => setFacingMode((m) => (m === 'user' ? 'environment' : 'user'))}
                        canSwitchCamera
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80 hover:text-white"
                      >
                        <ImageUp size={32} />
                        <p className="text-sm">Tap to upload a full-body photo</p>
                        <p className="text-[11px] text-white/50">JPG, PNG, or WEBP</p>
                      </button>
                    )}
                  </>
                )}

                {(stage === 'preview' || stage === 'generating') && capturedImage && (
                  <>
                    <img src={capturedImage} alt="Your photo" className="absolute inset-0 w-full h-full object-cover" />
                    {stage === 'generating' && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white gap-3">
                        <Loader2 className="animate-spin" size={28} />
                        <p className="text-sm">Fitting garment…</p>
                        <p className="text-[11px] text-white/60 px-8 text-center">
                          AI is generating your photorealistic look. This can take up to a minute.
                        </p>
                      </div>
                    )}
                  </>
                )}

                {stage === 'result' && capturedImage && resultImage && (
                  <TryOnCompareSlider beforeSrc={capturedImage} afterSrc={resultImage} beforeLabel="You" afterLabel="Try-on" />
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div className="p-4 space-y-3 overflow-y-auto">
                {resultMeta?.mode === 'demo' && (
                  <div className="bg-amber-50 border border-amber-300 text-amber-800 text-[11px] px-3 py-2 leading-snug">
                    <strong className="uppercase tracking-widest">Demo mode.</strong>{' '}
                    {resultMeta.message ||
                      'This is a local composite for UI testing, not a photorealistic AI result.'}
                  </div>
                )}

                {errorMsg && (
                  <div className="bg-red-50 border border-red-300 text-red-700 text-[11px] px-3 py-2 leading-snug">
                    {errorMsg}
                  </div>
                )}

                {stage === 'source' && (
                  <p className="text-xs text-black/50">
                    Capture from your camera or upload a clear, full-body photo to try on{' '}
                    <span className="font-medium">{product.name}</span>.
                  </p>
                )}

                {(stage === 'preview' || stage === 'generating') && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-black/45">Size hint</span>
                      <div className="flex gap-1.5">
                        {SIZE_OPTIONS.map((size) => (
                          <button
                            key={size}
                            type="button"
                            disabled={generating}
                            onClick={() => setSizeHint(size)}
                            className={`w-9 h-8 text-xs border ${
                              sizeHint === size
                                ? 'bg-black text-white border-black'
                                : 'border-black/20 text-black/70'
                            } disabled:opacity-40`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={generating}
                        onClick={handleRetake}
                        className="flex-1 inline-flex items-center justify-center gap-2 border border-black/20 px-3 py-2.5 text-xs uppercase tracking-widest disabled:opacity-40"
                      >
                        <RotateCcw size={14} /> Retake
                      </button>
                      <button
                        type="button"
                        disabled={generating}
                        onClick={handleGenerate}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-black text-white px-3 py-2.5 text-xs uppercase tracking-widest disabled:opacity-50"
                      >
                        {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        {generating ? 'Generating…' : 'Generate try-on'}
                      </button>
                    </div>
                  </>
                )}

                {stage === 'result' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-black/45">Size hint</span>
                      <div className="flex gap-1.5">
                        {SIZE_OPTIONS.map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSizeHint(size)}
                            className={`w-9 h-8 text-xs border ${
                              sizeHint === size
                                ? 'bg-black text-white border-black'
                                : 'border-black/20 text-black/70'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleGenerate}
                        className="inline-flex items-center justify-center gap-2 border border-black/20 px-3 py-2.5 text-xs uppercase tracking-widest"
                      >
                        <Sparkles size={14} /> Regenerate
                      </button>
                      <button
                        type="button"
                        onClick={handleRetake}
                        className="inline-flex items-center justify-center gap-2 border border-black/20 px-3 py-2.5 text-xs uppercase tracking-widest"
                      >
                        <Camera size={14} /> New photo
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveImage}
                        className="inline-flex items-center justify-center gap-2 bg-black text-white px-3 py-2.5 text-xs uppercase tracking-widest"
                      >
                        <Download size={14} /> Save image
                      </button>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="inline-flex items-center justify-center gap-2 border border-black/20 px-3 py-2.5 text-xs uppercase tracking-widest"
                      >
                        <LogOut size={14} /> Exit try-on
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, RefreshCw, ScanFace } from 'lucide-react';
import { loadVisionTasks, VisionTasks } from '../../utils/mediapipeVision';

interface TryOnCameraStageProps {
  facingMode: 'user' | 'environment';
  onCapture: (dataUrl: string) => void;
  onSwitchCamera: () => void;
  canSwitchCamera: boolean;
}

// Pose landmark indices (BlazePose topology) used for the "full body in frame" guidance heuristic.
const LM_NOSE = 0;
const LM_LEFT_SHOULDER = 11;
const LM_RIGHT_SHOULDER = 12;
const LM_LEFT_HIP = 23;
const LM_RIGHT_HIP = 24;
const LM_LEFT_ANKLE = 27;
const LM_RIGHT_ANKLE = 28;

/**
 * Live camera stage: real-time MediaPipe Pose Landmarker (skeleton + full-body guidance) and
 * Selfie Segmentation (soft highlight) drawn over the video feed on a canvas overlay. This is
 * guidance for framing a capture — the photorealistic garment render happens after capture via
 * the backend generative try-on API, not here.
 */
export function TryOnCameraStage({
  facingMode,
  onCapture,
  onSwitchCamera,
  canSwitchCamera,
}: TryOnCameraStageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const visionRef = useRef<VisionTasks | null>(null);
  const frameCounterRef = useRef(0);
  const tintCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cancelledRef = useRef(false);

  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [guidance, setGuidance] = useState('Requesting camera permission…');
  const [fullBodyDetected, setFullBodyDetected] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      setError(null);
      setCameraReady(false);
      setGuidance('Requesting camera permission…');
      stopStream();

      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera access is not supported in this browser.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
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
          setCameraReady(true);
          setGuidance('Loading pose guidance…');
        }
      } catch (err: any) {
        if (err?.name === 'NotAllowedError') {
          setError('Camera permission denied. Allow camera access to use live capture.');
        } else {
          setError(err?.message || 'Unable to start the camera.');
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  useEffect(() => {
    if (!cameraReady) return;
    cancelledRef.current = false;

    loadVisionTasks()
      .then((tasks) => {
        if (cancelledRef.current) return;
        visionRef.current = tasks;
        setModelReady(true);
        setGuidance('Stand back so your full body is visible');
        rafRef.current = requestAnimationFrame(detectFrame);
      })
      .catch((err) => {
        console.warn('Pose guidance unavailable:', err);
        setGuidance('Live pose guidance unavailable — camera still works for capture.');
      });

    return () => {
      cancelledRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraReady]);

  function stopStream() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
    setModelReady(false);
  }

  function detectFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const vision = visionRef.current;

    if (!video || !canvas || !vision || video.readyState < 2 || !video.videoWidth) {
      rafRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      rafRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    frameCounterRef.current += 1;
    const now = performance.now();

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Mirror to match the mirrored <video> preview so the skeleton lines up visually.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    try {
      if (vision.imageSegmenter && frameCounterRef.current % 3 === 0) {
        const segResult = vision.imageSegmenter.segmentForVideo(video, now);
        const mask = segResult.confidenceMasks?.[0];
        if (mask) {
          renderSegmentationTint(mask, tintCanvasRef);
          mask.close();
        }
        segResult.confidenceMasks?.forEach((m) => {
          if (m !== mask) m.close();
        });
        segResult.categoryMask?.close();
      }

      if (tintCanvasRef.current) {
        ctx.globalAlpha = 0.35;
        ctx.drawImage(tintCanvasRef.current, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
      }

      const poseResult = vision.poseLandmarker.detectForVideo(video, now);
      const landmarks = poseResult.landmarks?.[0];

      if (landmarks && landmarks.length) {
        const drawingUtils = new vision.DrawingUtils(ctx);
        drawingUtils.drawConnectors(landmarks, vision.PoseLandmarkerCtor.POSE_CONNECTIONS, {
          color: '#22ff88',
          lineWidth: 2,
        });
        drawingUtils.drawLandmarks(landmarks, { radius: 3, color: '#22ff88', fillColor: '#22ff88' });

        const visible = (idx: number) => (landmarks[idx]?.visibility ?? 0) > 0.5;
        const fullBody =
          visible(LM_NOSE) &&
          (visible(LM_LEFT_SHOULDER) || visible(LM_RIGHT_SHOULDER)) &&
          (visible(LM_LEFT_HIP) || visible(LM_RIGHT_HIP)) &&
          (visible(LM_LEFT_ANKLE) || visible(LM_RIGHT_ANKLE));

        setFullBodyDetected(fullBody);
        setGuidance(
          fullBody
            ? 'Full body detected — hold still and capture'
            : 'Step back so your head and feet are both in frame'
        );
      } else {
        setFullBodyDetected(false);
        setGuidance('No person detected — step into frame');
      }
    } catch {
      // A single detection hiccup shouldn't interrupt the live preview loop.
    }

    ctx.restore();
    rafRef.current = requestAnimationFrame(detectFrame);
  }

  function handleCapture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = video.videoWidth;
    captureCanvas.height = video.videoHeight;
    const ctx = captureCanvas.getContext('2d');
    if (!ctx) return;
    ctx.translate(captureCanvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
    onCapture(captureCanvas.toDataURL('image/jpeg', 0.92));
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
      />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />

      {!error && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pt-10 pb-4 flex flex-col gap-3">
          <p
            className={`text-xs text-center uppercase tracking-widest ${
              fullBodyDetected ? 'text-emerald-300' : 'text-white/85'
            }`}
          >
            {cameraReady ? guidance : 'Requesting camera permission…'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleCapture}
              disabled={!cameraReady}
              className="inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 text-xs uppercase tracking-widest font-medium disabled:opacity-40"
            >
              <Camera size={14} /> Capture photo
            </button>
            {canSwitchCamera && (
              <button
                type="button"
                onClick={onSwitchCamera}
                disabled={!cameraReady}
                aria-label="Switch camera"
                className="inline-flex items-center gap-2 border border-white/40 text-white px-3 py-2.5 text-xs uppercase tracking-widest disabled:opacity-40"
              >
                <RefreshCw size={14} />
              </button>
            )}
          </div>
          {modelReady && (
            <p className="text-[10px] text-center text-white/50 flex items-center justify-center gap-1">
              <ScanFace size={11} /> Live pose guidance — capture, then AI generates the photorealistic result
            </p>
          )}
        </div>
      )}

      {!cameraReady && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3">
          <Camera className="animate-pulse" />
          <p className="text-sm">{guidance}</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3 px-6 text-center">
          <CameraOff />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Renders the selfie-segmentation confidence mask into a cached offscreen canvas as a soft
 * green tint. This is guidance only (helps the user see they're detected as foreground) — it is
 * never sent anywhere or used as the actual try-on result.
 */
function renderSegmentationTint(
  mask: { width: number; height: number; getAsFloat32Array: () => Float32Array },
  cacheRef: { current: HTMLCanvasElement | null }
) {
  const { width, height } = mask;
  if (!width || !height) return;

  if (!cacheRef.current) {
    cacheRef.current = document.createElement('canvas');
  }
  const tintCanvas = cacheRef.current;
  if (tintCanvas.width !== width || tintCanvas.height !== height) {
    tintCanvas.width = width;
    tintCanvas.height = height;
  }
  const tctx = tintCanvas.getContext('2d');
  if (!tctx) return;

  const floatData = mask.getAsFloat32Array();
  const imageData = tctx.createImageData(width, height);
  for (let i = 0; i < floatData.length; i++) {
    const confidence = floatData[i];
    const alpha = confidence > 0.5 ? Math.min(255, Math.round(confidence * 255)) : 0;
    imageData.data[i * 4] = 34;
    imageData.data[i * 4 + 1] = 255;
    imageData.data[i * 4 + 2] = 136;
    imageData.data[i * 4 + 3] = alpha;
  }
  tctx.putImageData(imageData, 0, 0);
}

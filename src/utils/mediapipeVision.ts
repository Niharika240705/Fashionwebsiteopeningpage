import type {
  DrawingUtils as DrawingUtilsClass,
  ImageSegmenter as ImageSegmenterClass,
  PoseLandmarker as PoseLandmarkerClass,
} from '@mediapipe/tasks-vision';

export interface VisionTasks {
  poseLandmarker: PoseLandmarkerClass;
  imageSegmenter: ImageSegmenterClass | null;
  DrawingUtils: typeof DrawingUtilsClass;
  PoseLandmarkerCtor: typeof PoseLandmarkerClass;
}

// Pinned to the installed npm package version so the WASM runtime always matches the JS bindings.
const TASKS_VISION_VERSION = '0.10.35';
const WASM_BASE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;
const POSE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';
const SELFIE_SEGMENTER_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.task';

let tasksPromise: Promise<VisionTasks> | null = null;

/**
 * Lazily loads MediaPipe Pose Landmarker + Selfie Segmentation exactly once per tab and keeps
 * both model instances warm in a module-level singleton, so re-opening the try-on modal reuses
 * the already-initialized models instead of re-downloading/re-compiling them.
 */
export function loadVisionTasks(): Promise<VisionTasks> {
  if (!tasksPromise) {
    tasksPromise = initVisionTasks().catch((err) => {
      tasksPromise = null; // allow retry on next call if initialization failed
      throw err;
    });
  }
  return tasksPromise;
}

async function initVisionTasks(): Promise<VisionTasks> {
  const { FilesetResolver, PoseLandmarker, ImageSegmenter, DrawingUtils } = await import(
    '@mediapipe/tasks-vision'
  );

  const fileset = await FilesetResolver.forVisionTasks(WASM_BASE_URL);

  const poseLandmarker = await PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: 'GPU' },
    runningMode: 'VIDEO',
    numPoses: 1,
  });

  // Selfie segmentation is a "nice to have" soft-highlight guide, not required for capture —
  // if it fails to load (older GPU, blocked asset host, etc.) pose guidance keeps working.
  let imageSegmenter: ImageSegmenterClass | null = null;
  try {
    imageSegmenter = await ImageSegmenter.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: SELFIE_SEGMENTER_MODEL_URL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      outputConfidenceMasks: true,
      outputCategoryMask: false,
    });
  } catch (err) {
    console.warn('Selfie segmentation model unavailable; continuing with pose guidance only.', err);
    imageSegmenter = null;
  }

  return { poseLandmarker, imageSegmenter, DrawingUtils, PoseLandmarkerCtor: PoseLandmarker };
}

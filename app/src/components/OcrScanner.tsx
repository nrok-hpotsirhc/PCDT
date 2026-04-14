import { useState, useRef, useCallback, useEffect } from 'react';
import type { Card } from '@/lib/types';
import { formatSetNumber } from '@/lib/types';
import { translateGermanName } from '@/lib/german-pokemon-names';
import { useI18n } from '@/lib/i18n';
import { loadCards } from '@/lib/data-loader';

interface OcrScannerProps {
  /** Kept for API compatibility – not used directly in scan logic. */
  cards: Card[];
  onCardDetected: (card: Card) => void;
}

/** Pokemon card aspect ratio: 63mm × 88mm ≈ 5:7 */
const CARD_RATIO = 5 / 7;
const MAX_VISIBLE_MATCHES = 5;
const NON_NAME_PREFIXES = new Set(['basis', 'basic', 'stage', 'stufe', 'evolution']);

// ── ROI definitions (fractions of card width/height) ────────────────────────
// Top-left ROI: only the actual Pokemon name area, skipping the tiny status text
// in the upper-left corner ("Basis", "Stage 1", etc.).
const NAME_ROI = { x: 0.16, y: 0.01, w: 0.68, h: 0.14 };

/**
 * Crop the center of the video frame to the Pokemon card portrait aspect ratio.
 * Returns the full card dimensions so ROIs can be extracted afterwards.
 */
function captureCardCanvas(video: HTMLVideoElement, canvas: HTMLCanvasElement): boolean {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return false;

  let cropW: number, cropH: number, cropX: number, cropY: number;
  if (vw / vh > CARD_RATIO) {
    cropH = vh;
    cropW = Math.round(vh * CARD_RATIO);
    cropX = Math.round((vw - cropW) / 2);
    cropY = 0;
  } else {
    cropW = vw;
    cropH = Math.round(vw / CARD_RATIO);
    cropX = 0;
    cropY = Math.round((vh - cropH) / 2);
  }

  canvas.width = cropW;
  canvas.height = cropH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  return true;
}

/**
 * Compute an Otsu threshold for a grayscale histogram.
 * Returns the threshold value that minimizes intra-class variance.
 */
function otsuThreshold(grayValues: number[]): number {
  const histogram = new Array<number>(256).fill(0);
  for (const v of grayValues) histogram[v]!++;

  const total = grayValues.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * histogram[i]!;

  let sumB = 0;
  let wB = 0;
  let maxVariance = 0;
  let bestThreshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t]!;
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;

    sumB += t * histogram[t]!;
    const meanB = sumB / wB;
    const meanF = (sum - sumB) / wF;
    const variance = wB * wF * (meanB - meanF) * (meanB - meanF);

    if (variance > maxVariance) {
      maxVariance = variance;
      bestThreshold = t;
    }
  }
  return bestThreshold;
}

interface ROIOptions {
  /** Upscale factor (default 3) */
  scale?: number;
}

/**
 * Extract a ROI from a source canvas into a new canvas with heavy
 * preprocessing optimised for OCR accuracy.
 *
 * Pipeline: bilinear upscale → grayscale → adaptive Otsu binarization.
 * If the ROI is predominantly dark (mean gray < 128) the result is
 * automatically inverted so Tesseract always sees dark text on white bg.
 */
function extractROI(
  src: HTMLCanvasElement,
  roi: { x: number; y: number; w: number; h: number },
  opts: ROIOptions = {},
): HTMLCanvasElement {
  const { scale = 3 } = opts;

  const sx = Math.round(roi.x * src.width);
  const sy = Math.round(roi.y * src.height);
  const sw = Math.round(roi.w * src.width);
  const sh = Math.round(roi.h * src.height);

  const roiCanvas = document.createElement('canvas');
  roiCanvas.width = sw * scale;
  roiCanvas.height = sh * scale;
  const ctx = roiCanvas.getContext('2d')!;

  // Use bilinear smoothing for natural-looking upscaled text
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, sx, sy, sw, sh, 0, 0, roiCanvas.width, roiCanvas.height);

  // ── Step 1: Convert to grayscale ──────────────────────────────────────
  const imageData = ctx.getImageData(0, 0, roiCanvas.width, roiCanvas.height);
  const d = imageData.data;

  const pixelCount = d.length / 4;
  const grayValues = new Array<number>(pixelCount);
  let graySum = 0;

  for (let i = 0; i + 3 < d.length; i += 4) {
    const gray = Math.round(0.299 * d[i]! + 0.587 * d[i + 1]! + 0.114 * d[i + 2]!);
    d[i] = d[i + 1] = d[i + 2] = gray;
    grayValues[i / 4] = gray;
    graySum += gray;
  }

  // ── Step 2: Adaptive Otsu binarization ────────────────────────────────
  const threshold = otsuThreshold(grayValues);

  // Auto-detect inversion: if the ROI is predominantly dark (mean < 128),
  // the text is likely light-on-dark and we must invert for Tesseract.
  const meanGray = graySum / pixelCount;
  const needsInvert = meanGray < 128;

  for (let i = 0; i + 3 < d.length; i += 4) {
    let bin = d[i]! > threshold ? 255 : 0;
    if (needsInvert) bin = bin === 255 ? 0 : 255;
    d[i] = d[i + 1] = d[i + 2] = bin;
  }

  ctx.putImageData(imageData, 0, 0);
  return roiCanvas;
}

/** Convert a canvas to a PNG Blob. */
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to convert canvas to blob'));
    }, 'image/png');
  });
}

/**
 * Normalize a card name for exact lookup against OCR candidates.
 */
function normalizeNameLookup(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function mergeCards(primary: Card[], secondary: Card[]): Card[] {
  const merged = new Map<string, Card>();
  for (const card of primary) merged.set(card.id, card);
  for (const card of secondary) merged.set(card.id, card);
  return Array.from(merged.values());
}

/**
 * Extract candidate name phrases from the OCR text for the name ROI.
 * Returns phrases ordered from longest to shortest.
 */
function extractNameCandidatesFromROI(raw: string): string[] {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length >= 2);

  const candidates = new Set<string>();

  for (const line of lines) {
    // Remove noise characters that Tesseract sometimes injects
    let cleaned = line
      .replace(/[|_{}[\]<>~`@#$%^&*()+=]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (cleaned.length < 2) continue;

    // Skip lines that are clearly HP indicators or numbers
    if (/^\d+\s*HP$/i.test(cleaned)) continue;
    if (/^HP\s*\d+$/i.test(cleaned)) continue;
    if (/^\d+$/.test(cleaned)) continue;

    const words = cleaned
      .split(/\s+/)
      .map((word) => word.replace(/^[^0-9A-Za-zÀ-ÿ]+|[^0-9A-Za-zÀ-ÿ'.-]+$/g, ''))
      .filter((word) => word.length > 0);

    while (words.length > 0 && NON_NAME_PREFIXES.has(normalizeNameLookup(words[0]!))) {
      words.shift();
    }

    for (let length = words.length; length >= 1; length--) {
      for (let start = 0; start + length <= words.length; start++) {
        const phrase = words.slice(start, start + length).join(' ').trim();
        if (phrase.length < 2) continue;
        if (/^\d+$/.test(phrase)) continue;
        candidates.add(phrase);
      }
    }
  }

  return Array.from(candidates).sort((a, b) => {
    const tokenDiff = b.split(/\s+/).length - a.split(/\s+/).length;
    return tokenDiff || b.length - a.length;
  });
}

function findCardsForDetectedName(
  raw: string,
  cardPool: Card[],
): { matchedName: string; cards: Card[]; candidates: string[] } | null {
  if (cardPool.length === 0) return null;

  const cardsByName = new Map<string, Card[]>();
  for (const card of cardPool) {
    const key = normalizeNameLookup(card.name);
    const existing = cardsByName.get(key);
    if (existing) existing.push(card);
    else cardsByName.set(key, [card]);
  }

  const candidates = extractNameCandidatesFromROI(raw);

  for (const candidate of candidates) {
    const variants = [candidate, translateGermanName(candidate)]
      .filter((value): value is string => Boolean(value))
      .filter((value, index, array) => array.indexOf(value) === index);

    for (const variant of variants) {
      const hits = cardsByName.get(normalizeNameLookup(variant));
      if (hits && hits.length > 0) {
        return { matchedName: variant, cards: hits, candidates };
      }
    }
  }

  return candidates.length > 0 ? { matchedName: '', cards: [], candidates } : null;
}

export function OcrScanner({ cards, onCardDetected }: OcrScannerProps) {
  const [status, setStatus] = useState<'idle' | 'camera' | 'processing' | 'result'>('idle');
  const [ocrText, setOcrText] = useState('');
  const [matchedCards, setMatchedCards] = useState<Card[]>([]);
  const [allResults, setAllResults] = useState<Card[]>([]);
  const [catalogCards, setCatalogCards] = useState<Card[]>([]);
  const [ocrQuery, setOcrQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [showAllModal, setShowAllModal] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { t, tr } = useI18n();

  const handleSelectCard = useCallback((card: Card) => {
    setShowAllModal(false);
    onCardDetected(card);
  }, [onCardDetected]);

  useEffect(() => {
    let mounted = true;

    void loadCards()
      .then((loadedCards) => {
        if (mounted) setCatalogCards(loadedCards);
      })
      .catch(() => {
        if (mounted) setCatalogCards([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 720 },
          height: { ideal: 1280 },
          aspectRatio: { ideal: CARD_RATIO },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus('camera');
    } catch {
      setError('Camera access denied. Please allow camera permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const ok = captureCardCanvas(videoRef.current, canvasRef.current);
    if (!ok) return;
    stopCamera();
    setStatus('processing');

    try {
      const { createWorker, PSM } = await import('tesseract.js');

      // Extract only the name ROI from the captured card image.
      const nameCanvas = extractROI(canvasRef.current, NAME_ROI, { scale: 3 });
      const nameBlob = await canvasToBlob(nameCanvas);

      // OCR only the name ROI – use 'deu+eng' for German card name support.
      const nameWorker = await createWorker('deu+eng');
      await nameWorker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_LINE,
      });

      const nameResult = await nameWorker.recognize(nameBlob);
      await nameWorker.terminate();

      const nameRaw = nameResult.data.text.trim();
      const searchPool = mergeCards(catalogCards, cards);
      const detectedMatch = findCardsForDetectedName(nameRaw, searchPool);
      const candidatePreview = detectedMatch?.candidates.join(' | ') ?? '–';

      const debugText = [
        `[Name ROI] ${nameRaw}`,
        `→ Kandidaten: ${candidatePreview}`,
        `→ Gültiger Name: ${detectedMatch?.matchedName || '–'}`,
      ].join('\n');
      setOcrText(debugText);
      setShowAllModal(false);

      if (detectedMatch && detectedMatch.cards.length > 0) {
        setOcrQuery(detectedMatch.matchedName);
        setMatchedCards(detectedMatch.cards.slice(0, MAX_VISIBLE_MATCHES));
        setAllResults(detectedMatch.cards);
        setTotalCount(detectedMatch.cards.length);
      } else {
        setOcrQuery('');
        setMatchedCards([]);
        setAllResults([]);
        setTotalCount(0);
      }
      setStatus('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR failed');
      setStatus('idle');
    }
  }, [cards, catalogCards, stopCamera]);

  const handleShowAll = useCallback(() => {
    if (!ocrQuery || allResults.length === 0) return;
    setShowAllModal(true);
  }, [allResults.length, ocrQuery]);

  const reset = useCallback(() => {
    stopCamera();
    setStatus('idle');
    setOcrText('');
    setMatchedCards([]);
    setAllResults([]);
    setOcrQuery('');
    setTotalCount(0);
    setShowAllModal(false);
    setLoadingAll(false);
    setError(null);
  }, [stopCamera]);

  return (
    <div className="space-y-4">
      {/* Camera view – portrait 5:7 to match Pokemon card ratio */}
      <div className="relative bg-black rounded-lg overflow-hidden mx-auto aspect-[5/7] max-w-xs">
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${status !== 'camera' ? 'hidden' : ''}`}
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <span className="text-4xl mb-3">📷</span>
            <p className="text-sm opacity-80">{t('scan.idle')}</p>
          </div>
        )}

        {status === 'processing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/70">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-3" />
            <p className="text-sm">{t('scan.analyzing')}</p>
          </div>
        )}

        {status === 'camera' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-4 border-2 border-white/60 rounded-lg" />
            {/* ROI overlay: name area (top-left) – derived from NAME_ROI */}
            <div
              className="absolute border-2 border-yellow-400/80 rounded bg-yellow-400/10"
              style={{ left: `${NAME_ROI.x * 100}%`, top: `${NAME_ROI.y * 100}%`, width: `${NAME_ROI.w * 100}%`, height: `${NAME_ROI.h * 100}%` }}
            />
            <span
              className="absolute text-yellow-300 text-[9px] font-bold"
              style={{ left: `${(NAME_ROI.x + 0.01) * 100}%`, top: `${(NAME_ROI.y + 0.01) * 100}%` }}
            >NAME</span>
            <p className="absolute bottom-3 left-0 right-0 text-center text-white text-xs opacity-70">
              {t('scan.position')}
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {status === 'idle' && (
          <button
            onClick={() => void startCamera()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            {t('scan.startCamera')}
          </button>
        )}
        {status === 'camera' && (
          <>
            <button
              onClick={() => void captureAndScan()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
            >
              {t('scan.capture')}
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
            >
              {t('scan.cancel')}
            </button>
          </>
        )}
        {(status === 'result' || status === 'processing') && (
          <button
            onClick={reset}
            className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {t('scan.again')}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* OCR Result */}
      {status === 'result' && (
        <div className="space-y-3">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('scan.ocrText')}</p>
            <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ocrText || t('scan.noText')}</pre>
          </div>

          {matchedCards.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('scan.matches')}
              </p>
              <div className="space-y-2">
                {matchedCards.map((card: Card) => (
                  <button
                    key={card.id}
                    onClick={() => handleSelectCard(card)}
                    className="w-full flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 text-left"
                  >
                    <img src={card.images.small} alt="" className="w-10 h-14 object-contain" />
                    <div>
                      <div className="text-sm font-medium">{card.name}</div>
                      <div className="text-xs text-gray-500">
                        {card.set.name} · {formatSetNumber(card.set, card.number)} · {tr('rarity', card.rarity ?? '')}
                      </div>
                    </div>
                    <span className="ml-auto text-xs text-blue-600">{t('scan.select')}</span>
                  </button>
                ))}
              </div>
              {totalCount > MAX_VISIBLE_MATCHES && (
                <button
                  type="button"
                  onClick={handleShowAll}
                  className="mt-2 w-full px-3 py-2 text-center text-xs text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-950 font-medium"
                >
                  +{totalCount - MAX_VISIBLE_MATCHES} {t('form.moreResults')}
                </button>
              )}
            </div>
          )}

          {matchedCards.length === 0 && ocrText && (
            <p className="text-sm text-gray-500">{t('scan.noMatch')}</p>
          )}
        </div>
      )}

      {showAllModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setShowAllModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('form.allResults')}</h3>
              <button type="button" onClick={() => setShowAllModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">&times;</button>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              {loadingAll ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                  <span className="ml-2 text-sm text-gray-500">{t('form.loadingAll')}</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 divide-y divide-gray-100 dark:divide-gray-700">
                  {allResults.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => handleSelectCard(card)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-950 text-left"
                    >
                      <img src={card.images.small} alt="" className="w-10 h-14 object-contain" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{card.name}</div>
                        <div className="text-xs text-gray-500">
                          {card.set.name} · {formatSetNumber(card.set, card.number)} · {tr('rarity', card.rarity ?? '')}
                        </div>
                      </div>
                      <span className="ml-auto text-xs text-blue-600">{t('scan.select')}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useCallback } from 'react';
import type { Card } from '@/lib/types';
import { formatSetNumber } from '@/lib/types';
import { searchCardsApi } from '@/lib/pokemon-api';
import { translateGermanName } from '@/lib/german-pokemon-names';
import { useI18n } from '@/lib/i18n';

interface OcrScannerProps {
  /** Kept for API compatibility – not used directly in scan logic. */
  cards: Card[];
  onCardDetected: (card: Card) => void;
}

/** Pokemon card aspect ratio: 63mm × 88mm ≈ 5:7 */
const CARD_RATIO = 5 / 7;

// ── ROI definitions (fractions of card width/height) ────────────────────────
// Top-left ROI: Pokemon name area (generous margin for camera shake)
const NAME_ROI = { x: 0.02, y: 0.01, w: 0.85, h: 0.14 };
// Bottom-left ROI: set info, card number, total count (generous margin for camera shake)
const SET_ROI  = { x: 0.02, y: 0.86, w: 0.65, h: 0.13 };

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

// ── Text parsing helpers ────────────────────────────────────────────────────

/** Card number pattern: "072/091", "32/100", "SV043/SV091" etc. */
const CARD_NUMBER_RE = /(?:SV)?(\d{1,4})\s*\/\s*(\d{1,4})/i;

/** Set code pattern on card bottom: typically 2-6 uppercase letters */
const SET_CODE_RE = /\b([A-Z]{2,6})\b/;

/** Common short uppercase tokens that are NOT set codes */
const FALSE_POSITIVE_SET_CODES = new Set(['HP', 'EX', 'GX', 'LV', 'SP', 'FB', 'VS', 'GL']);

/**
 * Clean up the OCR text for the Pokemon name ROI.
 * Returns the best candidate name string.
 */
function parseNameFromROI(raw: string): string | null {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length >= 2);

  for (const line of lines) {
    // Remove noise characters that Tesseract sometimes injects
    let cleaned = line
      .replace(/[|_{}[\]<>~`@#$%^&*()+=]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (cleaned.length < 2) continue;

    // Skip lines that are clearly HP indicators or numbers
    if (/^\d+\s*HP$/i.test(cleaned)) continue;
    if (/^HP\s*\d+$/i.test(cleaned)) continue;
    if (/^\d+$/.test(cleaned)) continue;

    // The name may include suffixes like "ex", "EX", "GX", "V", "VSTAR" etc.
    // Remove trailing "Stage 1", "Stage 2", "BASIC" etc. that may leak in
    cleaned = cleaned.replace(/\b(BASIC|Stage\s*[12]|EVOLUTION)\b/gi, '').trim();

    if (cleaned.length >= 2) return cleaned;
  }

  return null;
}

/**
 * Parse the set info ROI to extract set code and card number.
 * Returns { setCode, cardNumber } or null fields if not found.
 *
 * Handles common OCR misreadings: O↔0, l/I↔1, S↔5, B↔8 in the
 * numeric portion, and normalises whitespace and slash variants.
 */
function parseSetInfo(raw: string): { setCode: string | null; cardNumber: string | null } {
  // Normalise OCR artefacts: replace common slash look-alikes and collapse whitespace
  let text = raw.replace(/\n/g, ' ').trim();
  // Some OCR engines return backslash or pipe instead of forward slash
  text = text.replace(/[\\|]/g, '/');

  // Try to find card number like "072/091"
  let numMatch = CARD_NUMBER_RE.exec(text);

  // If no match, try fixing OCR digit/letter confusion in the numeric parts.
  // Common confusions: O/o/Q → 0, l/I/i/| → 1, S/s → 5, B/b → 8
  if (!numMatch) {
    const DIGIT_LIKE = /[O0oQlIi|1-9SsBb]{1,4}/;
    const corrected = text
      .replace(new RegExp(`([A-Z]{2,6}\\s*)(${DIGIT_LIKE.source})\\s*/\\s*(${DIGIT_LIKE.source})`, 'gi'),
        (_m, prefix: string, a: string, b: string) => {
          const fixDigits = (s: string) =>
            s.replace(/[OoQ]/g, '0').replace(/[lIi|]/g, '1').replace(/[Ss]/g, '5').replace(/[Bb]/g, '8');
          return `${prefix}${fixDigits(a)}/${fixDigits(b)}`;
        });
    numMatch = CARD_NUMBER_RE.exec(corrected);
    if (numMatch) text = corrected;
  }

  const cardNumber = numMatch ? numMatch[1]!.replace(/^0+/, '') || '0' : null;

  // Try to find a set code (2-6 uppercase letters)
  // Remove the number portion first to avoid false matches
  const textWithoutNum = numMatch ? text.replace(numMatch[0], '') : text;
  const codeMatch = SET_CODE_RE.exec(textWithoutNum.toUpperCase());
  const setCode = codeMatch && !FALSE_POSITIVE_SET_CODES.has(codeMatch[1]!) ? codeMatch[1]! : null;

  return { setCode, cardNumber };
}

export function OcrScanner({ onCardDetected }: OcrScannerProps) {
  const [status, setStatus] = useState<'idle' | 'camera' | 'processing' | 'result'>('idle');
  const [ocrText, setOcrText] = useState('');
  const [matchedCards, setMatchedCards] = useState<Card[]>([]);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { t, tr } = useI18n();

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

      // Extract the two ROIs from the captured card image
      // Name ROI: large text on card header – default 3× upscale
      const nameCanvas = extractROI(canvasRef.current, NAME_ROI, { scale: 3 });
      // Set ROI: small text at card bottom – higher 5× upscale for tiny characters
      const setCanvas  = extractROI(canvasRef.current, SET_ROI, { scale: 5 });

      const [nameBlob, setBlob] = await Promise.all([
        canvasToBlob(nameCanvas),
        canvasToBlob(setCanvas),
      ]);

      // OCR both ROIs – use 'deu+eng' for German card name support
      const nameWorker = await createWorker('deu+eng');
      const setWorker  = await createWorker('eng');

      // Optimise Tesseract parameters for each ROI
      await setWorker.setParameters({
        // Treat as a single text line – the set info is one line (e.g. "PAL 041/196")
        tessedit_pageseg_mode: PSM.SINGLE_LINE,
        // Whitelist only characters that can appear in set codes + card numbers
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/ ',
      });

      const [nameResult, setResult] = await Promise.all([
        nameWorker.recognize(nameBlob),
        setWorker.recognize(setBlob),
      ]);

      await Promise.all([nameWorker.terminate(), setWorker.terminate()]);

      const nameRaw = nameResult.data.text.trim();
      const setRaw  = setResult.data.text.trim();

      // Parse results from each ROI
      const pokemonName = parseNameFromROI(nameRaw);
      const { setCode, cardNumber } = parseSetInfo(setRaw);

      // Build a combined OCR debug text
      const debugText = [
        `[Name ROI] ${nameRaw}`,
        `→ Parsed name: ${pokemonName ?? '–'}`,
        '',
        `[Set ROI] ${setRaw}`,
        `→ Set: ${setCode ?? '–'}, #${cardNumber ?? '–'}`,
      ].join('\n');
      setOcrText(debugText);

      // ── Search strategy ──
      // 1. If we have both a set code and card number, search by "SET NUMBER"
      // 2. Always search by the detected Pokemon name (translated DE→EN)
      // 3. Combine and deduplicate results, preferring exact set matches
      const allMatches: Card[] = [];

      // Search by set code + card number (most precise)
      if (setCode && cardNumber) {
        try {
          const result = await searchCardsApi(`${setCode} ${cardNumber}`, 5);
          allMatches.push(...result.cards);
        } catch { /* skip */ }
      }

      // Search by Pokemon name (primary identification)
      if (pokemonName) {
        // Translate German name to English for the API search
        const englishName = translateGermanName(pokemonName) ?? pokemonName;
        try {
          const result = await searchCardsApi(englishName, 10);
          allMatches.push(...result.cards);
        } catch { /* skip */ }
      }

      // Deduplicate by card id
      const uniqueIds = new Set<string>();
      const unique = allMatches.filter((c) => {
        if (uniqueIds.has(c.id)) return false;
        uniqueIds.add(c.id);
        return true;
      });

      // If we have a card number, boost cards whose number matches
      let sorted = unique;
      if (cardNumber) {
        const normalizedNum = cardNumber.replace(/^0+/, '') || '0';
        sorted = [...unique].sort((a, b) => {
          const aNorm = a.number.replace(/^0+/, '') || '0';
          const bNorm = b.number.replace(/^0+/, '') || '0';
          const aMatch = aNorm === normalizedNum ? 1 : 0;
          const bMatch = bNorm === normalizedNum ? 1 : 0;
          return bMatch - aMatch;
        });
      }

      setMatchedCards(sorted.slice(0, 5));
      setStatus('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR failed');
      setStatus('idle');
    }
  }, [stopCamera]);

  const reset = useCallback(() => {
    stopCamera();
    setStatus('idle');
    setOcrText('');
    setMatchedCards([]);
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
            {/* ROI overlay: set info area (bottom-left) – derived from SET_ROI */}
            <div
              className="absolute border-2 border-cyan-400/80 rounded bg-cyan-400/10"
              style={{ left: `${SET_ROI.x * 100}%`, top: `${SET_ROI.y * 100}%`, width: `${SET_ROI.w * 100}%`, height: `${SET_ROI.h * 100}%` }}
            />
            <span
              className="absolute text-cyan-300 text-[9px] font-bold"
              style={{ left: `${(SET_ROI.x + 0.01) * 100}%`, top: `${(SET_ROI.y + 0.01) * 100}%` }}
            >SET #</span>
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
                    onClick={() => onCardDetected(card)}
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
            </div>
          )}

          {matchedCards.length === 0 && ocrText && (
            <p className="text-sm text-gray-500">{t('scan.noMatch')}</p>
          )}
        </div>
      )}
    </div>
  );
}

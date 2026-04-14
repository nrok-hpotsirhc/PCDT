import { useState, useRef, useCallback } from 'react';
import type { Card } from '@/lib/types';
import { formatSetNumber } from '@/lib/types';
import { searchCardsApi } from '@/lib/pokemon-api';
import { useI18n } from '@/lib/i18n';

interface OcrScannerProps {
  /** Kept for API compatibility – not used directly in scan logic. */
  cards: Card[];
  onCardDetected: (card: Card) => void;
}

/** Pokemon card aspect ratio: 63mm × 88mm ≈ 5:7 */
const CARD_RATIO = 5 / 7;

/**
 * Crop the center of the video frame to the Pokemon card portrait aspect ratio
 * and apply grayscale + contrast enhancement for better OCR results.
 */
function captureCardCanvas(video: HTMLVideoElement, canvas: HTMLCanvasElement): boolean {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return false;

  // Crop to portrait 5:7 centered area
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

  // Draw cropped frame
  ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  // Grayscale + contrast boost for better OCR
  const imageData = ctx.getImageData(0, 0, cropW, cropH);
  const d = imageData.data;
  for (let i = 0; i + 3 < d.length; i += 4) {
    const gray = 0.299 * d[i]! + 0.587 * d[i + 1]! + 0.114 * d[i + 2]!;
    const enhanced = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128));
    d[i] = d[i + 1] = d[i + 2] = enhanced;
  }
  ctx.putImageData(imageData, 0, 0);

  return true;
}

/**
 * Extract the most likely card name candidates from raw OCR text.
 * Pokemon cards have the name as the first prominent non-noise text.
 */
function extractCandidates(text: string): string[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    // Remove lines that are clearly not card names
    .filter((l) => {
      if (l.length < 3) return false;
      if (/^\d+$/.test(l)) return false;                      // pure numbers
      if (/^\d+\/\d+/.test(l)) return false;                  // card number "072/091"
      if (/\bHP\b/i.test(l) && /\d{2,3}/.test(l)) return false; // "120 HP"
      if (/©|™|®|illus\./i.test(l)) return false;             // copyright
      if (l.length > 40) return false;                         // too long
      return true;
    });

  // Deduplicate while preserving order
  const seen = new Set<string>();
  return lines.filter((l) => {
    const key = l.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 6);
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
        // Request portrait dimensions matching Pokemon card aspect ratio
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
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const blob = await new Promise<Blob | null>((resolve) =>
        canvasRef.current!.toBlob(resolve, 'image/png'),
      );
      if (!blob) throw new Error('Failed to capture image');

      const { data } = await worker.recognize(blob);
      await worker.terminate();

      const text = data.text.trim();
      setOcrText(text);

      // Extract smart candidate lines and search each one
      const candidates = extractCandidates(text);
      const allMatches: Card[] = [];
      for (const line of candidates) {
        try {
          const result = await searchCardsApi(line, 5);
          allMatches.push(...result.cards);
        } catch { /* skip failed searches */ }
      }

      // Deduplicate by card id
      const uniqueIds = new Set<string>();
      const unique = allMatches.filter((c) => {
        if (uniqueIds.has(c.id)) return false;
        uniqueIds.add(c.id);
        return true;
      });

      setMatchedCards(unique.slice(0, 5));
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

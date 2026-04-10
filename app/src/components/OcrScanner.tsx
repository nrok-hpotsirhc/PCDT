import { useState, useRef, useCallback } from 'react';
import type { Card } from '@/lib/types';
import { formatSetNumber } from '@/lib/types';
import { searchCardsApi } from '@/lib/pokemon-api';
import { useI18n } from '@/lib/i18n';

interface OcrScannerProps {
  cards: Card[];
  onCardDetected: (card: Card) => void;
}

export function OcrScanner({ cards, onCardDetected }: OcrScannerProps) {
  const [status, setStatus] = useState<'idle' | 'camera' | 'processing' | 'result'>('idle');
  const [ocrText, setOcrText] = useState('');
  const [matchedCards, setMatchedCards] = useState<Card[]>([]);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { t } = useI18n();

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
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
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    stopCamera();
    setStatus('processing');

    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );
      if (!blob) throw new Error('Failed to capture image');

      const { data } = await worker.recognize(blob);
      await worker.terminate();

      const text = data.text.trim();
      setOcrText(text);

      // Try to match against pokemontcg.io API
      const lines = text.split('\n').filter((l) => l.trim().length > 2);
      const allMatches: Card[] = [];
      for (const line of lines.slice(0, 3)) {
        try {
          const result = await searchCardsApi(line.trim(), 3);
          allMatches.push(...result.cards);
        } catch { /* skip failed searches */ }
      }

      // Deduplicate
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
  }, [cards, stopCamera]);

  const reset = useCallback(() => {
    stopCamera();
    setStatus('idle');
    setOcrText('');
    setMatchedCards([]);
    setError(null);
  }, [stopCamera]);

  return (
    <div className="space-y-4">
      {/* Camera view */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
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
            <div className="absolute inset-8 border-2 border-white/50 rounded-lg" />
            <p className="absolute bottom-4 left-0 right-0 text-center text-white text-xs opacity-70">
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
                {matchedCards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => onCardDetected(card)}
                    className="w-full flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 text-left"
                  >
                    <img src={card.images.small} alt="" className="w-10 h-14 object-contain" />
                    <div>
                      <div className="text-sm font-medium">{card.name}</div>
                      <div className="text-xs text-gray-500">
                        {card.set.name} · {formatSetNumber(card.set, card.number)} · {card.rarity}
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

import { useState, useCallback } from 'react';
import { parseExcelFile, downloadTemplate } from '@/lib/excel-parser';
import { useI18n } from '@/lib/i18n';
import type { UserCard } from '@/lib/types';

interface ExcelImportProps {
  onImport: (cards: UserCard[]) => void;
}

export function ExcelImport({ onImport }: ExcelImportProps) {
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<{ row: number; message: string }[]>([]);
  const [imported, setImported] = useState(0);
  const { t } = useI18n();

  const handleFile = useCallback(
    async (file: File) => {
      setErrors([]);
      setImported(0);

      const buffer = await file.arrayBuffer();
      const result = parseExcelFile(buffer);

      if (result.errors.length > 0) {
        setErrors(result.errors);
      }

      if (result.success.length > 0) {
        onImport(result.success);
        setImported(result.success.length);
      }
    },
    [onImport],
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
        }`}
      >
        <div className="text-3xl mb-2">📄</div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('import.drop')}{' '}
          <label className="text-blue-600 hover:underline cursor-pointer">
            {t('import.browse')}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleChange}
              className="hidden"
            />
          </label>
        </p>
        <p className="text-xs text-gray-400 mt-2">
          {t('import.formats')}
        </p>
      </div>

      {/* Template download */}
      <button
        onClick={() => downloadTemplate()}
        className="text-sm text-blue-600 hover:underline"
      >
        {t('import.template')}
      </button>

      {/* Import result */}
      {imported > 0 && (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-700 dark:text-green-300">
          ✓ {imported} {t('import.success')}
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
            {errors.length} {t('import.errors')}
          </p>
          <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 max-h-40 overflow-y-auto">
            {errors.map((err, i) => (
              <li key={i}>Row {err.row}: {err.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

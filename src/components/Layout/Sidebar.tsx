import React, { useState } from 'react';
import { useSlicer } from '../../context/SlicerContext';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';
import { Settings, Type, Grid3X3, ArrowDown01, ArrowRightLeft, Wand2, Loader2, Minus, Plus, Upload } from 'lucide-react';
import { SortMode } from '../../types';
import { detectGrid } from '../../utils/imageAnalysis';

// Helper component for number input with buttons
const NumberInput = ({ 
  label, 
  value, 
  onChange, 
  min = 1, 
  max = 50 
}: { 
  label: string; 
  value: number; 
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-gray-400">
      {label}
    </label>
    <div className="flex items-center">
      <button
        onClick={() => onChange(Math.max(value - 1, min))}
        disabled={value <= min}
        className="h-9 w-9 flex items-center justify-center rounded-l-md border border-r-0 border-border bg-surface hover:bg-surface-hover text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
      >
        <Minus className="w-3 h-3" />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const val = parseInt(e.target.value);
          if (!isNaN(val)) onChange(Math.min(Math.max(val, min), max));
        }}
        className="flex h-9 w-full border border-border bg-surface px-2 py-1 text-sm text-center shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary text-gray-200 appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded-none z-10"
      />
      <button
        onClick={() => onChange(Math.min(value + 1, max))}
        disabled={value >= max}
        className="h-9 w-9 flex items-center justify-center rounded-r-md border border-l-0 border-border bg-surface hover:bg-surface-hover text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  </div>
);

export const Sidebar: React.FC = () => {
  const { settings, updateSettings, file, setFile, t } = useSlicer();
  const [isDetecting, setIsDetecting] = useState(false);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSettings({ sortMode: e.target.value as SortMode });
  };

  const handleAutoDetect = async () => {
    if (!file) return;
    
    setIsDetecting(true);
    try {
      const { rows, cols } = await detectGrid(file);
      updateSettings({ rows, cols });
    } catch (error) {
      console.error('Detection failed:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <aside className="w-80 border-r border-border bg-surface/50 flex flex-col shrink-0 overflow-y-auto">
      {/* Persistent Drop Zone */}
      <div className="p-4 border-b border-border">
        <div 
          className="border-2 border-dashed border-border hover:border-primary/50 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-surface/30 hover:bg-surface group"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const files = e.dataTransfer.files;
            if (files && files.length > 0) setFile(files[0]);
          }}
          onClick={() => document.getElementById('sidebar-upload')?.click()}
        >
          <input 
            id="sidebar-upload"
            type="file" 
            className="hidden" 
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
          />
          <Upload className="w-6 h-6 text-gray-400 group-hover:text-primary mb-2 transition-colors" />
          <span className="text-xs text-gray-400 group-hover:text-gray-200 text-center transition-colors">
            {file ? t('dropzone.select') : t('dropzone.drag')}
          </span>
        </div>
      </div>

      <div className="p-4 border-b border-border">
        <h2 className="flex items-center gap-2 font-medium text-gray-200">
          <Settings className="w-4 h-4" />
          {t('settings.title')}
        </h2>
      </div>

      <div className="p-4 space-y-6">
        {/* Grid Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Grid3X3 className="w-3 h-3" />
              {t('settings.grid')}
            </h3>
            {file && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleAutoDetect}
                disabled={isDetecting}
                className="h-6 px-2 text-[10px] gap-1"
                title="Auto detect rows and columns based on transparency"
              >
                {isDetecting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Wand2 className="w-3 h-3" />
                )}
                {isDetecting ? t('settings.detecting') : t('settings.detect')}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label={t('settings.rows')}
              min={1}
              max={50}
              value={settings.rows}
              onChange={(val) => updateSettings({ rows: val })}
            />
            <NumberInput
              label={t('settings.cols')}
              min={1}
              max={50}
              value={settings.cols}
              onChange={(val) => updateSettings({ cols: val })}
            />
          </div>
        </div>

        {/* Numbering Settings */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <ArrowDown01 className="w-3 h-3" />
            {t('settings.numbering')}
          </h3>
          <Input
            label={t('settings.startId')}
            type="number"
            value={settings.startId}
            onChange={(e) => updateSettings({ startId: Number(e.target.value) })}
          />
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 flex items-center gap-2">
              <Type className="w-3 h-3" />
              {t('settings.fontSize')} ({settings.fontSize}px)
            </label>
            <input
              type="range"
              min={8}
              max={100}
              value={settings.fontSize}
              onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
              className="w-full h-2 bg-surface-hover rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>

        {/* Sorting Settings */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <ArrowRightLeft className="w-3 h-3" />
            {t('settings.sorting')}
          </h3>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400">
              {t('settings.pattern')}
            </label>
            <select
              value={settings.sortMode}
              onChange={handleSortChange}
              className="flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary text-gray-200"
            >
              <option value="normal">{t('sort.normal')}</option>
              <option value="snake-1">{t('sort.snake1')}</option>
              <option value="snake-2">{t('sort.snake2')}</option>
              <option value="reverse">{t('sort.reverse')}</option>
            </select>
          </div>
        </div>
      </div>
      
      {!file && (
        <div className="mt-auto p-4 text-center text-sm text-gray-500">
          {t('sidebar.noFile')}
        </div>
      )}
    </aside>
  );
};

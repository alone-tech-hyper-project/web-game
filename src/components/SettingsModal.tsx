import React, { useState } from 'react';
import { PerformanceSettings } from '../types/game';
import { Settings, Zap, Sliders, ShieldCheck, Download, Upload, Trash2, X, Check, Volume2, VolumeX, Copy, Film, Eye, HardDrive, Sparkles } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PerformanceSettings;
  onUpdateSettings: (newSettings: PerformanceSettings) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onExportSave: () => void;
  onImportSave: (jsonStr: string) => void;
  onResetGame: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  soundEnabled,
  onToggleSound,
  onExportSave,
  onImportSave,
  onResetGame,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const handleCopyUrl = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch (_) {
      // Fallback
      const input = document.createElement('input');
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  const applyPreset = (presetType: 'cinema24' | 'mobile30' | 'smooth60') => {
    if (presetType === 'cinema24') {
      onUpdateSettings({
        ...settings,
        renderScale: 1.0,
        shadowQuality: 'off',
        particleDensity: 'low',
        fpsLimit: 24, // 24 FPS Movie Style
        cameraZoom: 1.4,
        autoOptimize: true,
      });
    } else if (presetType === 'mobile30') {
      onUpdateSettings({
        ...settings,
        renderScale: 1.0,
        shadowQuality: 'off',
        particleDensity: 'low',
        fpsLimit: 30,
        cameraZoom: 1.4,
        autoOptimize: true,
      });
    } else {
      onUpdateSettings({
        ...settings,
        renderScale: 1.25,
        shadowQuality: 'off',
        particleDensity: 'high',
        fpsLimit: 60,
        cameraZoom: 1.4,
        autoOptimize: false,
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) onImportSave(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700">
              <Settings className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-100 leading-tight">Pengaturan & Opsi Game</h2>
              <p className="text-[11px] text-slate-400">FPS limiter, jarak kamera, salin tautan, dan audio</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-slate-200 text-sm">
          {/* 1. TOMBOL SALIN URL GAME (FITUR UTAMA DIMINTA USER) */}
          <div className="bg-gradient-to-r from-emerald-950/50 to-teal-950/40 border border-emerald-500/40 rounded-2xl p-3 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                <Copy className="w-4 h-4 text-emerald-400" />
                <span>Bagikan / Salin Tautan Game</span>
              </span>
              {copiedUrl && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Berhasil Disalin!
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300">
              Salin URL aplikasi ini untuk dibuka di browser lain atau dibagikan ke teman.
            </p>
            <button
              onClick={handleCopyUrl}
              className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${
                copiedUrl
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedUrl ? 'Tautan Berhasil Disalin ke Clipboard!' : 'Salin URL Game Ini'}</span>
            </button>
          </div>

          {/* 2. JARAK KAMERA (ZOOM DEKAT / COZY) */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-teal-400" />
                <span>Jarak Pandang Kamera (Zoom)</span>
              </span>
              <span className="text-[11px] font-bold text-teal-400 font-mono">
                {settings.cameraZoom ? `${settings.cameraZoom.toFixed(1)}x` : '1.4x'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Pilih zoom lebih dekat agar karakter dan tanaman terlihat besar dan jelas di HP.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '🔍 Dekat (Cozy)', val: 1.6, desc: 'Besar & detail' },
                { label: '📐 Standar', val: 1.35, desc: 'Seimbang' },
                { label: '🌐 Luas', val: 1.0, desc: 'Lihat semua' },
              ].map((z) => {
                const isSelected = Math.abs((settings.cameraZoom || 1.35) - z.val) < 0.1;
                return (
                  <button
                    key={z.val}
                    onClick={() => onUpdateSettings({ ...settings, cameraZoom: z.val })}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-teal-950/60 border-teal-400 text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="font-bold text-xs">{z.label}</span>
                    <span className="text-[9px] text-slate-400">{z.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. FPS LIMITER (24 FPS MOVIE STYLE DIMINTA USER) */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3.5 space-y-2.5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Film className="w-4 h-4 text-amber-400" />
              <span>Batas Frame Rate (FPS Limiter)</span>
            </h3>
            <p className="text-[10px] text-slate-400 leading-tight">
              24 FPS memberi sensasi sinematik film tempo dulu sekaligus sangat hemat baterai HP.
            </p>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onUpdateSettings({ ...settings, fpsLimit: 24 })}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all active:scale-95 ${
                  settings.fpsLimit === 24
                    ? 'bg-amber-950/60 border-amber-400 text-white shadow-md'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-amber-300">🎬 24 FPS</span>
                  {settings.fpsLimit === 24 && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <span className="text-[9px] text-slate-400">Movie Style Sinematik</span>
              </button>

              <button
                onClick={() => onUpdateSettings({ ...settings, fpsLimit: 30 })}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all active:scale-95 ${
                  settings.fpsLimit === 30
                    ? 'bg-emerald-950/60 border-emerald-400 text-white shadow-md'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-emerald-300">⚡ 30 FPS</span>
                  {settings.fpsLimit === 30 && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <span className="text-[9px] text-slate-400">Standar Seluler</span>
              </button>

              <button
                onClick={() => onUpdateSettings({ ...settings, fpsLimit: 60 })}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all active:scale-95 ${
                  settings.fpsLimit === 60
                    ? 'bg-sky-950/60 border-sky-400 text-white shadow-md'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-sky-300">🚀 60 FPS</span>
                  {settings.fpsLimit === 60 && <Check className="w-3.5 h-3.5 text-sky-400" />}
                </div>
                <span className="text-[9px] text-slate-400">Ultra Mulus</span>
              </button>
            </div>
          </div>

          {/* 4. Audio & Indikator */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3 space-y-2">
            <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2">
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                <span className="text-xs font-semibold">Efek Suara Audio</span>
              </div>
              <button
                onClick={onToggleSound}
                className={`px-3 py-1 rounded-xl font-bold text-xs ${soundEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'}`}
              >
                {soundEnabled ? 'Aktif' : 'Mati'}
              </button>
            </div>

            <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50">
              <span className="text-xs font-semibold">Indikator FPS di Layar</span>
              <button
                onClick={() => onUpdateSettings({ ...settings, showFpsCounter: !settings.showFpsCounter })}
                className={`px-3 py-1 rounded-xl font-bold text-xs ${
                  settings.showFpsCounter ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'
                }`}
              >
                {settings.showFpsCounter ? 'Tampil' : 'Sembunyi'}
              </button>
            </div>
          </div>

          {/* 5. Simpan Data & Cache Memory */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3 space-y-2.5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>Penyimpanan Cache HP & Progres</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                <Sparkles className="w-2.5 h-2.5" /> Fast IndexedDB Aktif
              </span>
            </h3>

            <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">Aplikasi Web Progresif (PWA)</span>
                <span className="text-[10px] text-slate-400">Cache offline instan & layar penuh</span>
              </div>
              <PWAInstallButton />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onExportSave}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 px-3 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 text-xs active:scale-95"
              >
                <Download className="w-3.5 h-3.5" /> Ekspor (.json)
              </button>

              <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 px-3 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 text-xs cursor-pointer active:scale-95">
                <Upload className="w-3.5 h-3.5" /> Impor File
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <button
              onClick={onResetGame}
              className="w-full bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 font-bold py-2 px-3 rounded-xl border border-rose-800/40 flex items-center justify-center gap-1.5 text-xs transition-all active:scale-95 mt-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Reset Progres Ladang Baru
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

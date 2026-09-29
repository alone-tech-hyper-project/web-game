import React, { useState } from 'react';
import { PRESET_TEXTURE_PACKS, texturePackManager } from '../game/TexturePackManager';
import { TexturePackPalette } from '../types/game';
import { Palette, Download, Upload, Sparkles, Check, X, RefreshCw, Image } from 'lucide-react';

interface TexturePackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaletteChanged: (palette: TexturePackPalette) => void;
}

export const TexturePackModal: React.FC<TexturePackModalProps> = ({ isOpen, onClose, onPaletteChanged }) => {
  const [activePalette, setActivePalette] = useState<TexturePackPalette>(texturePackManager.getPalette());
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [showImportArea, setShowImportArea] = useState(false);
  const [atlasPreview, setAtlasPreview] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: TexturePackPalette) => {
    setActivePalette(preset);
    texturePackManager.setPalette(preset);
    onPaletteChanged(preset);
  };

  const handleColorChange = (key: keyof TexturePackPalette, value: string) => {
    const updated: TexturePackPalette = {
      ...activePalette,
      [key]: value,
      isCustom: true,
      name: activePalette.isCustom ? activePalette.name : `${activePalette.name} (Custom)`,
    };
    setActivePalette(updated);
    texturePackManager.setPalette(updated);
    onPaletteChanged(updated);
  };

  const handleExportJSON = () => {
    texturePackManager.downloadJSON();
  };

  const handleGenerateAtlas = () => {
    const dataUrl = texturePackManager.exportTextureAtlasPNG();
    setAtlasPreview(dataUrl);
  };

  const handleImportJSON = () => {
    setImportError('');
    const success = texturePackManager.importFromJSON(importText);
    if (success) {
      const newPalette = texturePackManager.getPalette();
      setActivePalette(newPalette);
      onPaletteChanged(newPalette);
      setShowImportArea(false);
      setImportText('');
    } else {
      setImportError('Format JSON tidak valid. Pastikan JSON memiliki properti grassColor, soilColor, dll.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportText(content);
        texturePackManager.importFromJSON(content);
        const newPalette = texturePackManager.getPalette();
        setActivePalette(newPalette);
        onPaletteChanged(newPalette);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-slate-100 leading-tight">Manajer Texture Pack & Grafis</h2>
              <p className="text-xs text-slate-400">Sesuaikan tema, ekspor/impor palet warna, & optimalkan visual</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-6 flex-1 text-slate-200 text-sm">
          {/* Preset Swapper */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-purple-400 mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Preset Texture Pack Bawaan</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_TEXTURE_PACKS.map((preset) => {
                const isSelected = activePalette.id === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-500/20 scale-[1.01]'
                        : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-slate-100">{preset.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">{preset.description}</p>
                    {/* Swatch Previews */}
                    <div className="flex gap-1.5 mt-1">
                      {[preset.grassColor, preset.soilColor, preset.waterColor, preset.woodColor, preset.roofColor, preset.skyNoon].map((c, i) => (
                        <div key={i} className="w-5 h-5 rounded-md border border-white/20 shadow-inner" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Color Palette Customizer */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">Editor Warna Palet Langsung</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Rumput (Grass)', key: 'grassColor' },
                { label: 'Tanah (Soil)', key: 'soilColor' },
                { label: 'Air (Water)', key: 'waterColor' },
                { label: 'Kayu (Wood)', key: 'woodColor' },
                { label: 'Atap (Roof)', key: 'roofColor' },
                { label: 'Daun (Leaves)', key: 'leavesColor' },
                { label: 'Langit Siang', key: 'skyNoon' },
                { label: 'Langit Malam', key: 'skyNight' },
                { label: 'Kabut (Fog)', key: 'fogColor' },
              ].map((item) => (
                <div key={item.key} className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-700/50">
                  <input
                    type="color"
                    value={(activePalette as unknown as Record<string, string>)[item.key] || '#ffffff'}
                    onChange={(e) => handleColorChange(item.key as keyof TexturePackPalette, e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-slate-300">{item.label}</span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      {(activePalette as unknown as Record<string, string>)[item.key]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export / Import Texture Pack Section */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={handleExportJSON}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Pack (.json)</span>
            </button>

            <button
              onClick={() => setShowImportArea(!showImportArea)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs border border-slate-700 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Impor Texture Pack</span>
            </button>

            <button
              onClick={handleGenerateAtlas}
              className="bg-indigo-700 hover:bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs shadow-lg transition-all"
            >
              <Image className="w-4 h-4" />
              <span>Pratinjau Peta Tekstur PNG</span>
            </button>
          </div>

          {/* Import Textarea Area */}
          {showImportArea && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300">Tempel JSON / Unggah File Texture Pack:</span>
                <label className="text-xs font-bold text-purple-400 hover:text-purple-300 cursor-pointer">
                  Pilih File .json
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='{"grassColor": "#82ca9d", "soilColor": "#c89666", ...}'
                className="w-full h-28 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
              />

              {importError && <p className="text-xs text-rose-400 font-medium">{importError}</p>}

              <button
                onClick={handleImportJSON}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs shadow-md"
              >
                Terapkan Impor JSON
              </button>
            </div>
          )}

          {/* PNG Atlas Preview */}
          {atlasPreview && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 flex flex-col items-center">
              <span className="text-xs font-bold text-slate-300 self-start">Peta Tekstur Gambar (Atlas PNG):</span>
              <img src={atlasPreview} alt="Texture Atlas" className="w-full max-w-sm rounded-xl border border-slate-700 shadow-md" />
              <a
                href={atlasPreview}
                download={`texture_atlas_${activePalette.id}.png`}
                className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1 mt-1"
              >
                <Download className="w-3.5 h-3.5" /> Unduh Gambar Atlas PNG
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

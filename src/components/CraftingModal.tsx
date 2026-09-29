import React from 'react';
import { InventoryItem } from '../types/game';
import { Wrench, X, Sparkles, Check } from 'lucide-react';

interface CraftingModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  onCraftItem: (recipe: { id: string; name: string; reqId: string; reqCount: number; outputIcon: string; sellPrice: number }) => void;
}

export const CraftingModal: React.FC<CraftingModalProps> = ({ isOpen, onClose, inventory, onCraftItem }) => {
  if (!isOpen) return null;

  const recipes = [
    {
      id: 'jam_strawberry',
      name: 'Selai Stroberi Manis',
      reqId: 'crop_strawberry',
      reqName: 'Stroberi',
      reqCount: 2,
      outputIcon: '🍓🍯',
      sellPrice: 120,
      desc: 'Olah 2x Stroberi menjadi Selai Stroberi lezat',
    },
    {
      id: 'flour_rice',
      name: 'Tepung Beras',
      reqId: 'crop_rice',
      reqName: 'Padi',
      reqCount: 3,
      outputIcon: '🌾🌾',
      sellPrice: 80,
      desc: 'Giling 3x Padi menjadi Tepung Olahan',
    },
    {
      id: 'sauce_tomato',
      name: 'Saus Tomat Spesial',
      reqId: 'crop_tomato',
      reqName: 'Tomat',
      reqCount: 2,
      outputIcon: '🍅🥫',
      sellPrice: 95,
      desc: 'Olah 2x Tomat segar menjadi Saus Botolan',
    },
  ];

  const getItemCount = (reqId: string) => {
    const found = inventory.find((i) => i.id === reqId);
    return found ? found.count : 0;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-slate-100 leading-tight">Stasiun Kriya & Artisan</h2>
              <p className="text-xs text-slate-400">Olah hasil tani menjadi produk olahan bernilai tinggi</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recipes list */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {recipes.map((r) => {
            const currentCount = getItemCount(r.reqId);
            const canCraft = currentCount >= r.reqCount;

            return (
              <div key={r.id} className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-3.5 flex justify-between items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
                    {r.outputIcon}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-slate-100">{r.name}</span>
                    <span className="text-[11px] text-slate-400">{r.desc}</span>
                    <div className="text-[11px] font-semibold mt-1 flex items-center gap-1.5">
                      <span className={canCraft ? 'text-emerald-400' : 'text-rose-400'}>
                        Bahan: {r.reqName} ({currentCount}/{r.reqCount})
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-amber-400">Harga: {r.sellPrice} Koin</span>
                    </div>
                  </div>
                </div>

                <button
                  disabled={!canCraft}
                  onClick={() => onCraftItem(r)}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-1 shrink-0 ${
                    canCraft
                      ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white active:scale-95'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Buat
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { InventoryItem, PlayerData, CropType, BuildingType } from '../types/game';
import { ShoppingBag, Coins, X, Plus, Check, Sprout, Building, Bird, ArrowDownUp } from 'lucide-react';

interface MarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerData;
  inventory: InventoryItem[];
  onBuyItem: (item: { name: string; cost: number; category: 'seed' | 'building' | 'tool'; cropType?: CropType; buildingType?: BuildingType }) => void;
  onSellItem: (itemId: string, count: number, price: number) => void;
}

export const MarketModal: React.FC<MarketModalProps> = ({
  isOpen,
  onClose,
  player,
  inventory,
  onBuyItem,
  onSellItem,
}) => {
  const [tab, setTab] = useState<'buy_seeds' | 'buy_buildings' | 'sell_goods'>('buy_seeds');

  if (!isOpen) return null;

  const seedCatalog = [
    { name: 'Benih Padi (Rice)', cost: 15, cropType: 'rice' as CropType, desc: 'Tumbuh cepat, panen melimpah' },
    { name: 'Benih Jagung (Corn)', cost: 25, cropType: 'corn' as CropType, desc: 'Tanaman serba guna panen emas' },
    { name: 'Benih Stroberi (Strawberry)', cost: 40, cropType: 'strawberry' as CropType, desc: 'Buah manis nilai jual tinggi' },
    { name: 'Benih Wortel (Carrot)', cost: 20, cropType: 'carrot' as CropType, desc: 'Sayur sehat kesukaan ternak' },
    { name: 'Benih Tomat (Tomato)', cost: 30, cropType: 'tomato' as CropType, desc: 'Panen berkali-kali' },
    { name: 'Benih Bunga Matahari', cost: 35, cropType: 'sunflower' as CropType, desc: 'Mempercantik ladang & ceria' },
    { name: 'Benih Labu (Pumpkin)', cost: 50, cropType: 'pumpkin' as CropType, desc: 'Buah raksasa keuntungan maksimal' },
  ];

  const buildingCatalog = [
    { name: 'Pagar Kayu Minimalis', cost: 20, buildingType: 'fence' as BuildingType, desc: 'Membatasi ladang agar rapi' },
    { name: 'Jalan Setapak Batu', cost: 10, buildingType: 'path' as BuildingType, desc: 'Pijakan estetik antilumpur' },
    { name: 'Orang-Aring (Scarecrow)', cost: 100, buildingType: 'scarecrow' as BuildingType, desc: 'Menjaga tanaman dari burung' },
    { name: 'Penyiram Otomatis (Sprinkler)', cost: 250, buildingType: 'sprinkler' as BuildingType, desc: 'Menyiram tanaman sekitar otomatis' },
    { name: 'Penyimpan Selai (Preserves Jar)', cost: 300, buildingType: 'preserves_jar' as BuildingType, desc: 'Olah buah jadi selai manis' },
    { name: 'Mesin Keju (Cheese Press)', cost: 350, buildingType: 'cheese_press' as BuildingType, desc: 'Olah susu sapi jadi keju lezat' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-slate-100 leading-tight">Pasar Desa Isopolis</h2>
              <p className="text-xs text-slate-400">Jual hasil panen & beli benih atau peralatan ladang</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-amber-950/80 border border-amber-500/40 rounded-xl px-3 py-1 flex items-center gap-1.5 text-amber-300 font-mono font-bold text-xs">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{player.coins.toLocaleString()}</span>
            </div>

            <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 pt-2 gap-2">
          <button
            onClick={() => setTab('buy_seeds')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              tab === 'buy_seeds' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sprout className="w-4 h-4" /> Beli Benih
          </button>

          <button
            onClick={() => setTab('buy_buildings')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              tab === 'buy_buildings' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="w-4 h-4" /> Dekor & Alat
          </button>

          <button
            onClick={() => setTab('sell_goods')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              tab === 'sell_goods' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownUp className="w-4 h-4" /> Jual Hasil Panen ({inventory.filter((i) => i.count > 0).length})
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {tab === 'buy_seeds' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {seedCatalog.map((s) => {
                const canAfford = player.coins >= s.cost;
                return (
                  <div key={s.cropType} className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-3 flex justify-between items-center gap-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-slate-100">{s.name}</span>
                      <span className="text-[11px] text-slate-400">{s.desc}</span>
                      <span className="text-xs font-mono font-bold text-amber-400 mt-1">{s.cost} Koin</span>
                    </div>

                    <button
                      disabled={!canAfford}
                      onClick={() => onBuyItem({ name: s.name, cost: s.cost, category: 'seed', cropType: s.cropType })}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1 shrink-0 ${
                        canAfford
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
                          : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" /> Beli
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'buy_buildings' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {buildingCatalog.map((b) => {
                const canAfford = player.coins >= b.cost;
                return (
                  <div key={b.buildingType} className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-3 flex justify-between items-center gap-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-slate-100">{b.name}</span>
                      <span className="text-[11px] text-slate-400">{b.desc}</span>
                      <span className="text-xs font-mono font-bold text-amber-400 mt-1">{b.cost} Koin</span>
                    </div>

                    <button
                      disabled={!canAfford}
                      onClick={() => onBuyItem({ name: b.name, cost: b.cost, category: 'building', buildingType: b.buildingType })}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1 shrink-0 ${
                        canAfford
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
                          : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" /> Beli
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'sell_goods' && (
            <div className="space-y-2.5">
              {/* Notice Banner */}
              <div className="p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-[10px] text-amber-300 flex items-start gap-2">
                <span className="text-sm">💡</span>
                <div>
                  <span className="font-black text-amber-200 block">Jual Cepat di Toko (Potongan 35%)</span>
                  <span>
                    Penjualan langsung di toko dikenakan potongan uang instan. <strong>Lebih menguntungkan lewat Kotak Pengiriman (+40% koin lebih banyak)</strong> yang cair otomatis pukul 17:30!
                  </span>
                </div>
              </div>

              {inventory.filter((i) => i.count > 0).length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">Inventaris Anda kosong. Tanam & panen tanaman untuk dijual di sini!</div>
              ) : (
                inventory
                  .filter((i) => i.count > 0)
                  .map((item) => {
                    const directPrice = Math.max(1, Math.round(item.sellPrice * 0.65));
                    return (
                      <div key={item.id} className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-3 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-lg">
                            {item.icon}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-xs text-slate-100">{item.name}</span>
                            <span className="text-[11px] text-slate-400">
                              Jumlah: <strong className="text-emerald-400">{item.count}x</strong> • Jual Instan: <strong className="text-amber-400 font-mono">{directPrice} Koin</strong>/unit
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-1.5">
                          <button
                            onClick={() => onSellItem(item.id, 1, directPrice)}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs px-2.5 py-1.5 rounded-xl border border-slate-600 active:scale-95"
                          >
                            Jual 1x ({directPrice} K)
                          </button>
                          {item.count > 1 && (
                            <button
                              onClick={() => onSellItem(item.id, item.count, directPrice * item.count)}
                              className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-2.5 py-1.5 rounded-xl border border-amber-500 shadow-md active:scale-95"
                            >
                              Semua ({directPrice * item.count} K)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Quest } from '../types/game';
import { Award, CheckCircle, X, Sparkles, Coins } from 'lucide-react';

interface QuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  quests: Quest[];
  onClaimQuest: (questId: string) => void;
}

export const QuestModal: React.FC<QuestModalProps> = ({ isOpen, onClose, quests, onClaimQuest }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-slate-100 leading-tight">Misi & Prestasi Harian</h2>
              <p className="text-xs text-slate-400">Selesaikan misi untuk mendapatkan bonus koin & reputasi</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quests list */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {quests.map((q) => {
            const isReady = q.currentCount >= q.requiredCount && !q.completed;

            return (
              <div key={q.id} className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-3.5 flex justify-between items-center gap-3">
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-100">{q.title}</span>
                    {q.completed && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-0.5">{q.description}</p>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-900 h-2 rounded-full mt-2 overflow-hidden border border-slate-700">
                    <div
                      className="bg-sky-500 h-full transition-all"
                      style={{ width: `${Math.min(100, (q.currentCount / q.requiredCount) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1">
                    Progres: {q.currentCount}/{q.requiredCount}
                  </span>
                </div>

                {/* Reward & Button */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                    <Coins className="w-3.5 h-3.5" />
                    <span>+{q.rewardCoins}</span>
                  </div>

                  {q.completed ? (
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-800">
                      Selesai
                    </span>
                  ) : (
                    <button
                      disabled={!isReady}
                      onClick={() => onClaimQuest(q.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1 ${
                        isReady
                          ? 'bg-sky-600 hover:bg-sky-500 text-white active:scale-95 animate-pulse'
                          : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Klaim
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

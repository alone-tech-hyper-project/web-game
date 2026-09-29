import React, { useState } from 'react';
import { VillagerNPC } from '../types/game';
import { MessageSquare, X, Send, Sparkles, User, Heart } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface NPCDialogueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NPCDialogueModal: React.FC<NPCDialogueModalProps> = ({ isOpen, onClose }) => {
  const villagers: VillagerNPC[] = [
    {
      id: 'pak_budi',
      name: 'Pak Budi',
      role: 'Pedagang Benih & Tetua Pasar',
      avatar: '👨‍🌾',
      location: 'Pasar Desa',
      personality: 'Ramah, hangat, suka bercerita tentang tanah pertanian dan cuaca.',
      dialogues: [
        'Selamat pagi, petani muda! Cuaca hari ini sangat cocok untuk menanam Padi.',
        'Jangan lupa menyiram tanamanmu setiap pagi agar panennya melimpah!',
        'Kalau butuh benih baru, mampirlah ke toko Pasar Desa Isopolis.',
      ],
    },
    {
      id: 'siti_craft',
      name: 'Siti',
      role: 'Pengrajin & Ahli Kriya',
      avatar: '👩‍🌾',
      location: 'Bengkel Kriya',
      personality: 'Kreatif, energik, semangat membuat selai dan produk olahan.',
      dialogues: [
        'Tahukah kamu? Stroberi yang diolah jadi Selai harganya 3x lipat di pasar!',
        'Penyiram otomatis (Sprinkler) akan mempermudah hidupmu di ladang.',
        'Saya bisa membantumu mengolah padi menjadi tepung olahan berserat.',
      ],
    },
    {
      id: 'mbah_joko',
      name: 'Mbah Joko',
      role: 'Tetua Desa Isopolis',
      avatar: '👴',
      location: 'Balai Desa',
      personality: 'Bijaksana, tenang, memberi saran bijak tentang kehidupan desa.',
      dialogues: [
        'Kehidupan di desa mengajarkan kita kesabaran. Tanaman butuh waktu untuk tumbuh.',
        'Jaga stamina dan energi tubuhmu. Bila lelah, tidurlah di rumah panggungmu.',
        'Setiap musim membawa keindahan tersendiri bagi ladang kita.',
      ],
    },
    {
      id: 'maya_pet',
      name: 'Maya',
      role: 'Pemelihara Ternak',
      avatar: '👩‍🦰',
      location: 'Kandang Ternak',
      personality: 'Cinta hewan, ceria, paham perawatan ayam, sapi, dan domba.',
      dialogues: [
        'Hewan ternak yang disayang dan diberi makan tepat waktu menghasilkan susu & telur kualitas terbaik!',
        'Ayam suka berjalan-jalan di sekitar rumput hijau saat hari cerah.',
      ],
    },
  ];

  const [selectedNPC, setSelectedNPC] = useState<VillagerNPC>(villagers[0]);
  const [chatMessages, setChatMessages] = useState<{ sender: 'npc' | 'player'; text: string }[]>([
    { sender: 'npc', text: villagers[0].dialogues[0] },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  if (!isOpen) return null;

  const handleSelectNPC = (npc: VillagerNPC) => {
    setSelectedNPC(npc);
    setChatMessages([{ sender: 'npc', text: npc.dialogues[Math.floor(Math.random() * npc.dialogues.length)] }]);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setInputText('');
    setChatMessages((prev) => [...prev, { sender: 'player', text: userMsg }]);

    setIsLoadingAi(true);

    try {
      // Attempt Gemini AI reply if client API key available
      const apiKey = process.env.GEMINI_API_KEY || (import.meta as unknown as { env: Record<string, string> }).env?.VITE_GEMINI_API_KEY;
      if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Kamu adalah NPC karakter video game simulasi bertani bernama "${selectedNPC.name}" (${selectedNPC.role}) di desa Isopolis. Perilakumu: ${selectedNPC.personality}. Pemain bertanya: "${userMsg}". Jawablah dalam Bahasa Indonesia yang singkat (1-2 kalimat), ramah, dan berkarakter game bertani yang hangat.`,
        });

        const reply = response.text || 'Terima kasih sudah menyapa di desa Isopolis!';
        setChatMessages((prev) => [...prev, { sender: 'npc', text: reply }]);
        setIsLoadingAi(false);
        return;
      }
    } catch (e) {
      console.warn('Gemini AI fallback to local replies:', e);
    }

    // Fallback cute local replies
    setTimeout(() => {
      const fallbackReplies = [
        `Tentu saja! Di desa Isopolis, kerja kerasmu di ladang pasti membuahkan hasil.`,
        `Wah menarik sekali! Jangan lupa cek tanamanmu hari ini ya.`,
        `Saya selalu senang mengobrol denganmu. Semoga hari pertanianmu menyenangkan!`,
      ];
      const reply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
      setChatMessages((prev) => [...prev, { sender: 'npc', text: reply }]);
      setIsLoadingAi(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-slate-100 leading-tight">Interaksi Warga Desa</h2>
              <p className="text-xs text-slate-400">Ngobrol dengan warga desa Isopolis untuk petunjuk & cerita</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Section */}
        <div className="flex-1 overflow-hidden flex flex-col sm:flex-row">
          {/* NPC Selector List */}
          <div className="w-full sm:w-56 bg-slate-950/50 border-b sm:border-b-0 sm:border-r border-slate-800 p-3 space-y-2 overflow-x-auto sm:overflow-y-auto flex sm:flex-col shrink-0">
            {villagers.map((npc) => {
              const isSelected = selectedNPC.id === npc.id;
              return (
                <div
                  key={npc.id}
                  onClick={() => handleSelectNPC(npc)}
                  className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-2.5 shrink-0 sm:w-full ${
                    isSelected
                      ? 'bg-teal-950/50 border-teal-500 text-slate-100 shadow-md'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="text-2xl">{npc.avatar}</span>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">{npc.name}</span>
                    <span className="text-[10px] text-slate-400">{npc.role}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col bg-slate-900/60 p-4 space-y-3 justify-between overflow-hidden">
            {/* NPC Header */}
            <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedNPC.avatar}</span>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-slate-100">{selectedNPC.name}</span>
                  <span className="text-xs text-teal-400 font-medium">{selectedNPC.role}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-xl text-xs font-bold border border-rose-500/20">
                <Heart className="w-3.5 h-3.5 fill-rose-400" />
                <span>Sahabat Desa</span>
              </div>
            </div>

            {/* Message Bubble List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 p-1">
              {chatMessages.map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'player' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                      m.sender === 'player'
                        ? 'bg-emerald-600 text-white rounded-br-none shadow-md'
                        : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none shadow-md'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {isLoadingAi && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl text-xs text-teal-300 animate-pulse flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>{selectedNPC.name} sedang memikirkan jawaban...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`Sapa ${selectedNPC.name}...`}
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className="bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-4 py-2.5 rounded-2xl font-bold text-xs shadow-md flex items-center justify-center transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

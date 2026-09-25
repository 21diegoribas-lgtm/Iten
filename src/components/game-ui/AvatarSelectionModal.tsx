import React, { useState, useEffect } from 'react';
import { AVATAR_PRESETS_50, AvatarPreset, getAvatarById } from '../../utils/avatarHelper';
import { Sparkles, Check, Search, UserCheck, Gamepad2, Heart, Award, X } from 'lucide-react';

interface AvatarSelectionModalProps {
  isOpen?: boolean;
  currentAvatarId?: string;
  onConfirm: (selectedAvatarId: string) => void | Promise<void>;
  onClose?: () => void;
  isInitialSetup?: boolean; // If true, force selecting avatar before starting
}

export const AvatarSelectionModal: React.FC<AvatarSelectionModalProps> = ({
  isOpen = true,
  currentAvatarId,
  onConfirm,
  onClose,
  isInitialSetup = false
}) => {
  const [selectedId, setSelectedId] = useState<string>(currentAvatarId || 'avatar-01');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (currentAvatarId) {
      setSelectedId(currentAvatarId);
    }
  }, [currentAvatarId]);

  if (!isOpen) return null;

  const selectedAvatar: AvatarPreset = getAvatarById(selectedId);

  // Filter avatars
  const filteredAvatars = AVATAR_PRESETS_50.filter(avatar => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'male' && avatar.category === 'male') ||
      (activeTab === 'female' && avatar.category === 'female') ||
      (activeTab === 'personality' && avatar.category === 'personality') ||
      (activeTab === 'accessory' && avatar.category === 'accessory') ||
      (activeTab === 'mascot' && avatar.category === 'mascot');

    const matchesSearch =
      avatar.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      avatar.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      avatar.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const handleSelect = (avatarId: string) => {
    setSelectedId(avatarId);
  };

  const handleConfirmAction = async () => {
    if (isSaving) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      await onConfirm(selectedId);
    } catch (error) {
      console.error('[Avatar Save Error]', error);
      setSaveError('Không thể lưu avatar. Vui lòng kiểm tra kết nối rồi thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      {/* Game Character Selection Container */}
      <div className="relative w-full max-w-5xl bg-gradient-to-b from-amber-50 via-sky-50 to-indigo-50 border-4 border-amber-300 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Game Title Bar */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 py-4 flex items-center justify-between border-b-4 border-amber-600 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-300/30 border-2 border-white/50 flex items-center justify-center shadow-inner">
              <Gamepad2 className="w-6 h-6 text-yellow-100 animate-bounce" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-wide text-yellow-100 drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)] uppercase">
                {isInitialSetup ? 'THIẾT LẬP NHÂN VẬT CHIBI CỦA BẠN' : 'CHỌN NHÂN VẬT AVATAR'}
              </h2>
              <p className="text-xs text-amber-100 font-medium">
                Chọn 1 trong 50 avatar Chibi độc đáo để sử dụng xuyên suốt ITEN!
              </p>
            </div>
          </div>

          {!isInitialSetup && onClose && (
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Area: Left/Top Preview + Right/Main Grid */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          
          {/* LARGE PREVIEW PANEL */}
          <div className="lg:w-80 bg-gradient-to-b from-amber-100/70 to-sky-100/70 p-5 border-b lg:border-b-0 lg:border-r-4 border-amber-200 flex flex-col items-center justify-between shrink-0 shadow-inner">
            <div className="w-full text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/30 text-amber-900 font-bold text-xs border border-amber-300 uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" /> YOUR CHIBI AVATAR
              </span>

              {/* Large Avatar Stage */}
              <div className="relative my-2 mx-auto w-44 h-44 sm:w-48 sm:h-48 rounded-3xl bg-gradient-to-b from-white to-sky-100 border-4 border-amber-300 shadow-xl flex items-center justify-center p-3 transform transition-transform duration-300 hover:scale-105">
                {/* Glow ring background */}
                <div className="absolute inset-0 rounded-3xl bg-amber-300/20 animate-pulse pointer-events-none" />
                
                <img
                  src={selectedAvatar.svgUrl}
                  alt={selectedAvatar.name}
                  className="w-full h-full object-contain filter drop-shadow-md animate-bounce-subtle"
                />

                {/* Selected Check Badge */}
                <div className="absolute top-2 right-2 bg-emerald-500 text-white w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              </div>

              {/* Avatar Info */}
              <div className="mt-3 px-2">
                <div className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-0.5">
                  ID: {selectedAvatar.id}
                </div>
                <h3 className="text-lg font-black text-slate-800 line-clamp-1">
                  {selectedAvatar.name}
                </h3>
                <p className="text-xs text-slate-600 mt-1 italic line-clamp-2 px-1">
                  "{selectedAvatar.description}"
                </p>
                
                <div className="mt-3 inline-block px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 shadow-sm">
                  ✨ "Ready to go!"
                </div>
              </div>
            </div>

            {/* CONFIRM BUTTON (GAME 3D STYLE) */}
            <div className="w-full mt-4 pt-3 border-t border-amber-200">
              {saveError && (
                <p className="mb-3 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-center text-xs font-bold text-rose-700" role="alert">
                  {saveError}
                </p>
              )}
              <button
                onClick={handleConfirmAction}
                disabled={isSaving}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white font-black text-base sm:text-lg tracking-wider border-2 border-amber-300 shadow-[0_6px_0_#b45309] hover:shadow-[0_4px_0_#b45309] active:translate-y-1 active:shadow-[0_0_0] transition-all flex items-center justify-center gap-2 group disabled:cursor-wait disabled:opacity-70"
              >
                <UserCheck className="w-6 h-6 text-yellow-200 group-hover:scale-110 transition-transform" />
                {isSaving ? 'ĐANG LƯU AVATAR...' : 'XÁC NHẬN AVATAR'}
              </button>
            </div>
          </div>

          {/* GALLERY GRID PANEL */}
          <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-hidden bg-white/60">
            
            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
              
              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'all', label: 'Tất cả (50)' },
                  { id: 'male', label: 'Nam Chibi' },
                  { id: 'female', label: 'Nữ Chibi' },
                  { id: 'personality', label: 'Cá tính' },
                  { id: 'accessory', label: 'Phụ kiện' },
                  { id: 'mascot', label: 'Mascot' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'bg-amber-500 text-white shadow-md border-2 border-amber-600 scale-105'
                        : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-800 border border-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative shrink-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm nhân vật..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs rounded-xl border-2 border-slate-200 bg-white focus:outline-none focus:border-amber-400 w-full sm:w-40"
                />
              </div>
            </div>

            {/* 50 AVATARS RESPONSIVE GRID (5 desktop / 4 tablet / 3 mobile) */}
            <div className="flex-1 overflow-y-auto pr-1">
              {filteredAvatars.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm font-medium">
                  Không tìm thấy nhân vật phù hợp từ khóa.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 p-1">
                  {filteredAvatars.map(avatar => {
                    const isSelected = avatar.id === selectedId;

                    return (
                      <button
                        key={avatar.id}
                        onClick={() => handleSelect(avatar.id)}
                        className={`group relative flex flex-col items-center p-2.5 rounded-2xl transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-b from-amber-100 to-orange-100 border-3 border-amber-500 shadow-lg scale-105 -translate-y-1 ring-4 ring-amber-300/60'
                            : 'bg-white hover:bg-amber-50/80 border-2 border-slate-200 hover:border-amber-300 shadow-sm hover:shadow-md hover:-translate-y-1'
                        }`}
                      >
                        {/* Selected Sparkle Badge */}
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white p-1 rounded-full shadow-md z-10 animate-spin-slow">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                        )}

                        {/* Avatar Image Card Container */}
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 group-hover:bg-amber-100/50 p-1 flex items-center justify-center transition-colors">
                          <img
                            src={avatar.svgUrl}
                            alt={avatar.name}
                            className={`w-full h-full object-contain transition-transform duration-200 ${
                              isSelected ? 'scale-110' : 'group-hover:scale-110'
                            }`}
                          />
                        </div>

                        {/* Avatar ID & Name label */}
                        <div className="mt-2 text-center w-full">
                          <span className="block text-[10px] font-black text-amber-600 uppercase tracking-tighter">
                            {avatar.id}
                          </span>
                          <span className={`block text-xs font-bold line-clamp-1 ${isSelected ? 'text-amber-900 font-extrabold' : 'text-slate-700'}`}>
                            {avatar.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Grid Footer Counter */}
            <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
              <span>Đang hiển thị {filteredAvatars.length} / 50 nhân vật Chibi</span>
              <span className="text-amber-600 font-bold">ITEN Chibi Collection</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

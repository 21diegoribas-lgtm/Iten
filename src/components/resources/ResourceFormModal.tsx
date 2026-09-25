import React, { useState } from 'react';
import { ResourceItem, ResourceType, ResourceAccessPermission, User } from '../../types';
import { soundFx } from '../../utils/sound';
import {
  X,
  Link as LinkIcon,
  FileText,
  Presentation,
  Video,
  BookOpen,
  Folder,
  Shield,
  Upload,
  Sparkles,
  Check
} from 'lucide-react';

interface ResourceFormModalProps {
  initialResource?: ResourceItem | null;
  currentUser: User;
  onSave: (resource: ResourceItem) => void;
  onClose: () => void;
}

export const ResourceFormModal: React.FC<ResourceFormModalProps> = ({
  initialResource,
  currentUser,
  onSave,
  onClose
}) => {
  const isEditing = !!initialResource;

  const [title, setTitle] = useState(initialResource?.title || '');
  const [url, setUrl] = useState(initialResource?.url || '');
  const [type, setType] = useState<ResourceType>(initialResource?.type || 'website');
  const [description, setDescription] = useState(initialResource?.description || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(initialResource?.thumbnailUrl || '');
  const [topic, setTopic] = useState(initialResource?.topic || 'Tiếng Anh');
  const [permission, setPermission] = useState<ResourceAccessPermission>(
    initialResource?.permission || 'all_class'
  );
  const [targetClassId, setTargetClassId] = useState(initialResource?.targetClassId || '8A1');

  const resourceTypesList: { type: ResourceType; label: string; icon: string; color: string }[] = [
    { type: 'website', label: '🔗 Website', icon: '🔗', color: 'bg-sky-100 border-sky-300 text-sky-800' },
    { type: 'presentation', label: '📽️ Bài trình chiếu', icon: '📽️', color: 'bg-amber-100 border-amber-300 text-amber-800' },
    { type: 'document', label: '📄 Tài liệu', icon: '📄', color: 'bg-emerald-100 border-emerald-300 text-emerald-800' },
    { type: 'video', label: '🎥 Video', icon: '🎥', color: 'bg-rose-100 border-rose-300 text-rose-800' },
    { type: 'learning_material', label: '📚 Tài nguyên học tập', icon: '📚', color: 'bg-purple-100 border-purple-300 text-purple-800' },
    { type: 'other', label: '📁 Khác', icon: '📁', color: 'bg-slate-100 border-slate-300 text-slate-800' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tên tài nguyên.');
      return;
    }

    soundFx.playSuccess();

    const resourceData: ResourceItem = {
      id: initialResource?.id || 'res_' + Date.now(),
      title: title.trim(),
      url: url.trim(),
      type: type,
      description: description.trim(),
      thumbnailUrl: thumbnailUrl.trim() || undefined,
      topic: topic.trim() || 'Chung',
      creatorName: initialResource?.creatorName || currentUser.fullName || 'Giáo viên',
      creatorId: initialResource?.creatorId || currentUser.id,
      createdAt: initialResource?.createdAt || new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      permission: permission,
      targetClassId: permission === 'class' ? targetClassId : undefined,
      embeddable: true
    };

    onSave(resourceData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border-4 border-amber-300 shadow-2xl space-y-5 animate-in zoom-in-95 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 border-2 border-amber-300 flex items-center justify-center text-2xl font-black shadow-2xs">
              {isEditing ? '✏️' : '🔗'}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">
                {isEditing ? 'Chỉnh sửa tài nguyên' : '+ Thêm tài nguyên mới'}
              </h3>
              <p className="text-xs font-bold text-slate-500">
                Lưu đường link, tài liệu hoặc bài giảng vào kho của giáo viên
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-xl hover:bg-slate-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tên tài nguyên */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">
              Tên tài nguyên <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ví dụ: Mô phỏng Thí nghiệm Khoa học PhET"
              className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-400"
              required
            />
          </div>

          {/* Đường link URL */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">
              Đường link URL (Website / Video / Tài liệu online)
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com/tai-nguyen-hoc-tap"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          {/* Loại tài nguyên */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5">
              Loại tài nguyên
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {resourceTypesList.map(item => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setType(item.type);
                  }}
                  className={`p-2.5 rounded-2xl text-xs font-black border-2 transition-all cursor-pointer text-left flex items-center gap-2 ${
                    type === item.type
                      ? `${item.color} shadow-2xs ring-2 ring-sky-400`
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="truncate">{item.label.replace(/^.\s*/, '')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nhóm / Chủ đề & Ảnh đại diện Thumbnail */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                Nhóm / Chủ đề môn học
              </label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Ví dụ: Tiếng Anh, Toán học..."
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                Link ảnh đại diện (Tùy chọn)
              </label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={e => setThumbnailUrl(e.target.value)}
                placeholder="https://.../thumbnail.jpg"
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          {/* Mô tả ngắn */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">
              Mô tả nội dung
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Mô tả tóm tắt nội dung tài nguyên bài giảng..."
              className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-sky-400"
            />
          </div>

          {/* Quyền truy cập (Phân quyền) */}
          <div className="p-4 bg-sky-50 rounded-2xl border-2 border-sky-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-sky-900">
              <Shield className="w-4 h-4 text-sky-600" />
              <span>Quyền truy cập cho học sinh</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <label
                onClick={() => setPermission('all_class')}
                className={`p-2.5 rounded-xl border-2 text-xs font-bold cursor-pointer transition-all flex items-center gap-2 ${
                  permission === 'all_class'
                    ? 'bg-white border-sky-500 text-sky-900 shadow-2xs font-black'
                    : 'bg-white/60 border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="permission"
                  checked={permission === 'all_class'}
                  onChange={() => setPermission('all_class')}
                  className="accent-sky-600"
                />
                <span>🌍 Tất cả học sinh</span>
              </label>

              <label
                onClick={() => setPermission('class')}
                className={`p-2.5 rounded-xl border-2 text-xs font-bold cursor-pointer transition-all flex items-center gap-2 ${
                  permission === 'class'
                    ? 'bg-white border-sky-500 text-sky-900 shadow-2xs font-black'
                    : 'bg-white/60 border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="permission"
                  checked={permission === 'class'}
                  onChange={() => setPermission('class')}
                  className="accent-sky-600"
                />
                <span>👥 Lớp được chọn (8A1)</span>
              </label>

              <label
                onClick={() => setPermission('private')}
                className={`p-2.5 rounded-xl border-2 text-xs font-bold cursor-pointer transition-all flex items-center gap-2 ${
                  permission === 'private'
                    ? 'bg-white border-sky-500 text-sky-900 shadow-2xs font-black'
                    : 'bg-white/60 border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="permission"
                  checked={permission === 'private'}
                  onChange={() => setPermission('private')}
                  className="accent-sky-600"
                />
                <span>🔒 Chỉ mình tôi (Riêng tư)</span>
              </label>

              <label
                onClick={() => setPermission('students')}
                className={`p-2.5 rounded-xl border-2 text-xs font-bold cursor-pointer transition-all flex items-center gap-2 ${
                  permission === 'students'
                    ? 'bg-white border-sky-500 text-sky-900 shadow-2xs font-black'
                    : 'bg-white/60 border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="permission"
                  checked={permission === 'students'}
                  onChange={() => setPermission('students')}
                  className="accent-sky-600"
                />
                <span>⭐ Học sinh được chọn</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all cursor-pointer"
            >
              Hủy
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-black text-xs rounded-2xl shadow-[0_4px_0_#C2410C] hover:brightness-105 active:translate-y-1 transition-all cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isEditing ? 'LƯU THAY ĐỔI' : 'LƯU TÀI NGUYÊN'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

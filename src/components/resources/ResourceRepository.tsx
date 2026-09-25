import React, { useState, useEffect, useRef } from 'react';
import { ResourceItem, ResourceType, ResourceAccessPermission, User, PresentationItem, PresentationFormat } from '../../types';
import { soundFx } from '../../utils/sound';
import {
  getAllResourcesFromDB,
  saveResourceToDB,
  deleteResourceFromDB
} from '../../utils/resourceStorage';
import {
  savePresentationToDB,
  getAllPresentationsFromDB,
  getOriginalFileBlobFromDB,
  deletePresentationFromDB,
  updateLastViewedSlideDB
} from '../../utils/slideStorage';
import { parsePdfFile, parsePptxFile, formatFileSize } from '../../utils/presentationParser';
import { getInitialDemoResources } from '../../data/sampleResources';
import { getInitialDemoPresentations } from '../../data/samplePresentations';

import { ResourceFormModal } from './ResourceFormModal';
import { InternalBrowserModal } from './InternalBrowserModal';
import { PresentationModeModal } from '../presentation/PresentationModeModal';

import {
  Search,
  Plus,
  ArrowUpDown,
  Play,
  ExternalLink,
  Edit3,
  Trash2,
  FolderOpen,
  Sparkles,
  Shield,
  Clock,
  User as UserIcon,
  Globe,
  FileText,
  Presentation as PresentationIcon,
  Video,
  BookOpen,
  Upload,
  Download,
  Eye,
  Lock,
  X,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';

interface ResourceRepositoryProps {
  currentUser: User;
}

export const ResourceRepository: React.FC<ResourceRepositoryProps> = ({ currentUser }) => {
  // Role check: Only Teachers and Admins can use this feature
  const isAuthorized = currentUser.role === 'teacher' || currentUser.role === 'admin';

  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [presentations, setPresentations] = useState<PresentationItem[]>([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');

  // Resource Form Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);

  // Presentation Upload Modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Tiếng Anh');
  const [uploadSubject, setUploadSubject] = useState('Bài giảng điện tử');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Viewing Modals
  const [activeBrowserResource, setActiveBrowserResource] = useState<ResourceItem | null>(null);
  const [activePresentation, setActivePresentation] = useState<PresentationItem | null>(null);
  const [detailPresentation, setDetailPresentation] = useState<PresentationItem | null>(null);

  // Load resources & presentations on mount
  useEffect(() => {
    if (isAuthorized) {
      loadData();
    }
  }, [isAuthorized]);

  const loadData = async () => {
    try {
      const dbResources = await getAllResourcesFromDB();
      if (dbResources.length === 0) {
        const demoR = getInitialDemoResources();
        for (const item of demoR) {
          await saveResourceToDB(item);
        }
        setResources(demoR);
      } else {
        setResources(dbResources);
      }

      const dbPresentations = await getAllPresentationsFromDB();
      if (dbPresentations.length === 0) {
        const demoP = getInitialDemoPresentations();
        for (const item of demoP) {
          await savePresentationToDB(item);
        }
        setPresentations(demoP);
      } else {
        setPresentations(dbPresentations);
      }
    } catch (err) {
      console.error('Error loading unified repository data:', err);
      setResources(getInitialDemoResources());
      setPresentations(getInitialDemoPresentations());
    }
  };

  // 1. RESOURCE HANDLERS
  const handleSaveResource = async (resource: ResourceItem) => {
    await saveResourceToDB(resource);
    setResources(prev => {
      const idx = prev.findIndex(r => r.id === resource.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = resource;
        return updated;
      }
      return [resource, ...prev];
    });
    setIsFormModalOpen(false);
    setEditingResource(null);
  };

  const handleDeleteResource = async (resource: ResourceItem) => {
    if (confirm(`Bạn có chắc chắn muốn xóa tài nguyên "${resource.title}"?`)) {
      soundFx.playClick();
      await deleteResourceFromDB(resource.id);
      setResources(prev => prev.filter(r => r.id !== resource.id));
    }
  };

  const handleOpenResource = (resource: ResourceItem) => {
    soundFx.playClick();
    if (resource.type === 'presentation' || resource.presentationId) {
      const matchPres = presentations.find(p => p.id === resource.presentationId) || presentations[0];
      if (matchPres) {
        setActivePresentation(matchPres);
        return;
      }
    }
    setActiveBrowserResource(resource);
  };

  // 2. PRESENTATION HANDLERS
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pptx' && ext !== 'pdf' && ext !== 'ppt') {
      alert('Chỉ hỗ trợ file trình chiếu định dạng .PPTX hoặc .PDF');
      return;
    }

    setUploadFile(file);
    setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
    setIsUploadModalOpen(true);
  };

  const handleStartUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsProcessingUpload(true);
    setUploadProgress(10);
    setUploadStatusText('Đang tải file lên kho lưu trữ...');

    const ext = uploadFile.name.split('.').pop()?.toLowerCase();
    const format: PresentationFormat = ext === 'pdf' ? 'pdf' : 'pptx';

    try {
      soundFx.playClick();
      setUploadProgress(30);
      setUploadStatusText('Đang trích xuất slide và khởi tạo preview...');

      let parseRes;
      if (format === 'pdf') {
        parseRes = await parsePdfFile(uploadFile, (pct) => setUploadProgress(30 + Math.floor(pct * 0.6)));
      } else {
        parseRes = await parsePptxFile(uploadFile, (pct) => setUploadProgress(30 + Math.floor(pct * 0.6)));
      }

      setUploadProgress(95);
      setUploadStatusText('Đang hoàn tất lưu trữ file gốc...');

      const newPresentation: PresentationItem = {
        id: 'pres_' + Date.now(),
        fileName: uploadFile.name,
        title: uploadTitle.trim() || parseRes.title,
        teacherOwner: currentUser.fullName || 'Giáo viên',
        teacherId: currentUser.id,
        uploadTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
        updatedTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
        format: format,
        fileSize: formatFileSize(uploadFile.size),
        fileSizeBytes: uploadFile.size,
        slideCount: parseRes.slideCount,
        thumbnail: parseRes.thumbnail,
        slideImages: parseRes.slideImages,
        status: 'ready',
        lastViewedSlide: 1,
        category: uploadCategory,
        subject: uploadSubject,
        description: `Bài trình chiếu ${format.toUpperCase()} gốc gồm ${parseRes.slideCount} slide.`
      };

      await savePresentationToDB(newPresentation, uploadFile);

      soundFx.playSuccess();
      setUploadProgress(100);
      setUploadStatusText('Đã tải lên thành công!');

      setTimeout(() => {
        setPresentations(prev => [newPresentation, ...prev]);
        setIsUploadModalOpen(false);
        setUploadFile(null);
        setIsProcessingUpload(false);
        setUploadProgress(0);
      }, 500);

    } catch (err) {
      console.error('Presentation upload failed:', err);
      soundFx.playError();
      alert('Không thể xử lý file trình chiếu này. Vui lòng kiểm tra lại định dạng file.');
      setIsProcessingUpload(false);
      setUploadProgress(0);
    }
  };

  const handleDeletePresentation = async (item: PresentationItem) => {
    if (confirm(`Bạn có chắc chắn muốn xóa bài trình chiếu "${item.title}"?`)) {
      soundFx.playClick();
      await deletePresentationFromDB(item.id);
      setPresentations(prev => prev.filter(p => p.id !== item.id));
      if (detailPresentation?.id === item.id) {
        setDetailPresentation(null);
      }
    }
  };

  const handleDownloadOriginal = async (item: PresentationItem) => {
    soundFx.playClick();
    try {
      const blob = await getOriginalFileBlobFromDB(item.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert('File gốc sẵn sàng trong kho dữ liệu ITEN!');
      }
    } catch (err) {
      console.error('Download original file failed:', err);
      alert('Không thể tải file gốc.');
    }
  };

  const handleUpdateLastViewed = async (slideIndex: number) => {
    if (activePresentation) {
      await updateLastViewedSlideDB(activePresentation.id, slideIndex);
      setPresentations(prev =>
        prev.map(p => (p.id === activePresentation.id ? { ...p, lastViewedSlide: slideIndex } : p))
      );
    }
  };

  // Standard Security Gate for Non-Teachers/Admins
  if (!isAuthorized) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border-4 border-amber-300 shadow-xl text-center max-w-2xl mx-auto space-y-4 my-8 animate-in zoom-in-95">
        <div className="w-20 h-20 rounded-full bg-amber-100 border-2 border-amber-300 text-amber-700 flex items-center justify-center mx-auto text-3xl shadow-inner">
          <Lock className="w-10 h-10 stroke-[2.5]" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-slate-800">
            Chức Năng Dành Riêng Cho Giáo Viên & Quản Trị Viên
          </h3>
          <p className="text-xs sm:text-sm font-medium text-slate-600 max-w-md mx-auto leading-relaxed">
            Kho Tài Nguyên & Bài Trình Chiếu Giảng Dạy được quản lý tập trung bởi Giáo viên và Admin để chuẩn bị bài học cho lớp. Học sinh vui lòng truy cập các bài giảng do thầy cô chỉ định.
          </p>
        </div>
        <div className="pt-2">
          <span className="px-4 py-2 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-black inline-flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            Vui lòng đăng nhập tài khoản Giáo viên hoặc Admin
          </span>
        </div>
      </div>
    );
  }

  // Combine Resources & Presentations for Grid Rendering
  interface UnifiedItem {
    id: string;
    isPresentation: boolean;
    title: string;
    description: string;
    topic: string;
    creatorName: string;
    createdAt: string;
    thumbnailUrl?: string;
    // For Resource
    resourceRaw?: ResourceItem;
    // For Presentation
    presentationRaw?: PresentationItem;
  }

  const unifiedList: UnifiedItem[] = [
    // Transform Presentation Items
    ...presentations.map(p => ({
      id: `pres_${p.id}`,
      isPresentation: true,
      title: p.title,
      description: `Bài trình chiếu ${p.format.toUpperCase()} (${p.slideCount} slides, ${p.fileSize}). ${p.description || ''}`,
      topic: p.category || 'Bài giảng điện tử',
      creatorName: p.teacherOwner,
      createdAt: p.uploadTime,
      thumbnailUrl: p.thumbnail,
      presentationRaw: p
    })),
    // Transform Resource Items
    ...resources.map(r => ({
      id: `res_${r.id}`,
      isPresentation: false,
      title: r.title,
      description: r.description || 'Tài nguyên liên kết web/tài liệu.',
      topic: r.topic || 'Chung',
      creatorName: r.creatorName,
      createdAt: r.createdAt,
      thumbnailUrl: r.thumbnailUrl,
      resourceRaw: r
    }))
  ];

  // Search and Filter
  const filteredList = unifiedList.filter(item => {
    // Search
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.creatorName.toLowerCase().includes(searchTerm.toLowerCase());

    // Type Filter
    let matchesType = true;
    if (typeFilter === 'presentation') {
      matchesType = item.isPresentation || item.resourceRaw?.type === 'presentation';
    } else if (typeFilter !== 'all') {
      matchesType = !item.isPresentation && item.resourceRaw?.type === typeFilter;
    }

    // Topic Filter
    const matchesTopic = topicFilter === 'all' || item.topic === topicFilter;

    return matchesSearch && matchesType && matchesTopic;
  });

  // Sorting
  const sortedList = [...filteredList].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'name') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  const allTopics = Array.from(new Set(unifiedList.map(i => i.topic).filter(Boolean)));

  const getTypeBadge = (item: UnifiedItem) => {
    if (item.isPresentation) {
      const format = item.presentationRaw?.format || 'pptx';
      return {
        label: `📽️ ${format.toUpperCase()} Slide`,
        bg: format === 'pdf' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
      };
    }

    const type = item.resourceRaw?.type || 'website';
    switch (type) {
      case 'presentation':
        return { label: '📽️ Bài trình chiếu', bg: 'bg-amber-500 text-white' };
      case 'document':
        return { label: '📄 Tài liệu', bg: 'bg-emerald-600 text-white' };
      case 'website':
        return { label: '🔗 Website', bg: 'bg-sky-500 text-white' };
      case 'video':
        return { label: '🎥 Video', bg: 'bg-rose-500 text-white' };
      case 'learning_material':
        return { label: '📚 Tài nguyên học tập', bg: 'bg-purple-600 text-white' };
      default:
        return { label: '📁 Khác', bg: 'bg-slate-700 text-white' };
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Unified Repository Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border-4 border-amber-300">
        <div className="absolute right-4 -bottom-6 text-9xl opacity-20 select-none">📚</div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase tracking-wider backdrop-blur-md flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Kho Tài Nguyên & Bài Trình Chiếu ITEN
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-300 text-[11px] font-black shadow-2xs border border-amber-300/40">
              🎓 Dành riêng cho Giáo viên & Admin
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white drop-shadow-sm">
            Kho Tài Nguyên & Bài Giảng Điện Tử Tập Trung
          </h2>
          <p className="text-sm font-medium text-amber-100 max-w-3xl leading-relaxed">
            Quản lý bài trình chiếu (.PPTX, .PDF) và các liên kết tài nguyên trực tuyến (Website, Mô phỏng PhET, Video) trong cùng một kho lưu trữ. Trình chiếu trực tiếp 16:9 hoặc mở xem trong trình duyệt nội bộ tiện lợi!
          </p>
        </div>
      </div>

      {/* 2. Top Controls, Search, Filter & Action Buttons */}
      <div className="bg-white/95 rounded-3xl p-5 border-2 border-amber-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0 sm:min-w-[260px] w-full sm:w-auto">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm tài nguyên, bài trình chiếu, môn học, giáo viên..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="py-2.5 px-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-400"
            >
              <option value="newest">📅 Mới nhất</option>
              <option value="oldest">⌛ Cũ nhất</option>
              <option value="name">🔤 Theo tên (A-Z)</option>
            </select>
          </div>

          {/* Action Buttons: Add Resource & Upload Presentation */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setEditingResource(null);
                setIsFormModalOpen(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs rounded-2xl shadow-[0_4px_0_#C2410C] hover:brightness-105 active:translate-y-1 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ THÊM TÀI NGUYÊN LINK</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                if (fileInputRef.current) fileInputRef.current.click();
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white font-black text-xs rounded-2xl shadow-[0_4px_0_#3730A3] hover:brightness-105 active:translate-y-1 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              <span>+ TẢI BÀI TRÌNH CHIẾU (.PPTX/.PDF)</span>
            </button>

            {/* Hidden Presentation Picker */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pptx,.pdf,.ppt"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => { soundFx.playClick(); setTypeFilter('all'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              typeFilter === 'all' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({unifiedList.length})
          </button>
          <button
            type="button"
            onClick={() => { soundFx.playClick(); setTypeFilter('presentation'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              typeFilter === 'presentation' ? 'bg-amber-500 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📽️ Bài trình chiếu ({unifiedList.filter(i => i.isPresentation || i.resourceRaw?.type === 'presentation').length})
          </button>
          <button
            type="button"
            onClick={() => { soundFx.playClick(); setTypeFilter('website'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              typeFilter === 'website' ? 'bg-sky-500 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🔗 Website ({unifiedList.filter(i => !i.isPresentation && i.resourceRaw?.type === 'website').length})
          </button>
          <button
            type="button"
            onClick={() => { soundFx.playClick(); setTypeFilter('document'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              typeFilter === 'document' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📄 Tài liệu ({unifiedList.filter(i => !i.isPresentation && i.resourceRaw?.type === 'document').length})
          </button>
          <button
            type="button"
            onClick={() => { soundFx.playClick(); setTypeFilter('video'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              typeFilter === 'video' ? 'bg-rose-500 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🎥 Video ({unifiedList.filter(i => !i.isPresentation && i.resourceRaw?.type === 'video').length})
          </button>
          <button
            type="button"
            onClick={() => { soundFx.playClick(); setTypeFilter('learning_material'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              typeFilter === 'learning_material' ? 'bg-purple-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📚 Học tập ({unifiedList.filter(i => !i.isPresentation && i.resourceRaw?.type === 'learning_material').length})
          </button>
        </div>

        {/* Topics Filter */}
        {allTopics.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Chủ đề:</span>
            <button
              type="button"
              onClick={() => setTopicFilter('all')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                topicFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
            {allTopics.map(topic => (
              <button
                key={topic}
                type="button"
                onClick={() => setTopicFilter(topic)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  topicFilter === topic ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Unified Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedList.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border-2 border-dashed border-amber-200 p-8 space-y-3">
            <FolderOpen className="w-16 h-16 text-amber-300 mx-auto" />
            <h3 className="text-lg font-black text-slate-700">Chưa có tài nguyên hoặc bài giảng nào</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Nhấn nút <span className="font-bold text-amber-600">+ THÊM TÀI NGUYÊN LINK</span> hoặc <span className="font-bold text-sky-600">+ TẢI BÀI TRÌNH CHIẾU</span> để tải nội dung lên kho.
            </p>
          </div>
        ) : (
          sortedList.map(item => {
            const badge = getTypeBadge(item);

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border-2 border-amber-200/80 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group hover:border-amber-400"
              >
                {/* Thumbnail Header */}
                <div
                  onClick={() => {
                    if (item.isPresentation && item.presentationRaw) {
                      soundFx.playClick();
                      setActivePresentation(item.presentationRaw);
                    } else if (item.resourceRaw) {
                      handleOpenResource(item.resourceRaw);
                    }
                  }}
                  className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer group"
                >
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 space-y-2 bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950">
                      {item.isPresentation ? (
                        <PresentationIcon className="w-12 h-12 text-amber-400" />
                      ) : (
                        <Globe className="w-12 h-12 text-sky-400" />
                      )}
                      <span className="text-xs font-bold">{badge.label}</span>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase shadow-2xs ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-slate-900/80 text-amber-300 backdrop-blur-md">
                      {item.topic}
                    </span>
                  </div>

                  {item.isPresentation && item.presentationRaw && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm">
                        {item.presentationRaw.slideCount} slides
                      </span>
                    </div>
                  )}

                  {/* Hover Overlay Button */}
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs shadow-lg flex items-center gap-2 transform group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 fill-current" />
                      <span>{item.isPresentation ? 'TRÌNH CHIẾU NGAY' : 'MỞ TÀI NGUYÊN'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-black text-slate-800 line-clamp-2 leading-snug group-hover:text-amber-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium pt-1">
                      <span className="flex items-center gap-1 font-bold text-slate-700">
                        <UserIcon className="w-3.5 h-3.5 text-amber-500" />
                        {item.creatorName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {item.createdAt}
                      </span>
                    </div>
                  </div>

                  {/* Card Action Controls */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {item.isPresentation && item.presentationRaw ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            soundFx.playClick();
                            setDetailPresentation(item.presentationRaw!);
                          }}
                          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                          title="Xem chi tiết & danh sách slide"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chi tiết</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            soundFx.playClick();
                            setActivePresentation(item.presentationRaw!);
                          }}
                          className="flex-1 py-2 px-3 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-black text-xs rounded-xl shadow-2xs hover:brightness-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>TRÌNH CHIẾU</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePresentation(item.presentationRaw!)}
                          className="py-2 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center"
                          title="Xóa bài trình chiếu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => item.resourceRaw && handleOpenResource(item.resourceRaw)}
                          className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs rounded-xl shadow-2xs hover:brightness-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>MỞ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            soundFx.playClick();
                            setEditingResource(item.resourceRaw || null);
                            setIsFormModalOpen(true);
                          }}
                          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                          title="Chỉnh sửa tài nguyên"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>SỬA</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => item.resourceRaw && handleDeleteResource(item.resourceRaw)}
                          className="py-2 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center"
                          title="Xóa tài nguyên"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. RESOURCE FORM MODAL (Add/Edit URL link) */}
      {isFormModalOpen && (
        <ResourceFormModal
          initialResource={editingResource}
          currentUser={currentUser}
          onSave={handleSaveResource}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingResource(null);
          }}
        />
      )}

      {/* 5. PRESENTATION UPLOAD MODAL */}
      {isUploadModalOpen && uploadFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border-4 border-amber-300 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                  📤
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Tải bài trình chiếu lên ITEN</h3>
                  <p className="text-[11px] font-bold text-slate-500">{uploadFile.name} ({formatFileSize(uploadFile.size)})</p>
                </div>
              </div>
              {!isProcessingUpload && (
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <form onSubmit={handleStartUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên bài trình chiếu</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  disabled={isProcessingUpload}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Môn / Chủ đề</label>
                  <input
                    type="text"
                    value={uploadCategory}
                    onChange={e => setUploadCategory(e.target.value)}
                    disabled={isProcessingUpload}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thể loại bài giảng</label>
                  <input
                    type="text"
                    value={uploadSubject}
                    onChange={e => setUploadSubject(e.target.value)}
                    disabled={isProcessingUpload}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Progress Indicator */}
              {isProcessingUpload && (
                <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-sky-900">
                    <span>{uploadStatusText}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-3 bg-sky-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-amber-500 transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                {!isProcessingUpload && (
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Hủy
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isProcessingUpload}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs rounded-xl shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isProcessingUpload ? 'Đang xử lý...' : 'Xác nhận tải lên'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. PRESENTATION DETAIL PREVIEW MODAL */}
      {detailPresentation && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full border-4 border-amber-300 shadow-2xl space-y-5 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase text-white ${
                  detailPresentation.format === 'pdf' ? 'bg-rose-500' : 'bg-amber-500'
                }`}>
                  {detailPresentation.format.toUpperCase()}
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-800">{detailPresentation.title}</h3>
                  <p className="text-xs text-slate-500">File gốc: {detailPresentation.fileName} ({detailPresentation.fileSize})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailPresentation(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>📋 Danh sách slide preview ({detailPresentation.slideCount} slides):</span>
                {detailPresentation.lastViewedSlide > 1 && (
                  <span className="text-amber-600 font-extrabold">📌 Dừng ở slide {detailPresentation.lastViewedSlide}</span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {detailPresentation.slideImages?.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      soundFx.playClick();
                      setActivePresentation({
                        ...detailPresentation,
                        lastViewedSlide: idx + 1
                      });
                      setDetailPresentation(null);
                    }}
                    className={`relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border-2 cursor-pointer group transition-all ${
                      detailPresentation.lastViewedSlide === idx + 1
                        ? 'border-amber-500 ring-2 ring-amber-300'
                        : 'border-slate-200 hover:border-amber-400'
                    }`}
                  >
                    <img src={img} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-lg bg-black/70 text-white text-[10px] font-bold">
                      Slide {idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => handleDeletePresentation(detailPresentation)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa file</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadOriginal(detailPresentation)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải file gốc</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setActivePresentation(detailPresentation);
                    setDetailPresentation(null);
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs rounded-xl shadow-md hover:brightness-105 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>TRÌNH CHIẾU NGAY</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. INTERNAL BROWSER MODAL (Links/Websites) */}
      {activeBrowserResource && (
        <InternalBrowserModal
          resource={activeBrowserResource}
          onClose={() => setActiveBrowserResource(null)}
        />
      )}

      {/* 8. ACTIVE PRESENTATION SLIDE MODE MODAL */}
      {activePresentation && (
        <PresentationModeModal
          presentation={activePresentation}
          onClose={() => setActivePresentation(null)}
          onUpdateLastViewed={handleUpdateLastViewed}
          onDownloadOriginal={handleDownloadOriginal}
        />
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { PresentationItem, PresentationFormat, User } from '../../types';
import { soundFx } from '../../utils/sound';
import {
  savePresentationToDB,
  getAllPresentationsFromDB,
  getOriginalFileBlobFromDB,
  deletePresentationFromDB,
  updateLastViewedSlideDB
} from '../../utils/slideStorage';
import { parsePdfFile, parsePptxFile, formatFileSize } from '../../utils/presentationParser';
import { getInitialDemoPresentations } from '../../data/samplePresentations';
import { PresentationModeModal } from './PresentationModeModal';
import {
  Presentation as PresentationIcon,
  Upload,
  Play,
  Search,
  Filter,
  Trash2,
  Download,
  Eye,
  FileText,
  Clock,
  User as UserIcon,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FolderOpen,
  X,
  Plus
} from 'lucide-react';

interface PresentationRepositoryProps {
  currentUser: User;
}

export const PresentationRepository: React.FC<PresentationRepositoryProps> = ({ currentUser }) => {
  const [presentations, setPresentations] = useState<PresentationItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'pptx' | 'pdf'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activePresentation, setActivePresentation] = useState<PresentationItem | null>(null);
  const [detailModalPresentation, setDetailModalPresentation] = useState<PresentationItem | null>(null);

  // Upload modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Tiếng Anh');
  const [uploadSubject, setUploadSubject] = useState('Bài giảng điện tử');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load presentations on mount
  useEffect(() => {
    loadPresentations();
  }, []);

  const loadPresentations = async () => {
    try {
      const dbItems = await getAllPresentationsFromDB();
      if (dbItems.length === 0) {
        // Initialize with high quality demo presentation decks
        const demoItems = getInitialDemoPresentations();
        for (const item of demoItems) {
          await savePresentationToDB(item);
        }
        setPresentations(demoItems);
      } else {
        setPresentations(dbItems);
      }
    } catch (err) {
      console.error('Error loading presentations:', err);
      setPresentations(getInitialDemoPresentations());
    }
  };

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
      setUploadStatusText('Đang trích xuất slide và khởi tạo bản preview...');

      let parseRes;
      if (format === 'pdf') {
        parseRes = await parsePdfFile(uploadFile, (pct) => setUploadProgress(30 + Math.floor(pct * 0.6)));
      } else {
        parseRes = await parsePptxFile(uploadFile, (pct) => setUploadProgress(30 + Math.floor(pct * 0.6)));
      }

      setUploadProgress(95);
      setUploadStatusText('Đang hoàn tất lưu giữ file gốc...');

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
        description: `File trình chiếu ${format.toUpperCase()} gốc với ${parseRes.slideCount} slide.`
      };

      // Save to IndexedDB along with original File Blob
      await savePresentationToDB(newPresentation, uploadFile);

      soundFx.playSuccess();
      setUploadProgress(100);
      setUploadStatusText('Đã lưu thành công!');

      setTimeout(() => {
        setPresentations(prev => [newPresentation, ...prev]);
        setIsUploadModalOpen(false);
        setUploadFile(null);
        setIsProcessingUpload(false);
        setUploadProgress(0);
      }, 500);

    } catch (err) {
      console.error('Upload processing failed:', err);
      soundFx.playError();
      alert('Không thể xử lý file trình chiếu này. Vui lòng kiểm tra lại định dạng file.');
      setIsProcessingUpload(false);
      setUploadProgress(0);
    }
  };

  const handleDeletePresentation = async (item: PresentationItem) => {
    if (confirm(`Bạn có chắc chắn muốn xóa file trình chiếu "${item.title}"?`)) {
      soundFx.playClick();
      await deletePresentationFromDB(item.id);
      setPresentations(prev => prev.filter(p => p.id !== item.id));
      if (detailModalPresentation?.id === item.id) {
        setDetailModalPresentation(null);
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
        alert('File gốc sẵn sàng trong hệ thống ITEN!');
      }
    } catch (err) {
      console.error('Failed to download original presentation file:', err);
      alert('Tải file gốc không thành công.');
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

  // Filtered list
  const filteredPresentations = presentations.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.teacherOwner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFormat = formatFilter === 'all' || p.format === formatFilter;
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;

    return matchesSearch && matchesFormat && matchesCategory;
  });

  const categoriesList = Array.from(new Set(presentations.map(p => p.category).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* 1. ITEN Top Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border-4 border-sky-300">
        <div className="absolute right-4 -bottom-8 text-9xl opacity-20 select-none">📊</div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase tracking-wider backdrop-blur-md flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Kho Trình Chiếu ITEN
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[11px] font-black shadow-2xs">
              Trình chiếu trực tiếp
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white drop-shadow-sm">
            Kho Bài Trình Chiếu & Trình Chiếu Tích Hợp
          </h2>
          <p className="text-sm font-medium text-sky-100 max-w-3xl leading-relaxed">
            Tải file trình chiếu (<span className="font-bold underline">.PPTX</span>, <span className="font-bold underline">.PDF</span>), lưu giữ file gốc an toàn và trình chiếu trực tiếp trong ứng dụng ITEN mà KHÔNG cần mở PowerPoint hay phần mềm bên ngoài!
          </p>
        </div>
      </div>

      {/* 2. Controls & Search Bar */}
      <div className="bg-white/95 rounded-3xl p-5 border-2 border-sky-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0 sm:min-w-[260px] w-full sm:w-auto">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm bài trình chiếu, tên file, giáo viên..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          {/* Format Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => { soundFx.playClick(); setFormatFilter('all'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                formatFilter === 'all' ? 'bg-white text-sky-800 shadow-2xs border border-sky-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({presentations.length})
            </button>
            <button
              type="button"
              onClick={() => { soundFx.playClick(); setFormatFilter('pptx'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                formatFilter === 'pptx' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📊 PPTX ({presentations.filter(p => p.format === 'pptx').length})
            </button>
            <button
              type="button"
              onClick={() => { soundFx.playClick(); setFormatFilter('pdf'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                formatFilter === 'pdf' ? 'bg-rose-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📕 PDF ({presentations.filter(p => p.format === 'pdf').length})
            </button>
          </div>

          {/* Upload Button */}
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              if (fileInputRef.current) fileInputRef.current.click();
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-black text-xs rounded-2xl shadow-[0_4px_0_#C2410C] hover:brightness-105 active:translate-y-1 transition-all cursor-pointer flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ TẢI TRÌNH CHIẾU</span>
          </button>

          {/* Hidden File Picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pptx,.pdf,.ppt"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Categories Bar */}
        {categoriesList.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Chủ đề:</span>
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
            {categoriesList.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat!)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  categoryFilter === cat ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Presentation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPresentations.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border-2 border-dashed border-sky-200 p-8 space-y-3">
            <FolderOpen className="w-16 h-16 text-sky-300 mx-auto" />
            <h3 className="text-lg font-black text-slate-700">Chưa có bài trình chiếu nào</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Nhấn nút <span className="font-bold text-amber-600">+ TẢI TRÌNH CHIẾU</span> để tải file PPTX hoặc PDF lên kho ứng dụng ITEN.
            </p>
          </div>
        ) : (
          filteredPresentations.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border-2 border-sky-100 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group hover:border-sky-300"
            >
              {/* Thumbnail Container */}
              <div
                onClick={() => {
                  soundFx.playClick();
                  setActivePresentation(item);
                }}
                className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer group"
              >
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <FileText className="w-12 h-12" />
                    <span className="text-xs font-bold">{item.format.toUpperCase()} Presentation</span>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase text-white shadow-2xs ${
                    item.format === 'pdf' ? 'bg-rose-500' : 'bg-amber-500'
                  }`}>
                    {item.format.toUpperCase()}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-md">
                    {item.slideCount} slides
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm">
                    {item.fileSize}
                  </span>
                </div>

                {/* Hover Play Button Overlay */}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="px-4 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-xs shadow-lg flex items-center gap-2 transform group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-current" />
                    <span>TRÌNH CHIẾU NGAY</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <h3 className="text-sm font-black text-slate-800 line-clamp-2 leading-snug group-hover:text-sky-600 transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1 font-bold text-slate-700">
                      <UserIcon className="w-3.5 h-3.5 text-sky-500" />
                      {item.teacherOwner}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {item.uploadTime}
                    </span>
                  </div>
                </div>

                {/* Option Buttons (Requirement #5) */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setDetailModalPresentation(item);
                    }}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Mở</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setActivePresentation(item);
                    }}
                    className="py-2 px-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black text-xs rounded-xl shadow-2xs hover:brightness-105 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Trình chiếu</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Upload Modal with Progress Bar (Requirement #6 & #7) */}
      {isUploadModalOpen && uploadFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border-4 border-amber-300 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                  📤
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Tải file trình chiếu lên ITEN</h3>
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

              {/* Progress Bar Indicator */}
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

      {/* 5. Details Modal ("Mở" Preview Modal) */}
      {detailModalPresentation && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full border-4 border-sky-300 shadow-2xl space-y-5 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase text-white ${
                  detailModalPresentation.format === 'pdf' ? 'bg-rose-500' : 'bg-amber-500'
                }`}>
                  {detailModalPresentation.format.toUpperCase()}
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-800">{detailModalPresentation.title}</h3>
                  <p className="text-xs text-slate-500">File gốc: {detailModalPresentation.fileName} ({detailModalPresentation.fileSize})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalPresentation(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slides Preview Grid */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>📋 Danh sách slide preview ({detailModalPresentation.slideCount} slides):</span>
                {detailModalPresentation.lastViewedSlide > 1 && (
                  <span className="text-amber-600 font-extrabold">📌 Dừng ở slide {detailModalPresentation.lastViewedSlide}</span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {detailModalPresentation.slideImages?.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      soundFx.playClick();
                      setActivePresentation({
                        ...detailModalPresentation,
                        lastViewedSlide: idx + 1
                      });
                      setDetailModalPresentation(null);
                    }}
                    className={`relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border-2 cursor-pointer group transition-all ${
                      detailModalPresentation.lastViewedSlide === idx + 1
                        ? 'border-amber-500 ring-2 ring-amber-300'
                        : 'border-slate-200 hover:border-sky-400'
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

            {/* Bottom Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => handleDeletePresentation(detailModalPresentation)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa file</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadOriginal(detailModalPresentation)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải file gốc</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setActivePresentation(detailModalPresentation);
                    setDetailModalPresentation(null);
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black text-xs rounded-xl shadow-md hover:brightness-105 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>TRÌNH CHIẾU NGAY</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Active Presentation Mode Modal */}
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

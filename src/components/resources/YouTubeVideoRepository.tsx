import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Play, Plus, Search, Trash2, X, Youtube } from 'lucide-react';
import type { User } from '../../types';
import { soundFx } from '../../utils/sound';
import { deleteYouTubeVideo, loadYouTubeVideos, saveYouTubeVideo, type SavedYouTubeVideo } from '../../services/youtubeVideoService';

interface YouTubeVideoRepositoryProps { currentUser: User }

function getYouTubeVideoId(value: string): string | null {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    let id = '';
    if (host === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] || '';
    else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (url.pathname === '/watch') id = url.searchParams.get('v') || '';
      else if (/^\/(embed|shorts|live)\//.test(url.pathname)) id = url.pathname.split('/')[2] || '';
    }
    return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export const YouTubeVideoRepository: React.FC<YouTubeVideoRepositoryProps> = ({ currentUser }) => {
  const storageKey = `iten_youtube_videos_${currentUser.id}`;
  const [videos, setVideos] = useState<SavedYouTubeVideo[]>([]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [search, setSearch] = useState('');
  const [activeVideo, setActiveVideo] = useState<SavedYouTubeVideo | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let cached: SavedYouTubeVideo[] = [];
    try {
      const saved = localStorage.getItem(storageKey);
      cached = saved ? JSON.parse(saved) : [];
      setVideos(cached);
    } catch {
      setVideos([]);
    }
    loadYouTubeVideos(currentUser.id).then(remote => {
      if (cancelled) return;
      const merged = [...remote, ...cached.filter(local => !remote.some(item => item.id === local.id))];
      setVideos(merged);
      localStorage.setItem(storageKey, JSON.stringify(merged));
    }).catch(error => console.error('[YouTube videos load]', error));
    return () => { cancelled = true; };
  }, [currentUser.id, storageKey]);

  const persist = (items: SavedYouTubeVideo[]) => {
    setVideos(items);
    localStorage.setItem(storageKey, JSON.stringify(items));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const videoId = getYouTubeVideoId(url);
    if (!videoId) {
      setError('Link YouTube không hợp lệ. Hãy dùng link xem, link chia sẻ, Shorts hoặc Live của YouTube.');
      return;
    }
    if (videos.some(item => item.videoId === videoId)) {
      setError('Video này đã có trong danh sách.');
      return;
    }
    const item: SavedYouTubeVideo = {
      id: `youtube_${Date.now()}`,
      ownerId: currentUser.id,
      classId: currentUser.classId || '',
      videoId,
      title: title.trim() || `Video YouTube ${videos.length + 1}`,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      createdAt: new Date().toLocaleString('vi-VN'),
    };
    persist([item, ...videos]);
    setTitle('');
    setUrl('');
    setError('');
    soundFx.playSuccess();
    try { await saveYouTubeVideo(item); }
    catch (saveError) { console.error('[YouTube video save]', saveError); }
  };

  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi');
    return keyword ? videos.filter(item => item.title.toLocaleLowerCase('vi').includes(keyword)) : videos;
  }, [videos, search]);

  return <div className="space-y-5">
    <div className="rounded-3xl bg-gradient-to-r from-red-600 to-rose-600 p-6 text-white shadow-lg border-4 border-red-200">
      <h2 className="text-2xl font-black flex items-center gap-2"><Youtube className="w-7 h-7" /> Video YouTube chuẩn bị sẵn</h2>
      <p className="mt-1 text-sm font-semibold text-white/90">Lưu link ở nhà và mở video nhúng ngay khi lên lớp.</p>
    </div>

    <form onSubmit={handleSave} className="rounded-3xl bg-white border-2 border-red-100 p-5 shadow-sm space-y-3">
      <h3 className="font-black text-slate-800">Thêm video YouTube</h3>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_auto] gap-3">
        <input aria-label="Tên video" value={title} onChange={event => setTitle(event.target.value)} placeholder="Tên bài giảng / video" className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" />
        <input aria-label="Link YouTube" value={url} onChange={event => setUrl(event.target.value)} placeholder="Dán link YouTube..." required className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" />
        <button type="submit" className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-black flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Lưu video</button>
      </div>
      {error && <p role="alert" className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">{error}</p>}
    </form>

    <div className="relative max-w-md">
      <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
      <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm video đã lưu..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {filtered.map(item => <article key={item.id} className="rounded-3xl overflow-hidden bg-white border-2 border-slate-100 shadow-sm">
        <button type="button" onClick={() => setActiveVideo(item)} className="relative block w-full aspect-video bg-slate-900 group">
          <img src={`https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`} alt={item.title} className="w-full h-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35"><span className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl"><Play className="w-6 h-6 fill-current ml-1" /></span></span>
        </button>
        <div className="p-4 space-y-3">
          <div><h3 className="font-black text-slate-800 line-clamp-2">{item.title}</h3><p className="text-[11px] text-slate-400 mt-1">Đã lưu: {item.createdAt}</p></div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setActiveVideo(item)} className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-black flex items-center justify-center gap-1.5"><Play className="w-3.5 h-3.5 fill-current" /> Xem video</button>
            <a href={item.url} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-slate-100 text-slate-600" title="Mở trên YouTube"><ExternalLink className="w-4 h-4" /></a>
            <button type="button" onClick={async () => { if (confirm(`Xóa video “${item.title}”?`)) { persist(videos.filter(video => video.id !== item.id)); try { await deleteYouTubeVideo(item.id); } catch (deleteError) { console.error('[YouTube video delete]', deleteError); } } }} className="p-2 rounded-xl bg-rose-50 text-rose-600" title="Xóa"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      </article>)}
      {!filtered.length && <div className="md:col-span-2 xl:col-span-3 rounded-3xl border-2 border-dashed border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-500">Chưa có video YouTube nào được lưu.</div>}
    </div>

    {activeVideo && <div className="fixed inset-0 z-50 bg-black/90 p-3 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-6xl space-y-3">
        <div className="flex items-center justify-between gap-3 text-white"><h3 className="font-black truncate">{activeVideo.title}</h3><button type="button" onClick={() => setActiveVideo(null)} className="p-2 rounded-xl bg-white/15 hover:bg-white/25"><X className="w-5 h-5" /></button></div>
        <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
          <iframe src={`https://www.youtube-nocookie.com/embed/${activeVideo.videoId}?autoplay=1&rel=0`} title={activeVideo.title} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
        </div>
      </div>
    </div>}
  </div>;
};

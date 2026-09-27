import { collection, deleteDoc, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface SavedYouTubeVideo {
  id: string;
  ownerId: string;
  classId: string;
  videoId: string;
  title: string;
  url: string;
  createdAt: string;
}

const COLLECTION = 'youtubeVideos';

export async function loadYouTubeVideos(ownerId: string): Promise<SavedYouTubeVideo[]> {
  if (!ownerId) return [];
  const snapshot = await getDocs(query(collection(db, COLLECTION), where('ownerId', '==', ownerId)));
  return snapshot.docs
    .map(item => ({ ...item.data(), id: item.id }) as SavedYouTubeVideo)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveYouTubeVideo(video: SavedYouTubeVideo): Promise<void> {
  if (!video.id || !video.ownerId || !/^[a-zA-Z0-9_-]{11}$/.test(video.videoId)) throw new Error('Video YouTube không hợp lệ.');
  await setDoc(doc(db, COLLECTION, video.id), { ...video, updatedAt: serverTimestamp() });
}

export async function deleteYouTubeVideo(id: string): Promise<void> {
  if (!id) return;
  await deleteDoc(doc(db, COLLECTION, id));
}

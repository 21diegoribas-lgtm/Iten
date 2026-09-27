import { useEffect, useRef, useState } from 'react';

type GameMusicKey = 'fishing' | 'lottery';
const DB_NAME = 'iten_game_music_db';
const STORE = 'tracks';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.objectStoreNames.contains(STORE) || request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readTrack(key: GameMusicKey): Promise<{ name: string; blob: Blob } | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function writeTrack(key: GameMusicKey, value: { name: string; blob: Blob } | null): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = value
      ? db.transaction(STORE, 'readwrite').objectStore(STORE).put(value, key)
      : db.transaction(STORE, 'readwrite').objectStore(STORE).delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function useGameMusic(key: GameMusicKey) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef('');
  const [trackName, setTrackName] = useState('');

  const setBlob = (blob: Blob | null, name = '') => {
    audioRef.current?.pause();
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = blob ? URL.createObjectURL(blob) : '';
    audioRef.current = blob ? new Audio(objectUrlRef.current) : null;
    if (audioRef.current) audioRef.current.loop = true;
    setTrackName(name);
  };

  useEffect(() => {
    let cancelled = false;
    readTrack(key).then(track => { if (!cancelled && track) setBlob(track.blob, track.name); }).catch(console.error);
    return () => { cancelled = true; audioRef.current?.pause(); if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); };
  }, [key]);

  return {
    trackName,
    choose: async (file?: File) => {
      if (!file) return;
      await writeTrack(key, { name: file.name, blob: file });
      setBlob(file, file.name);
    },
    clear: async () => { await writeTrack(key, null); setBlob(null); },
    play: () => { if (audioRef.current) { audioRef.current.currentTime = 0; void audioRef.current.play(); } },
    stop: () => { audioRef.current?.pause(); if (audioRef.current) audioRef.current.currentTime = 0; },
  };
}

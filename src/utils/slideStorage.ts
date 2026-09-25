import { PresentationItem } from '../types';

const DB_NAME = 'iten_presentations_db';
const DB_VERSION = 1;
const STORE_NAME = 'presentations';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result as IDBDatabase);
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

/**
 * Save presentation record along with its original file Blob
 */
export async function savePresentationToDB(item: PresentationItem, blob?: Blob | File): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const recordToSave = {
      ...item,
      blobData: blob || item.originalFileBlob || null
    };

    delete recordToSave.originalFileBlob; // keep object lightweight

    await new Promise<void>((resolve, reject) => {
      const req = store.put(recordToSave);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to save presentation to IndexedDB:', err);
  }
}

/**
 * Get all saved presentations
 */
export async function getAllPresentationsFromDB(): Promise<PresentationItem[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result || [];
        const items: PresentationItem[] = results.map(r => ({
          id: r.id,
          fileName: r.fileName,
          title: r.title,
          teacherOwner: r.teacherOwner,
          teacherId: r.teacherId,
          uploadTime: r.uploadTime,
          updatedTime: r.updatedTime,
          format: r.format,
          fileSize: r.fileSize,
          fileSizeBytes: r.fileSizeBytes,
          slideCount: r.slideCount,
          thumbnail: r.thumbnail,
          slideImages: r.slideImages || [],
          status: r.status || 'ready',
          errorMessage: r.errorMessage,
          lastViewedSlide: r.lastViewedSlide || 1,
          category: r.category || 'Chung',
          subject: r.subject || 'Tổng hợp',
          description: r.description
        }));
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to read presentations from IndexedDB:', err);
    return [];
  }
}

/**
 * Retrieve original file Blob for downloading
 */
export async function getOriginalFileBlobFromDB(id: string): Promise<Blob | File | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result && req.result.blobData) {
          resolve(req.result.blobData);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to fetch original blob:', err);
    return null;
  }
}

/**
 * Update last viewed slide number
 */
export async function updateLastViewedSlideDB(id: string, slideIndex: number): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const reqGet = store.get(id);
    reqGet.onsuccess = () => {
      if (reqGet.result) {
        const updated = { ...reqGet.result, lastViewedSlide: slideIndex, updatedTime: new Date().toISOString().replace('T', ' ').substring(0, 16) };
        store.put(updated);
      }
    };
  } catch (err) {
    console.error('Failed to update lastViewedSlide:', err);
  }
}

/**
 * Delete presentation record and original file
 */
export async function deletePresentationFromDB(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to delete presentation:', err);
  }
}

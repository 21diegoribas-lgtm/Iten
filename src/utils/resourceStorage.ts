import { ResourceItem } from '../types';
import { getInitialDemoResources } from '../data/sampleResources';

const DB_NAME = 'iten_resources_db';
const DB_VERSION = 1;
const STORE_NAME = 'resources';

function openResourceDB(): Promise<IDBDatabase> {
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

export async function getAllResourcesFromDB(): Promise<ResourceItem[]> {
  try {
    const db = await openResourceDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Falling back to LocalStorage for resources:', err);
    const local = localStorage.getItem('iten_resources_data');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        return [];
      }
    }
    return [];
  }
}

export async function saveResourceToDB(item: ResourceItem): Promise<void> {
  try {
    const db = await openResourceDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Saving resource to LocalStorage fallback:', err);
    const items = await getAllResourcesFromDB();
    const existingIndex = items.findIndex(i => i.id === item.id);
    if (existingIndex >= 0) {
      items[existingIndex] = item;
    } else {
      items.unshift(item);
    }
    localStorage.setItem('iten_resources_data', JSON.stringify(items));
  }
}

export async function deleteResourceFromDB(id: string): Promise<void> {
  try {
    const db = await openResourceDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Deleting resource from LocalStorage fallback:', err);
    const items = await getAllResourcesFromDB();
    const filtered = items.filter(i => i.id !== id);
    localStorage.setItem('iten_resources_data', JSON.stringify(filtered));
  }
}

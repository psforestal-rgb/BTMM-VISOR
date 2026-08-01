import type { StateStorage } from 'zustand/middleware';

const DB_NAME = 'btmm-visor';
const STORE_NAME = 'zustand-state';
const DB_VERSION = 1;

function notifyStorageError() {
  window.dispatchEvent(new Event('btmm-storage-error'));
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB no está disponible'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('No se pudo abrir IndexedDB'));
  });
}

async function runRequest<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const request = operation(transaction.objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Falló la operación de IndexedDB'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Se canceló la transacción de IndexedDB'));
    });
  } finally {
    db.close();
  }
}

function readLegacyValue(name: string): string | null {
  try {
    return window.localStorage.getItem(name);
  } catch {
    return null;
  }
}

export const indexedDBStorage: StateStorage = {
  async getItem(name) {
    try {
      const stored = await runRequest('readonly', (store) => store.get(name));
      if (typeof stored === 'string') return stored;

      // One-time migration from the original localStorage implementation.
      const legacy = readLegacyValue(name);
      if (legacy !== null) {
        await runRequest('readwrite', (store) => store.put(legacy, name));
        try { window.localStorage.removeItem(name); } catch { /* best effort */ }
      }
      return legacy;
    } catch {
      return readLegacyValue(name);
    }
  },

  async setItem(name, value) {
    try {
      await runRequest('readwrite', (store) => store.put(value, name));
      return;
    } catch {
      try {
        window.localStorage.setItem(name, value);
        return;
      } catch {
        notifyStorageError();
        throw new Error('No se pudo persistir el estado del visor');
      }
    }
  },

  async removeItem(name) {
    try {
      await runRequest('readwrite', (store) => store.delete(name));
    } catch {
      // Continue with the legacy cleanup below.
    }
    try { window.localStorage.removeItem(name); } catch { /* best effort */ }
  },
};

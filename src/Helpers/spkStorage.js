// spkStorage.js
import { get, set } from 'idb-keyval';

const SPK_KEY = 'cachedSPK';

export const saveSPKToIndexedDB = async (data) => {
  try {
    await set(SPK_KEY, {
      timestamp: Date.now(),
      data: data,
    });
  } catch (err) {
    console.error('Error saving SPK to IndexedDB:', err);
  }
};

export const getSPKFromIndexedDB = async (maxAgeMs = 10 * 60 * 1000) => {
  try {
    const cached = await get(SPK_KEY);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > maxAgeMs) return null; // Expired
    return cached.data;
  } catch (err) {
    console.error('Error reading SPK from IndexedDB:', err);
    return null;
  }
};

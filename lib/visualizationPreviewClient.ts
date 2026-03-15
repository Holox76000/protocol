"use client";

import type { FunnelVariant } from "./funnels";
import { getVisualizationPreviewStorageKey, type VisualizationPreviewPayload } from "./visualizationPreview";

const DB_NAME = "protocol-visualization-preview";
const STORE_NAME = "previews";
const DB_VERSION = 1;
const memoryPreviewStore = new Map<string, VisualizationPreviewPayload>();

function getStorageKey(funnel: FunnelVariant) {
  return getVisualizationPreviewStorageKey(funnel);
}

function hasIndexedDbSupport() {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!hasIndexedDbSupport()) {
      reject(new Error("IndexedDB is unavailable in this browser context."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open preview database."));
  });
}

export async function saveVisualizationPreview(
  funnel: FunnelVariant,
  payload: VisualizationPreviewPayload
) {
  const storageKey = getStorageKey(funnel);
  memoryPreviewStore.set(storageKey, payload);

  if (!hasIndexedDbSupport()) {
    return;
  }

  try {
    const database = await openDatabase();

    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.put(payload, storageKey);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Could not save preview data."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Could not save preview data."));
    });

    database.close();
  } catch (error) {
    console.warn("[visualizationPreview] falling back to in-memory storage", error);
  }
}

export async function loadVisualizationPreview(funnel: FunnelVariant) {
  const storageKey = getStorageKey(funnel);
  const memoryPreview = memoryPreviewStore.get(storageKey) ?? null;
  if (memoryPreview) {
    return memoryPreview;
  }

  if (!hasIndexedDbSupport()) {
    return null;
  }

  try {
    const database = await openDatabase();

    const preview = await new Promise<VisualizationPreviewPayload | null>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(storageKey);

      request.onsuccess = () => {
        resolve((request.result as VisualizationPreviewPayload | undefined) ?? null);
      };
      request.onerror = () => reject(request.error ?? new Error("Could not load preview data."));
    });

    database.close();

    if (preview) {
      memoryPreviewStore.set(storageKey, preview);
    }

    return preview;
  } catch (error) {
    console.warn("[visualizationPreview] could not load persisted preview", error);
    return null;
  }
}

export async function clearVisualizationPreview(funnel: FunnelVariant) {
  const storageKey = getStorageKey(funnel);
  memoryPreviewStore.delete(storageKey);

  if (!hasIndexedDbSupport()) {
    return;
  }

  try {
    const database = await openDatabase();

    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.delete(storageKey);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Could not clear preview data."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Could not clear preview data."));
    });

    database.close();
  } catch (error) {
    console.warn("[visualizationPreview] could not clear persisted preview", error);
  }
}

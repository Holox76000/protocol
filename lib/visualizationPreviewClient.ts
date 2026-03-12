"use client";

import type { FunnelVariant } from "./funnels";
import { getVisualizationPreviewStorageKey, type VisualizationPreviewPayload } from "./visualizationPreview";

const DB_NAME = "protocol-visualization-preview";
const STORE_NAME = "previews";
const DB_VERSION = 1;

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
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
  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.put(payload, getVisualizationPreviewStorageKey(funnel));

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not save preview data."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Could not save preview data."));
  });

  database.close();
}

export async function loadVisualizationPreview(funnel: FunnelVariant) {
  const database = await openDatabase();

  const preview = await new Promise<VisualizationPreviewPayload | null>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(getVisualizationPreviewStorageKey(funnel));

    request.onsuccess = () => {
      resolve((request.result as VisualizationPreviewPayload | undefined) ?? null);
    };
    request.onerror = () => reject(request.error ?? new Error("Could not load preview data."));
  });

  database.close();
  return preview;
}

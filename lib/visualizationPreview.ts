import type { FunnelVariant } from "./funnels";

export type VisualizationPreviewPayload = {
  beforeBlob: Blob;
  afterBlob?: Blob | null;
  previewId?: string | null;
};

export function getVisualizationPreviewStorageKey(funnel: FunnelVariant) {
  return `protocol.visualization-preview.${funnel}`;
}

import type { Metadata } from "next";
import WebcamCapture from "./WebcamCapture";

export const metadata: Metadata = {
  title: "Preview | Protocol",
};

export default function PreviewPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16 lg:px-0">
      <div className="mx-auto max-w-[720px]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute mb-4">
          Preview
        </p>
        <h1 className="text-3xl font-display text-void mb-2">
          Prendre une photo
        </h1>
        <p className="text-dim mb-10">
          Activez votre caméra et prenez une photo. Elle sera traitée localement, aucune donnée n&apos;est envoyée.
        </p>

        <WebcamCapture />
      </div>
    </main>
  );
}

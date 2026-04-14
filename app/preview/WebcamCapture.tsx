"use client";

import { useRef, useState, useCallback, useEffect } from "react";

type Status = "idle" | "active" | "captured";

export default function WebcamCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStatus("active");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Impossible d'accéder à la caméra.";
      if (msg.includes("Permission") || msg.includes("NotAllowed")) {
        setError("Accès à la caméra refusé. Autorisez l'accès dans les paramètres de votre navigateur.");
      } else {
        setError("Aucune caméra détectée ou accès impossible.");
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror horizontally to match preview
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setPhoto(dataUrl);
    setStatus("captured");
    stopCamera();
  }, [stopCamera]);

  const retake = useCallback(() => {
    setPhoto(null);
    setStatus("idle");
  }, []);

  const downloadPhoto = useCallback(() => {
    if (!photo) return;
    const a = document.createElement("a");
    a.href = photo;
    a.download = `photo-${Date.now()}.jpg`;
    a.click();
  }, [photo]);

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Camera viewport */}
      <div className="relative w-full max-w-[640px] aspect-video rounded-2xl overflow-hidden bg-pebble border border-wire shadow-card">
        {/* Live feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
            status === "active" ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />

        {/* Captured photo */}
        {status === "captured" && photo && (
          <img
            src={photo}
            alt="Photo prise"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Idle placeholder */}
        {status === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-mute">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
            <p className="text-sm">La caméra n&apos;est pas encore activée</p>
          </div>
        )}

        {/* Flash animation on capture */}
        {status === "captured" && (
          <div className="absolute inset-0 bg-white animate-[flash_0.3s_ease-out]" style={{ animationFillMode: "forwards" }} />
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500 text-center max-w-[480px]">{error}</p>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3">
        {status === "idle" && (
          <button
            onClick={startCamera}
            className="px-6 py-3 bg-void text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Activer la caméra
          </button>
        )}

        {status === "active" && (
          <>
            <button
              onClick={takePhoto}
              className="w-16 h-16 rounded-full bg-void text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-soft"
              aria-label="Prendre une photo"
            >
              <span className="w-10 h-10 rounded-full bg-white/20 border-2 border-white" />
            </button>
            <button
              onClick={() => { stopCamera(); setStatus("idle"); }}
              className="px-4 py-2 text-sm text-dim border border-wire rounded-xl hover:bg-pebble transition-colors"
            >
              Arrêter
            </button>
          </>
        )}

        {status === "captured" && (
          <>
            <button
              onClick={downloadPhoto}
              className="px-6 py-3 bg-void text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              Télécharger
            </button>
            <button
              onClick={retake}
              className="px-4 py-2 text-sm text-dim border border-wire rounded-xl hover:bg-pebble transition-colors"
            >
              Reprendre
            </button>
          </>
        )}
      </div>

      {status === "active" && (
        <p className="text-xs text-mute">Appuyez sur le bouton pour prendre une photo</p>
      )}
    </div>
  );
}

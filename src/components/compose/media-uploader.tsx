"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { useComposeStore } from "@/lib/stores/compose.store";

export function MediaUploader() {
  const { media, addMedia, removeMedia } = useComposeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList) => {
      setError(null);
      setIsUploading(true);

      for (const file of Array.from(files)) {
        try {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Upload failed");
          }

          const data = await response.json();
          addMedia({
            id: data.id,
            url: data.url,
            type: data.type.toLowerCase() as any,
            mimeType: data.mimeType,
            size: data.size,
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : "Upload failed");
        }
      }

      setIsUploading(false);
    },
    [addMedia]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-neutral-700">Media</label>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className="hidden"
      />
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 p-6 hover:border-neutral-300 transition-colors"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 text-neutral-400 mb-2 animate-spin" />
            <p className="text-sm text-neutral-500">Uploading...</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-neutral-400 mb-2" />
            <p className="text-sm text-neutral-500">Click or drag files to upload</p>
            <p className="text-xs text-neutral-400 mt-1">JPEG, PNG, GIF, WebP, MP4, MOV</p>
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {media.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {media.map((asset) => (
            <div key={asset.id} className="relative group rounded-md overflow-hidden w-20 h-20 bg-neutral-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeMedia(asset.id);
                }}
                className="absolute top-1 right-1 z-10 rounded-full bg-black/50 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3 text-white" />
              </button>
              {asset.url && asset.mimeType?.startsWith("image/") ? (
                <img src={asset.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                  {asset.type?.toUpperCase()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

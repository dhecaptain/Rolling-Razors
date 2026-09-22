import React, { useState, useRef } from 'react';
import { Camera, Upload, X, AlertCircle, Loader2, Eye, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { uploadImageFile, validateFileBeforeUpload, ImageUploadCategory } from '../../utils/storageClient';

export interface PhotoUploaderProps {
  category: ImageUploadCategory;
  entityId?: string;
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  title?: string;
  subtitle?: string;
  readOnly?: boolean;
  className?: string;
}

interface UploadQueueItem {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'error' | 'success';
  errorMessage?: string;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  category,
  entityId,
  photos = [],
  onChange,
  maxPhotos = 6,
  title,
  subtitle,
  readOnly = false,
  className = '',
}) => {
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [activePreview, setActivePreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0 || readOnly) return;

    const remainingSlots = maxPhotos - (photos.length + queue.filter(q => q.status === 'uploading').length);
    if (remainingSlots <= 0) {
      alert(`Maximum of ${maxPhotos} photos reached.`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToUpload) {
      const validation = validateFileBeforeUpload(file);
      const queueId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      if (!validation.valid) {
        setQueue(prev => [
          ...prev,
          {
            id: queueId,
            file,
            progress: 0,
            status: 'error',
            errorMessage: validation.error,
          },
        ]);
        continue;
      }

      setQueue(prev => [
        ...prev,
        {
          id: queueId,
          file,
          progress: 10,
          status: 'uploading',
        },
      ]);

      uploadSingleFile(file, queueId);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadSingleFile = async (file: File, queueId: string) => {
    try {
      const result = await uploadImageFile(file, {
        category,
        entityId,
        onProgress: (percent) => {
          setQueue(prev =>
            prev.map(item => (item.id === queueId ? { ...item, progress: percent } : item))
          );
        },
      });

      // Update photos list
      onChange([...photos, result.url]);

      // Remove from queue after a short delay
      setTimeout(() => {
        setQueue(prev => prev.filter(item => item.id !== queueId));
      }, 500);
    } catch (err: any) {
      setQueue(prev =>
        prev.map(item =>
          item.id === queueId
            ? { ...item, status: 'error', errorMessage: err.message || 'Upload failed' }
            : item
        )
      );
    }
  };

  const handleRetry = (item: UploadQueueItem) => {
    setQueue(prev =>
      prev.map(q => (q.id === item.id ? { ...q, status: 'uploading', progress: 10, errorMessage: undefined } : q))
    );
    uploadSingleFile(item.file, item.id);
  };

  const handleRemoveQueueItem = (id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id));
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    if (readOnly) return;
    const updated = photos.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const canAddMore = !readOnly && (photos.length + queue.length) < maxPhotos;

  return (
    <div className={`space-y-3 ${className}`}>
      {(title || subtitle) && (
        <div className="flex items-center justify-between">
          <div>
            {title && <h4 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h4>}
            {subtitle && <p className="text-[11px] text-white/60">{subtitle}</p>}
          </div>
          <span className="text-[11px] font-mono text-gold">
            {photos.length} / {maxPhotos}
          </span>
        </div>
      )}

      {/* Grid of uploaded images and upload action */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {/* Existing uploaded photos */}
        {photos.map((photoUrl, idx) => (
          <div
            key={`${photoUrl}-${idx}`}
            className="group relative aspect-video rounded-xl overflow-hidden bg-ink border border-gold shadow-md transition-all hover:border-goldhover:"
          >
            <img
              src={photoUrl}
              alt={`Photo ${idx + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23A85F35' stroke-width='1.5'><rect width='18' height='18' x='3' y='3' rx='2'/><circle cx='9' cy='9' r='2'/><path d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/></svg>";
              }}
            />
            {/* Overlay actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setActivePreview(photoUrl)}
                className="p-1.5 rounded-lg bg-black/60 text-white hover:text-goldhover: transition-colors"
                title="View Full Size"
              >
                <Eye className="w-4 h-4" />
              </button>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(idx)}
                  className="p-1.5 rounded-lg bg-red-900/80 text-white hover:bg-red-800 transition-colors"
                  title="Remove Photo"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-gold">
              #{idx + 1}
            </div>
          </div>
        ))}

        {/* Uploading queue items */}
        {queue.map((item) => (
          <div
            key={item.id}
            className="relative aspect-video rounded-xl overflow-hidden bg-ink border border-white/20 p-3 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-medium text-white/80 truncate max-w-[80%]">
                {item.file.name}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveQueueItem(item.id)}
                className="text-white/40 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {item.status === 'uploading' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-gold">
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
                  </span>
                  <span>{item.progress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gold transition-all duration-200"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            )}

            {item.status === 'error' && (
              <div className="space-y-1">
                <div className="text-[10px] text-rose-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{item.errorMessage || 'Failed'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRetry(item)}
                  className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold flex items-center gap-1 hover:bg-rose-500/30"
                >
                  <RefreshCw className="w-2.5 h-2.5" /> Retry
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Upload Trigger Area */}
        {canAddMore && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFilesSelected(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`aspect-video rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-3 text-center cursor-pointer ${
              dragOver
                ? 'border-gold bg-gold'
                : 'border-white/20 hover:border-goldhover: bg-ink hover:bg-inkhover:'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              multiple
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />
            <div className="w-8 h-8 rounded-full bg-gold text-gold flex items-center justify-center mb-1.5">
              <Camera className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-white">Add Photo</span>
            <span className="text-[9px] text-white/50">Drop or browse (JPEG, PNG, WebP)</span>
          </div>
        )}
      </div>

      {/* Full-Screen Preview Modal */}
      {activePreview && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setActivePreview(null)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] bg-ink border border-gold rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-white/10 bg-panel">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-gold" /> Image Inspection
              </span>
              <button
                onClick={() => setActivePreview(null)}
                className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={activePreview}
                alt="Workshop inspection preview"
                className="max-h-[70vh] w-auto object-contain rounded-lg"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.onerror = null;
                  target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 24 24' fill='none' stroke='%23A85F35' stroke-width='1.5'><rect width='18' height='18' x='3' y='3' rx='2'/><circle cx='9' cy='9' r='2'/><path d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/></svg>";
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

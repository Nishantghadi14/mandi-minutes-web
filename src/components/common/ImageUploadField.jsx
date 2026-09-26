import { useState, useRef } from 'react';
import { UploadCloud, ImageOff, Trash2, Camera, Link as LinkIcon, Check } from 'lucide-react';

/**
 * Compresses an image file client-side using an HTML5 Canvas.
 * Keeps output small (~30KB-75KB) so it saves safely in Firestore/LocalStorage.
 */
function compressImage(file, maxDimension = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    // If it's already an SVG, read directly as text Data URL
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Draw image with smooth rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to lightweight JPEG data URL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

export default function ImageUploadField({
  value = '',
  onChange,
  label = 'Picture',
  aspectRatio = 'banner', // 'banner' (16:7), 'square' (1:1), 'wide' (16:9)
  recommendedText = '',
  placeholderText = 'Image not available',
  required = false,
  id,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const inputId = id || `upload-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  const aspectClass =
    aspectRatio === 'banner'
      ? 'aspect-[16/7] min-h-[140px]'
      : aspectRatio === 'square'
      ? 'aspect-square max-w-[180px] mx-auto'
      : 'aspect-[16/9] min-h-[130px]';

  const handleProcessFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setUploadError('Image size exceeds 12MB. Please choose a smaller image.');
      return;
    }

    setUploadError('');
    setProcessing(true);
    try {
      const maxDim = aspectRatio === 'square' ? 600 : 1200;
      const dataUrl = await compressImage(file, maxDim, 0.82);
      onChange?.(dataUrl);
    } catch (err) {
      console.error('Image compression error:', err);
      setUploadError('Could not process this image. Please try another one.');
    } finally {
      setProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      onChange?.(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleRemove = () => {
    onChange?.('');
    setUrlInput('');
  };

  const hasImage = Boolean(value && typeof value === 'string' && value.trim().length > 0);

  return (
    <div className="space-y-2">
      {/* Label & Recommended Size Header */}
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="block text-mandi-text text-xs font-semibold">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {recommendedText && (
          <span className="text-[11px] text-mandi-muted">{recommendedText}</span>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Case 1: Image Present */}
      {hasImage ? (
        <div className="relative rounded-2xl overflow-hidden border border-mandi-border bg-mandi-surface shadow-sm group">
          <div className={`w-full ${aspectClass} overflow-hidden bg-mandi-card`}>
            <img
              src={value}
              alt={label}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
              onError={() => {
                setUploadError('Failed to display the selected image.');
              }}
            />
          </div>

          {/* Action overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3 backdrop-blur-[2px]">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={processing}
              className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 shadow-lg font-bold"
            >
              <Camera size={14} />
              Change Picture
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="py-1.5 px-3 text-xs flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg transition-all font-semibold"
            >
              <Trash2 size={14} />
              Remove
            </button>
          </div>

          {/* Mobile visible action strip */}
          <div className="flex sm:hidden items-center justify-between p-2 bg-mandi-surface border-t border-mandi-border text-xs">
            <span className="text-mandi-muted text-[11px] truncate max-w-[150px]">Picture uploaded</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-mandi-green font-semibold text-xs hover:underline flex items-center gap-1"
              >
                <Camera size={12} /> Change
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="text-red-400 font-semibold text-xs hover:underline flex items-center gap-1"
              >
                <Trash2 size={12} /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Case 2: No Image Present -> Asks to upload picture & says "Image not available" */
        <div className="space-y-2">
          {/* Status Display: "Image not available" */}
          <div
            className={`w-full ${aspectClass} rounded-2xl border border-mandi-border/60 bg-gradient-to-b from-mandi-surface/90 to-mandi-card/90 flex flex-col items-center justify-center p-4 text-center select-none shadow-inner`}
          >
            <div className="w-12 h-12 rounded-full bg-mandi-surface border border-mandi-border flex items-center justify-center mb-2 text-mandi-muted shadow-sm">
              <ImageOff size={22} className="opacity-70" />
            </div>
            <span className="text-xs font-bold text-mandi-text tracking-wide">
              {placeholderText}
            </span>
            <span className="text-[11px] text-mandi-muted mt-0.5">
              No picture currently uploaded for this {label.toLowerCase()}
            </span>
          </div>

          {/* Primary Action: Asks to Upload a Picture */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center transition-all ${
              isDragging
                ? 'border-mandi-green bg-mandi-green/15 scale-[1.01]'
                : 'border-mandi-green/40 hover:border-mandi-green bg-mandi-green/5 hover:bg-mandi-green/10'
            }`}
          >
            {processing ? (
              <div className="py-2 flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-mandi-green border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold text-mandi-green">Optimizing &amp; uploading picture...</p>
              </div>
            ) : (
              <div className="py-1 space-y-1">
                <UploadCloud size={24} className="text-mandi-green mx-auto mb-1 animate-pulse" />
                <p className="text-xs font-bold text-mandi-green">
                  Upload {label}
                </p>
                <p className="text-[11px] text-mandi-muted">
                  Click to select from your device or drag &amp; drop file here
                </p>
                <p className="text-[10px] text-mandi-subtle">
                  PNG, JPG, JPEG, WEBP (Auto-optimized)
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Error Banner */}
      {uploadError && (
        <p className="text-xs text-red-500 font-medium">{uploadError}</p>
      )}

      {/* Alternative: Enter URL toggle */}
      <div className="pt-1">
        {!showUrlInput ? (
          <button
            type="button"
            onClick={() => setShowUrlInput(true)}
            className="text-[11px] text-mandi-muted hover:text-mandi-green transition-colors flex items-center gap-1"
          >
            <LinkIcon size={11} /> Or provide image via URL link
          </button>
        ) : (
          <div className="p-2.5 rounded-xl bg-mandi-surface border border-mandi-border space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-mandi-muted font-medium">Paste Image Web URL:</span>
              <button
                type="button"
                onClick={() => setShowUrlInput(false)}
                className="text-mandi-subtle hover:text-mandi-text"
              >
                Cancel
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="input-field text-xs py-1.5 flex-1"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                disabled={!urlInput.trim()}
                className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1 font-bold disabled:opacity-40"
              >
                <Check size={12} /> Apply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

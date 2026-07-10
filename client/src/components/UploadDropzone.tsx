import { useState, useRef, useCallback } from 'react';

interface Props {
  onFiles: (files: File[]) => void;
}

export default function UploadDropzone({ onFiles }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
      if (files.length > 0) onFiles(files);
    },
    [onFiles],
  );

  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) onFiles(files);
      e.target.value = '';
    },
    [onFiles],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed px-8 py-12 transition-colors ${
        dragging ? 'border-accent bg-accent/5' : 'border-border hover:border-accent'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleSelect}
        className="hidden"
      />
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-3 text-muted">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
      </svg>
      <p className="text-sm font-medium text-text">拖拽图片到此处</p>
      <p className="mt-1.5 text-xs text-muted">或点击选择 · 支持批量</p>
    </div>
  );
}

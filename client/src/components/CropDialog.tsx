import { useState, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { imageApi } from '../lib/api';
import { useToast } from './Toast';

interface Props {
  imageId: string;
  imageUrl: string;
  onClose: () => void;
  onDone: () => void;
}

export default function CropDialog({ imageId, imageUrl, onClose, onDone }: Props) {
  const { toast } = useToast();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setLoading(true);
    try {
      await imageApi.crop(imageId, {
        x: Math.round(croppedAreaPixels.x),
        y: Math.round(croppedAreaPixels.y),
        width: Math.round(croppedAreaPixels.width),
        height: Math.round(croppedAreaPixels.height),
        rotation,
      });
      toast('success', '裁剪成功');
      onDone();
      onClose();
    } catch (err: any) {
      toast('error', err.message || '裁剪失败');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="flex w-full max-w-2xl flex-col rounded-lg border border-border bg-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-base font-bold text-text">裁剪图片</h2>
          <button onClick={onClose} className="text-muted hover:text-text">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Crop area */}
        <div className="relative h-[400px] bg-black">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={4 / 3}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Controls */}
        <div className="space-y-3 border-t border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="w-16 text-xs text-muted">缩放</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-accent"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="w-16 text-xs text-muted">旋转</span>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="flex-1 accent-accent"
            />
            <span className="w-10 text-right text-xs text-muted">{rotation}°</span>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="btn-outline">取消</button>
            <button onClick={handleSave} disabled={loading} className="btn-primary">
              {loading ? '处理中…' : '应用'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import type { ImageItem } from '../lib/api';
import { cn } from '../lib/utils';

interface Props {
  images: ImageItem[];
  onImageClick?: (image: ImageItem) => void;
}

export default function ImageGrid({ images, onImageClick }: Props) {
  return (
    <div className="masonry">
      {images.map((img, i) => (
        <GridItem key={img.id} image={img} index={i} onClick={() => onImageClick?.(img)} />
      ))}
    </div>
  );
}

function GridItem({ image, index, onClick }: { image: ImageItem; index: number; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false);
  // 占位高度，避免布局抖动
  const [ratio, setRatio] = useState(image.width && image.height ? image.width / image.height : 1);

  useEffect(() => {
    setLoaded(false);
  }, [image.id]);

  return (
    <figure
      className={cn(
        'masonry-item group relative cursor-pointer overflow-hidden bg-surface',
        !loaded && 'min-h-[200px]',
      )}
      onClick={onClick}
      style={{ animationDelay: `${(index % 12) * 50}ms` }}
    >
      <div
        className="relative w-full"
        style={{ paddingBottom: `${(1 / ratio) * 100}%` }}
      >
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-surface" />
        )}
        <img
          src={image.displayUrl}
          alt={image.title}
          loading="lazy"
          onLoad={(e) => {
            setLoaded(true);
            const t = e.currentTarget;
            if (t.naturalWidth && t.naturalHeight) {
              setRatio(t.naturalWidth / t.naturalHeight);
            }
          }}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-all duration-700',
            loaded ? 'opacity-100 group-hover:scale-105' : 'opacity-0',
          )}
        />
      </div>
      <figcaption className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/0 to-black/0 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <h3 className="font-display text-lg font-medium text-white">{image.title}</h3>
        {image.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {image.tags.slice(0, 3).map((t) => (
              <span key={t} className="text-[10px] uppercase tracking-widest2 text-white/70">
                #{t}
              </span>
            ))}
          </div>
        )}
      </figcaption>
    </figure>
  );
}

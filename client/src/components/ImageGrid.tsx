import { useState, useEffect } from 'react';
import type { ImageItem } from '../lib/api';
import { cn } from '../lib/utils';

interface Props {
  images: ImageItem[];
  onImageClick?: (image: ImageItem) => void;
}

export default function ImageGrid({ images, onImageClick }: Props) {
  return (
    <div className="grid gap-2 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {images.map((img, i) => (
        <GridItem key={img.id} image={img} index={i} onClick={() => onImageClick?.(img)} />
      ))}
    </div>
  );
}

function GridItem({ image, index, onClick }: { image: ImageItem; index: number; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [image.id]);

  return (
    <figure
      className="group relative cursor-pointer overflow-hidden rounded-sm bg-surface"
      onClick={onClick}
      style={{ aspectRatio: '3/2', animationDelay: `${(index % 12) * 50}ms` }}
    >
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-surface" />
      )}
      <img
        src={image.displayUrl}
        alt={image.title}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={cn(
          'h-full w-full object-cover transition-all duration-200',
          loaded ? 'opacity-100 group-hover:scale-[1.02]' : 'opacity-0',
        )}
      />
      {/* Hover overlay: resolution badge + title */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-8">
          <h3 className="truncate text-sm font-medium text-white">{image.title}</h3>
          {image.tags.length > 0 && (
            <div className="mt-0.5 flex flex-wrap gap-1">
              {image.tags.slice(0, 4).map((t) => (
                <span key={t} className="text-[10px] text-white/60">#{t}</span>
              ))}
            </div>
          )}
        </div>
        {image.width && image.height && (
          <span className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/70">
            {image.width}×{image.height}
          </span>
        )}
      </div>
    </figure>
  );
}

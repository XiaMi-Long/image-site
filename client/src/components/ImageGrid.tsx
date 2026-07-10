import { motion } from 'framer-motion';
import type { ImageItem } from '../lib/api';

interface Props {
  images: ImageItem[];
  onImageClick?: (image: ImageItem) => void;
}

const containerVariants = {
  animate: { transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
};

export default function ImageGrid({ images, onImageClick }: Props) {
  return (
    <motion.div
      className="grid gap-2 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {images.map((img) => (
        <motion.figure
          key={img.id}
          className="group relative cursor-pointer overflow-hidden rounded-sm bg-surface"
          style={{ aspectRatio: '3/2' }}
          variants={itemVariants}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={() => onImageClick?.(img)}
        >
          <img
            src={img.displayUrl}
            alt={img.title}
            loading="lazy"
            className="h-full w-full object-cover transition-all duration-200 group-hover:scale-[1.02]"
          />
          {/* Hover overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-8">
              <h3 className="truncate text-sm font-medium text-white">{img.title}</h3>
              {img.tags.length > 0 && (
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {img.tags.slice(0, 4).map((t) => (
                    <span key={t} className="text-[10px] text-white/60">#{t}</span>
                  ))}
                </div>
              )}
            </div>
            {img.width && img.height && (
              <span className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/70">
                {img.width}×{img.height}
              </span>
            )}
          </div>
        </motion.figure>
      ))}
    </motion.div>
  );
}

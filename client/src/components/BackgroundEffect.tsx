import { useEffect, useRef, useState } from 'react';

function generateNoiseDataURL(size = 128): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(size, size);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.floor(Math.random() * 200 + 55);
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
    d[i + 3] = 35;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

export default function BackgroundEffect() {
  const [noiseUrl, setNoiseUrl] = useState('');
  const doneRef = useRef(false);
  useEffect(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setNoiseUrl(generateNoiseDataURL());
  }, []);

  return (
    <>
      {/* Film grain noise */}
      {noiseUrl && (
        <div
          className="pointer-events-none fixed inset-0 z-50"
          style={{
            backgroundImage: `url(${noiseUrl})`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px 128px',
            mixBlendMode: 'overlay',
            opacity: 0.3,
          }}
        />
      )}

      {/* Glowing orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -left-1/3 -top-1/3 aspect-square w-[80%] animate-drift-1 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(230,126,34,0.18) 0%, transparent 60%)',
          }}
        />
        <div
          className="absolute -bottom-1/3 -right-1/4 aspect-square w-[70%] animate-drift-2 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(100,160,255,0.12) 0%, transparent 60%)',
            animationDelay: '-12s',
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 aspect-square w-[90%] -translate-x-1/2 -translate-y-1/2 animate-drift-3 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(200,100,255,0.08) 0%, transparent 60%)',
            animationDelay: '-24s',
          }}
        />
      </div>
    </>
  );
}

'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';

export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

const createImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.95);
  });
}

interface ImageCropperProps {
  imageSrc: string;
  aspectRatio: number;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export function ImageCropper({ imageSrc, aspectRatio, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropCompleteHandler = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedBlob) {
        onCropComplete(croppedBlob);
      }
    } catch (e) {
      console.error('Crop failed', e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/90">
      <div className="flex items-center justify-between p-4 bg-black/50 text-white">
        <h3 className="font-medium text-sm">Adjust Image</h3>
        <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="relative flex-1 w-full bg-black">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropCompleteHandler}
          objectFit="contain"
        />
      </div>

      <div className="p-6 bg-black/50 flex flex-col sm:flex-row items-center gap-6 justify-center">
        <div className="flex items-center gap-4 w-full max-w-sm">
          <span className="text-white/60 text-xs font-medium">Zoom</span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-sage-light"
          />
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={onCancel} className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg border border-white/20 text-white hover:bg-white/10 text-sm font-medium transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg bg-sage-dark text-white hover:bg-sage text-sm font-medium transition-colors flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}

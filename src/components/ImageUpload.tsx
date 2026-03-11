import { useRef, useState } from 'react';

interface ImageUploadProps {
  currentUrl?: string | null;
  onFileSelect: (file: File) => void | Promise<void>;
  label: string;
  aspect?: 'square' | 'banner';
  disabled?: boolean;
}

export function ImageUpload({ currentUrl, onFileSelect, label, aspect = 'square', disabled }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > (aspect === 'banner' ? 5 : 2) * 1024 * 1024) return;

    setPreview(URL.createObjectURL(file));
    setIsLoading(true);
    try {
      await onFileSelect(file);
      setPreview(null);
    } finally {
      setIsLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const displayUrl = preview || currentUrl;
  const isSquare = aspect === 'square';

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <div
        className={`relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 ${
          isSquare ? 'h-24 w-24' : 'h-20 w-full'
        }`}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt=""
            className={`h-full w-full object-cover ${isSquare ? 'rounded-xl' : ''}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl text-slate-300">
            +
          </div>
        )}
        {!disabled && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleChange}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-sm">
                Subiendo...
              </div>
            )}
          </>
        )}
      </div>
      <p className="mt-1 text-[10px] text-slate-500">
        {aspect === 'banner' ? 'Máx. 5 MB' : 'Máx. 2 MB'} · JPG, PNG, WebP
      </p>
    </div>
  );
}

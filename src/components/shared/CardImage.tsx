import { useState, type ImgHTMLAttributes } from "react";
import { Mountain } from "lucide-react";
import { cn } from "@/lib/utils";

// Shared broken/missing-image placeholder for park, blog and gear card
// thumbnails — forest-dark surface + centered mountain mark, no text.
export function ImageFallback({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center bg-forest-dark", className)}>
      <Mountain className="h-8 w-8 text-cloud/40" strokeWidth={1.5} aria-hidden="true" />
    </div>
  );
}

type CardImageProps = ImgHTMLAttributes<HTMLImageElement>;

// Drop-in <img> replacement for card thumbnails: renders ImageFallback when
// `src` is missing or the URL fails to load, instead of a broken-image icon.
export function CardImage({ src, alt, className, onError, ...rest }: CardImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <ImageFallback className={className} />;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
      {...rest}
    />
  );
}

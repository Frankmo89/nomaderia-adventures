import { useState } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  lazy?: boolean;
  width?: number;
  height?: number;
}

const OptimizedImage = ({
  src,
  alt,
  lazy = true,
  width,
  height,
  className,
  ...props
}: OptimizedImageProps) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative block overflow-hidden" style={{ width, height }}>
      {!loaded && (
        <span
          className="absolute inset-0 bg-muted animate-pulse"
          aria-hidden="true"
        />
      )}
      <img
        src={src}
        alt={alt}
        loading={lazy ? "lazy" : "eager"}
        decoding={lazy ? "async" : "sync"}
        width={width}
        height={height}
        onLoad={() => setLoaded(true)}
        className={cn(
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;

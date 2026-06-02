import type { ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface FullBleedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  overlay?: boolean;
  overlayClassName?: string;
  wrapperClassName?: string;
}

const FullBleedImage = ({
  alt,
  className,
  overlay = false,
  overlayClassName,
  wrapperClassName,
  width,
  height,
  ...props
}: FullBleedImageProps) => {
  return (
    <figure className={cn("relative left-1/2 right-1/2 w-screen -translate-x-1/2 overflow-hidden", wrapperClassName)}>
      <img
        alt={alt}
        className={cn("block h-full w-full object-cover", className)}
        width={width}
        height={height}
        {...props}
      />
      {overlay ? (
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-t from-[#B5651D]/28 via-transparent to-[#F4EFE7]/10",
            overlayClassName
          )}
        />
      ) : null}
    </figure>
  );
};

export default FullBleedImage;
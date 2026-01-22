import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageCellProps {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export function ImageCell({ src, alt, className, fallbackClassName }: ImageCellProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (error) {
    return (
      <div
        className={cn(
          "bg-muted text-muted-foreground flex items-center justify-center",
          fallbackClassName || className
        )}
      >
        <ImageOff className="h-6 w-6 opacity-50" />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {!loaded && <div className="bg-muted absolute inset-0 animate-pulse" />}
      <img
        src={src}
        alt={alt}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-200",
          loaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        loading="lazy"
      />
    </div>
  );
}

interface ImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ImageGallery({ images, alt, className }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <ImageCell
        src={images[selectedIndex]!}
        alt={`${alt} - Image ${selectedIndex + 1}`}
        className="aspect-video w-full rounded-lg"
      />
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((src, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                selectedIndex === index
                  ? "border-primary"
                  : "hover:border-muted-foreground/50 border-transparent"
              )}
            >
              <ImageCell
                src={src}
                alt={`${alt} - Thumbnail ${index + 1}`}
                className="h-full w-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

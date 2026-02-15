"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string) => void;
  onRemove: () => void;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled = false,
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const preview = localPreview || value;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer upload");
      }

      onChange(data.imageUrl);
      setLocalPreview(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao fazer upload da imagem",
      );
      setLocalPreview(null);
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(objectUrl);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    onRemove();
    setLocalPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={className}>
      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          onChange={handleFileUpload}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {preview ? (
          <div className="relative w-fit">
            <div className="relative h-40 w-40 overflow-hidden rounded-lg border">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
                unoptimized
              />
              {isUploading && (
                <div className="bg-background/70 absolute inset-0 flex items-center justify-center">
                  <Loader2 className="text-primary size-6 animate-spin" />
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 size-7 rounded-full"
              onClick={handleRemove}
              disabled={disabled || isUploading}
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="border-border hover:bg-accent flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors"
          >
            {isUploading ? (
              <Loader2 className="text-muted-foreground size-8 animate-spin" />
            ) : (
              <ImagePlus className="text-muted-foreground size-8" />
            )}
            <span className="text-muted-foreground text-xs">
              {isUploading ? "Enviando..." : "Enviar imagem"}
            </span>
          </button>
        )}

        {preview && !isUploading && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            Trocar imagem
          </Button>
        )}
      </div>

      <p className="text-muted-foreground mt-1.5 text-xs">
        JPG, PNG, WebP, GIF ou AVIF. Máximo 5MB.
      </p>
    </div>
  );
}

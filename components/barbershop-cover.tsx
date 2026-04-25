"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Camera, MapPin, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateBarbershopCover } from "@/actions/barbershops/update-cover";

interface BarbershopCoverProps {
  barbershop: {
    id: string;
    name: string;
    imageUrl: string;
    address: string;
    city?: string | null;
    state?: string | null;
    phones: string[];
    isActive: boolean;
  };
  isOwner: boolean;
}

export function BarbershopCover({ barbershop, isOwner }: BarbershopCoverProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [currentImage, setCurrentImage] = useState(barbershop.imageUrl);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const displayImage = localPreview ?? currentImage;

  // Limpa o blob URL para evitar memory leak
  const revokePrevPreview = useCallback((url: string | null) => {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  }, []);

  function handleFileSelect(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Formato inválido. Use JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }
    revokePrevPreview(localPreview);
    setSelectedFile(file);
    setLocalPreview(URL.createObjectURL(file));
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    // reset para permitir selecionar o mesmo arquivo novamente
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function clearProgress() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function resetUploadState() {
    clearProgress();
    setIsUploading(false);
    setUploadProgress(0);
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleCancel() {
    if (isUploading) return; // não cancela enquanto envia
    setSheetOpen(false);
    revokePrevPreview(localPreview);
    setLocalPreview(null);
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSave() {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setUploadProgress(0);
    setSheetOpen(false);

    intervalRef.current = setInterval(() => {
      setUploadProgress((p) => Math.min(p + Math.random() * 15, 90));
    }, 100);

    try {
      // 1. upload
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("folder", "barbershop");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer upload");
      }

      const imageUrl = `/api/uploads/${data.id}`;

      // 2. salva no banco
      const result = await updateBarbershopCover({
        barbershopId: barbershop.id,
        imageUrl,
      });

      if (result?.serverError) {
        throw new Error(result.serverError);
      }

      clearProgress();
      setUploadProgress(100);

      // pequeno delay para a barra chegar a 100% antes de sumir
      await new Promise((r) => setTimeout(r, 500));

      revokePrevPreview(localPreview);
      setCurrentImage(imageUrl);
      setLocalPreview(null);
      toast.success("Capa atualizada!");
    } catch (error) {
      revokePrevPreview(localPreview);
      setLocalPreview(null);
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar capa",
      );
    } finally {
      resetUploadState();
    }
  }

  return (
    <>
      {/* ── HERO ── */}
      <div
        className={cn(
          "group relative h-75 w-full overflow-hidden",
          "sm:h-95 md:h-110",
        )}
      >
        <Image
          src={displayImage}
          alt={barbershop.name}
          fill
          priority
          sizes="100vw"
          unoptimized={displayImage.startsWith("blob:")}
          className={cn(
            "object-cover transition-all duration-500",
            isOwner && "group-hover:scale-[1.02] group-hover:brightness-60",
          )}
        />

        {/* gradiente */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-black/5" />

        {/* badge aberto */}
        {barbershop.isActive && (
          <div className="absolute left-4 top-4 z-10 sm:left-5 sm:top-5">
            <Badge className="gap-1.5 border-0 bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400 backdrop-blur-sm">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
              Aberto
            </Badge>
          </div>
        )}

        {/* botão editar capa — min 44×44pt conforme HIG da Apple */}
        {isOwner && (
          <>
            <button
              type="button"
              aria-label="Editar foto de capa"
              onClick={() => setSheetOpen(true)}
              className={cn(
                "absolute right-4 top-4 z-10 sm:right-5 sm:top-5",
                "flex min-h-11 items-center gap-1.5",
                "rounded-full border border-white/15 bg-black/55 px-4 py-2.5",
                "text-xs font-medium text-white/90 backdrop-blur-md",
                "transition-all duration-200 active:scale-95",
                // visível sempre no mobile, aparece no hover no desktop
                "opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
              )}
            >
              <Camera className="size-3.5 shrink-0" />
              <span>Editar capa</span>
            </button>

            {/* overlay central — só desktop */}
            <div className="pointer-events-none absolute inset-0 hidden items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:flex">
              <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 backdrop-blur-md">
                <Camera className="size-4 text-white" />
                <span className="text-sm font-medium text-white">
                  Alterar foto de capa
                </span>
              </div>
            </div>
          </>
        )}

        {/* barra de progresso */}
        {isUploading && (
          <div className="absolute bottom-0 left-0 right-0 z-20 h-0.75 bg-white/10">
            <div
              className="h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {/* info */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
          {(barbershop.city || barbershop.state) && (
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/45">
              {[barbershop.city, barbershop.state].filter(Boolean).join(", ")}
            </p>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
            {barbershop.name}
          </h1>
          <div className="mt-1.5 flex items-start gap-2 text-sm text-white/70">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            <span className="leading-snug">{barbershop.address}</span>
          </div>
          {barbershop.phones.length > 0 && (
            <div className="mt-1 flex items-center gap-2 text-sm text-white/70">
              <Phone className="size-4 shrink-0" />
              <span>{barbershop.phones.join(" · ")}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM SHEET ── */}
      {isOwner && (
        <>
          {/* backdrop */}
          <div
            aria-hidden="true"
            className={cn(
              "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-300",
              sheetOpen
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0",
            )}
            onClick={handleCancel}
          />

          {/* sheet — pb-safe para respeitar home indicator do iPhone */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Editar foto de capa"
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50 mx-auto w-full max-w-lg",
              "rounded-t-2xl border-t border-white/8 bg-[#161616]",
              "px-5 pt-5",
              // padding bottom seguro para iPhone (home indicator)
              "pb-[calc(1.25rem+env(safe-area-inset-bottom))]",
              "transition-transform duration-300 ease-out",
              "will-change-transform", // evita jank no iOS
              sheetOpen ? "translate-y-0" : "translate-y-full",
            )}
          >
            {/* handle */}
            <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-white/15" />

            <p className="text-base font-semibold text-white">Foto de capa</p>
            <p className="mt-0.5 text-xs text-white/40">
              Recomendado: 1200×400 px · JPG, PNG ou WEBP · até 5 MB
            </p>

            {/* preview */}
            {localPreview && (
              <div className="relative mt-4 h-28 w-full overflow-hidden rounded-xl border border-white/8">
                <Image
                  src={localPreview}
                  alt="Preview da nova capa"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            {/* drop zone / touch zone */}
            <div
              role="button"
              tabIndex={0}
              aria-label="Selecionar imagem"
              className={cn(
                "mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed",
                // min-h de 44pt para iOS, mas generoso para UX
                "min-h-30 cursor-pointer px-4 py-6 transition-all duration-200",
                isDragging
                  ? "border-blue-500/50 bg-blue-500/5"
                  : "border-white/12 bg-white/2 hover:border-white/20 active:bg-white/5",
              )}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
            >
              <Camera className="mb-2 size-7 text-white/25" />
              <p className="text-sm text-white/50">
                <span className="font-semibold text-white/80">
                  {localPreview ? "Trocar imagem" : "Toque para escolher"}
                </span>
                {!localPreview && (
                  <span className="hidden sm:inline"> ou arraste aqui</span>
                )}
              </p>
              <p className="mt-1 text-xs text-white/25">
                JPG, PNG, WEBP · max 5MB
              </p>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onInputChange}
            />

            {/* ações — botões com min 44pt de altura (HIG Apple) */}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={isUploading}
                className={cn(
                  "flex min-h-11 flex-1 items-center justify-center rounded-xl",
                  "border border-white/8 bg-white/6",
                  "text-sm font-medium text-white/70",
                  "transition-colors hover:bg-white/10 active:scale-[0.98]",
                  "disabled:opacity-40",
                )}
                onClick={handleCancel}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!selectedFile || isUploading}
                className={cn(
                  "flex min-h-11 flex-1 items-center justify-center rounded-xl",
                  "text-sm font-semibold text-white",
                  "transition-all active:scale-[0.98]",
                  selectedFile && !isUploading
                    ? "bg-blue-600 hover:bg-blue-500"
                    : "cursor-not-allowed bg-white/10 text-white/30",
                )}
                onClick={handleSave}
              >
                {isUploading ? "Enviando…" : "Salvar capa"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const PERMANENT_FOLDERS = new Set(["services", "barbershop", "professional"]);

export const POST = async (request: Request) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = formData.get("folder") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido. Use JPG, PNG, WebP, GIF ou AVIF." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo 5MB." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const permanente = PERMANENT_FOLDERS.has(folder ?? "");

    await prisma.upload.deleteMany({
      where: {
        permanente: false,
        createdAt: {
          lt: new Date(Date.now() - THIRTY_DAYS_MS),
        },
      },
    });

    const upload = await prisma.upload.create({
      data: {
        nomeArquivo: file.name,
        tipoArquivo: file.type,
        tamanho: file.size,
        dados: buffer,
        permanente,
      },
    });

    return NextResponse.json({ id: upload.id });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar o upload. Tente novamente." },
      { status: 500 },
    );
  }
};

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;

    const upload = await prisma.upload.findUnique({
      where: { id },
    });

    if (!upload) {
      return NextResponse.json(
        { error: "Arquivo não encontrado" },
        { status: 404 },
      );
    }
    const raw = upload.dados as Uint8Array;
    const base64 = Buffer.from(raw).toString("base64");
    const dataUrl = `data:${upload.tipoArquivo};base64,${base64}`;

    // Redireciona para a data URL
    return NextResponse.redirect(dataUrl);
  } catch (error) {
    console.error("Error serving upload:", error);
    return NextResponse.json(
      { error: "Erro ao buscar arquivo" },
      { status: 500 },
    );
  }
};

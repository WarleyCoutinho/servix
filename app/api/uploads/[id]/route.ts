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

    return new Response(upload.dados, {
      headers: {
        "Content-Type": upload.tipoArquivo,
        "Content-Disposition": `inline; filename="${upload.nomeArquivo}"`,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving upload:", error);
    return NextResponse.json(
      { error: "Erro ao buscar arquivo" },
      { status: 500 },
    );
  }
};

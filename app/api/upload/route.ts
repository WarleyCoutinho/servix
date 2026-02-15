import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

export const POST = async (request: Request) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

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

  const extension = file.name.split(".").pop() || "jpg";
  const fileName = `${crypto.randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const uploadDir = join(process.cwd(), "public", "uploads", "services");
  const filePath = join(uploadDir, fileName);

  await writeFile(filePath, buffer);

  const imageUrl = `/uploads/services/${fileName}`;

  return NextResponse.json({ imageUrl });
};

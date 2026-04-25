// components/not-found-content.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, FileQuestion } from "lucide-react";
/* import Link from "next/link"; */

/* interface NotFoundContentProps {
  storeSlug: string | null;
} */

/* export function NotFoundContent({ storeSlug }: NotFoundContentProps) { */
export function NotFoundContent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">Página não encontrada</CardTitle>
          <CardDescription>
            A página que você está procurando não existe ou foi movida.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p>
              Verifique se o endereço está correto ou volte para a página
              inicial.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => history.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          {/*  <Button className="flex-1" asChild>
            <Link href={storeSlug ? `/${storeSlug}` : "/"}>
              <Home className="mr-2 h-4 w-4" />
              Página inicial
            </Link>
          </Button> */}
        </CardFooter>
      </Card>
    </div>
  );
}

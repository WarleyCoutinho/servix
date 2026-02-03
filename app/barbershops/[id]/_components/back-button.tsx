"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const BackButton = () => {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="icon"
      className="absolute left-5 top-6 rounded-full bg-background"
      onClick={() => router.back()}
    >
      <ChevronLeft />
    </Button>
  );
};

export default BackButton;

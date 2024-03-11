"use client";

import { PropsWithChildren } from "react";

import { useRouter } from "next/navigation";
import { useHasPreviousPathname } from "../providers";

export default function BackButton({
  children,
  ...props
}: PropsWithChildren<React.ComponentPropsWithoutRef<"button">>) {
  const router = useRouter();
  const hasPrevious = useHasPreviousPathname();

  if (!hasPrevious) return null;

  return (
    <button onClick={() => router.back()} {...props}>
      {children}
    </button>
  );
}

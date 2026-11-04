"use client";

import { Button } from "@/components/ui/button";
import { ComponentProps } from "react";
import { useRouter } from "@/i18n/navigation";

type OAuthPkceButtonProps = ComponentProps<typeof Button> & {
  href?: string;
};

export function OAuthPkceButton({
  children,
  onClick,
  href = "/login",
  ...props
}: OAuthPkceButtonProps) {
  const router = useRouter();

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (onClick) {
      onClick(e);
      return;
    }
    router.push(href as any);
  }

  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  );
}

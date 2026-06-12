import { Badge } from "@/components/ui/badge";
import { getPill } from "@/lib/pills";
import { cn } from "@/lib/utils";
import type * as React from "react";

/**
 * Badge for a data term. Known terms (Ethernet, WiFi, ArtNet, microSD, ...)
 * get an icon and tint from the pill registry; unknown terms render as a
 * plain outline badge.
 */
export function TermBadge({
  term,
  className,
  ...props
}: { term: string } & React.ComponentProps<"span">) {
  const pill = getPill(term);
  const Icon = pill?.icon;
  return (
    <Badge variant="outline" className={cn(pill?.className, className)} {...props}>
      {Icon && <Icon aria-hidden />}
      {term}
    </Badge>
  );
}

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "bg-transparent text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Badge = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>>(
  ({ className, variant, ...props }, ref) => (
    <span ref={ref} data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  )
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };

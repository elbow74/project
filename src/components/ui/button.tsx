"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/cn";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "default" | "outline";
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const base =
      "inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 transition-colors border";
    const styles =
      variant === "outline"
        ? "bg-transparent border-input hover:bg-accent"
        : "bg-primary text-primary-foreground hover:opacity-90 border-transparent";
    return (
      <Comp
        ref={ref as any}
        className={cn(base, styles, className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

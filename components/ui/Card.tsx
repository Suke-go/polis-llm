import React, { HTMLAttributes } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Card = React.forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 p-6",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";


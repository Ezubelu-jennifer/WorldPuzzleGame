import React from "react";
import { cn } from "@/lib/utils";
import { ButtonProps, Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface IconButtonProps extends ButtonProps {
  icon: LucideIcon;
  iconClassName?: string;
}

export function IconButton({
  icon: Icon,
  className,
  iconClassName,
  children,
  ...props
}: IconButtonProps) {
  return (
    <Button
      className={cn("flex items-center space-x-2", className)}
      {...props}
    >
      <Icon className={cn("h-4 w-4", iconClassName)} />
      {children && <span>{children}</span>}
    </Button>
  );
}

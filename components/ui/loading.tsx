import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

export function Loading({ className, size = 24, ...props }: LoadingProps) {
  return (
    <div
      className={cn("flex items-center justify-center min-h-[50vh]", className)}
      {...props}
    >
      <Loader2 className="animate-spin text-muted-foreground" size={size} />
    </div>
  );
}

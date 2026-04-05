import { cn } from "@/lib/utils";

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function ShimmerButton({ children, className, ...props }: ShimmerButtonProps) {
  return (
    <button
      className={cn(
        "relative overflow-hidden rounded-lg font-medium px-6 py-3",
        "bg-primary text-primary-foreground",
        "hover:shadow-lg transition-shadow duration-300",
        "inline-flex items-center justify-center gap-2",
        "group",
        className
      )}
      {...props}
    >
      <span className="relative z-10 inline-flex items-center justify-center gap-2">{children}</span>
      <div
        className={cn(
          "absolute inset-0 -translate-x-full",
          "bg-linear-to-r from-transparent via-white/20 to-transparent",
          "group-hover:translate-x-full transition-transform duration-700"
        )}
      />
    </button>
  );
}

import { Loader } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Defines the size variants for the spinner using class-variance-authority.
 * Keeps loader dimensions consistent across consumers.
 */
const spinnerVariants = cva("text-muted-foreground animate-spin", {
  variants: {
    size: {
      default: "h-4 w-4",
      sm: "h-2 w-2",
      lg: "h-6 w-6",
      icon: "h-10 w-10",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

/**
 * Props accepted by the spinner allowing consumers to pick a size preset.
 */
interface SpinnerProps extends VariantProps<typeof spinnerVariants> {}

/**
 * Loading indicator built with a Lucide loader icon and Tailwind animations.
 * Ideal for inline async affordances.
 *
 * @param size Spinner dimension preset to render.
 * @returns Animated spinner icon sized according to the chosen variant.
 * @see https://lucide.dev/icons/loader-2
 */
export const Spinner = ({ size }: SpinnerProps) => {
  return <Loader className={cn(spinnerVariants({ size }))} />;
};

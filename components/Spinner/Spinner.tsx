import { Loader } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Spinner variants that can be selected when using the Spinner component.
 * By default, the spinner is 4x4.
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

interface SpinnerProps extends VariantProps<typeof spinnerVariants> {}

/**
 * Spinner component that displays a loading spinner.
 * @param size ('default' | 'sm' | 'lg' | 'icon'): The size of the spinner.
 * @returns (JSX.Element): The spinner component.
 */
export const Spinner = ({ size }: SpinnerProps) => {
  return <Loader className={cn(spinnerVariants({ size }))} />;
};

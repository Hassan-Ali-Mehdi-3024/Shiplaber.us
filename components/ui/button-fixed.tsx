import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500",
        primary: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500",
        secondary: "bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500",
        outline: "border border-gray-300 bg-transparent hover:bg-gray-100 focus:ring-gray-500",
        ghost: "bg-transparent hover:bg-gray-100 focus:ring-gray-500",
        destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 py-1",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 py-2.5",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    // Ensure children is always wrapped in a single element if asChild is true
    const wrappedChildren = asChild && React.Children.count(children) > 1 ? (
      <span className="flex items-center">{children}</span>
    ) : children;
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {wrappedChildren}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Re-use the same styles as the original button
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

// Common props for both button types
interface CommonButtonProps extends VariantProps<typeof buttonVariants> {
  className?: string;
  children?: React.ReactNode;
  isLoading?: boolean;
}

// Direct button props
interface ButtonBaseProps extends CommonButtonProps, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonButtonProps> {}

// Props when used with Link
interface ButtonLinkProps extends CommonButtonProps {
  href: string;
}

// Type for the component props - either a button or a link
type CustomButtonProps = ButtonBaseProps | ButtonLinkProps;

// Type guard to check if props include href
function isLinkButton(props: CustomButtonProps): props is ButtonLinkProps {
  return 'href' in props;
}

export const CustomButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>(
  (props, ref) => {
    const { className, variant, size, isLoading, children, ...rest } = props;
    const classNames = cn(buttonVariants({ variant, size, className }));
    
    // Render a Link component if href is provided
    if (isLinkButton(props)) {
      const { href } = props;
      return (
        <Link href={href} className={classNames}>
          {isLoading && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
          {children}
        </Link>
      );
    }
    
    // Otherwise render a button
    return (
      <button 
        ref={ref} 
        className={classNames}
        disabled={isLoading || ('disabled' in props && props.disabled)}
        {...rest}
      >
        {isLoading && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
        {children}
      </button>
    );
  }
);

CustomButton.displayName = "CustomButton";

export { buttonVariants };
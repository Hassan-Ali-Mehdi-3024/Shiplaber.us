import {
  AvatarFallback,
  Avatar as AvatarRoot,
  AvatarImage,
} from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

type AvatarProps = React.ComponentProps<typeof AvatarRoot> & {
  src?: string;
  alt?: string;
  fallback: string;
};

export function Avatar({ className, src, alt, fallback, ...props }: AvatarProps) {
  return (
    <AvatarRoot
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      {src && <AvatarImage className="h-full w-full object-cover" src={src} alt={alt || fallback} />}
      <AvatarFallback
        className="flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-gray-800"
      >
        {fallback}
      </AvatarFallback>
    </AvatarRoot>
  );
}

export { AvatarFallback, AvatarImage };

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  isFooter?: boolean;
}

export function Logo({ isFooter = false }: LogoProps) {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Vanu Organic Home">
       <Image 
        src="https://github.com/akm12109/assets_vanu/blob/main/logo.png?raw=true" 
        alt="Vanu Organic Logo" 
        width={40} 
        height={40} 
        className="h-10 w-auto"
      />
      <span className={cn(
        "font-headline text-xl font-bold",
        isFooter ? "text-primary-foreground" : "text-foreground"
      )}>
        Vanu Organic
      </span>
    </Link>
  );
}

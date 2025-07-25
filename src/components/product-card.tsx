
"use client"

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { useLanguage } from "@/context/language-context";
import { Heart, ShoppingCart, Eye, PackageX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Product {
  id: string; 
  name: string;
  price: number;
  mrp?: number;
  image: string;
  imageHover?: string;
  aiHint?: string;
  category?: string;
  featured?: boolean;
  stock?: number;
}

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const { translations } = useLanguage();
    const t = translations.home;

    const isOutOfStock = product.stock !== undefined && product.stock <= 0;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault(); 
        if (isOutOfStock) return;
        const cartProduct = {
            ...product,
            price: product.price,
        };
        addToCart(cartProduct);
    };

    const handleWishlistToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        if(isInWishlist(product.id)) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product);
        }
    }
    
    const displayPrice = `₹${product.price.toFixed(2)}`;
    const displayMrp = product.mrp && product.mrp > product.price ? `₹${product.mrp.toFixed(2)}` : null;
    const discount = product.mrp && product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
    const isWishlisted = isInWishlist(product.id);


    return (
        <div className="group relative overflow-hidden rounded-lg bg-card border shadow-sm transition-all duration-300 hover:shadow-md">
             <Link href={`/product/${product.id}`} className="absolute inset-0 z-10" aria-label={`View details for ${product.name}`}>
                <span className="sr-only">View Details</span>
            </Link>
            <div className="relative w-full aspect-[4/5] overflow-hidden">
                <Image 
                    src={product.image} 
                    alt={product.name} 
                    layout="fill" 
                    objectFit="cover" 
                    className={cn("transition-opacity duration-300 group-hover:opacity-0 rounded-t-lg", isOutOfStock && "grayscale")}
                    data-ai-hint={product.aiHint}
                />
                {product.imageHover && (
                    <Image 
                        src={product.imageHover} 
                        alt={`${product.name} hover`}
                        layout="fill" 
                        objectFit="cover" 
                        className={cn("opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-t-lg", isOutOfStock && "grayscale")}
                        data-ai-hint={product.aiHint}
                    />
                )}
                 {discount > 0 && !isOutOfStock && (
                    <Badge variant="destructive" className="absolute top-2 left-2 z-20">
                        {discount}% OFF
                    </Badge>
                )}
                 {isOutOfStock && (
                    <Badge variant="secondary" className="absolute top-2 left-2 z-20 text-destructive border-destructive">
                        Out of Stock
                    </Badge>
                )}
                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <Button size="icon" variant="secondary" className="rounded-full h-8 w-8 bg-background/80 hover:bg-background" onClick={handleWishlistToggle}>
                        <Heart className={cn("h-4 w-4", isWishlisted && "fill-destructive text-destructive")} />
                    </Button>
                    {!isOutOfStock && (
                         <Button size="icon" variant="secondary" className="rounded-full h-8 w-8 bg-background/80 hover:bg-background" onClick={handleAddToCart}>
                            <ShoppingCart className="h-4 w-4" />
                        </Button>
                    )}
                    <Button asChild size="icon" variant="secondary" className="rounded-full h-8 w-8 bg-background/80 hover:bg-background">
                       <Link href={`/product/${product.id}`}>
                           <Eye className="h-4 w-4" />
                       </Link>
                    </Button>
                </div>
            </div>
            <div className="p-2 text-center">
                <h3 className="text-sm font-semibold text-foreground truncate">{product.name}</h3>
                <div className="mt-1 flex items-baseline justify-center gap-2">
                    <p className="text-sm font-bold text-primary">{displayPrice}</p>
                    {displayMrp && <p className="text-xs text-muted-foreground line-through">{displayMrp}</p>}
                </div>
                 <Button size="sm" className="w-full mt-2 z-20 relative text-xs" onClick={handleAddToCart} disabled={isOutOfStock}>
                    {isOutOfStock ? <><PackageX className="mr-2 h-4 w-4"/> Out of Stock</> : <><ShoppingCart className="mr-2 h-4 w-4"/> {t.addToCart}</>}
                </Button>
            </div>
        </div>
    );
}

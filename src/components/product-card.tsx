
"use client"

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { useLanguage } from "@/context/language-context";
import { Heart, ShoppingCart, Eye } from "lucide-react";
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
}

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const { translations } = useLanguage();
    const t = translations.home;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault(); 
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
        <div className="group relative overflow-hidden rounded-lg bg-transparent">
             <Link href={`/product/${product.id}`} className="absolute inset-0 z-10" aria-label={`View details for ${product.name}`}>
                <span className="sr-only">View Details</span>
            </Link>
            <div className="relative w-full aspect-[4/3] bg-card rounded-t-lg">
                <Image 
                    src={product.image} 
                    alt={product.name} 
                    layout="fill" 
                    objectFit="cover" 
                    className="transition-opacity duration-300 group-hover:opacity-0 rounded-t-lg"
                    data-ai-hint={product.aiHint}
                />
                {product.imageHover && (
                    <Image 
                        src={product.imageHover} 
                        alt={`${product.name} hover`}
                        layout="fill" 
                        objectFit="cover" 
                        className="opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-t-lg"
                        data-ai-hint={product.aiHint}
                    />
                )}
                 {discount > 0 && (
                    <Badge variant="destructive" className="absolute top-2 left-2 z-20">
                        {discount}% OFF
                    </Badge>
                )}
                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <Button size="icon" variant="secondary" className="rounded-full h-8 w-8 bg-background/80 hover:bg-background" onClick={handleWishlistToggle}>
                        <Heart className={cn("h-4 w-4", isWishlisted && "fill-destructive text-destructive")} />
                    </Button>
                    <Button size="icon" variant="secondary" className="rounded-full h-8 w-8 bg-background/80 hover:bg-background" onClick={handleAddToCart}>
                        <ShoppingCart className="h-4 w-4" />
                    </Button>
                    <Button asChild size="icon" variant="secondary" className="rounded-full h-8 w-8 bg-background/80 hover:bg-background">
                       <Link href={`/product/${product.id}`}>
                           <Eye className="h-4 w-4" />
                       </Link>
                    </Button>
                </div>
            </div>
            <div className="p-4 text-center bg-card rounded-b-lg">
                <h3 className="text-lg font-headline font-semibold text-foreground">{product.name}</h3>
                <div className="mt-2 flex items-baseline justify-center gap-2">
                    <p className="text-lg font-bold text-primary">{displayPrice}</p>
                    {displayMrp && <p className="text-sm text-muted-foreground line-through">{displayMrp}</p>}
                </div>
                <Button size="sm" className="w-full mt-4 z-20 relative" onClick={handleAddToCart}>{t.addToCart}</Button>
            </div>
        </div>
    );
}

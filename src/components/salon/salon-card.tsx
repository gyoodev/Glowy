
'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Salon } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Gift, HeartOff, Sparkles } from 'lucide-react'; // Added Sparkles
import { isFuture } from 'date-fns';

interface SalonCardProps {
  salon: Salon;
  isFavoriteMode?: boolean; // New prop
  onToggleFavorite?: (salonId: string, isCurrentlyFavorite: boolean) => void; // New prop
}

export function SalonCard({ salon, isFavoriteMode = false, onToggleFavorite }: SalonCardProps) {
  const isPromoted = salon.promotion &&
                      salon.promotion.isActive &&
                      salon.promotion.expiresAt &&
                      isFuture(new Date(salon.promotion.expiresAt));

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const isNew = salon.createdAt && new Date(salon.createdAt) > sevenDaysAgo;

  const handleUnfavoriteClick = () => {
    if (onToggleFavorite && salon.id) {
      onToggleFavorite(salon.id, true); // Pass true because in favorite mode, it's currently a favorite
    }
  };

  const salonNameToSlug = (name?: string) => name ? name.replace(/\s+/g, '_') : 'unknown-salon';

  return (
    <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-xl flex flex-col h-full relative">
      <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
        {isPromoted && (
          <Badge variant="default" className="py-1 px-2 text-xs shadow-lg shadow-primary/50 animate-pulse">
            <Gift className="h-3 w-3 mr-1" />
            Промотиран
          </Badge>
        )}
        {isNew && (
          <Badge variant="secondary" className="py-1 px-2 text-xs shadow-md">
            <Sparkles className="h-3 w-3 mr-1" />
            Нов в Glaura
          </Badge>
        )}
      </div>
      <CardHeader className="p-0">
        <Link href={`/salons/${salonNameToSlug(salon.name)}`} aria-label={`Вижте детайли за ${salon.name}`}>
          <div className="relative h-48 w-full">
            <Image
              src={salon.heroImage || 'https://placehold.co/400x200.png'}
              alt={`Снимка на салон ${salon.name} в град ${salon.city}`}
              fill={true}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              style={{ objectFit: 'cover' }}
              data-ai-hint="salon exterior modern"
            />
          </div>
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <Link href={`/salons/${salonNameToSlug(salon.name)}`} className="hover:underline">
          <CardTitle className="mb-2 text-xl font-semibold">{salon.name}</CardTitle>
        </Link>
        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{salon.description}</p>
        <div className="mb-3 flex items-center text-sm text-muted-foreground">
          <MapPin className="mr-1.5 h-4 w-4 text-primary" />
          {salon.city}
        </div>
        <div className="flex items-center space-x-1 text-sm">
          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          <span>{(salon.rating || 0).toFixed(1)}</span>
          <span className="text-muted-foreground">({(salon.reviewCount || 0)} отзива)</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {isFavoriteMode ? (
          <Button onClick={handleUnfavoriteClick} variant="outline" className="w-full">
            <HeartOff className="mr-2 h-4 w-4" />
            Премахни от любими
          </Button>
        ) : (
          <Button asChild className="w-full">
            <Link href={`/salons/${salonNameToSlug(salon.name)}`}>Виж Повече</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}


import Link from 'next/link';
import Image from 'next/image';
import type { Salon } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Gift } from 'lucide-react';
import { isFuture } from 'date-fns';

interface SalonCardProps {
  salon: Salon;
}

export function SalonCard({ salon }: SalonCardProps) {
  const isPromoted = salon.promotion &&
                      salon.promotion.isActive &&
                      salon.promotion.expiresAt &&
                      isFuture(new Date(salon.promotion.expiresAt));

  return (
    <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-xl flex flex-col h-full relative">
      {isPromoted && (
        <Badge variant="default" className="absolute top-2 right-2 bg-accent text-accent-foreground z-10 py-1 px-2 text-xs">
          <Gift className="h-3 w-3 mr-1" />
          Промотиран
        </Badge>
      )}
      <CardHeader className="p-0">
        <Link href={`/salons/${salon.name.replace(/\s+/g, '_')}`} aria-label={`Вижте детайли за ${salon.name}`}>
          <div className="relative h-48 w-full">
            <Image
              src={salon.heroImage || 'https://placehold.co/400x200.png'}
              alt={`Екстериор или интериор на ${salon.name}`}
              layout="fill"
              objectFit="cover"
              data-ai-hint="salon interior beauty"
            />
          </div>
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <Link href={`/salons/${salon.name.replace(/\s+/g, '_')}`} className="hover:underline">
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
          <span className="text-muted-foreground">({(salon.reviews || []).length} отзива)</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full">
          <Link href={`/salons/${salon.name.replace(/\s+/g, '_')}`}>Виж Повече</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

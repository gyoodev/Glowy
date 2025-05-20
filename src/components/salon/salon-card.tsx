import Link from 'next/link';
import Image from 'next/image';
import type { Salon } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin } from 'lucide-react';

interface SalonCardProps {
  salon: Salon;
}

export function SalonCard({ salon }: SalonCardProps) {
  const priceRangeTranslations = {
    cheap: 'евтино',
    moderate: 'умерено',
    expensive: 'скъпо',
  };

  return (
    <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-xl flex flex-col h-full">
      <CardHeader className="p-0">
        <Link href={`/salons/${salon.id}`} aria-label={`Вижте детайли за ${salon.name}`}>
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
        <Link href={`/salons/${salon.id}`} className="hover:underline">
          <CardTitle className="mb-2 text-xl font-semibold">{salon.name}</CardTitle>
        </Link>
        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{salon.description}</p>
        <div className="mb-3 flex items-center text-sm text-muted-foreground">
          <MapPin className="mr-1.5 h-4 w-4 text-primary" />
          {salon.city}
        </div>
        <div className="flex items-center space-x-1 text-sm">
          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          <span>{salon.rating.toFixed(1)}</span>
          <span className="text-muted-foreground">({salon.reviews.length} отзива)</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Badge variant={salon.priceRange === 'expensive' ? 'destructive' : salon.priceRange === 'moderate' ? 'secondary' : 'outline'} className="capitalize">
          {priceRangeTranslations[salon.priceRange] || salon.priceRange}
        </Badge>
      </CardFooter>
    </Card>
  );
}

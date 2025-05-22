
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { SalonCard } from '@/components/salon/salon-card';
import { FilterSidebar } from '@/components/salon/filter-sidebar';
import { mockServices, allBulgarianCities } from '@/lib/mock-data';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { isFuture } from 'date-fns';

import type { Salon } from '@/types';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const ALL_CITIES_VALUE = "--all-cities--";
const ALL_SERVICES_VALUE = "--all-services--";
const DEFAULT_MIN_RATING = 0;
const DEFAULT_MIN_PRICE = 0;
const DEFAULT_MAX_PRICE = 500;

interface HeroImage {
  src: string;
  alt: string;
  hint: string;
  id: string;
}

const initialHeroImages: HeroImage[] = [
  {
    id: 'hero1',
    src: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxCYXJiZXJ8ZW58MHx8fHwxNzQ3OTIzNDI0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    alt: 'Интериор на модерен бръснарски салон',
    hint: 'barber salon',
  },
  {
    id: 'hero2',
    src: 'https://images.unsplash.com/photo-1571290274554-6a2eaa771e5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxOYWlsJTIwc3R1ZGlvfGVufDB8fHx8MTc0NzkyMzQ3N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    alt: 'Близък план на инструменти в студио за маникюр',
    hint: 'nail salon',
  },
  {
    id: 'hero3',
    src: 'https://images.unsplash.com/photo-1595475693741-b445b025aec7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxIYWlyJTIwc3R1ZGlvfGVufDB8fHx8MTc0NzkyMzUwM3ww&ixlib=rb-4.1.0&q=80&w=1080',
    alt: 'Стилист работещ във фризьорски салон',
    hint: 'hair studio',
  },
  {
    id: 'hero4',
    src: 'https://images.unsplash.com/photo-1604605140903-0190f98c758d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxQZWRpY3VyZXxlbnwwfHx8fDE3NTUwNzYxODV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    alt: 'Педикюр в спа център',
    hint: 'pedicure spa',
  },
  {
    id: 'hero5',
    src: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxGYWNpYWwlMjBUcmVhdG1lbnR8ZW58MHx8fHwxNzU1MDc2MjMxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    alt: 'Процедура за лице в козметичен салон',
    hint: 'facial treatment',
  },
  {
    id: 'hero6',
    src: 'https://images.unsplash.com/photo-1512290746430-3ff1f14a1916?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxIYWlyJTIwQ29sb3Jpbmd8ZW58MHx8fHwxNzU1MDc2Mjg0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    alt: 'Боядисване на коса във фризьорски салон',
    hint: 'hair coloring',
  },
  {
    id: 'hero7',
    src: 'https://images.unsplash.com/photo-1605497788044-5a32c6ba005c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxNYXNzYWdlJTIwdGhlcmFweXxlbnwwfHx8fDE3NTUwNzY3ODJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    alt: 'Масажна терапия в спа център',
    hint: 'massage therapy',
  },
  {
    id: 'hero8',
    src: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxTYWxvbiUyMGludGVyaW9yJTIwZGVzaWdufGVufDB8fHx8MTc1NTA3NjgxOHww&ixlib=rb-4.1.0&q=80&w=1080',
    alt: 'Стилен интериор на козметичен салон',
    hint: 'salon interior design',
  },
];

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}


export default function SalonDirectoryPage() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [filteredSalons, setFilteredSalons] = useState<Salon[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({
    location: ALL_CITIES_VALUE,
    serviceType: ALL_SERVICES_VALUE,
    minRating: DEFAULT_MIN_RATING,
    maxPrice: DEFAULT_MIN_PRICE,
  });
  const [isLoading, setIsLoading] = useState(true);
  // Initialize with a static set for SSR, shuffle on client
  const [displayedHeroImages, setDisplayedHeroImages] = useState<HeroImage[]>(initialHeroImages.slice(0, 3));


  useEffect(() => {
    const fetchSalons = async () => {
      setIsLoading(true);
      const firestore = getFirestore();
      const salonsCollectionRef = collection(firestore, 'salons');
      try {
        const querySnapshot = await getDocs(salonsCollectionRef);
        const salonsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Salon[];
        setSalons(salonsList);
      } catch (error) {
        console.error("Грешка при извличане на салони:", error);
      }
      setIsLoading(false);
    };
    fetchSalons();
  }, []);

  useEffect(() => {
    // Perform initial shuffle on client mount
    setDisplayedHeroImages(shuffleArray(initialHeroImages).slice(0, 3));

    const interval = setInterval(() => {
      setDisplayedHeroImages(shuffleArray(initialHeroImages).slice(0, 3));
    }, 5000); // Change images every 5 seconds

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);


  const uniqueServiceTypes = useMemo(() => {
    const serviceNames = new Set(mockServices.map(service => service.name));
    return Array.from(serviceNames);
  }, []);

  useEffect(() => {
    let result = [...salons];

    // Sort by promotion status first
    result.sort((a, b) => {
      const isAPromoted = a.promotion && a.promotion.isActive && a.promotion.expiresAt && isFuture(new Date(a.promotion.expiresAt));
      const isBPromoted = b.promotion && b.promotion.isActive && b.promotion.expiresAt && isFuture(new Date(b.promotion.expiresAt));

      if (isAPromoted && !isBPromoted) return -1;
      if (!isAPromoted && isBPromoted) return 1;
      // If both have same promotion status, you might want a secondary sort, e.g., by rating or name
      // For now, maintain original relative order or add another sort criterion.
      return 0;
    });

    if (searchTerm) {
      result = result.filter(salon =>
        salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (salon.description && salon.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (Object.keys(filters).length > 0) {
      result = result.filter(salon => {
        const { location, serviceType, minRating, maxPrice } = filters;
        let matchesAll = true;

        if (location && location !== ALL_CITIES_VALUE && salon.city !== location) {
          matchesAll = false;
        }
        if (matchesAll && serviceType && serviceType !== ALL_SERVICES_VALUE && !(salon.services || []).some(s => s.name === serviceType)) {
          matchesAll = false;
        }
        if (matchesAll && minRating && (salon.rating || 0) < minRating) {
          matchesAll = false;
        }
        
        if (matchesAll && typeof maxPrice === 'number' && maxPrice > DEFAULT_MIN_PRICE && maxPrice < DEFAULT_MAX_PRICE) {
           const salonHasMatchingService = (salon.services || []).some(service =>
            service.price <= maxPrice
          );
          if (!salonHasMatchingService) {
            matchesAll = false;
          }
        }
        return matchesAll;
      });
    }
    setFilteredSalons(result);
  }, [searchTerm, filters, salons]);

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
  };

  return (
    <div className="container mx-auto py-10 px-6">
      <header className="mb-16 py-12 sm:py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none opacity-70">
          <div className="absolute top-[-80px] left-[-100px] w-80 h-80 bg-primary/5 rounded-full transform rotate-[-45deg] blur-2xl"></div>
          <div className="absolute bottom-[-100px] right-[-120px] w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
          <div className="absolute top-[10%] left-[45%] w-16 h-16 bg-secondary/10 rounded-full blur-md"></div>
          <div className="absolute bottom-[15%] left-[5%] w-20 h-20 bg-primary/5 rounded-full blur-lg transform rotate-[15deg]"></div>
          <div className="absolute top-[50%] left-[-5%] w-2/5 h-1 bg-border/20 transform -rotate-[25deg] blur-sm"></div>
        </div>

        <div className="relative z-0 grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
              Намерете Вашия Перфектен Салон
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8">
              Открийте най-добрите салони за красота и услуги близо до Вас.
            </p>
          </div>

          {displayedHeroImages.length >= 3 && (
            <div className="relative z-10 md:col-span-1 space-y-4">
              <div> 
                <Image
                  key={displayedHeroImages[0].id + '-large'} // Add key for re-renders
                  src={displayedHeroImages[0].src}
                  alt={displayedHeroImages[0].alt}
                  width={560}
                  height={320}
                  className="w-full h-auto object-cover rounded-lg shadow-xl"
                  data-ai-hint={displayedHeroImages[0].hint}
                  priority={true}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Image
                    key={displayedHeroImages[1].id + '-small1'} // Add key for re-renders
                    src={displayedHeroImages[1].src}
                    alt={displayedHeroImages[1].alt}
                    width={270}
                    height={270}
                    className="w-full h-auto object-cover rounded-lg shadow-xl"
                    data-ai-hint={displayedHeroImages[1].hint}
                  />
                </div>
                <div>
                  <Image
                    key={displayedHeroImages[2].id + '-small2'} // Add key for re-renders
                    src={displayedHeroImages[2].src}
                    alt={displayedHeroImages[2].alt}
                    width={270}
                    height={270}
                    className="w-full h-auto object-cover rounded-lg shadow-xl"
                    data-ai-hint={displayedHeroImages[2].hint}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="mb-8 max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Търсете по име на салон, услуга или местоположение..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-base rounded-lg shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <FilterSidebar
            onFilterChange={handleFilterChange}
            cities={allBulgarianCities}
            serviceTypes={uniqueServiceTypes}
            initialMaxPrice={DEFAULT_MAX_PRICE}
            initialMinRating={DEFAULT_MIN_RATING}
          />
        </aside>

        <main className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                  <Skeleton className="h-[192px] w-full rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredSalons.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredSalons.map(salon => (
                <SalonCard key={salon.id} salon={salon} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-2xl font-semibold text-foreground mb-2">Няма намерени салони</h3>
              <p className="text-muted-foreground">
                Опитайте да промените критериите за търсене или филтрите.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

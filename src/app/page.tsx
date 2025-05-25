
// This file will now contain the SalonDirectoryPage logic.
// The original content of src/app/(default)/home/page.tsx is moved here.

'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { Salon } from '@/types';
import { SalonCard } from '@/components/salon/salon-card';
import { FilterSidebar } from '@/components/salon/filter-sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { allBulgarianCities, mockServices as allMockServices } from '@/lib/mock-data';
import { isFuture } from 'date-fns';
import { firestore } from '@/lib/firebase'; // Import the initialized firestore instance

const DEFAULT_MIN_RATING = 0;
const DEFAULT_MAX_PRICE = 500;
const DEFAULT_MIN_PRICE = 0;

interface HeroImage {
  id: string;
  src: string;
  alt: string;
  dataAiHint: string;
  priority?: boolean;
}

// Static list of 3 specific images
const staticHeroImages: HeroImage[] = [
  { id: 'hair_studio_large', src: 'https://images.unsplash.com/photo-1629397685944-7073f5589754?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxOXx8SGFpciUyMHNhbG9ufGVufDB8fHx8MTc0NzkyNDI4OHww&ixlib=rb-4.1.0&q=80&w=1080', alt: 'Стилист работещ във фризьорски салон', dataAiHint: 'hair studio', priority: true },
  { id: 'barber_small', src: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxCYXJiZXJ8ZW58MHx8fHwxNzQ3OTIzNDI0fDA&ixlib=rb-4.1.0&q=80&w=1080', alt: 'Интериор на модерен бръснарски салон', dataAiHint: 'barber salon' },
  { id: 'nail_studio_small', src: 'https://images.unsplash.com/photo-1571290274554-6a2eaa771e5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxOYWlsJTIwc3R1ZGlvfGVufDB8fHx8MTc0NzkyMzQ3N3ww&ixlib=rb-4.1.0&q=80&w=1080', alt: 'Близък план на инструменти в студио за маникюр', dataAiHint: 'nail salon' },
];


export default function SalonDirectoryPage() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [filteredSalons, setFilteredSalons] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    location: '--all-cities--',
    serviceType: '--all-services--',
    minRating: DEFAULT_MIN_RATING,
    maxPrice: DEFAULT_MAX_PRICE,
  });

  const uniqueServiceTypes = Array.from(new Set(allMockServices.map(service => service.name)));

  useEffect(() => {
    const fetchSalons = async () => {
      setIsLoading(true);
      try {
        const salonsCollectionRef = collection(firestore, 'salons');
        const q = query(salonsCollectionRef, orderBy('name'));
        const salonsSnapshot = await getDocs(q);
        const salonsList = salonsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Salon[];

        salonsList.sort((a, b) => {
          const aIsPromoted = a.promotion?.isActive && a.promotion.expiresAt && isFuture(new Date(a.promotion.expiresAt));
          const bIsPromoted = b.promotion?.isActive && b.promotion.expiresAt && isFuture(new Date(b.promotion.expiresAt));
          if (aIsPromoted && !bIsPromoted) return -1;
          if (!aIsPromoted && bIsPromoted) return 1;
          if (a.rating !== undefined && b.rating !== undefined) {
            return b.rating - a.rating;
          }
          return a.name.localeCompare(b.name);
        });
        
        setSalons(salonsList);
      } catch (error) {
        console.error("Error fetching salons:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSalons();
  }, []); 

  const applyFilters = useCallback(() => {
    let tempSalons = [...salons];

    if (searchTerm) {
      tempSalons = tempSalons.filter(salon =>
        salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (salon.description && salon.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filters.location !== '--all-cities--') {
      tempSalons = tempSalons.filter(salon => salon.city === filters.location);
    }

    if (filters.serviceType !== '--all-services--') {
      tempSalons = tempSalons.filter(salon =>
        salon.services?.some(service => service.name === filters.serviceType)
      );
    }

    if (filters.minRating > DEFAULT_MIN_RATING) {
      tempSalons = tempSalons.filter(salon => (salon.rating || 0) >= filters.minRating);
    }
    
    if (filters.maxPrice < DEFAULT_MAX_PRICE && filters.maxPrice !== DEFAULT_MIN_PRICE) {
        tempSalons = tempSalons.filter(salon =>
            salon.services?.some(service => service.price <= filters.maxPrice)
        );
    }
    setFilteredSalons(tempSalons);
  }, [salons, searchTerm, filters]);

  useEffect(() => {
    applyFilters();
  }, [salons, searchTerm, filters, applyFilters]);

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters }));
  };
  

  return (
    <div className="container mx-auto py-10 px-6">
      <header className="mb-16 py-12 bg-gradient-to-r from-secondary via-background to-secondary relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-30 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/30 rounded-full filter blur-2xl animate-pulse delay-0"></div>
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-accent/30 rounded-full filter blur-2xl animate-pulse delay-200"></div>
            <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-secondary/50 rounded-lg filter blur-xl animate-ping-slow delay-100 transform -rotate-45"></div>
            <div className="absolute bottom-1/3 right-1/3 w-20 h-20 bg-primary/20 rounded-full filter blur-lg animate-pulse delay-300"></div>
            <div className="absolute top-10 right-20 w-0.5 h-32 bg-border/50 transform rotate-[20deg] opacity-70"></div>
        </div>
        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-8 items-center relative z-0">
            <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                Намерете Вашия Перфектен Салон
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto md:mx-0">
                Открийте най-добрите салони за красота и услуги близо до Вас.
                </p>
            </div>
            <div className="relative z-10 md:col-span-1 space-y-4">
              <div> 
                <Image
                  key={staticHeroImages[0].id + '-large'} 
                  src={staticHeroImages[0].src}
                  alt={staticHeroImages[0].alt}
                  width={560}
                  height={320}
                  priority={staticHeroImages[0].priority}
                  className="w-full h-auto object-cover rounded-lg shadow-xl"
                  data-ai-hint={staticHeroImages[0].dataAiHint}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Image
                    key={staticHeroImages[1].id + '-small1'}
                    src={staticHeroImages[1].src}
                    alt={staticHeroImages[1].alt}
                    width={270}
                    height={270}
                    loading="lazy"
                    className="w-full h-auto object-cover rounded-lg shadow-xl"
                    data-ai-hint={staticHeroImages[1].dataAiHint}
                  />
                </div>
                <div>
                  <Image
                    key={staticHeroImages[2].id + '-small2'}
                    src={staticHeroImages[2].src}
                    alt={staticHeroImages[2].alt}
                    width={270}
                    height={270}
                    loading="lazy"
                    className="w-full h-auto object-cover rounded-lg shadow-xl"
                    data-ai-hint={staticHeroImages[2].dataAiHint}
                  />
                </div>
              </div>
            </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-1/4 lg:w-1/5">
          <FilterSidebar 
            onFilterChange={handleFilterChange} 
            cities={allBulgarianCities} 
            serviceTypes={uniqueServiceTypes}
          />
        </aside>
        <main className="w-full md:w-3/4 lg:w-4/5">
          <div className="mb-8 relative">
            <Input
              type="text"
              placeholder="Търсене на салон по име или описание..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-base py-6 rounded-lg shadow-sm border-border/80 focus:border-primary focus:ring-primary"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                 <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-5/6 mb-3" />
                    <Skeleton className="h-4 w-1/2 mb-3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <div className="p-4 pt-0">
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredSalons.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSalons.map(salon => (
                <SalonCard key={salon.id} salon={salon} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground">Няма намерени салони</h3>
              <p className="text-muted-foreground mt-2">
                Опитайте да промените Вашите филтри или термина за търсене.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}


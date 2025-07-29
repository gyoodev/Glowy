
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { isFuture, parseISO } from 'date-fns';
import type { Salon } from '@/types';
import { SalonCard } from '@/components/salon/salon-card';
import { FilterSidebar, type CategorizedService } from '@/components/salon/filter-sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, ListOrdered, ShoppingBag, Sparkles, Home } from 'lucide-react';
import { PromotedSalons } from '@/components/salon/PromotedSalons';

const DEFAULT_MIN_RATING = 0;
const DEFAULT_MAX_PRICE = 500;
const DEFAULT_MIN_PRICE = 0;
const ALL_REGIONS_VALUE = "--all-regions--";
const ALL_CITIES_VALUE = "--all-cities--";
const ALL_CATEGORIES_VALUE = "--all-categories--";
const ALL_SERVICES_IN_CATEGORY_VALUE = "--all-services-in-category--";

interface SalonDirectoryProps {
    initialSalons: Salon[];
    initialPromotedSalons: Salon[];
    initialRecentlyAddedSalons: Salon[];
    categorizedServices: CategorizedService[];
    regionsAndCities: { region: string; cities: string[] }[];
}

export function SalonDirectory({
    initialSalons,
    initialPromotedSalons,
    initialRecentlyAddedSalons,
    categorizedServices,
    regionsAndCities
}: SalonDirectoryProps) {
  const [salons, setSalons] = useState<Salon[]>(initialSalons);
  const [filteredSalons, setFilteredSalons] = useState<Salon[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    region: ALL_REGIONS_VALUE,
    location: ALL_CITIES_VALUE,
    category: ALL_CATEGORIES_VALUE,
    serviceId: ALL_SERVICES_IN_CATEGORY_VALUE,
    minRating: DEFAULT_MIN_RATING,
    maxPrice: DEFAULT_MIN_PRICE,
  });
  const [sortOrder, setSortOrder] = useState<string>('default');

  const regularSalons = useMemo(() => {
    const promotedIds = new Set(initialPromotedSalons.map(s => s.id));
    const recentIds = new Set(initialRecentlyAddedSalons.map(s => s.id));
    return initialSalons.filter(s => !promotedIds.has(s.id) && !recentIds.has(s.id));
  }, [initialSalons, initialPromotedSalons, initialRecentlyAddedSalons]);

  const hasActiveFilters = useMemo(() => {
    return searchTerm.trim() !== '' ||
           filters.region !== ALL_REGIONS_VALUE ||
           filters.location !== ALL_CITIES_VALUE ||
           filters.category !== ALL_CATEGORIES_VALUE ||
           filters.serviceId !== ALL_SERVICES_IN_CATEGORY_VALUE ||
           filters.minRating > DEFAULT_MIN_RATING ||
           filters.maxPrice > DEFAULT_MIN_PRICE;
  }, [searchTerm, filters]);

  const applyFiltersAndSort = useCallback(() => {
    if (!hasActiveFilters) {
        setFilteredSalons([]); // Clear search results if no filters are active
        return;
    }

    let tempSalons = [...salons];

    // Apply text search
    if (searchTerm.trim()) {
      const lowercasedTerm = searchTerm.toLowerCase();
      tempSalons = tempSalons.filter(salon =>
        salon.name.toLowerCase().includes(lowercasedTerm) ||
        (salon.description && salon.description.toLowerCase().includes(lowercasedTerm))
      );
    }
    
    // Apply structured filters
    if (filters.region !== ALL_REGIONS_VALUE) {
      tempSalons = tempSalons.filter(salon => salon.region === filters.region);
    }
    if (filters.location !== ALL_CITIES_VALUE) {
      tempSalons = tempSalons.filter(salon => salon.city === filters.location);
    }
    if (filters.category && filters.category !== ALL_CATEGORIES_VALUE) {
      if (filters.serviceId && filters.serviceId !== ALL_SERVICES_IN_CATEGORY_VALUE) {
        tempSalons = tempSalons.filter(salon =>
          salon.services?.some(service => service.id === filters.serviceId)
        );
      } else {
        tempSalons = tempSalons.filter(salon =>
          salon.services?.some(service => service.category === filters.category)
        );
      }
    }
    if (filters.minRating > DEFAULT_MIN_RATING) {
      tempSalons = tempSalons.filter(salon => (salon.rating || 0) >= filters.minRating);
    }
    if (filters.maxPrice > DEFAULT_MIN_PRICE) {
      tempSalons = tempSalons.filter(salon =>
        salon.services?.some(service => service.price <= filters.maxPrice)
      );
    }

    // Apply sorting
    if (sortOrder === 'rating_desc') {
      tempSalons.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortOrder === 'rating_asc') {
      tempSalons.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
    } else if (sortOrder === 'name_asc') {
      tempSalons.sort((a, b) => a.name.localeCompare(b.name, 'bg'));
    } else if (sortOrder === 'name_desc') {
      tempSalons.sort((a, b) => b.name.localeCompare(a.name, 'bg'));
    } else if (sortOrder === 'default') {
      tempSalons.sort((a, b) => {
        const aIsPromoted = a.promotion?.isActive && a.promotion.expiresAt ? isFuture(parseISO(a.promotion.expiresAt)) : false;
        const bIsPromoted = b.promotion?.isActive && b.promotion.expiresAt ? isFuture(parseISO(b.promotion.expiresAt)) : false;
        if (aIsPromoted && !bIsPromoted) return -1;
        if (!aIsPromoted && bIsPromoted) return 1;
        if ((b.rating ?? 0) !== (a.rating ?? 0)) return (b.rating ?? 0) - (a.rating ?? 0);
        return a.name.localeCompare(b.name, 'bg');
      });
    }
    setFilteredSalons(tempSalons);
  }, [salons, searchTerm, filters, sortOrder, hasActiveFilters]);


  useEffect(() => {
    applyFiltersAndSort();
  }, [searchTerm, filters, sortOrder, applyFiltersAndSort]);

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters }));
  };
  
  return (
    <div className="flex flex-col md:flex-row gap-8">
      <aside className="w-full md:w-1/4 lg:w-1/5">
        <FilterSidebar 
          onFilterChange={handleFilterChange} 
          regionsAndCities={regionsAndCities} 
          categorizedServices={categorizedServices}
        />
      </aside>
      <main className="w-full md:w-3/4 lg:w-4/5">
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full sm:w-auto">
            <Input
              type="text"
              placeholder="Търсене на салон по име или описание..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-base py-6 rounded-lg shadow-sm border-border/80 focus:border-primary focus:ring-primary"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
          <div className="w-full sm:w-auto sm:min-w-[200px]">
            <Label htmlFor="sortOrder" className="sr-only">Подреди по</Label>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger id="sortOrder" className="text-base py-3 rounded-lg shadow-sm border-border/80 focus:border-primary focus:ring-primary h-auto">
                 <ListOrdered className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Подреди по..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">По подразбиране</SelectItem>
                <SelectItem value="rating_desc">Рейтинг (най-висок)</SelectItem>
                <SelectItem value="rating_asc">Рейтинг (най-нисък)</SelectItem>
                <SelectItem value="name_asc">Име (А-Я)</SelectItem>
                <SelectItem value="name_desc">Име (Я-А)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasActiveFilters ? (
            filteredSalons.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSalons.map((salon) => (
                      <SalonCard key={salon.id} salon={salon} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                  <Search className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold text-foreground">Няма намерени салони.</h3>
                  <p className="text-muted-foreground mt-2">
                      Моля, променете критериите си за търсене.
                  </p>
              </div>
            )
        ) : (
           <div className="space-y-12">
              <PromotedSalons salons={initialPromotedSalons} />
              
              {initialRecentlyAddedSalons.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold flex items-center mb-4">
                      <Sparkles className="mr-3 h-6 w-6 text-primary" />
                      Нови и препоръчани
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {initialRecentlyAddedSalons.map((salon) => (
                          <SalonCard key={salon.id} salon={salon} />
                      ))}
                  </div>
                </div>
              )}
              
               {regularSalons.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold flex items-center mb-4">
                    <Home className="mr-3 h-6 w-6 text-primary" />
                    Всички салони
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {regularSalons.map((salon) => (
                      <SalonCard key={salon.id} salon={salon} />
                    ))}
                  </div>
                </div>
              )}

              {(initialPromotedSalons.length === 0 && initialRecentlyAddedSalons.length === 0 && regularSalons.length === 0) && (
                 <div className="text-center py-12">
                  <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold text-foreground">Добре дошли в Glaura!</h3>
                  <p className="text-muted-foreground mt-2">
                      Използвайте търсачката или филтрите, за да намерите перфектния салон за Вас. Все още няма одобрени салони.
                  </p>
              </div>
              )}
          </div>
        )}
      </main>
    </div>
  );
}

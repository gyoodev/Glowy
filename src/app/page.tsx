
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import type { Salon, BusinessStatus } from '@/types';
import { SalonCard } from '@/components/salon/salon-card';
import { FilterSidebar, type CategorizedService } from '@/components/salon/filter-sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, ListOrdered, ShoppingBag } from 'lucide-react';
import { bulgarianRegionsAndCities, mockServices as allMockServices } from '@/lib/mock-data';
import { format, isFuture, parseISO } from 'date-fns';
import { firestore } from '@/lib/firebase';
import { mapSalon } from '@/utils/mappers';
import { HeroSlider } from '@/components/layout/HeroSlider';
import { slidesData } from '@/lib/hero-slides-data';
import { PromotedSalons } from '@/components/salon/PromotedSalons';

const DEFAULT_MIN_RATING = 0;
const DEFAULT_MAX_PRICE = 500;
const DEFAULT_MIN_PRICE = 0;
const ALL_CITIES_VALUE = "--all-cities--";
const ALL_CATEGORIES_VALUE = "--all-categories--";
const ALL_SERVICES_IN_CATEGORY_VALUE = "--all-services-in-category--";

export default function SalonDirectoryPage() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [promotedSalons, setPromotedSalons] = useState<Salon[]>([]);
  const [filteredSalons, setFilteredSalons] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    location: ALL_CITIES_VALUE,
    category: ALL_CATEGORIES_VALUE,
    serviceId: ALL_SERVICES_IN_CATEGORY_VALUE,
    minRating: DEFAULT_MIN_RATING,
    maxPrice: DEFAULT_MIN_PRICE,
  });
  const [sortOrder, setSortOrder] = useState<string>('default');

  const categorizedServices = useMemo((): CategorizedService[] => {
    const categoriesMap: Record<string, { id: string; name: string }[]> = {};
    allMockServices.forEach(service => {
      if (service.category) {
        if (!categoriesMap[service.category]) {
          categoriesMap[service.category] = [];
        }
        categoriesMap[service.category].push({ id: service.id, name: service.name });
      }
    });
    return Object.keys(categoriesMap).map(categoryName => ({
      category: categoryName,
      services: categoriesMap[categoryName],
    })).sort((a,b) => a.category.localeCompare(b.category));
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const salonsCollectionRef = collection(firestore, 'salons');
        const q = query(salonsCollectionRef, where('status', '==', 'approved' as BusinessStatus));
        const salonsSnapshot = await getDocs(q);
        const allSalons = salonsSnapshot.docs.map(doc => mapSalon(doc.data(), doc.id));
        
        const activePromoted = allSalons.filter(s => s.promotion?.isActive && s.promotion.expiresAt && isFuture(parseISO(s.promotion.expiresAt)));
        
        setSalons(allSalons);
        setPromotedSalons(activePromoted);
        setFilteredSalons([]); // Initially, don't show the main list, only promoted
      } catch (error) {
        console.error("Error fetching initial salons:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const applyFiltersAndSort = useCallback(() => {
    let tempSalons = [...salons];

    // Start filtering only if there is a search term or active filters
    const hasActiveFilters = 
      searchTerm ||
      filters.location !== ALL_CITIES_VALUE ||
      filters.category !== ALL_CATEGORIES_VALUE ||
      filters.minRating > DEFAULT_MIN_RATING ||
      filters.maxPrice > DEFAULT_MIN_PRICE;
      
    if (!hasActiveFilters) {
        setFilteredSalons([]);
        setIsSearching(false);
        return;
    }
    
    setIsSearching(true);

    if (searchTerm) {
      tempSalons = tempSalons.filter(salon =>
        salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (salon.description && salon.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
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

    if (sortOrder === 'rating_desc') {
      tempSalons.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortOrder === 'rating_asc') {
      tempSalons.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
    } else if (sortOrder === 'name_asc') {
      tempSalons.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'name_desc') {
      tempSalons.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortOrder === 'default') {
      tempSalons.sort((a, b) => {
        const aIsPromoted = a.promotion?.isActive && a.promotion.expiresAt ? isFuture(parseISO(a.promotion.expiresAt)) : false;
        const bIsPromoted = b.promotion?.isActive && b.promotion.expiresAt ? isFuture(parseISO(b.promotion.expiresAt)) : false;
        if (aIsPromoted && !bIsPromoted) return -1;
        if (!aIsPromoted && bIsPromoted) return 1;
        if ((b.rating ?? 0) !== (a.rating ?? 0)) return (b.rating ?? 0) - (a.rating ?? 0);
        return a.name.localeCompare(b.name);
      });
    }
    setFilteredSalons(tempSalons);
  }, [salons, searchTerm, filters, sortOrder]);


  useEffect(() => {
    applyFiltersAndSort();
  }, [searchTerm, filters, sortOrder, applyFiltersAndSort]);

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters }));
  };
  
  return (
    <div className="container mx-auto py-10 px-6">
      <header className="mb-10">
        <HeroSlider slides={slidesData} />
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-1/4 lg:w-1/5">
          <FilterSidebar 
            onFilterChange={handleFilterChange} 
            regionsAndCities={bulgarianRegionsAndCities} 
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
          ) : isSearching ? (
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
            <PromotedSalons salons={promotedSalons} />
          )}
        </main>
      </div>
    </div>
  );
}

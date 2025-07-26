
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { isFuture, parseISO, subDays, isWithinInterval } from 'date-fns';
import type { Salon, BusinessStatus } from '@/types';
import { SalonCard } from '@/components/salon/salon-card';
import { FilterSidebar, type CategorizedService } from '@/components/salon/filter-sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, ListOrdered, ShoppingBag, Sparkles } from 'lucide-react';
import { bulgarianRegionsAndCities, mockServices as allMockServices } from '@/lib/mock-data';
import { firestore } from '@/lib/firebase';
import { mapSalon } from '@/utils/mappers';
import { PromotedSalons } from '@/components/salon/PromotedSalons';

const DEFAULT_MIN_RATING = 0;
const DEFAULT_MAX_PRICE = 500;
const DEFAULT_MIN_PRICE = 0;
const ALL_REGIONS_VALUE = "--all-regions--";
const ALL_CITIES_VALUE = "--all-cities--";
const ALL_CATEGORIES_VALUE = "--all-categories--";
const ALL_SERVICES_IN_CATEGORY_VALUE = "--all-services-in-category--";

export default function AllSalonsPage() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [filteredSalons, setFilteredSalons] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    })).sort((a, b) => a.category.localeCompare(b.category));
  }, []);

  useEffect(() => {
    const fetchSalons = async () => {
      setIsLoading(true);
      try {
        const salonsCollectionRef = collection(firestore, 'salons');
        const q = query(salonsCollectionRef, where('status', '==', 'approved' as BusinessStatus));
        const salonsSnapshot = await getDocs(q);
        const salonsList = salonsSnapshot.docs.map(doc => mapSalon(doc.data(), doc.id));
        setSalons(salonsList);
        setFilteredSalons(salonsList); // Initially show all approved salons
      } catch (error) {
        console.error("Error fetching salons:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSalons();
  }, []);

  const applyFiltersAndSort = useCallback(() => {
    let tempSalons = [...salons];

    if (searchTerm) {
      tempSalons = tempSalons.filter(salon =>
        salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (salon.description && salon.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (filters.region !== ALL_REGIONS_VALUE) {
      tempSalons = tempSalons.filter(salon => salon.region === filters.region);
    }
    if (filters.location !== ALL_CITIES_VALUE) {
      tempSalons = tempSalons.filter(salon => salon.city === filters.location);
    }
    if (filters.category !== ALL_CATEGORIES_VALUE) {
      if (filters.serviceId !== ALL_SERVICES_IN_CATEGORY_VALUE) {
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
        const aIsPromoted = a.promotion?.isActive && a.promotion.expiresAt && isFuture(new Date(a.promotion.expiresAt));
        const bIsPromoted = b.promotion?.isActive && b.promotion.expiresAt && isFuture(new Date(b.promotion.expiresAt));
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
  }, [salons, searchTerm, filters, sortOrder, applyFiltersAndSort]);

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="container mx-auto py-10 px-6">
      <header className="mb-16 py-12 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-30 pointer-events-none">
          {/* Animated background elements */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/30 rounded-full filter blur-2xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-accent/30 rounded-full filter blur-2xl animate-pulse delay-200" />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-secondary/50 rounded-lg filter blur-xl animate-ping-slow rotate-45" />
          <div className="absolute bottom-1/3 right-1/3 w-20 h-20 bg-primary/20 rounded-full filter blur-lg animate-pulse delay-300" />
          <div className="absolute top-10 right-20 w-0.5 h-32 bg-border/50 rotate-[20deg]" />
        </div>
        <div className="container mx-auto grid md:grid-cols-2 gap-8 items-center relative z-0">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">Всички Салони</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl">Разгледайте всички салони, налични в платформата и намерете подходящия за Вас.</p>
          </div>
        </div>
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
            <div className="relative flex-grow w-full">
              <Input
                type="text"
                placeholder="Търсене на салон по име или описание..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-6 text-base rounded-lg border-border shadow-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
            <div className="w-full sm:w-auto sm:min-w-[200px]">
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="text-base py-3 rounded-lg shadow-sm border-border">
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
                <div key={i} className="rounded-lg border bg-card shadow-sm animate-pulse overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-4 space-y-2" key={`skeleton-content-${i}`}>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <div className="p-4 pt-0">
                    <Skeleton className="h-10 w-full" key={`skeleton-button-${i}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredSalons.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSalons.map(salon => (
                <SalonCard salon={salon} key={`salon-card-${salon.id}`} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold">Няма намерени салони</h3>
              <p className="text-muted-foreground mt-2">Опитайте да промените филтрите или ключовата дума.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}


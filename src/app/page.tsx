
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { Salon, BusinessStatus } from '@/types';
import { SalonCard } from '@/components/salon/salon-card';
import { FilterSidebar, type CategorizedService } from '@/components/salon/filter-sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, ListOrdered, ShoppingBag } from 'lucide-react'; // Added ShoppingBag for no salons case
import { allBulgarianCities, mockServices as allMockServices } from '@/lib/mock-data';
import { format, isFuture, parseISO } from 'date-fns'; // Import parseISO
import { where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { mapSalon } from '@/utils/mappers';
import NewPageSlider from '@/components/layout/NewPageSlider'; // Import the new slider

const DEFAULT_MIN_RATING = 0;
const DEFAULT_MAX_PRICE = 500;
const DEFAULT_MIN_PRICE = 0;
const ALL_CITIES_VALUE = "--all-cities--";
const ALL_CATEGORIES_VALUE = "--all-categories--";
const ALL_SERVICES_IN_CATEGORY_VALUE = "--all-services-in-category--";


export default function SalonDirectoryPage() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [filteredSalons, setFilteredSalons] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    const fetchSalons = async () => {
      setIsLoading(true);
      try {
        const salonsCollectionRef = collection(firestore, 'salons');
        const q = query(salonsCollectionRef, where('status', '==', 'approved' as BusinessStatus), orderBy('name'));
        
        const salonsSnapshot = await getDocs(q);
        let salonsList = salonsSnapshot.docs.map(doc => mapSalon(doc.data(), doc.id));
        
        setSalons(salonsList);
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

    // Filtering logic
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

    // Sorting logic
    if (sortOrder === 'rating_desc') {
      tempSalons.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortOrder === 'rating_asc') { // Should be maxPrice_desc? Sorting logic seems inconsistent with comments
      tempSalons.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
    } else if (sortOrder === 'name_asc') {
      tempSalons.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'name_desc') {
      tempSalons.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortOrder === 'default') {
      // Default sort: Promoted first, then by rating (desc), then by name (asc)
      tempSalons.sort((a, b) => {
        const aIsPromoted = a.promotion?.isActive && a.promotion.expiresAt ? isFuture(parseISO(a.promotion.expiresAt)) : false;
        const bIsPromoted = b.promotion?.isActive && b.promotion.expiresAt ? isFuture(parseISO(b.promotion.expiresAt)) : false;

        // Check for valid dates before comparing
        const aRating = a.rating ?? 0;
        const bRating = b.rating ?? 0;

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
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters }));
  };
  

  return (
    <div className="container mx-auto py-10 px-6">
      <header className="mb-10">
        <NewPageSlider /> {/* Use the new slider component */}
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-1/4 lg:w-1/5">
          <FilterSidebar 
            onFilterChange={handleFilterChange} 
            cities={allBulgarianCities} 
            categorizedServices={categorizedServices}
          />
        </aside>
        <main className="w-full md:w-3/4 lg:w-4/5">
          <h1 className="text-3xl font-bold mb-8 text-center md:text-left">
            Директория със Салони за Красота
          </h1>
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
          ) : salons.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" /> {/* Changed icon */}
              <h3 className="text-xl font-semibold text-foreground">В платформата все още няма създадени салони.</h3>
              <p className="text-muted-foreground mt-2">
                Моля, проверете по-късно или ако сте собственик на салон, регистрирайте го.
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground">Търсеният от Вас салон не е намерен в платформата.</h3>
              <p className="text-muted-foreground mt-2">
                Моля, проверете критериите си за търсене.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}


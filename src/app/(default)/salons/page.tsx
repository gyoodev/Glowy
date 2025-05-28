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
import { format, isFuture } from 'date-fns';
import { firestore } from '@/lib/firebase';

const DEFAULT_MIN_RATING = 0;
const DEFAULT_MAX_PRICE = 500;
const DEFAULT_MIN_PRICE = 0;

export default function SalonsDirectoryPage() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [filteredSalons, setFilteredSalons] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    location: '--all-cities--',
    serviceType: '--all-services--',
    minRating: DEFAULT_MIN_RATING,
    maxPrice: DEFAULT_MIN_PRICE,
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

    if (filters.maxPrice > DEFAULT_MIN_PRICE) { // Only apply maxPrice filter if it's greater than 0
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
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">Всички Салони</h1>
        <p className="text-lg text-muted-foreground">Разгледайте всички салони, налични в платформата.</p>
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
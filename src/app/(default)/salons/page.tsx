'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { Salon } from '@/types';
import { SalonCard } from '@/components/salon/salon-card';
import { FilterSidebar } from '@/components/salon/filter-sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
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
    <>
    <div className="container mx-auto py-10 px-6">
      <header className="mb-16 py-12 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-30 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/30 rounded-full filter blur-2xl animate-pulse delay-0"></div>
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-accent/30 rounded-full filter blur-2xl animate-pulse duration-1000 delay-200"></div>
            <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-secondary/50 rounded-lg filter blur-xl animate-ping-slow duration-1000 delay-100 transform -rotate-45"></div>
            <div className="absolute bottom-1/3 right-1/3 w-20 h-20 bg-primary/20 rounded-full filter blur-lg animate-pulse delay-300"></div>
            <div className="absolute top-10 right-20 w-0.5 h-32 bg-border/50 transform rotate-[20deg] opacity-70 duration-1000"></div>
        </div>
        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-8 items-center relative z-0">
            <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                Всички Салони
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto md:mx-0">
                Разгледайте всички салони, налични в платформата и намерете подходящия за Вас.
                </p>
            </div>
             {/* Add an image section here if desired, similar to the home page */}
             {/* For now, leaving the second column empty or for potential future use */}
            <div className="relative z-10 md:col-span-1 space-y-4">
                {/* Placeholder for image or other content */}
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
            {/* <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /> */}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
 <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden animate-pulse duration-100">
                  <Skeleton className="h-48 w-full animate-pulse duration-1000" />
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
              {/* <Search className="mx-auto h-16 w-16 text-muted-foreground mb-4" /> */}
              <h3 className="text-xl font-semibold text-foreground">Няма намерени салони</h3>
              <p className="text-muted-foreground mt-2">
                Опитайте да промените Вашите филтри или термина за търсене.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
    </>
  );
}
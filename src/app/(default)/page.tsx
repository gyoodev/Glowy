
'use client';

import { useState, useMemo, useEffect } from 'react';
import { SalonCard } from '@/components/salon/salon-card';
import { FilterSidebar } from '@/components/salon/filter-sidebar';
import { mockServices, allBulgarianCities } from '@/lib/mock-data'; // Import allBulgarianCities
import { Input } from '@/components/ui/input';
import { Search, MapPin, VenetianMask } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const ALL_CITIES_VALUE = "--all-cities--";
const ALL_SERVICES_VALUE = "--all-services--";
const ANY_PRICE_VALUE = "--any-price--"; // This constant is used for actual filtering.
import type { Salon } from '@/types';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

export default function SalonDirectoryPage() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [filteredSalons, setFilteredSalons] = useState<Salon[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({
    location: ALL_CITIES_VALUE,
    serviceType: ALL_SERVICES_VALUE,
    minRating: 0,
    priceRange: ANY_PRICE_VALUE, // This remains the same string for filtering.
  });
  const [isLoading, setIsLoading] = useState(true);

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
        console.error("Error fetching salons:", error);
      }
      setIsLoading(false);
    };
    fetchSalons();
  }, []);


  const uniqueServiceTypes = useMemo(() => {
    const serviceNames = new Set(mockServices.map(service => service.name));
    return Array.from(serviceNames);
  }, []);

  useEffect(() => {
    let result = salons;

    if (searchTerm) {
      result = result.filter(salon =>
        salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        salon.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (Object.keys(filters).length > 0) {
      result = result.filter(salon => {
        const { location, serviceType, minRating, priceRange } = filters;
        let matches = true;
        if (location && location !== ALL_CITIES_VALUE && salon.city !== location) matches = false;
        if (serviceType && serviceType !== ALL_SERVICES_VALUE && !salon.services.some(s => s.name === serviceType)) matches = false;
        if (minRating && salon.rating < minRating) matches = false; 
        // The priceRange filter here still expects 'cheap', 'moderate', 'expensive', or ANY_PRICE_VALUE ('--any-price--')
        if (priceRange && priceRange !== ANY_PRICE_VALUE && salon.priceRange !== priceRange) matches = false;
        return matches;
      });
    }
    setFilteredSalons(result);
  }, [searchTerm, filters, salons]);

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
  };

  return (
    <div className="container mx-auto py-10 px-6">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-foreground mb-4 flex items-center justify-center">
          <VenetianMask className="w-12 h-12 mr-3 text-primary" />
          Намерете Вашия Перфектен Салон
        </h1>
        <p className="text-xl text-muted-foreground">
          Открийте най-добрите салони за красота и услуги близо до Вас.
        </p>
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
              <MapPin className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
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

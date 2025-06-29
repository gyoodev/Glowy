
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconFilter, IconX } from '@tabler/icons-react';

export interface CategorizedService {
  category: string;
  services: { id: string; name: string }[];
}

interface FilterSidebarProps {
  onFilterChange: (filters: Record<string, any>) => void;
  regionsAndCities: { region: string; cities: string[] }[];
  categorizedServices: CategorizedService[];
}

const ALL_REGIONS_VALUE = "--all-regions--";
const ALL_CITIES_VALUE = "--all-cities--";
const ALL_CATEGORIES_VALUE = "--all-categories--";
const ALL_SERVICES_IN_CATEGORY_VALUE = "--all-services-in-category--";
const DEFAULT_MIN_PRICE = 0;
const DEFAULT_MAX_PRICE = 500;

export function FilterSidebar({ onFilterChange, regionsAndCities, categorizedServices }: FilterSidebarProps) {
  const [region, setRegion] = useState(ALL_REGIONS_VALUE);
  const [city, setCity] = useState(ALL_CITIES_VALUE);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES_VALUE);
  const [selectedServiceId, setSelectedServiceId] = useState(ALL_SERVICES_IN_CATEGORY_VALUE);
  const [rating, setRating] = useState([0]);
  const [maxPriceValue, setMaxPriceValue] = useState<[number]>([DEFAULT_MIN_PRICE]);

  useEffect(() => {
    if (region !== ALL_REGIONS_VALUE) {
      const regionData = regionsAndCities.find(r => r.region === region);
      setAvailableCities(regionData ? regionData.cities.sort((a,b) => a.localeCompare(b, 'bg')) : []);
      setCity(ALL_CITIES_VALUE); // Reset city when region changes
    } else {
      setAvailableCities([]);
      setCity(ALL_CITIES_VALUE);
    }
  }, [region, regionsAndCities]);

  useEffect(() => {
    setSelectedServiceId(ALL_SERVICES_IN_CATEGORY_VALUE);
  }, [selectedCategory]);

  const servicesForSelectedCategory = selectedCategory === ALL_CATEGORIES_VALUE
    ? []
    : categorizedServices.find(cs => cs.category === selectedCategory)?.services || [];

  const handleApplyFilters = () => {
    onFilterChange({
      region: region === ALL_REGIONS_VALUE ? undefined : region,
      location: city === ALL_CITIES_VALUE ? undefined : city,
      category: selectedCategory === ALL_CATEGORIES_VALUE ? undefined : selectedCategory,
      serviceId: selectedServiceId === ALL_SERVICES_IN_CATEGORY_VALUE ? undefined : selectedServiceId,
      minRating: rating[0],
      maxPrice: maxPriceValue[0] === DEFAULT_MIN_PRICE ? DEFAULT_MAX_PRICE : maxPriceValue[0],
    });
  };

  const handleClearFilters = () => {
    setRegion(ALL_REGIONS_VALUE);
    setCity(ALL_CITIES_VALUE);
    setSelectedCategory(ALL_CATEGORIES_VALUE);
    setSelectedServiceId(ALL_SERVICES_IN_CATEGORY_VALUE);
    setRating([0]);
    setMaxPriceValue([DEFAULT_MIN_PRICE]);
    onFilterChange({
      region: undefined,
      location: undefined,
      category: undefined,
      serviceId: undefined,
      minRating: 0,
      maxPrice: DEFAULT_MAX_PRICE,
    });
  };

  const priceLabel = maxPriceValue[0] === DEFAULT_MIN_PRICE 
    ? "Всякаква цена" 
    : `До ${maxPriceValue[0]} лв.`;

  return (
    <Card className="sticky top-20 shadow-lg rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center">
          <IconFilter className="mr-2 h-5 w-5 text-primary" />
          Филтри
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-sm">
          <IconX className="mr-1 h-4 w-4" /> Изчисти
        </Button>
      </CardHeader>
      <CardContent className="space-y-6 p-4">
        <div>
          <Label htmlFor="region-filter" className="text-sm font-medium">Област</Label>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger id="region-filter">
              <SelectValue placeholder="Всички области" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_REGIONS_VALUE}>Всички области</SelectItem>
              {regionsAndCities.map(r => (
                <SelectItem key={r.region} value={r.region}>{r.region}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="location-filter" className="text-sm font-medium">Град</Label>
          <Select value={city} onValueChange={setCity} disabled={region === ALL_REGIONS_VALUE}>
            <SelectTrigger id="location-filter">
              <SelectValue placeholder={region === ALL_REGIONS_VALUE ? "Първо изберете област" : "Всички градове"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CITIES_VALUE}>Всички градове</SelectItem>
              {availableCities.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="category-filter" className="text-sm font-medium">Категория услуги</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger id="category-filter">
              <SelectValue placeholder="Изберете категория" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES_VALUE}>Всички категории</SelectItem>
              {categorizedServices.map(cs => (
                <SelectItem key={cs.category} value={cs.category}>{cs.category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCategory !== ALL_CATEGORIES_VALUE && servicesForSelectedCategory.length > 0 && (
          <div>
            <Label htmlFor="service-filter" className="text-sm font-medium">Конкретна услуга</Label>
            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
              <SelectTrigger id="service-filter">
                <SelectValue placeholder="Изберете услуга" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SERVICES_IN_CATEGORY_VALUE}>Всички услуги в категорията</SelectItem>
                {servicesForSelectedCategory.map(service => (
                  <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="rating" className="text-sm font-medium">Рейтинг: {rating[0] === 0 ? 'Всякакъв' : `${rating[0]}+ Звезди`}</Label>
          <Slider
            id="rating"
            min={0}
            max={5}
            step={0.5}
            value={rating}
            onValueChange={setRating}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="priceSlider" className="text-sm font-medium">
            Цена: {priceLabel}
          </Label>
          <Slider
            id="priceSlider"
            min={DEFAULT_MIN_PRICE}
            max={DEFAULT_MAX_PRICE}
            step={10}
            value={maxPriceValue}
            onValueChange={(value) => setMaxPriceValue(value as [number])}
            className="mt-2"
          />
        </div>

        <Button onClick={handleApplyFilters} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          Приложи филтри
        </Button>
      </CardContent>
    </Card>
  );
}


'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListFilter, X } from 'lucide-react';

interface FilterSidebarProps {
  onFilterChange: (filters: Record<string, any>) => void;
  cities: string[];
  serviceTypes: string[];
}

const ALL_CITIES_VALUE = "--all-cities--";
const ALL_SERVICES_VALUE = "--all-services--";
const ANY_PRICE_VALUE = "--any-price--";

export function FilterSidebar({ onFilterChange, cities, serviceTypes }: FilterSidebarProps) {
  const [location, setLocation] = useState(ALL_CITIES_VALUE);
  const [serviceType, setServiceType] = useState(ALL_SERVICES_VALUE);
  const [rating, setRating] = useState([0]);
  const [priceRange, setPriceRange] = useState(ANY_PRICE_VALUE);
  const [citySearchTerm, setCitySearchTerm] = useState(''); // New state for city search

  const handleApplyFilters = () => {
    onFilterChange({
      location,
      serviceType,
      minRating: rating[0],
      priceRange,
    });
  };

  const handleClearFilters = () => {
    setLocation(ALL_CITIES_VALUE);
    setServiceType(ALL_SERVICES_VALUE);
    setRating([0]);
    setPriceRange(ANY_PRICE_VALUE);
    setCitySearchTerm(''); // Clear city search term
    onFilterChange({
      location: ALL_CITIES_VALUE,
      serviceType: ALL_SERVICES_VALUE,
      minRating: 0,
      priceRange: ANY_PRICE_VALUE,
    });
  };

  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(citySearchTerm.toLowerCase())
  );

  return (
    <Card className="sticky top-20 shadow-lg rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center">
          <ListFilter className="mr-2 h-5 w-5 text-primary" />
          Филтри
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-sm">
          <X className="mr-1 h-4 w-4" /> Изчисти
        </Button>
      </CardHeader>
      <CardContent className="space-y-6 p-4">
        <div>
          <Label htmlFor="location-search" className="text-sm font-medium">Търсене на град</Label>
          <Input
            id="location-search"
            type="text"
            placeholder="Въведете за търсене..."
            value={citySearchTerm}
            onChange={(e) => setCitySearchTerm(e.target.value)}
            className="mb-2"
          />
          <Label htmlFor="location" className="text-sm font-medium">Местоположение (Град)</Label>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger id="location">
              <SelectValue placeholder="Изберете град" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CITIES_VALUE}>Всички градове</SelectItem>
              {filteredCities.map(city => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="serviceType" className="text-sm font-medium">Тип услуга</Label>
          <Select value={serviceType} onValueChange={setServiceType}>
            <SelectTrigger id="serviceType">
              <SelectValue placeholder="Изберете услуга" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SERVICES_VALUE}>Всички услуги</SelectItem>
               {serviceTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="rating" className="text-sm font-medium">Минимален рейтинг: {rating[0] === 0 ? 'Всякакъв' : `${rating[0]}+ Звезди`}</Label>
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
          <Label htmlFor="priceRange" className="text-sm font-medium">Ценови диапазон</Label>
          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger id="priceRange">
              <SelectValue placeholder="Изберете ценови диапазон" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY_PRICE_VALUE}>Всякаква цена</SelectItem>
              <SelectItem value="cheap">Евтино ($)</SelectItem>
              <SelectItem value="moderate">Умерено ($$)</SelectItem>
              <SelectItem value="expensive">Скъпо ($$$)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleApplyFilters} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          Приложи филтри
        </Button>
      </CardContent>
    </Card>
  );
}

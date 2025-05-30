
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ListFilter, X, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the structure for categorized services
interface CategorizedService {
  category: string;
  services: { id: string; name: string }[];
}

interface FilterSidebarProps {
  onFilterChange: (filters: Record<string, any>) => void;
  cities: string[];
  // Updated serviceTypes prop to be an array of CategorizedService
  serviceTypes: CategorizedService[];
}

const ALL_CITIES_VALUE = "--all-cities--";
const ALL_SERVICES_VALUE = "--all-services--";
const DEFAULT_MIN_PRICE = 0; 
const DEFAULT_MAX_PRICE = 500; 
const ALL_CATEGORIES_VALUE = "--all-categories--";

export function FilterSidebar({ onFilterChange, cities, serviceTypes }: FilterSidebarProps) {
  const [location, setLocation] = useState(ALL_CITIES_VALUE);
  const [serviceType, setServiceType] = useState(ALL_SERVICES_VALUE);
  const [rating, setRating] = useState([0]); 
  const [maxPriceValue, setMaxPriceValue] = useState<[number]>([DEFAULT_MIN_PRICE]); // Default to 0
  const [cityPopoverOpen, setCityPopoverOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES_VALUE);
  const [selectedService, setSelectedService] = useState(ALL_SERVICES_VALUE);

  const handleApplyFilters = () => {
    onFilterChange({
      location,
      category: selectedCategory === ALL_CATEGORIES_VALUE ? undefined : selectedCategory,
      serviceId: selectedService === ALL_SERVICES_VALUE ? undefined : selectedService,
      minRating: rating[0],
      maxPrice: maxPriceValue[0] === DEFAULT_MIN_PRICE ? DEFAULT_MAX_PRICE : maxPriceValue[0],
    });
  };

  const handleClearFilters = () => {
    setLocation(ALL_CITIES_VALUE);
    setSelectedCategory(ALL_CATEGORIES_VALUE);
    setSelectedService(ALL_SERVICES_VALUE);
    setRating([0]);
    setMaxPriceValue([DEFAULT_MIN_PRICE]); // Reset to 0
    onFilterChange({
      location: ALL_CITIES_VALUE,
      category: undefined,
      serviceId: undefined,
      minRating: 0,
      maxPrice: DEFAULT_MAX_PRICE, // Send DEFAULT_MAX_PRICE to signify "any price"
    });
  };
  
  const getCityLabel = (value: string) => {
    if (value === ALL_CITIES_VALUE) return "Всички градове";
    return cities.find(city => city === value) || "Изберете град";
  }

  const priceLabel = maxPriceValue[0] === DEFAULT_MIN_PRICE 
    ? "Всякаква цена" 
    : `До ${maxPriceValue[0]} лв.`;

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
          <Label htmlFor="location-filter" className="text-sm font-medium">Местоположение (Град)</Label>
          <Popover open={cityPopoverOpen} onOpenChange={setCityPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                id="location-filter"
                variant="outline"
                role="combobox"
                aria-expanded={cityPopoverOpen}
                className="w-full justify-between"
              >
                {getCityLabel(location)}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Търсете град..." />
                <CommandList>
                  <CommandEmpty>Няма намерен град.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value={ALL_CITIES_VALUE}
                      onSelect={() => {
                        setLocation(ALL_CITIES_VALUE);
                        setCityPopoverOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          location === ALL_CITIES_VALUE ? "opacity-100" : "opacity-0"
                        )}
                      />
                      Всички градове
                    </CommandItem>
                    {cities.map((city) => (
                      <CommandItem
                        key={city}
                        value={city}
                        onSelect={(currentValue) => {
                          setLocation(currentValue === location ? ALL_CITIES_VALUE : currentValue);
                          setCityPopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            location === city ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {city}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
            step={10} // You can adjust the step for price
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

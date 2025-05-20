
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ListFilter, X, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [cityPopoverOpen, setCityPopoverOpen] = useState(false);

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
    onFilterChange({
      location: ALL_CITIES_VALUE,
      serviceType: ALL_SERVICES_VALUE,
      minRating: 0,
      priceRange: ANY_PRICE_VALUE,
    });
  };
  
  const getCityLabel = (value: string) => {
    if (value === ALL_CITIES_VALUE) return "Всички градове";
    return cities.find(city => city === value) || "Изберете град";
  }

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
                      onSelect={(currentValue) => {
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

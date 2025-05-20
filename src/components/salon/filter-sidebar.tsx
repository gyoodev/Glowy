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

export function FilterSidebar({ onFilterChange, cities, serviceTypes }: FilterSidebarProps) {
  const [location, setLocation] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [rating, setRating] = useState([0]);
  const [priceRange, setPriceRange] = useState('');

  const handleApplyFilters = () => {
    onFilterChange({
      location,
      serviceType,
      minRating: rating[0],
      priceRange,
    });
  };

  const handleClearFilters = () => {
    setLocation('');
    setServiceType('');
    setRating([0]);
    setPriceRange('');
    onFilterChange({});
  };

  return (
    <Card className="sticky top-20 shadow-lg rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center">
          <ListFilter className="mr-2 h-5 w-5 text-primary" />
          Filters
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-sm">
          <X className="mr-1 h-4 w-4" /> Clear
        </Button>
      </CardHeader>
      <CardContent className="space-y-6 p-4">
        <div>
          <Label htmlFor="location" className="text-sm font-medium">Location (City)</Label>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger id="location">
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Cities</SelectItem>
              {cities.map(city => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="serviceType" className="text-sm font-medium">Service Type</Label>
          <Select value={serviceType} onValueChange={setServiceType}>
            <SelectTrigger id="serviceType">
              <SelectValue placeholder="Select service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Services</SelectItem>
               {serviceTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="rating" className="text-sm font-medium">Minimum Rating: {rating[0] === 0 ? 'Any' : `${rating[0]}+ Stars`}</Label>
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
          <Label htmlFor="priceRange" className="text-sm font-medium">Price Range</Label>
          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger id="priceRange">
              <SelectValue placeholder="Select price range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any Price</SelectItem>
              <SelectItem value="cheap">Cheap ($)</SelectItem>
              <SelectItem value="moderate">Moderate ($$)</SelectItem>
              <SelectItem value="expensive">Expensive ($$$)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleApplyFilters} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  );
}

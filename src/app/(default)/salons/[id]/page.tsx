'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import type { Salon, Service } from '@/types';
import { getSalonById } from '@/lib/mock-data';
import { ServiceListItem } from '@/components/salon/service-list-item';
import { ReviewCard } from '@/components/salon/review-card';
import { BookingCalendar } from '@/components/booking/booking-calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Phone, ThumbsUp, MessageSquare, Sparkles, Image as ImageIcon, CalendarDays, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';

export default function SalonProfilePage() {
  const params = useParams();
  const salonId = params.id as string;
  const [salon, setSalon] = useState<Salon | null>(null);
  const [selectedService, setSelectedService] = useState<Service | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    if (salonId) {
      // Simulate API call
      const fetchedSalon = getSalonById(salonId);
      setTimeout(() => { // Simulate loading
        if (fetchedSalon) {
          setSalon(fetchedSalon);
        } else {
          // Handle salon not found, e.g. redirect or show error
          console.error("Салонът не е намерен");
        }
      }, 500);
    }
  }, [salonId]);

  const handleBookService = (serviceId: string) => {
    const service = salon?.services.find(s => s.id === serviceId);
    setSelectedService(service);
    toast({
        title: "Услугата е избрана",
        description: `${service?.name} е добавена към календара за резервации. Моля, изберете дата и час.`,
    });
    const calendarElement = document.getElementById("booking-calendar-section");
    calendarElement?.scrollIntoView({ behavior: "smooth" });
  };

  if (!salon) {
    return (
      <div className="container mx-auto py-10 px-6">
        <Skeleton className="h-64 w-full rounded-lg mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const priceRangeTranslations = {
    cheap: 'евтино',
    moderate: 'умерено',
    expensive: 'скъпо',
  };

  return (
    <div className="bg-background">
      <div className="relative h-64 md:h-96 w-full group">
        <Image
          src={salon.heroImage}
          alt={`Hero image for ${salon.name}`}
          layout="fill"
          objectFit="cover"
          priority
          data-ai-hint="salon ambiance luxury"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white p-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">{salon.name}</h1>
            <p className="text-lg md:text-xl mt-2 max-w-2xl mx-auto">{salon.description.substring(0,100)}...</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-10 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-6 p-6 bg-card rounded-lg shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <div className="flex items-center mb-1">
                    <Star className="h-6 w-6 text-yellow-400 fill-yellow-400 mr-2" />
                    <span className="text-2xl font-bold">{salon.rating.toFixed(1)}</span>
                    <span className="ml-2 text-muted-foreground">({salon.reviews.length} отзива)</span>
                  </div>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <MapPin className="h-4 w-4 mr-1.5 text-primary" /> {salon.address}
                  </div>
                </div>
                <Badge variant={salon.priceRange === 'expensive' ? 'destructive' : salon.priceRange === 'moderate' ? 'secondary' : 'outline'} className="capitalize text-sm mt-2 sm:mt-0 py-1 px-3">
                  {priceRangeTranslations[salon.priceRange] || salon.priceRange}
                </Badge>
              </div>
              <p className="text-foreground leading-relaxed">{salon.description}</p>
            </div>

            <Tabs defaultValue="services" className="mb-8">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="services"><Sparkles className="mr-2 h-4 w-4" />Услуги</TabsTrigger>
                <TabsTrigger value="reviews"><MessageSquare className="mr-2 h-4 w-4" />Отзиви</TabsTrigger>
                <TabsTrigger value="gallery"><ImageIcon className="mr-2 h-4 w-4" />Галерия</TabsTrigger>
              </TabsList>

              <TabsContent value="services" className="bg-card p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4 text-foreground flex items-center">
                  <Sparkles className="mr-2 h-6 w-6 text-primary" /> Нашите Услуги
                </h2>
                <div className="space-y-1">
                  {salon.services.map(service => (
                    <ServiceListItem key={service.id} service={service} onBook={handleBookService} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="bg-card p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4 text-foreground flex items-center">
                  <ThumbsUp className="mr-2 h-6 w-6 text-primary" /> Отзиви от Клиенти
                </h2>
                {salon.reviews.length > 0 ? (
                  <div className="space-y-6">
                    {salon.reviews.map(review => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Все още няма отзиви. Бъдете първият, който ще остави отзив!</p>
                )}
              </TabsContent>
              
              <TabsContent value="gallery" className="bg-card p-6 rounded-lg shadow-md">
                 <h2 className="text-2xl font-semibold mb-4 text-foreground flex items-center">
                  <ImageIcon className="mr-2 h-6 w-6 text-primary" /> Фото Галерия
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {salon.photos.map((photo, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden shadow-md hover:scale-105 transition-transform duration-300">
                            <Image src={photo} alt={`${salon.name} снимка от галерия ${index + 1}`} layout="fill" objectFit="cover" data-ai-hint="salon style haircut" />
                        </div>
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <aside className="lg:col-span-1 space-y-8 sticky top-20">
             <div id="booking-calendar-section">
              <BookingCalendar 
                salonName={salon.name} 
                serviceName={selectedService?.name}
                availability={salon.availability}
              />
            </div>
            <div className="bg-card p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center"><Info className="mr-2 h-5 w-5 text-primary"/>Информация за Салона</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-primary"/> {salon.address}</li>
                <li className="flex items-center"><Phone className="h-4 w-4 mr-2 text-primary"/> (123) 456-7890 (Примерен)</li>
                <li className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-primary"/> Пон - Съб: 9:00 - 19:00</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

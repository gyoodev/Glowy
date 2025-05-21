
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Salon, Service } from '@/types';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { ServiceListItem } from '@/components/salon/service-list-item';
import { ReviewCard } from '@/components/salon/review-card';
import { AddReviewForm } from '@/components/salon/AddReviewForm';
import { BookingCalendar } from '@/components/booking/booking-calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Phone, ThumbsUp, MessageSquare, Sparkles, Image as ImageIcon, CalendarDays, Info, Clock, Scissors } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { createBooking, auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { sendReviewReminderEmail } from '@/app/actions/notificationActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';

export default function SalonProfilePage() {
  const params = useParams();
  const slugParam = params.slug;

  const [salon, setSalon] = useState<Salon | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | undefined>(undefined);
  const { toast } = useToast();
  const [selectedBookingDate, setSelectedBookingDate] = useState<Date | undefined>(undefined);
  const [selectedBookingTime, setSelectedBookingTime] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = getFirestore();

  useEffect(() => {
    let currentSlug: string | undefined;
    if (typeof slugParam === 'string') {
      currentSlug = slugParam;
    } else if (Array.isArray(slugParam) && slugParam.length > 0) {
      currentSlug = slugParam[0];
    } else {
      // Handle cases where slugParam might be undefined or an empty array
      currentSlug = undefined;
    }

    const fetchSalonBySlug = async (slugToFetch: string) => {
      setIsLoading(true);
      setSalon(null); 
      const salonNameFromSlug = slugToFetch.replace(/[_-]/g, ' ');
      console.log("[SalonProfilePage] Fetching salon for slug:", slugToFetch, "Derived name:", salonNameFromSlug);

      try {
        const salonsCollectionRef = collection(firestore, 'salons');
        const q = query(salonsCollectionRef, where('name', '==', salonNameFromSlug), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const salonDoc = querySnapshot.docs[0];
          let salonData = { id: salonDoc.id, ...salonDoc.data() } as Salon;
          // Ensure arrays exist to prevent runtime errors
          salonData.services = salonData.services || [];
          salonData.reviews = salonData.reviews || [];
          salonData.photos = salonData.photos || [];
          setSalon(salonData);
          console.log("[SalonProfilePage] Salon found:", salonData);
        } else {
          console.error("[SalonProfilePage] Salon not found in Firestore for derived name:", salonNameFromSlug);
          setSalon(null);
        }
      } catch (error) {
        console.error("[SalonProfilePage] Error fetching salon from Firestore:", error);
        setSalon(null);
        toast({
          title: "Грешка при зареждане",
          description: "Неуспешно зареждане на информацията за салона.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (currentSlug) {
      fetchSalonBySlug(currentSlug);
    } else {
      console.log("[SalonProfilePage] No valid slug provided, cannot fetch salon.");
      setSalon(null);
      setIsLoading(false);
    }
  }, [slugParam, firestore, toast]);

  const handleBookService = (serviceId: string) => {
    const service = salon?.services?.find(s => s.id === serviceId);
    if (service) {
        setSelectedService(service);
        toast({
            title: "Услугата е избрана",
            description: `${service.name} е добавена към календара за резервации. Моля, изберете дата и час.`,
        });
        const calendarElement = document.getElementById("booking-calendar-section");
        calendarElement?.scrollIntoView({ behavior: "smooth" });
    } else {
        toast({
            title: "Грешка",
            description: "Избраната услуга не е намерена.",
            variant: "destructive",
        });
    }
  };

  const handleTimeSelected = (date: Date | undefined, time: string | undefined) => {
    setSelectedBookingDate(date);
    setSelectedBookingTime(time);
  };

  const handleConfirmBooking = async () => {
    if (!auth.currentUser) {
      toast({
        title: "Не сте влезли",
        description: "Моля, влезте в профила си, за да направите резервация.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedService || !selectedBookingDate || !selectedBookingTime || !salon) {
      toast({
        title: "Непълна информация за резервация",
        description: "Моля, изберете салон, услуга, дата и час.",
        variant: "destructive",
      });
      return;
    }

    const bookingSalonName = salon.name;
    const bookingServiceName = selectedService.name;
    const bookingDate = new Date(selectedBookingDate);
    const bookingTime = selectedBookingTime;
    const localSelectedService = selectedService; // To satisfy TypeScript within this scope

    try {
      const userId = auth.currentUser.uid;
      await createBooking({
        salonId: salon.id,
        salonName: bookingSalonName,
        userId: userId,
        serviceId: localSelectedService.id, // Use local variable
        serviceName: bookingServiceName,
        date: bookingDate.toISOString(), // Store as ISO string
        time: bookingTime,
      });

      toast({
        title: "Резервацията е потвърдена!",
        description: `Успешно резервирахте ${bookingServiceName} за ${bookingDate.toLocaleDateString('bg-BG')} в ${bookingTime}.`,
      });

      const [hours, minutes] = bookingTime.split(':').map(Number);
      const bookingDateTime = new Date(bookingDate); // Use the original bookingDate which is a Date object
      bookingDateTime.setHours(hours, minutes, 0, 0);
      
      const reminderDateTime = new Date(bookingDateTime.getTime() + 60 * 60 * 1000); // 1 hour after booking
      const now = new Date();
      const delay = reminderDateTime.getTime() - now.getTime();

      if (delay > 0) {
        setTimeout(async () => {
          try {
            await sendReviewReminderEmail({
              salonName: bookingSalonName,
              serviceName: bookingServiceName,
              bookingDate: bookingDateTime.toLocaleDateString('bg-BG'),
              bookingTime: bookingTime,
            });
            toast({
              title: "Покана за отзив изпратена",
              description: `Тъй като резервацията Ви в ${bookingSalonName} за ${bookingServiceName} приключи, Ви изпратихме покана по имейл да оставите отзив.`,
              variant: "default",
              duration: 7000,
            });
          } catch (emailError) {
            console.error("Error sending review reminder email:", emailError);
            toast({
                title: "Грешка при изпращане на покана за отзив",
                description: "Възникна грешка при опита за изпращане на покана за отзив по имейл.",
                variant: "destructive",
            });
          }
        }, delay);
        toast({
          title: "Напомняне за отзив е насрочено",
          description: `Ще получите покана да оставите отзив 1 час след Вашата резервация в ${bookingSalonName}.`,
          variant: "default",
          duration: 6000,
        });
      } else {
        console.log("[SalonProfilePage] Review reminder time for this booking is in the past. Not scheduling delayed reminder.");
      }
      setSelectedService(undefined);
      setSelectedBookingDate(undefined);
      setSelectedBookingTime(undefined);
    } catch (error) {
      console.error("[SalonProfilePage] Error creating booking:", error);
      toast({
        title: "Възникна грешка при резервацията",
        description: "Моля, опитайте отново по-късно.",
        variant: "destructive",
      });
    }
  };

  const handleAddReview = async (rating: number, comment: string) => {
    if (!auth.currentUser) {
      toast({
        title: "Не сте влезли",
        description: "Моля, влезте в профила си, за да оставите отзив.",
        variant: "destructive",
      });
      return;
    }
    if (!salon) {
      toast({
        title: "Грешка",
        description: "Няма информация за салона.",
        variant: "destructive",
      });
      return;
    }

    try {
      const userId = auth.currentUser.uid;
      const newReview = {
        id: Date.now().toString(), // Simple unique ID for mock data
        userName: auth.currentUser.displayName || 'Анонимен потребител', // Use display name or a default
        rating: rating,
        comment: comment,
        date: new Date().toISOString(),
        userAvatar: auth.currentUser.photoURL || 'https://placehold.co/40x40.png', // Use photoURL or a default
        userId: userId,
      };

      // In a real application, you would add this to a 'reviews' collection
      // and update the salon's average rating and review count separately
      // For this example, we'll just update the local state as if it were added.
      const updatedSalon = { ...salon, reviews: [...(salon.reviews || []), newReview] };
      setSalon(updatedSalon);

      setShowReviewForm(false);
      toast({
        title: "Отзивът е добавен!",
        description: "Благодарим за Вашия отзив.",
      });
    } catch (error) {
      console.error("Error adding review:", error);
      toast({
        title: "Възникна грешка при добавяне на отзив",
        description: "Моля, опитайте отново по-късно.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
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

  if (!salon) {
    return (
        <div className="container mx-auto py-10 px-6 text-center flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <MapPin className="w-16 h-16 text-destructive mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">Салонът не е намерен</h1>
            <p className="text-lg text-muted-foreground mb-6">Изглежда, че салонът, който търсите, не съществува или адресът е грешен.</p>
            <Button asChild size="lg">
                <Link href="/">Обратно към всички салони</Link>
            </Button>
        </div>
    );
  }

  const priceRangeTranslations: Record<string, string> = {
    cheap: 'евтино',
    moderate: 'умерено',
    expensive: 'скъпо',
  };
  
  return (
    <div className="bg-background">
      <div className="relative h-64 md:h-96 w-full group">
        <Image
          src={salon.heroImage || 'https://placehold.co/1200x400.png'}
          alt={`Hero image for ${salon.name}`}
          layout="fill"
          objectFit="cover"
          priority
          data-ai-hint="salon ambiance luxury"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white p-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">{salon.name}</h1>
            <p className="text-lg md:text-xl mt-2 max-w-2xl mx-auto">{salon.description?.substring(0,100)}...</p>
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
                    <span className="text-2xl font-bold">{salon.rating?.toFixed(1) ?? 'N/A'}</span>
                    <span className="ml-2 text-muted-foreground">({salon.reviews?.length ?? 0} отзива)</span>
                  </div>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <MapPin className="h-4 w-4 mr-1.5 text-primary" /> {salon.address}
                  </div>
                </div>
                {salon.priceRange && (
                    <Badge variant={salon.priceRange === 'expensive' ? 'destructive' : salon.priceRange === 'moderate' ? 'secondary' : 'outline'} className="capitalize text-sm mt-2 sm:mt-0 py-1 px-3">
                    {priceRangeTranslations[salon.priceRange] || salon.priceRange}
                    </Badge>
                )}
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
                  {salon.services && salon.services.length > 0 ? salon.services.map(service => (
                    <ServiceListItem key={service.id} service={service} onBook={handleBookService} />
                  )) : <p className="text-muted-foreground">Все още няма добавени услуги за този салон.</p>}
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="bg-card p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4 text-foreground flex items-center">
                  <ThumbsUp className="mr-2 h-6 w-6 text-primary" /> Отзиви от Клиенти
                </h2>
                {salon.reviews && salon.reviews.length > 0 ? (
                  <div className="space-y-6">
                    {salon.reviews.map(review => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Все още няма отзиви. Бъдете първият, който ще остави отзив!</p>
                )}
                <div className="mt-6 text-center">
                  <Button variant="outline" onClick={() => { /* TODO: Implement add review functionality */ }} data-ai-hint="Add review button">Добави Отзив</Button>
                </div>
              </TabsContent>

              <TabsContent value="gallery" className="bg-card p-6 rounded-lg shadow-md">
                 <h2 className="text-2xl font-semibold mb-4 text-foreground flex items-center">
                  <ImageIcon className="mr-2 h-6 w-6 text-primary" /> Фото Галерия
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {salon.photos && salon.photos.length > 0 ? salon.photos.map((photo, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden shadow-md hover:scale-105 transition-transform duration-300">
                            <Image src={photo} alt={`${salon.name} снимка от галерия ${index + 1}`} layout="fill" objectFit="cover" data-ai-hint="salon style haircut" />
                        </div>
                    )) : <p className="text-muted-foreground col-span-full text-center">Няма добавени снимки в галерията.</p> }
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <aside className="lg:col-span-1 space-y-8 sticky top-20">
             <div id="booking-calendar-section">
              <BookingCalendar
                salonName={salon.name}
                serviceName={selectedService?.name}
                availability={salon.availability || {}}
                onTimeSelect={handleTimeSelected}
              />
            </div>

            {selectedService && selectedBookingDate && selectedBookingTime && (
              <Card className="shadow-md mb-4 border-primary bg-secondary/30">
                <CardHeader className="pb-3 pt-4">
                  <CardTitle className="text-lg text-primary-foreground flex items-center">
                    <Info className="mr-2 h-5 w-5" />
                    Вашата Резервация
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2 text-secondary-foreground">
                  <div className="flex items-center">
                    <Scissors className="mr-2 h-4 w-4 text-primary" />
                    <span className="font-medium">Услуга:</span>&nbsp;{selectedService.name}
                  </div>
                  <div className="flex items-center">
                    <CalendarDays className="mr-2 h-4 w-4 text-primary" />
                    <span className="font-medium">Дата:</span>&nbsp;{format(selectedBookingDate, "PPP", { locale: bg })}
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-primary" />
                    <span className="font-medium">Час:</span>&nbsp;{selectedBookingTime}
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedService && selectedBookingDate && selectedBookingTime && (
              <Button
                onClick={handleConfirmBooking}
                className="w-full py-6 text-lg font-semibold"
                disabled={!auth.currentUser}
              >
                {auth.currentUser ?
                  "Запази час"
                  : "Влезте за да резервирате"
                }
              </Button>
            )}
            <div className="bg-card p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center"><Info className="mr-2 h-5 w-5 text-primary"/>Информация за Салона</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-primary"/> {salon.address || 'Няма предоставен адрес'}</li>
                <li className="flex items-center"><Phone className="h-4 w-4 mr-2 text-primary"/> {salon.phone || 'Няма предоставен телефон'}</li>
                <li className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-primary"/> { salon.workingHours || 'Няма предоставено работно време'}</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

    
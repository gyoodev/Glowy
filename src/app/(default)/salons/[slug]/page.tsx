
'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Review, Salon, Service, UserProfile } from '@/types';
import { getFirestore, collection, query, where, getDocs, limit, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import { ServiceListItem } from '@/components/salon/service-list-item';
import { ReviewCard } from '@/components/salon/review-card';
import AddReviewForm from '@/components/salon/AddReviewForm';
import { BookingCalendar } from '@/components/booking/booking-calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Phone, ThumbsUp, MessageSquare, Sparkles, Image as ImageIcon, CalendarDays, Info, Clock, Scissors, Gift } from 'lucide-react';
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
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [selectedService, setSelectedService] = useState<Service | undefined>(undefined);
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isSalonOwner, setIsSalonOwner] = useState(false);
  const [selectedBookingDate, setSelectedBookingDate] = useState<Date | undefined>(undefined);
  const [selectedBookingTime, setSelectedBookingTime] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = getFirestore();
  const reminderTimeoutId = useRef<NodeJS.Timeout | null>(null);

  const fetchUserReviews = async () => {
    if (!auth.currentUser || !salon?.id) {
        setUserReviews([]);
        return;
    }
    try {
        console.log(`[SalonProfilePage] Fetching user reviews for salonId: ${salon.id} and userId: ${auth.currentUser.uid}`);
        const reviewsCollectionRef = collection(firestore, 'reviews');
        const q = query(
            reviewsCollectionRef,
            where('salonId', '==', salon.id),
            where('userId', '==', auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const reviewsData = querySnapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        })) as Review[];
        console.log("[SalonProfilePage] User reviews found:", reviewsData);
        setUserReviews(reviewsData);
    } catch (error) {
        console.error("[SalonProfilePage] Error fetching user reviews:", error);
        setUserReviews([]);
    }
  };


  useEffect(() => {
    let currentSlug: string | undefined;
    if (typeof slugParam === 'string') {
      currentSlug = slugParam;
    } else if (Array.isArray(slugParam) && slugParam.length > 0) {
      currentSlug = slugParam[0];
    } else {
      currentSlug = undefined;
    }

    const salonNameFromSlug = currentSlug ? currentSlug.replace(/_/g, ' ') : undefined;
    console.log("[SalonProfilePage] Derived salonNameFromSlug:", salonNameFromSlug);


    const fetchSalonBySlug = async (name: string) => {
      setIsLoading(true);
      setSalon(null);
      console.log("[SalonProfilePage] Fetching salon from Firestore for name:", name);

      try {
        const salonsCollectionRef = collection(firestore, 'salons');
        const q = query(salonsCollectionRef, where('name', '==', name), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const salonDoc = querySnapshot.docs[0];
          let salonData = { id: salonDoc.id, ...salonDoc.data() } as Salon;

          salonData.services = salonData.services || [];
          salonData.reviews = salonData.reviews || [];
          salonData.photos = salonData.photos || [];

          setSalon(salonData);
          console.log("[SalonProfilePage] Salon found in Firestore:", salonData);
        } else {
          console.error("[SalonProfilePage] Salon not found in Firestore for name:", name);
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

    if (salonNameFromSlug) {
      fetchSalonBySlug(salonNameFromSlug);
    } else {
      console.log("[SalonProfilePage] No valid salon name from slug, cannot fetch salon.");
      setSalon(null);
      setIsLoading(false);
    }

    return () => {
      if (reminderTimeoutId.current) {
        clearTimeout(reminderTimeoutId.current);
      }
    };
  }, [slugParam, firestore, toast]);

  useEffect(() => {
    const fetchUserRoleAndCheckOwnership = async () => {
      if (!auth.currentUser || !salon) {
        setUserRole(null);
        setIsSalonOwner(false);
        return;
      }

      try {
        const userDocRef = doc(firestore, 'users', auth.currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserProfile;
          setUserRole(userData.role || null);
          setIsSalonOwner(salon.ownerId === auth.currentUser.uid);
        } else {
          console.warn("[SalonProfilePage] User document not found for current user:", auth.currentUser.uid);
          setUserRole(null);
          setIsSalonOwner(false);
        }
      } catch (error) {
        console.error("[SalonProfilePage] Error fetching user role or checking ownership:", error);
        setUserRole(null);
        setIsSalonOwner(false);
      }
    };

    if(salon) {
      fetchUserRoleAndCheckOwnership();
    }
  }, [salon, firestore]);

  useEffect(() => {
    if(salon?.id && auth.currentUser) {
        fetchUserReviews();
    }
  }, [salon?.id, auth.currentUser, firestore]); // Added auth.currentUser dependency

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
    const localSelectedService = selectedService;

    try {
      const userId = auth.currentUser.uid;
      await createBooking({
        salonId: salon.id,
        salonName: bookingSalonName,
        userId: userId,
        service: {
            id: localSelectedService.id,
            name: bookingServiceName,
            price: localSelectedService.price,
            duration: localSelectedService.duration,
            description: localSelectedService.description, // Ensure description is passed if needed by createBooking
        },
        date: bookingDate.toISOString(),
        time: bookingTime,
      });

      toast({
        title: "Резервацията е потвърдена!",
        description: `Успешно резервирахте ${bookingServiceName} за ${bookingDate.toLocaleDateString('bg-BG')} в ${bookingTime}.`,
      });

      const [hours, minutes] = bookingTime.split(':').map(Number);
      const bookingDateTime = new Date(bookingDate);
      bookingDateTime.setHours(hours, minutes, 0, 0);

      const reminderDateTime = new Date(bookingDateTime.getTime() + 60 * 60 * 1000);
      const now = new Date();
      const delay = reminderDateTime.getTime() - now.getTime();

      if (delay > 0) {
        if (reminderTimeoutId.current) {
          clearTimeout(reminderTimeoutId.current);
        }
        reminderTimeoutId.current = setTimeout(async () => {
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
            console.error("[SalonProfilePage] Error sending review reminder email:", emailError);
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

  const handleReviewSubmit = async (rating: number, comment: string) => {
    console.log("[SalonProfilePage] auth.currentUser:", auth.currentUser);
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
      const userDisplayName = auth.currentUser.displayName || 'Анонимен потребител';
      const userAvatarUrl = auth.currentUser.photoURL || 'https://placehold.co/40x40.png';

      console.log(`[SalonProfilePage] Submitting review for salonId: ${salon.id} by userId: ${userId}`);
      const newReview = {
        userName: userDisplayName,
        rating: rating,
        comment: comment,
        date: new Date().toISOString(),
        userAvatar: userAvatarUrl,
        userId: userId,
        salonId: salon.id,
      };

      console.log("[SalonProfilePage] Review object to be added:", newReview);
      const reviewsCollectionRef = collection(firestore, 'reviews');
      const docRef = await addDoc(reviewsCollectionRef, newReview);
      console.log("[SalonProfilePage] Review added with ID:", docRef.id);

      // Re-fetch salon data to update reviews and rating
      const salonDocRefToUpdate = doc(firestore, 'salons', salon.id);
      const salonSnapToUpdate = await getDoc(salonDocRefToUpdate);
      if (salonSnapToUpdate.exists()) {
        let updatedSalonData = { id: salonSnapToUpdate.id, ...salonSnapToUpdate.data() } as Salon;
        
        const allReviewsQuery = query(collection(firestore, 'reviews'), where('salonId', '==', salon.id));
        const allReviewsSnapshot = await getDocs(allReviewsQuery);
        const allSalonReviews = allReviewsSnapshot.docs.map(reviewDoc => ({ id: reviewDoc.id, ...reviewDoc.data() })) as Review[];
        
        updatedSalonData.reviews = allSalonReviews; // Assign all reviews
        if (allSalonReviews.length > 0) {
            const totalRating = allSalonReviews.reduce((acc, rev) => acc + rev.rating, 0);
            updatedSalonData.rating = totalRating / allSalonReviews.length;
        } else {
             updatedSalonData.rating = 0;
        }
        
        // Update salon document in Firestore with new rating and reviews array
        await updateDoc(salonDocRefToUpdate, {
            rating: updatedSalonData.rating,
            // Storing the full review objects or just their IDs in the salon document depends on your data model.
            // If storing full objects, ensure they are serializable and don't grow too large.
            // For simplicity here, assuming you might be storing review IDs or a small summary.
            // If you store full reviews, this part is correct. Otherwise, adjust.
            reviews: allSalonReviews.map(r => ({ // Example: storing a reference or a subset of fields
                id: r.id,
                userName: r.userName,
                rating: r.rating,
                comment: r.comment.substring(0,100), // Example: store a snippet
                date: r.date,
                userAvatar: r.userAvatar
            }))
        });
        setSalon(updatedSalonData); // Update local state
      }


      fetchUserReviews();
      setShowReviewForm(false);

      toast({
        title: "Отзивът е добавен!",
        description: "Благодарим за Вашия отзив.",
      });
    } catch (error) {
      console.error("[SalonProfilePage] Error adding review:", error);
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
            <p className="text-lg text-muted-foreground mb-6">Изглежда, че салонът, който търсите, не съществува или адресът е грешен. Моля, проверете конзолата за повече информация относно името на салона.</p>
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
                    <MapPin className="h-4 w-4 mr-1.5 text-primary" /> {salon.address || 'Няма предоставен адрес'}
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
                 {auth.currentUser && (
                    <div className="mt-6">
                    {showReviewForm ? (
                        <AddReviewForm
                        onAddReview={handleReviewSubmit}
                        onCancel={() => setShowReviewForm(false)}
                        />
                    ) : (
                        <Button
                        variant="outline"
                        onClick={() => setShowReviewForm(true)}
                        data-ai-hint="Add review button"
                        className="w-full"
                        >
                        Добави Отзив
                        </Button>
                    )}
                    </div>
                )}
                 {auth.currentUser && userReviews.length > 0 && (
                    <div className="mt-8 bg-card p-6 rounded-lg shadow-md">
                         <h2 className="text-2xl font-semibold mb-4 text-foreground flex items-center">
                            <ThumbsUp className="mr-2 h-6 w-6 text-primary" /> Вашите Отзиви
                         </h2>
                         <div className="space-y-6">
                            {userReviews.map(review => (
                                <ReviewCard key={review.id} review={review} />
                            ))}
                         </div>
                    </div>
                  )}
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

            {(userRole === 'business' && isSalonOwner) && (
              <Card className="shadow-md mb-4 border-primary bg-yellow-100/30">
                <CardHeader className="pb-3 pt-4">
                  <CardTitle className="text-lg text-primary-foreground flex items-center">
                    <Gift className="mr-2 h-5 w-5" />
                    Рекламирайте Вашия Салон
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2 text-secondary-foreground">
                  <p>Искате ли Вашият салон да достигне до повече клиенти? Възползвайте се от нашата VIP/Промотирана услуга!</p>
                  <Button variant="default" className="mt-2">Научете повече / Активирайте</Button>
                </CardContent>
              </Card>
            )}
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
                {auth.currentUser ? "Запази час" : "Влезте за да резервирате"}
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

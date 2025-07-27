

'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import type { Review, Salon, Service, UserProfile, WorkingHoursStructure } from '@/types';
import dynamic from 'next/dynamic';
import { getFirestore, collection, query, where, getDocs, limit, doc, getDoc, addDoc, updateDoc, Timestamp, orderBy, arrayUnion, arrayRemove, startAfter } from 'firebase/firestore';
import { ReviewCard } from '@/components/salon/review-card';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Phone, ThumbsUp, MessageSquare, Sparkles, Image as ImageIcon, CalendarDays, Info, Clock, Scissors, Gift, Heart, AlertTriangle, HeartOff, Euro } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { createBooking, auth, getUserProfile, firestore as db } from '@/lib/firebase';
import { mapSalon } from '@/utils/mappers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, formatDistanceToNow, isFuture, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { bg } from 'date-fns/locale';
import { ServiceListItem } from '@/components/salon/service-list-item';
import Image from 'next/image';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';


const BookingCalendar = dynamic(() => import('@/components/booking/booking-calendar'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-64 rounded-lg" />,
});

const AddReviewForm = dynamic(() => import('@/components/salon/AddReviewForm'), { 
  loading: () => <Skeleton className="h-40 w-full rounded-lg" />,
 });
 const SalonGallery = dynamic(() => import('@/components/salon/SalonGallery'), {
   loading: () => <Skeleton className="w-full aspect-video rounded-lg" />,
 });

 const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), { 
  loading: () => <Skeleton className="h-[400px] w-full rounded-lg" />,
  ssr: false
});

const daysOrder: (keyof WorkingHoursStructure)[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const dayTranslations: Record<string, string> = {
  monday: "Понеделник",
  tuesday: "Вторник",
  wednesday: "Сряда",
  thursday: "Четвъртък",
  friday: "Петък",
  saturday: "Събота",
  sunday: "Неделя",
};

function generateSalonJsonLd(salon: Salon) {
    if (!salon) return null;

    const daysOrderForSchema: Record<string, string> = {
        monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday",
        friday: "Friday", saturday: "Saturday", sunday: "Sunday",
    };

    const openingHoursSpecification = daysOrder.map(dayKey => {
        const dayInfo = salon.workingHours?.[dayKey];
        if (!dayInfo || dayInfo.isOff || !dayInfo.open || !dayInfo.close) return null;
        return {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": `https://schema.org/${daysOrderForSchema[dayKey]}`,
            "opens": dayInfo.open,
            "closes": dayInfo.close,
        };
    }).filter(Boolean);

    const schema = {
        "@context": "https://schema.org",
        "@type": "BeautySalon",
        "name": salon.name,
        "image": salon.heroImage || 'https://placehold.co/1200x400.png',
        "address": {
            "@type": "PostalAddress",
            "streetAddress": salon.address || 'Няма предоставен адрес',
            "addressRegion": salon.region || undefined,
            "addressLocality": salon.city || 'Не е посочен град',
        },
        "telephone": salon.phoneNumber || undefined,
        "openingHoursSpecification": openingHoursSpecification.length > 0 ? openingHoursSpecification : undefined,
        "priceRange": salon.priceRange ? (salon.priceRange === 'cheap' ? '$' : salon.priceRange === 'moderate' ? '$$' : '$$$') : undefined,
        "aggregateRating": salon.rating !== undefined && (salon.reviewCount || 0) > 0 ? {
            "@type": "AggregateRating",
            "ratingValue": salon.rating.toFixed(1),
            "reviewCount": (salon.reviewCount || 0).toString(),
        } : undefined,
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

export default function SalonProfilePage() {
  const params = useParams();
  const slugParam = params?.slug;

  const slug = useMemo(() => {
    if (!slugParam) return undefined;
    return Array.isArray(slugParam) ? slugParam[0] : slugParam;
  }, [slugParam]);


  const [salon, setSalon] = useState<Salon | null>(null);
  const [displayedReviews, setDisplayedReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [lastVisibleReview, setLastVisibleReview] = useState<any>(null);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [selectedService, setSelectedService] = useState<Service | undefined>(undefined);
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isSalonOwner, setIsSalonOwner] = useState(false);
  const [selectedBookingDate, setSelectedBookingDate] = useState<Date | undefined>(undefined);
  const [selectedBookingTime, setSelectedBookingTime] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = getFirestore();
  const [isFavorite, setIsFavorite] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const reminderTimeoutId = useRef<NodeJS.Timeout | null>(null);

  const salonNameToSlug = (name?: string) => name ? name.replace(/\s+/g, '_') : 'unknown-salon';

  useEffect(() => {
    const salonNameFromSlug = slug ? slug.replace(/_/g, ' ') : undefined;

    const fetchSalonByName = async (name: string) => {
      setIsLoading(true);
      setSalon(null);
      setDisplayedReviews([]);
      
      try {
        const salonsCollectionRef = collection(firestore, 'salons');
        const q = query(salonsCollectionRef, where('name', '==', name), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const salonDoc = querySnapshot.docs[0];
          let salonData = mapSalon(salonDoc.data(), salonDoc.id);
          
          salonData.services = salonData.services || [];
          salonData.photos = salonData.photos || [];
          
          setSalon(salonData);
        } else {
          setSalon(null);
          toast({
            title: "Салонът не е намерен",
            description: "Салон с име '" + name + "' не беше открит.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Грешка при зареждане",
          description: "Неуспешно зареждане на информацията за салона.",
          variant: "destructive",
        });
        setSalon(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (salonNameFromSlug) {
      fetchSalonByName(salonNameFromSlug);
    } else {
      setIsLoading(false);
    }

    return () => {
      if (reminderTimeoutId.current) {
        clearTimeout(reminderTimeoutId.current);
      }
    };
  }, [slug, firestore, toast]);

  const fetchSalonReviews = useCallback(async (salonId: string, startAfterDoc: any = null) => {
    if (!salonId) return;
    setIsLoadingReviews(true);
    try {
      const reviewsCollectionRef = collection(firestore, 'reviews');
      let q = query(
        reviewsCollectionRef,
        where('salonId', '==', salonId),
        orderBy('date', 'desc'),
        limit(10)
      );

      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
      }

      const querySnapshot = await getDocs(q);
      const reviewsData = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Review[];

      if (querySnapshot.docs.length > 0) {
        setLastVisibleReview(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
      
      setHasMoreReviews(querySnapshot.docs.length === 10);

      setDisplayedReviews(prev => startAfterDoc ? [...prev, ...reviewsData] : reviewsData);
    } catch (error) {
      console.error("[SalonProfilePage] Error fetching salon reviews:", error);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [firestore]);


   const fetchMoreReviews = useCallback(async () => {
        if (!salon?.id || isLoadingReviews || !lastVisibleReview) return;
        await fetchSalonReviews(salon.id, lastVisibleReview);
    }, [salon?.id, isLoadingReviews, lastVisibleReview, fetchSalonReviews]);

  useEffect(() => {
    const fetchUserRoleAndCheckOwnership = async () => {
      if (!auth.currentUser || !salon) {
        setUserRole(null);
        setIsSalonOwner(false);
        setIsFavorite(false);
        setUserProfile(null);
        return;
      }
      try {
        const userProfileData = await getUserProfile(auth.currentUser.uid);
        setUserProfile(userProfileData);
        if (userProfileData) {
          setUserRole(userProfileData.role || null);
          setIsSalonOwner(salon.ownerId === auth.currentUser.uid);
          setIsFavorite(userProfileData.preferences?.favoriteSalons?.includes(salon.id) || false);
        }
      } catch (error) {
        console.error("[SalonProfilePage] Error fetching user role:", error);
      }
    };

    if(salon?.id) {
       fetchSalonReviews(salon.id);
       fetchUserRoleAndCheckOwnership();
    }
  }, [salon, fetchSalonReviews]);

  const fetchUserReviews = useCallback(async () => {
    if (!auth.currentUser || !salon?.id) {
        setUserReviews([]);
        return;
    }
    try {
        const reviewsCollectionRef = collection(firestore, 'reviews');
        const q = query(reviewsCollectionRef, where('salonId', '==', salon.id), where('userId', '==', auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        setUserReviews(querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as Review[]);
    } catch (error) {
        console.error("[SalonProfilePage] Error fetching user reviews:", error);
    }
  }, [salon?.id, firestore]);

  useEffect(() => {
    if(salon?.id && auth.currentUser?.uid) { 
        fetchUserReviews();
    }
  }, [salon?.id, auth.currentUser?.uid, showReviewForm, fetchUserReviews]);

  const handleToggleFavorite = useCallback(async () => {
    if (!auth.currentUser || !salon?.id) {
      toast({ title: "Влезте в профила си", variant: "destructive" });
      return;
    }
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    try {
      const updateAction = isFavorite ? arrayRemove(salon.id) : arrayUnion(salon.id);
      await updateDoc(userDocRef, { 'preferences.favoriteSalons': updateAction });
      setIsFavorite(!isFavorite);
      toast({ title: isFavorite ? "Премахнат от любими!" : "Добавен в любими!" });
    } catch (error) {
      toast({ title: "Грешка", variant: "destructive" });
    }
  }, [auth.currentUser, salon?.id, isFavorite, toast, db]);

  const handleBookService = (serviceId: string) => {
    const service = salon?.services?.find(s => s.id === serviceId);
    if (service) {
        setSelectedService(service);
        toast({ title: "Услугата е избрана", description: `${service.name} е добавена. Моля, изберете дата и час.` });
        document.getElementById("booking-calendar-section")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleTimeSelected = (date: Date | undefined, time: string | undefined) => {
    setSelectedBookingDate(date);
    setSelectedBookingTime(time);
  };

  const handleConfirmBooking = async () => {
    if (!auth.currentUser || !selectedService || !selectedBookingDate || !selectedBookingTime || !salon) {
        toast({ title: "Непълна информация", description: "Моля, изберете услуга, дата и час, за да продължите.", variant: "destructive" });
        return;
    }

    const clientProfile = await getUserProfile(auth.currentUser.uid);

    try {
        // Step 1: Create the booking document
        await createBooking({
            salonId: salon.id,
            salonName: salon.name,
            salonOwnerId: salon.ownerId,
            userId: auth.currentUser.uid,
            service: selectedService,
            date: selectedBookingDate.toISOString(),
            time: selectedBookingTime,
            clientName: clientProfile?.name || auth.currentUser.displayName || 'Клиент',
            clientEmail: clientProfile?.email || auth.currentUser.email || '',
            clientPhoneNumber: clientProfile?.phoneNumber || '',
            salonAddress: salon.address,
            salonPhoneNumber: salon.phoneNumber,
        });

        // Step 2: Update the salon's availability
        const dateKey = format(selectedBookingDate, 'yyyy-MM-dd');
        const salonRef = doc(db, 'salons', salon.id);
        
        const updatedAvailability = arrayRemove(selectedBookingTime);
        await updateDoc(salonRef, {
            [`availability.${dateKey}`]: updatedAvailability
        });
        
        // Step 3: Update local state to reflect the change immediately
        setSalon(prevSalon => {
            if (!prevSalon) return null;
            const newAvailability = { ...prevSalon.availability };
            if (newAvailability[dateKey]) {
                newAvailability[dateKey] = newAvailability[dateKey].filter(time => time !== selectedBookingTime);
            }
            return { ...prevSalon, availability: newAvailability };
        });

        // Reset selections
        setSelectedBookingTime(undefined);

        toast({
            title: "Резервацията е успешна!",
            description: `Вашият час за ${selectedService.name} в ${salon.name} е потвърден.`,
        });

    } catch (error: any) {
        console.error("Error confirming booking:", error);
        toast({
            title: "Възникна грешка",
            description: "Неуспешно създаване на резервация. Моля, опитайте отново.",
            variant: "destructive"
        });
    }
  };

 const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!auth.currentUser || !salon) {
      toast({ title: "Не сте влезли", variant: "destructive" });
      return;
    }
    
    let userProfileData = await getUserProfile(auth.currentUser.uid);
    let reviewerName = userProfileData?.name || auth.currentUser.displayName || 'Анонимен потребител';
    let userAvatarUrl = userProfileData?.profilePhotoUrl || auth.currentUser.photoURL || 'https://placehold.co/40x40.png';

    const newReviewData = {
      userName: reviewerName, rating, comment,
      date: new Date().toISOString(),
      userAvatar: userAvatarUrl,
      userId: auth.currentUser.uid, salonId: salon.id,
    };

    try {
      const docRef = await addDoc(collection(firestore, 'reviews'), newReviewData);
      
      const newTotalReviews = (salon.reviewCount || 0) + 1;
      const newTotalRating = ((salon.rating || 0) * (salon.reviewCount || 0) + rating) / newTotalReviews;
      await updateDoc(doc(firestore, 'salons', salon.id), { rating: newTotalRating, reviewCount: newTotalReviews });
      
      setSalon(prev => prev ? {...prev, rating: newTotalRating, reviewCount: newTotalReviews} : null);
      setDisplayedReviews(prev => [{...newReviewData, id: docRef.id} as Review, ...prev]);

      if (salon.ownerId) {
        await addDoc(collection(db, 'notifications'), {
          userId: salon.ownerId,
          message: `${reviewerName} остави нов отзив за ${salon.name}.`,
          link: `/salons/${salonNameToSlug(salon.name)}#reviews`,
          read: false,
          createdAt: Timestamp.now(),
          type: 'new_review_business',
          relatedEntityId: docRef.id,
        });
      }
      setShowReviewForm(false);
      toast({ title: "Отзивът е добавен!" });
    } catch (error) {
      toast({ title: "Грешка при добавяне на отзив", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-6">
        <Skeleton className="h-64 md:h-96 w-full rounded-lg mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6"><Skeleton className="h-10 w-3/4" /><Skeleton className="h-6 w-1/2" /><Skeleton className="h-20 w-full" /><Skeleton className="h-40 w-full" /></div>
          <div className="space-y-6"><Skeleton className="h-10 w-full" /><Skeleton className="h-64 w-full" /></div>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
        <div className="container mx-auto py-10 px-6 text-center flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <MapPin className="w-16 h-16 text-destructive mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">Салонът не е намерен</h1>
            <p className="text-lg text-muted-foreground mb-6">Изглежда, че страницата, която търсите, не съществува или адресът е грешен.</p>
            <Button asChild size="lg"><Link href="/">Обратно към всички салони</Link></Button>
        </div>
    );
  }

  const priceRangeTranslations: Record<string, string> = { cheap: 'евтино', moderate: 'умерено', expensive: 'скъпо', '': 'не е посочен' };
  const isPromotionActive = salon.promotion?.isActive && salon.promotion.expiresAt && isFuture(new Date(salon.promotion.expiresAt));
  const todayKey = daysOrder[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const hasServices = salon.services && salon.services.length > 0;
  
  return (
  <>
    {generateSalonJsonLd(salon)}
    <div className="relative w-full h-[400px] overflow-hidden mb-8">
      <Image 
        src={salon.heroImage || "/placeholder-image.jpg"} 
        alt={`Предна снимка на салон ${salon.name} в град ${salon.city}`}
        className="object-cover" 
        fill 
        sizes="100vw" 
        priority 
        data-ai-hint="Salon facade building" 
      />
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight drop-shadow-lg">{salon.name}</h1>
        <p className="text-lg md:text-xl mt-2 max-w-2xl mx-auto drop-shadow-md">{salon.description?.substring(0, 100)}...</p>
      </div>
    </div>

    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className={cn("w-full", hasServices && salon.workingMethod === 'appointment' && "lg:w-2/3")}>
          <div className="mb-6 p-6 bg-card rounded-lg shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    {isPromotionActive && (
                        <Badge variant="default" className="py-1 px-3 text-xs capitalize shadow-lg shadow-primary/50 animate-pulse">
                            <Gift className="h-3 w-3 mr-1" /> Промотиран
                        </Badge>
                    )}
                    {salon.priceRange && (
                        <Badge variant={salon.priceRange === 'expensive' ? 'destructive' : salon.priceRange === 'moderate' ? 'secondary' : 'outline'} className="capitalize text-sm py-1 px-3">
                            {priceRangeTranslations[salon.priceRange] || salon.priceRange}
                        </Badge>
                    )}
                </div>
                {auth.currentUser && salon?.id && (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleToggleFavorite} 
                        className={`py-2 px-3 text-sm sm:text-base flex items-center shrink-0 ${isFavorite ? 'text-red-500 border-red-500 hover:bg-red-50 dark:hover:bg-red-900' : 'text-muted-foreground hover:text-primary'}`} 
                        aria-label={isFavorite ? "Премахни от любими" : "Добави в любими"}
                    >
                        <Heart className={`mr-2 h-4 w-4 ${isFavorite ? 'fill-red-500' : ''}`} />
                        {isFavorite ? "Премахнат" : "Добави в любими"}
                    </Button>
                )}
            </div>
            <p className="text-foreground leading-relaxed">{salon.description}</p>
          </div>

            <Tabs defaultValue="info" className="w-full">
              <TabsList className="inline-flex h-auto w-full flex-wrap items-center justify-center rounded-lg bg-muted p-1.5 text-muted-foreground mb-6 gap-1.5">
                <TabsTrigger value="info" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-lg"><Info className="mr-2 h-4 w-4" />Информация</TabsTrigger>
                <TabsTrigger value="services" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-lg"><Sparkles className="mr-2 h-4 w-4" />Услуги</TabsTrigger>
                <TabsTrigger value="reviews" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-lg"><MessageSquare className="mr-2 h-4 w-4" />Отзиви</TabsTrigger>
                <TabsTrigger value="gallery" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-lg"><ImageIcon className="mr-2 h-4 w-4" />Галерия</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-0 md:mt-0 bg-card p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-foreground">Информация за Салона</h3>
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-muted-foreground"><MapPin className="h-4 w-4 mr-2 text-primary flex-shrink-0"/><span>{salon.address || 'Няма предоставен адрес'}, {salon.city || ''}, {salon.region ? `обл. ${salon.region}` : ''}</span></div>
                  <div className="flex items-center text-sm text-muted-foreground"><Phone className="h-4 w-4 mr-2 text-primary flex-shrink-0"/><span>{salon.phoneNumber || 'Няма предоставен телефон'}</span></div>
                </div>

                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-3 text-foreground flex items-center"><Clock className="mr-2 h-5 w-5 text-primary" />Работно време</h4>
                  <ul className="space-y-2 text-sm">
                    {daysOrder.map(dayKey => {
                        const dayInfo = salon.workingHours?.[dayKey];
                        const isToday = dayKey === todayKey;
                        return (<li key={dayKey} className={cn("flex justify-between items-center p-2 rounded-md", isToday && "bg-secondary")}><span className={cn("font-medium", isToday ? "text-primary" : "text-foreground")}>{dayTranslations[dayKey] || dayKey}</span>{dayInfo && !dayInfo.isOff && dayInfo.open && dayInfo.close ? (<span className="font-mono text-foreground">{dayInfo.open} – {dayInfo.close}</span>) : (<span className="text-muted-foreground italic">Почивен ден</span>)}</li>)
                    })}
                  </ul>
                </div>
                 {(salon.location || salon.address) && (
                    <div className="mt-6">
                        <h3 className="text-xl font-semibold mb-4 text-foreground">Местоположение на Картата</h3>
                        <div className="w-full h-[400px] rounded-lg overflow-hidden shadow-md border">
                            <LeafletMap key={salon.id} center={salon.location ?? undefined} address={salon.address} markerText={salon.name} />
                        </div>
                    </div>
                )}
                </TabsContent>
              <TabsContent value="services" className="mt-0 md:mt-0 bg-card p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-foreground">Услуги</h3>
                 <div className="mb-6 relative p-3 border border-primary rounded-md bg-transparent text-foreground">
                    <div className="absolute -top-3 left-3 px-2 py-0.5 text-sm font-semibold bg-primary text-primary-foreground rounded-sm">EUR BGN 🔄</div>
                    <p className="pt-3 text-base">
                      Валутен курс: <strong>1 EUR = 1.95583 лв.</strong>
                    </p>
                </div>
                <div className="space-y-1">
                  {(salon.services && salon.services.length > 0) ? salon.services.map(service => (<ServiceListItem key={service.id} service={service} isBookingEnabled={salon.workingMethod === 'appointment'} {...(salon.workingMethod === 'appointment' && { onBook: handleBookService })}/>)) : <p className="text-muted-foreground">Все още няма добавени услуги за този салон.</p>}
                </div>
              </TabsContent>
              <TabsContent value="reviews" id="reviews" className="mt-0 md:mt-0 bg-card p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center"><MessageSquare className="mr-2 h-5 w-5 text-primary"/>Отзиви</h3>
                {isLoadingReviews ? (<div className="space-y-4">{[...Array(3)].map((_, i) => (<Card key={i} className="shadow-sm"><CardHeader><Skeleton className="h-5 w-1/3 mb-1" /><Skeleton className="h-4 w-1/4" /></CardHeader><CardContent className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></CardContent></Card>))}</div>) : displayedReviews.length > 0 ? (<div className="space-y-6">{displayedReviews.map(review => (<ReviewCard key={review.id} review={review} />))}</div>) : (<p className="text-muted-foreground">Все още няма отзиви. Бъдете първият, който ще остави отзив!</p>)}
                {hasMoreReviews && !isLoadingReviews && displayedReviews.length > 0 && (<div className="mt-6 text-center"><Button onClick={fetchMoreReviews}>Зареди още отзиви</Button></div>)}
                {auth.currentUser && (<div className="mt-6">{showReviewForm ? (<AddReviewForm onAddReview={handleReviewSubmit} onCancel={() => setShowReviewForm(false)}/>) : (<Button variant="outline" onClick={() => setShowReviewForm(true)} data-ai-hint="Add review button" className="w-full">Добави Отзив</Button>)}</div>)}
                {auth.currentUser && userReviews.length > 0 && !showReviewForm && (<div className="mt-8 bg-card p-6 rounded-lg shadow-md"><h3 className="text-xl font-semibold mb-4 text-foreground flex items-center"><ThumbsUp className="mr-2 h-5 w-5 text-primary" /> Вашите Отзиви за този салон</h3><div className="space-y-6">{userReviews.map(review => (<ReviewCard key={review.id} review={review} />))}</div></div>)}
              </TabsContent>
              <TabsContent value="gallery" className="mt-0 md:mt-0 bg-card p-6 rounded-lg shadow-md">
                <SalonGallery photos={salon.photos || []} salonName={salon.name || ''} salonCity={salon.city || ''} />
              </TabsContent>
              </Tabs>
            </div>
            
            {hasServices && salon.workingMethod === 'appointment' && (
              <div className="lg:w-1/3">
                <div id="booking-calendar-section" className="sticky top-20">
                  <BookingCalendar salonName={salon.name} serviceName={selectedService?.name} availability={salon.availability || {}} onTimeSelect={handleTimeSelected} />
                  {selectedService && selectedBookingDate && selectedBookingTime && (
                    <div className="mt-4">
                      <Card className="shadow-md mb-4 border-primary bg-secondary/30 dark:bg-secondary/50"><CardHeader className="pb-3 pt-4"><CardTitle className="text-lg text-secondary-foreground flex items-center"><Info className="mr-2 h-5 w-5" />Вашата Резервация</CardTitle></CardHeader><CardContent className="text-sm space-y-2 text-secondary-foreground"><div className="flex items-center"><Scissors className="mr-2 h-4 w-4 text-primary" /><span className="font-medium">Услуга:</span>&nbsp;{selectedService.name}</div><div className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-primary" /><span className="font-medium">Дата:</span>&nbsp;{format(selectedBookingDate, "PPP", { locale: bg })}</div><div className="flex items-center"><Clock className="mr-2 h-4 w-4 text-primary" /><span className="font-medium">Час:</span>&nbsp;{selectedBookingTime}</div></CardContent></Card>
                       <Button onClick={handleConfirmBooking} className="w-full py-6 text-lg font-semibold" disabled={!auth.currentUser}>{auth.currentUser ? "Запази час" : "Влезте за да резервирате"}</Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
 </>
  );
}




'use client';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import type { Review, Salon, Service, UserProfile, WorkingHoursStructure, DayWorkingHours } from '@/types';
import { getFirestore, collection, query, where, getDocs, limit, doc, getDoc, addDoc, updateDoc, Timestamp, orderBy, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ServiceListItem } from '@/components/salon/service-list-item';
import { ReviewCard } from '@/components/salon/review-card';
import AddReviewForm from '@/components/salon/AddReviewForm';
import { BookingCalendar } from '@/components/booking/booking-calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Phone, ThumbsUp, MessageSquare, Sparkles, Image as ImageIcon, CalendarDays, Info, Clock, Scissors, Gift, Heart } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { createBooking, auth, getUserProfile, firestore as db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { sendReviewReminderEmail } from '@/app/actions/notificationActions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, formatDistanceToNow, isFuture } from 'date-fns';
import { bg } from 'date-fns/locale';

const daysOrder: (keyof WorkingHoursStructure)[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const dayTranslations: Record<string, string> = {
  monday: "Пон",
  tuesday: "Вт",
  wednesday: "Ср",
  thursday: "Четв",
  friday: "Пет",
  saturday: "Съб",
  sunday: "Нед",
};


function formatWorkingHours(workingHours?: WorkingHoursStructure): string {
  if (!workingHours || typeof workingHours !== 'object' || Object.keys(workingHours).length === 0) {
    return 'Няма предоставено работно време';
  }

  const parts: string[] = [];
  daysOrder.forEach(dayKey => {
    const dayInfo = workingHours![dayKey] as DayWorkingHours | undefined;
    if (dayInfo) {
      if (dayInfo.isOff || !dayInfo.open || !dayInfo.close) {
        parts.push(`${dayTranslations[dayKey] || dayKey}: Почивен ден`);
      } else {
        parts.push(`${dayTranslations[dayKey] || dayKey}: ${dayInfo.open} - ${dayInfo.close}`);
      }
    } else {
       parts.push(`${dayTranslations[dayKey] || dayKey}: Няма информация`);
    }
  });
  return parts.join('; ') || 'Няма предоставено работно време';
}

function generateSalonSchema(salon: Salon) {
  const daysOrderForSchema: Record<string, string> = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  const openingHoursSpecification = daysOrder.map(dayKey => {
    const dayInfo = salon.workingHours?.[dayKey];
    if (!dayInfo || dayInfo.isOff) {
      return null;
    }
    return {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": `https://schema.org/${daysOrderForSchema[dayKey]}`,
      "opens": dayInfo.open,
      "closes": dayInfo.close,
    };
  }).filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": salon.name,
    "image": salon.heroImage || 'https://placehold.co/1200x400.png',
    "address": {
      "@type": "PostalAddress",
      "streetAddress": salon.address || 'Няма предоставен адрес',
      "addressLocality": salon.city || 'Не е посочен град',
    },
    "telephone": salon.phone || 'Няма предоставен телефон',
    "openingHoursSpecification": openingHoursSpecification.length > 0 ? openingHoursSpecification : undefined,
    "priceRange": salon.priceRange ? (
        salon.priceRange === 'cheap' ? '$' : salon.priceRange === 'moderate' ? '$$' : salon.priceRange === 'expensive' ? '$$$' : undefined
    ) : undefined,
    "aggregateRating": salon.rating !== undefined && salon.reviewCount !== undefined ? {
      "@type": "AggregateRating",
      "ratingValue": salon.rating.toFixed(1),
      "reviewCount": salon.reviewCount.toString(),
    } : undefined,
  };
}


export default function SalonProfilePage() {
  const params = useParams();
  const slugParam = params?.slug;

  const [salon, setSalon] = useState<Salon | null>(null);
  const [displayedReviews, setDisplayedReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
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
  const [isFavorite, setIsFavorite] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const reminderTimeoutId = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let currentSlug: string | undefined;
    if (typeof slugParam === 'string') {
       currentSlug = slugParam;
    } else if (Array.isArray(slugParam) && slugParam.length > 0) {
      currentSlug = slugParam[0];
    } else {
      console.warn("[SalonProfilePage] Invalid or missing slug parameter:", slugParam);
      currentSlug = undefined;
    }

    const salonNameFromSlug = currentSlug ? currentSlug.replace(/_/g, ' ') : undefined;
    console.log("[SalonProfilePage] Derived salonNameFromSlug for Firestore query:", salonNameFromSlug);

    const fetchSalonByName = async (name: string) => {
      setIsLoading(true);
      setSalon(null);
      setDisplayedReviews([]);
      console.log("[SalonProfilePage] Fetching salon from Firestore for name:", name);
      
      try {
        const salonsCollectionRef = collection(firestore, 'salons');
        const q = query(salonsCollectionRef, where('name', '==', name), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const salonDoc = querySnapshot.docs[0];
          let salonData = { 
            id: salonDoc.id, 
            ...salonDoc.data(), 
            reviewCount: salonDoc.data().reviewCount || 0,
            rating: salonDoc.data().rating || 0,
          } as Salon;

          salonData.services = salonData.services || [];
          salonData.photos = salonData.photos || [];
          salonData.phone = salonData.phone || 'Няма предоставен телефон';
          salonData.address = salonData.address || 'Няма предоставен адрес';
          salonData.city = salonData.city || 'Не е посочен град';
          salonData.priceRange = salonData.priceRange || '';


          if (!salonData.workingHours || typeof salonData.workingHours !== 'object') {
              const defaultHours: WorkingHoursStructure = {};
              daysOrder.forEach(day => {
                  defaultHours[day] = { open: '09:00', close: '18:00', isOff: day === 'sunday' };
                  if (day === 'saturday') defaultHours[day] = { open: '10:00', close: '14:00', isOff: false };
              });
              salonData.workingHours = defaultHours;
          } else {
             daysOrder.forEach(dayKey => {
                if (!salonData.workingHours!.hasOwnProperty(dayKey)) {
                    salonData.workingHours![dayKey] = { open: '09:00', close: '18:00', isOff: dayKey === 'sunday' };
                     if (dayKey === 'saturday') salonData.workingHours![dayKey] = { open: '10:00', close: '14:00', isOff: false };
                }
             });
          }
          setSalon(salonData);
          console.log("[SalonProfilePage] Salon found in Firestore:", salonData);
        } else {
          console.error("[SalonProfilePage] Salon not found in Firestore for name:", name);
          setSalon(null);
          toast({
            title: "Салонът не е намерен",
            description: "Салон с име '" + name + "' не беше открит. Моля, проверете адреса или се върнете към списъка със салони.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("[SalonProfilePage] Error fetching salon from Firestore:", error);
        if (error.code === 'permission-denied') {
          toast({
            title: "Грешка: Няма права за достъп",
            description: "Неуспешно зареждане на информацията за салона поради липса на права. Моля, проверете Вашите Firestore Security Rules.",
            variant: "destructive",
            duration: 15000,
          });
        } else {
          toast({
            title: "Грешка при зареждане",
            description: "Неуспешно зареждане на информацията за салона. Опитайте отново по-късно.",
            variant: "destructive",
          });
        }
        setSalon(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (salonNameFromSlug) {
      fetchSalonByName(salonNameFromSlug);
    } else {
      console.log("[SalonProfilePage] No valid salon name from slug, cannot fetch salon.");
      setSalon(null);
      setIsLoading(false);
      toast({ title: "Грешен адрес", description: "Не може да се определи името на салона от URL адреса.", variant: "destructive" });
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
        const userProfileData = await getUserProfile(auth.currentUser.uid);
        setUserProfile(userProfileData); 
        if (userProfileData) {
          setUserRole(userProfileData.role || null);
          setIsSalonOwner(salon.ownerId === auth.currentUser.uid);
          setIsFavorite(userProfileData.preferences?.favoriteSalons?.includes(salon.id) || false);
        } else {
          setUserRole(null);
          setIsSalonOwner(false);
          setIsFavorite(false);
        }
      } catch (error) {
        console.error("[SalonProfilePage] Error fetching user role or checking ownership:", error);
        setUserRole(null);
        setIsSalonOwner(false);
        setIsFavorite(false);
      }
    };

    const fetchSalonReviews = async () => {
      if (!salon?.id) return;
      setIsLoadingReviews(true);
      try {
        const reviewsCollectionRef = collection(firestore, 'reviews');
        const q = query(reviewsCollectionRef, where('salonId', '==', salon.id), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        const reviewsData = querySnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as Review[];
        setDisplayedReviews(reviewsData);

        if (reviewsData.length > 0) {
            const totalRating = reviewsData.reduce((acc, rev) => acc + rev.rating, 0);
            const newAverageRating = totalRating / reviewsData.length;
            const salonDocRefToUpdate = doc(firestore, 'salons', salon.id);
            await updateDoc(salonDocRefToUpdate, { rating: newAverageRating, reviewCount: reviewsData.length });
            setSalon(prevSalon => prevSalon ? ({ ...prevSalon, rating: newAverageRating, reviewCount: reviewsData.length }) : null);
        } else {
             const salonDocRefToUpdate = doc(firestore, 'salons', salon.id);
             await updateDoc(salonDocRefToUpdate, { rating: 0, reviewCount: 0 });
             setSalon(prevSalon => prevSalon ? ({ ...prevSalon, rating: 0, reviewCount: 0 }) : null);
        }
      } catch (error) {
        console.error("[SalonProfilePage] Error fetching salon reviews:", error);
        setDisplayedReviews([]);
        // Do not toast here as it might be too noisy if only review fetching fails
      } finally {
        setIsLoadingReviews(false);
      }
    };

    if(salon) {
      fetchUserRoleAndCheckOwnership();
      fetchSalonReviews();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salon?.id, firestore]); // Removed displayedReviews from dependencies to avoid loop with rating update


  const fetchUserReviews = async () => {
    if (!auth.currentUser || !salon?.id) {
        setUserReviews([]);
        return;
    }
    try {
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
        setUserReviews(reviewsData);
    } catch (error) {
        console.error("[SalonProfilePage] Error fetching user reviews:", error);
        setUserReviews([]);
    }
  };

  useEffect(() => {
    if(salon?.id && auth.currentUser) {
        fetchUserReviews();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salon?.id, auth.currentUser?.uid, firestore, showReviewForm]);

  const handleToggleFavorite = useCallback(async () => {
    if (!auth.currentUser || !salon?.id) {
      toast({
        title: "Влезте в профила си",
        description: "Моля, влезте, за да добавите салон към любими.",
        variant: "destructive",
      });
      return;
    }

    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    try {
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        toast({ title: "Грешка", description: "Потребителският профил не е намерен.", variant: "destructive"});
        return;
      }

      const currentFavorites = userDoc.data()?.preferences?.favoriteSalons || [];
      let updatedFavorites;

      if (currentFavorites.includes(salon.id)) {
        updatedFavorites = arrayRemove(salon.id);
        setIsFavorite(false);
        toast({
          title: "Премахнат от любими!",
          description: salon.name + " е премахнат от вашите любими салони.",
        });
      } else {
        updatedFavorites = arrayUnion(salon.id);
        setIsFavorite(true);
        toast({
          title: "Добавен в любими!",
          description: salon.name + " е добавен към вашите любими салони.",
        });
      }
      await updateDoc(userDocRef, {
        'preferences.favoriteSalons': updatedFavorites
      });
       // Update local userProfile state if it exists
       if (userProfile) {
        setUserProfile(prevProfile => {
          if (!prevProfile) return null;
          const newFavoriteSalons = updatedFavorites === arrayRemove(salon.id)
            ? (prevProfile.preferences?.favoriteSalons || []).filter(id => id !== salon.id)
            : [...(prevProfile.preferences?.favoriteSalons || []), salon.id];
          return {
            ...prevProfile,
            preferences: {
              ...prevProfile.preferences,
              favoriteSalons: newFavoriteSalons,
            },
          };
        });
      }


    } catch (error) {
      console.error("[SalonProfilePage] Error toggling favorite status:", error);
      toast({
        title: "Грешка",
        description: "Неуспешно " + (isFavorite ? "премахване на" : "добавяне на") + " салон от/към любими. Моля, опитайте отново.",
        variant: "destructive",
      });
    }
  }, [auth.currentUser, salon?.id, salon?.name, isFavorite, toast, userProfile]);

  const handleBookService = (serviceId: string) => {
    const service = salon?.services?.find(s => s.id === serviceId);
    if (service) {
        setSelectedService(service);
        toast({
            title: "Услугата е избрана",
            description: service.name + " е добавена към календара за резервации. Моля, изберете дата и час.",
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
    const bookingDate = new Date(selectedBookingDate); // Already a Date object
    const bookingTime = selectedBookingTime;
    const localSelectedService = selectedService; // To capture its current state

    // Initialize client details with fallbacks
    let clientName = auth.currentUser.displayName || 'Клиент';
    let clientEmail = auth.currentUser.email || 'Няма имейл';
    let clientPhoneNumber = 'Няма номер';

    try {
      // Attempt to fetch more detailed user profile info
      const userId = auth.currentUser.uid;
      const fetchedUserProfile = await getUserProfile(userId);
      if (fetchedUserProfile) {
        clientName = fetchedUserProfile.name || fetchedUserProfile.displayName || clientName;
        clientEmail = fetchedUserProfile.email || clientEmail; // User's actual email
        clientPhoneNumber = fetchedUserProfile.phoneNumber || clientPhoneNumber; // User's phone
      }

      const bookingId = await createBooking({
        salonId: salon.id,
        salonName: bookingSalonName,
        salonOwnerId: salon.ownerId,
        userId: userId,
        service: {
            id: localSelectedService.id,
            name: bookingServiceName,
            price: localSelectedService.price,
            duration: localSelectedService.duration,
            description: localSelectedService.description || '',
        },
        date: bookingDate.toISOString(), // Store as ISO string
        time: bookingTime,
        clientName: clientName,
        clientEmail: clientEmail,
        clientPhoneNumber: clientPhoneNumber,
        salonAddress: salon.address,
        salonPhoneNumber: salon.phone,
      });

      toast({
        title: "Резервацията е потвърдена!",
        description: "Успешно резервирахте " + bookingServiceName + " за " + format(bookingDate, 'PPP', { locale: bg }) + " в " + bookingTime + ".",
      });

      const [hours, minutes] = bookingTime.split(':').map(Number);
      const bookingDateTime = new Date(bookingDate);
      bookingDateTime.setHours(hours, minutes, 0, 0);

      // Schedule reminder 1 hour AFTER the booking time
      const reminderDateTime = new Date(bookingDateTime.getTime() + 60 * 60 * 1000); // 1 hour later
      const now = new Date();
      const delay = reminderDateTime.getTime() - now.getTime();

      if (delay > 0) {
        if (reminderTimeoutId.current) {
          clearTimeout(reminderTimeoutId.current);
        }
        reminderTimeoutId.current = setTimeout(async () => {
          try {
            const reminderResult = await sendReviewReminderEmail({
              salonName: bookingSalonName,
              serviceName: bookingServiceName || undefined, // Ensure serviceName is passed
              bookingDate: format(bookingDate, 'PPP', { locale: bg }),
              bookingTime: bookingTime,
            });
            if(reminderResult.success) {
                 toast({
                    title: "Покана за отзив изпратена",
                    description: reminderResult.message,
                    variant: "default",
                    duration: 7000,
                });
            } else {
                console.warn("Reminder email not sent:", reminderResult.message);
                 toast({
                    title: "Проблем с изпращане на покана",
                    description: reminderResult.message,
                    variant: "default",
                });
            }
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
          description: "Ще получите покана да оставите отзив 1 час след Вашата резервация в " + bookingSalonName + ".",
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
    if (!auth.currentUser) {
      toast({ title: "Не сте влезли", description: "Моля, влезте, за да оставите отзив.", variant: "destructive" });
      return;
    }
    if (!salon) {
      toast({ title: "Грешка", description: "Няма информация за салона.", variant: "destructive" });
      return;
    }

    try {
      const userId = auth.currentUser.uid;
      const userProfileData = await getUserProfile(userId); // Fetch full user profile
      let reviewerName: string | null = null;

      if (auth.currentUser.displayName) {
        reviewerName = auth.currentUser.displayName;
      }
      // Prioritize name from Firestore profile if available
      if (userProfileData && (userProfileData.name || userProfileData.displayName)) {
        reviewerName = userProfileData.name || userProfileData.displayName || null;
      }
      reviewerName = reviewerName || 'Анонимен потребител'; // Fallback
      const userAvatarUrl = userProfileData?.profilePhotoUrl || auth.currentUser.photoURL || 'https://placehold.co/40x40.png';


      const newReviewData = {
        userName: reviewerName,
        rating: rating,
        comment: comment,
        date: Timestamp.fromDate(new Date()).toDate().toISOString(), // Store as ISO string
        userAvatar: userAvatarUrl,
        userId: userId,
        salonId: salon.id,
      };

      const docRef = await addDoc(collection(firestore, 'reviews'), newReviewData);
      const newReviewWithId = { ...newReviewData, id: docRef.id } as Review;

      // Optimistically update displayed reviews and user reviews
      const updatedDisplayedReviews = [newReviewWithId, ...displayedReviews].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setDisplayedReviews(updatedDisplayedReviews);

      if(userId === auth.currentUser.uid) { // This check is a bit redundant here as we check auth.currentUser above
          setUserReviews(prevUserReviews => [newReviewWithId, ...prevUserReviews].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }

      // Update salon's average rating and review count in Firestore
      if (updatedDisplayedReviews.length > 0) {
        const totalRating = updatedDisplayedReviews.reduce((acc, rev) => acc + rev.rating, 0);
        const newAverageRating = totalRating / updatedDisplayedReviews.length;
        const salonDocRefToUpdate = doc(firestore, 'salons', salon.id);
        await updateDoc(salonDocRefToUpdate, { rating: newAverageRating, reviewCount: updatedDisplayedReviews.length });
        // Update local salon state to reflect new rating and count
        setSalon(prevSalon => prevSalon ? ({ ...prevSalon, rating: newAverageRating, reviewCount: updatedDisplayedReviews.length }) : null);
      }

      // Notify business owner
      if (salon.ownerId) {
        const notificationMessage = reviewerName + " остави нов отзив за Вашия салон " + salon.name + ".";
        await addDoc(collection(db, 'notifications'), {
          userId: salon.ownerId,
          message: notificationMessage,
          link: `/salons/${salon.name.replace(/\s+/g, '_')}#reviews`, // Link to the reviews section of the salon page
          read: false,
          createdAt: Timestamp.fromDate(new Date()),
          type: 'new_review_business',
          relatedEntityId: docRef.id, // ID of the new review
        });
      }

      setShowReviewForm(false);
      toast({ title: "Отзивът е добавен!", description: "Благодарим за Вашия отзив." });
    } catch (error) {
      console.error("[SalonProfilePage] Error adding review:", error);
      toast({ title: "Грешка при добавяне на отзив", description: "Моля, опитайте отново.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-6">
        <Skeleton className="h-64 md:h-96 w-full rounded-lg mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
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
            <p className="text-lg text-muted-foreground mb-6">
              Изглежда, че салонът, който търсите, не съществува или адресът е грешен.
              <span className="block text-sm mt-1">Моля, проверете конзолата на браузъра за съобщения, започващи с "[SalonProfilePage]", за повече информация относно името на салона, което се търси.</span>
            </p>
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
    '': 'не е посочен'
  };

  const isPromotionActive = salon.promotion?.isActive && salon.promotion.expiresAt && isFuture(new Date(salon.promotion.expiresAt));


  return (
    <>
    {salon && (
 <script
 type="application/ld+json"
 dangerouslySetInnerHTML={{ __html: JSON.stringify(generateSalonSchema(salon)) }}
 /> )}
    <div className="bg-background">
      <div className="relative h-64 md:h-96 w-full group">
        <Image
          src={salon.heroImage || 'https://placehold.co/1200x400.png'}
          alt={"Предна снимка на " + salon.name + (salon.city ? " в " + salon.city : "")}
          layout="fill"
          objectFit="cover"
          priority
          data-ai-hint="salon facade building"
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
                    <span className="text-2xl font-bold">{salon.rating?.toFixed(1) ?? '0.0'}</span>
                    <span className="ml-2 text-muted-foreground">({salon.reviewCount || 0} отзива)</span>
                  </div>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <MapPin className="h-4 w-4 mr-1.5 text-primary" /> {salon.address || 'Няма предоставен адрес'}, {salon.city || ''}
                  </div>
                </div>
                 <div className="flex items-center gap-2 mt-3 sm:mt-0">
                    {isPromotionActive && (
                    <Badge variant="default" className="bg-accent text-accent-foreground py-1 px-3 text-xs capitalize">
                        <Gift className="h-3 w-3 mr-1" /> Промотиран
                    </Badge>
                    )}
                    {salon.priceRange && (
                        <Badge variant={salon.priceRange === 'expensive' ? 'destructive' : salon.priceRange === 'moderate' ? 'secondary' : 'outline'} className="capitalize text-sm py-1 px-3">
                        {priceRangeTranslations[salon.priceRange] || salon.priceRange}
                        </Badge>
                    )}
                    {auth.currentUser && salon?.id && (
                    <Button
                            variant="outline"
                            size="sm" // Changed from "icon"
                            onClick={handleToggleFavorite}
                            className={`py-1 px-3 ${isFavorite ? 'text-red-500 border-red-500 hover:bg-red-50 dark:hover:bg-red-900' : 'text-muted-foreground hover:text-primary'}`}
                            aria-label={isFavorite ? "Премахни от любими" : "Добави в любими"}
                        >
                        <Heart className={`mr-2 h-4 w-4 ${isFavorite ? 'fill-red-500' : ''}`} />
                        {isFavorite ? "Премахни от любими" : "Добави в любими"}
                        </Button>
                    )}
                </div>
              </div>
              <p className="text-foreground leading-relaxed">{salon.description}</p>
            </div>

            <Tabs defaultValue="services" orientation="vertical" className="flex flex-col md:flex-row gap-6 md:gap-10">
            <TabsList className="flex flex-row overflow-x-auto md:overflow-visible md:flex-col md:space-y-1 md:w-48 lg:w-56 md:border-r md:pr-4 shrink-0 bg-transparent p-0 shadow-none custom-scrollbar pb-2 md:pb-0">
                <TabsTrigger value="services" className="w-full justify-start py-2.5 px-3 text-sm sm:text-base data-[state=active]:bg-muted data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-sm rounded-md hover:bg-muted/50 transition-colors">
                    <Sparkles className="mr-2 h-4 w-4" />Услуги
                </TabsTrigger>
                <TabsTrigger value="reviews" className="w-full justify-start py-2.5 px-3 text-sm sm:text-base data-[state=active]:bg-muted data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-sm rounded-md hover:bg-muted/50 transition-colors">
                    <MessageSquare className="mr-2 h-4 w-4" />Отзиви
                </TabsTrigger>
                <TabsTrigger value="gallery" className="w-full justify-start py-2.5 px-3 text-sm sm:text-base data-[state=active]:bg-muted data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-sm rounded-md hover:bg-muted/50 transition-colors">
                    <ImageIcon className="mr-2 h-4 w-4" />Галерия
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 min-w-0">
                  <TabsContent value="services" className="mt-0 md:mt-0 bg-card p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground flex items-center">
                      <Sparkles className="mr-2 h-6 w-6 text-primary" /> Нашите Услуги
                    </h2>
                    <div className="space-y-1">
                      {(salon.services && salon.services.length > 0) ? salon.services.map(service => (
                        <ServiceListItem key={service.id} service={service} onBook={handleBookService} />
                      )) : <p className="text-muted-foreground">Все още няма добавени услуги за този салон.</p>}
                    </div>
                  </TabsContent>

                  <TabsContent value="reviews" id="reviews" className="mt-0 md:mt-0 bg-card p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground flex items-center">
                      <ThumbsUp className="mr-2 h-6 w-6 text-primary" /> Отзиви от Клиенти
                    </h2>
                    {isLoadingReviews ? (
                         <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                            <Card key={i} className="shadow-sm">
                                <CardHeader>
                                <Skeleton className="h-5 w-1/3 mb-1" />
                                <Skeleton className="h-4 w-1/4" />
                                </CardHeader>
                                <CardContent className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                                </CardContent>
                            </Card>
                            ))}
                        </div>
                    ) : displayedReviews.length > 0 ? (
                      <div className="space-y-6">
                        {displayedReviews.map(review => (
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
                     {auth.currentUser && userReviews.length > 0 && !showReviewForm && (
                        <div className="mt-8 bg-card p-6 rounded-lg shadow-md">
                             <h2 className="text-2xl font-semibold mb-4 text-foreground flex items-center">
                                <ThumbsUp className="mr-2 h-6 w-6 text-primary" /> Вашите Отзиви за този салон
                             </h2>
                             <div className="space-y-6">
                                {userReviews.map(review => (
                                    <ReviewCard key={review.id} review={review} />
                                ))}
                             </div>
                        </div>
                      )}
                  </TabsContent>
                  <TabsContent value="gallery" className="mt-0 md:mt-0 bg-card p-6 rounded-lg shadow-md">
                     <h2 className="text-2xl font-semibold mb-4 text-foreground flex items-center">
                      <ImageIcon className="mr-2 h-6 w-6 text-primary" /> Фото Галерия
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {(salon.photos && salon.photos.length > 0) ? salon.photos.map((photo, index) => (
                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden shadow-md hover:scale-105 transition-transform duration-300">
                                <Image src={photo} alt={"Снимка " + (index + 1) + " от галерията на " + salon.name + (salon.city ? " в " + salon.city : "")} layout="fill" objectFit="cover" data-ai-hint="salon style haircut" />
                            </div>
                        )) : <p className="text-muted-foreground col-span-full text-center">Няма добавени снимки в галерията.</p> }
                    </div>
                  </TabsContent>
                </div>
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
            {!isPromotionActive && userRole === 'business' && isSalonOwner && (
              <Card className="shadow-md mb-4 border-primary bg-secondary/30 dark:bg-secondary/50">
                <CardHeader className="pb-3 pt-4">
                  <CardTitle className="text-lg text-secondary-foreground flex items-center">
                    <Gift className="mr-2 h-5 w-5" />
                    Рекламирайте Вашия Салон
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2 text-secondary-foreground/90 dark:text-secondary-foreground/80">
                  <p>Искате ли Вашият салон да достигне до повече клиенти? Възползвайте се от нашата VIP/Промотирана услуга!</p>
                  <Button asChild variant="default" className="mt-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                     <Link href={salon.id ? "/business/promote/" + salon.id : '#'}>Научете повече / Активирайте</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
            {selectedService && selectedBookingDate && selectedBookingTime && (
              <Card className="shadow-md mb-4 border-primary bg-secondary/30 dark:bg-secondary/50">
                <CardHeader className="pb-3 pt-4">
                  <CardTitle className="text-lg text-secondary-foreground flex items-center">
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
                <li className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-primary"/> {salon.address || 'Няма предоставен адрес'}, {salon.city || ''}</li>
                <li className="flex items-center"><Phone className="h-4 w-4 mr-2 text-primary"/> {salon.phone || 'Няма предоставен телефон'}</li>
                <li className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-primary"/> {formatWorkingHours(salon.workingHours)}</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
    </>
  );
}


'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
// TODO: Implement Firebase Storage for actual file uploads
// import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Salon } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { UploadCloud, XCircle, ImagePlus, Trash2 } from 'lucide-react'; // Added Trash2 for remove icon

export default function EditBusinessPage() {
  const router = useRouter();
  const params = useParams();
  const businessId = params.businessId as string;

  const [business, setBusiness] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Salon>>({});

  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
  
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]); // Files to be uploaded
  const [galleryImagePreviews, setGalleryImagePreviews] = useState<string[]>([]); // Client-side previews for new files
  const [existingGalleryPhotos, setExistingGalleryPhotos] = useState<string[]>([]); // URLs from Firestore

  const firestore = getFirestore();
  // const storage = getStorage(); // Initialize Firebase Storage for actual uploads
  const { toast } = useToast();
  const authInstance = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      if (!user) {
        router.push('/login');
      } else {
        fetchBusiness(user.uid);
      }
    });
    return () => unsubscribe();
  }, [businessId, router, authInstance]); // eslint-disable-line react-hooks/exhaustive-deps
  // Added eslint-disable for fetchBusiness dependency, as it's stable.

  const fetchBusiness = async (userId: string) => {
    if (!businessId) {
      setLoading(false);
      toast({ title: 'Грешка', description: 'Липсва ID на бизнеса.', variant: 'destructive' });
      return;
    }
    try {
      const businessRef = doc(firestore, 'salons', businessId);
      const docSnap = await getDoc(businessRef);
      if (docSnap.exists()) {
        const businessData = { id: docSnap.id, ...docSnap.data() } as Salon;
        if (businessData.ownerId !== userId) {
          toast({ title: 'Неоторизиран достъп', description: 'Нямате права да редактирате този бизнес.', variant: 'destructive' });
          router.push('/business/manage');
          return;
        }
        setBusiness(businessData);
        setFormData({
            name: businessData.name,
            description: businessData.description,
            address: businessData.address,
            city: businessData.city, // Assuming city is part of Salon type and data
            priceRange: businessData.priceRange, // Assuming priceRange is part of Salon type and data
            phone: businessData.phone,
            email: businessData.email,
            website: businessData.website,
            workingHours: businessData.workingHours,
            // Do not set heroImage/photos in formData directly, use dedicated state
        });
        setExistingGalleryPhotos(businessData.photos || []);
        if (businessData.heroImage) {
          setHeroImagePreview(businessData.heroImage);
        }
      } else {
        toast({ title: 'Не е намерен', description: 'Бизнесът не е намерен.', variant: 'destructive' });
        router.push('/business/manage');
      }
    } catch (error) {
      console.error('Error fetching business:', error);
      toast({ title: 'Грешка', description: 'Неуспешно извличане на данни за бизнеса.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleHeroImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setHeroImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeroImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setGalleryFiles(prev => [...prev, ...filesArray]); // Add new files to the list for upload
      
      const newPreviewsArray: string[] = [];
      filesArray.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviewsArray.push(reader.result as string);
          // Check if all new files are processed
          if (newPreviewsArray.length === filesArray.length) {
            setGalleryImagePreviews(prev => [...prev, ...newPreviewsArray]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeExistingGalleryPhoto = (photoUrlToRemove: string) => {
    setExistingGalleryPhotos(prev => prev.filter(url => url !== photoUrlToRemove));
  };

  const removeNewGalleryPhotoPreview = (indexToRemove: number) => {
    setGalleryImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    setGalleryFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!businessId || !business) return;
    setSaving(true);

    const dataToUpdate: Partial<Salon> = { ...formData };
     // Remove id, ownerId, createdAt if they exist in formData to avoid updating them
    delete (dataToUpdate as any).id;
    delete (dataToUpdate as any).ownerId;
    delete (dataToUpdate as any).createdAt;


    // Simulate Hero Image Upload & Get URL
    if (heroImageFile) {
      // In a real app:
      // const heroImageStorageRef = ref(storage, `salons/${businessId}/heroImage/${heroImageFile.name}`);
      // await uploadBytes(heroImageStorageRef, heroImageFile);
      // dataToUpdate.heroImage = await getDownloadURL(heroImageStorageRef);
      dataToUpdate.heroImage = `https://placehold.co/1200x400.png?text=Hero+${Date.now()}`; // Placeholder for simulation
      toast({ title: 'Инфо', description: `Симулирано качване на главна снимка: ${heroImageFile.name}`});
    } else if (heroImagePreview === null) { // If preview is null, it means user wants to remove it
        dataToUpdate.heroImage = ''; // Or delete the field: delete dataToUpdate.heroImage;
    } else {
        dataToUpdate.heroImage = business.heroImage; // Keep existing if no new file and not removed
    }


    // Simulate Gallery Images Upload & Get URLs
    const uploadedGalleryUrls: string[] = [];
    if (galleryFiles.length > 0) {
      for (const file of galleryFiles) {
        // In a real app:
        // const galleryImageStorageRef = ref(storage, `salons/${businessId}/gallery/${Date.now()}_${file.name}`);
        // await uploadBytes(galleryImageStorageRef, file);
        // uploadedGalleryUrls.push(await getDownloadURL(galleryImageStorageRef));
        uploadedGalleryUrls.push(`https://placehold.co/600x400.png?text=NewGallery+${Date.now()}`); // Placeholder
      }
      toast({ title: 'Инфо', description: `Симулирано качване на ${galleryFiles.length} нови снимки в галерията.`});
    }
    
    dataToUpdate.photos = [...existingGalleryPhotos, ...uploadedGalleryUrls];

    try {
      const businessRef = doc(firestore, 'salons', businessId);
      await updateDoc(businessRef, dataToUpdate as any); // Use 'as any' if types don't perfectly align due to Partial
      toast({ title: 'Успех', description: 'Бизнесът е актуализиран успешно.' });
      router.push('/business/manage');
    } catch (error: any) {
      console.error('Error updating business:', error);
      toast({ title: 'Грешка', description: error.message || 'Неуспешно актуализиране на данни за бизнеса.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-6">
        <Skeleton className="h-10 w-1/4 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </CardHeader>
          <CardContent className="grid gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-40 w-full mt-4" />
            <Skeleton className="h-40 w-full mt-4" />
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!business) return null;

  return (
    <div className="container mx-auto py-10 px-6">
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Редактирай Салон: {business.name}</CardTitle>
          <CardDescription>Актуализирайте информацията, снимките и услугите за Вашия салон.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-8">
            {/* General Info Section */}
            <section>
              <h3 className="text-xl font-semibold mb-4 border-b pb-2">Основна Информация</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Име на Салона</Label>
                  <Input id="name" value={formData.name || ''} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Адрес</Label>
                  <Input id="address" value={formData.address || ''} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="city">Град</Label>
                  <Input id="city" value={formData.city || ''} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input id="phone" value={formData.phone || ''} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Имейл</Label>
                  <Input id="email" type="email" value={formData.email || ''} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="website">Уебсайт</Label>
                  <Input id="website" value={formData.website || ''} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="workingHours">Работно време</Label>
                  <Input id="workingHours" value={formData.workingHours || ''} onChange={handleInputChange} placeholder="напр. Пон - Пет: 09:00 - 18:00"/>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea id="description" value={formData.description || ''} onChange={handleInputChange} required rows={5} />
                </div>
              </div>
            </section>

            {/* Hero Image Section */}
            <section>
              <h3 className="text-xl font-semibold mb-4 border-b pb-2">Главна Снимка</h3>
              <div className="space-y-2">
                <Label htmlFor="heroImageFile" className="flex items-center gap-2 cursor-pointer text-primary hover:underline p-2 border border-dashed rounded-md justify-center hover:bg-secondary">
                    <UploadCloud size={24} /> {heroImageFile ? `Избрана: ${heroImageFile.name}` : heroImagePreview ? "Промени главната снимка" : "Качи главна снимка"}
                </Label>
                <Input id="heroImageFile" type="file" accept="image/*" onChange={handleHeroImageChange} className="sr-only" />
                {heroImagePreview && (
                  <div className="mt-2 relative w-full h-64 rounded-md overflow-hidden border group">
                    <Image src={heroImagePreview} alt="Преглед на главна снимка" layout="fill" objectFit="cover" />
                     <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={() => { setHeroImageFile(null); setHeroImagePreview(null); }}
                        title="Премахни главната снимка"
                      >
                        <Trash2 size={16} />
                      </Button>
                  </div>
                )}
              </div>
            </section>

            {/* Gallery Section */}
            <section>
              <h3 className="text-xl font-semibold mb-4 border-b pb-2">Фото Галерия</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="galleryFilesInput" className="flex items-center gap-2 cursor-pointer text-primary hover:underline p-2 border border-dashed rounded-md justify-center hover:bg-secondary">
                    <ImagePlus size={24} /> Добави снимки към галерията
                  </Label>
                  <Input id="galleryFilesInput" type="file" accept="image/*" multiple onChange={handleGalleryFilesChange} className="sr-only" />
                </div>

                {(existingGalleryPhotos.length > 0 || galleryImagePreviews.length > 0) ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {existingGalleryPhotos.map((photoUrl, index) => (
                      <div key={`existing-${index}`} className="relative group aspect-square">
                        <Image src={photoUrl} alt={`Съществуваща снимка ${index + 1}`} layout="fill" objectFit="cover" className="rounded-md border" data-ai-hint="salon interior details" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          onClick={() => removeExistingGalleryPhoto(photoUrl)}
                          title="Премахни тази снимка"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                    {galleryImagePreviews.map((previewUrl, index) => (
                      <div key={`new-${index}`} className="relative group aspect-square">
                        <Image src={previewUrl} alt={`Нова снимка ${index + 1} преглед`} layout="fill" objectFit="cover" className="rounded-md border" data-ai-hint="salon style example" />
                         <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          onClick={() => removeNewGalleryPhotoPreview(index)}
                          title="Премахни тази нова снимка"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">Галерията е празна. Добавете снимки.</p>
                )}
                 <p className="text-xs text-muted-foreground mt-2">
                    Забележка: Качването на файлове е симулирано. В реално приложение тук ще има интеграция с Firebase Storage.
                 </p>
              </div>
            </section>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full md:w-auto text-lg py-3" disabled={saving || loading}>
              {saving ? 'Запазване...' : 'Запази Промените'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

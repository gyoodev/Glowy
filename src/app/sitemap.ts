import { MetadataRoute } from 'next';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { firestore as db } from '@/lib/firebase';
import type { Salon } from '@/types';

const baseUrl = 'https://glowy.bg'; // Replace with your actual domain

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Define static pages
  const staticRoutes = [
    '',
    '/salons',
    '/contact',
    '/about-glowy',
    '/faq',
    '/terms',
    '/privacy',
    '/recommendations',
    '/login',
    '/register'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as 'monthly',
    priority: route === '' ? 1 : 0.8,
  }));


  // Fetch salon data from Firestore
  const salonsCollectionRef = collection(db, 'salons');
  const q = query(salonsCollectionRef, where('status', '==', 'approved'));
  const querySnapshot = await getDocs(q);

  const salonUrls = querySnapshot.docs.map((doc) => {
    const salonData = doc.data() as Salon;
    const salonName = salonData.name;
    const slug = salonName.replace(/\s+/g, '_');
    return {
      url: `${baseUrl}/salons/${slug}`,
      lastModified: salonData.lastUpdatedAt || salonData.createdAt || new Date(),
      changeFrequency: 'weekly' as 'weekly',
      priority: 0.9,
    };
  });

  return [...staticUrls, ...salonUrls];
}

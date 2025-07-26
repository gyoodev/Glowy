
import { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebaseAdmin'; // Use adminDb for server-side fetching
import { mapSalon } from '@/utils/mappers';
import type { Salon } from '@/types';

const baseUrl = 'https://glowy.bg'; 

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

  // Guard clause in case the admin SDK didn't initialize
  if (!adminDb) {
    console.warn("sitemap.ts: Firebase Admin SDK not initialized, returning only static routes.");
    return staticRoutes;
  }

  try {
    // Fetch salon data from Firestore using the Admin SDK
    const salonsCollectionRef = adminDb.collection('salons');
    const q = salonsCollectionRef.where('status', '==', 'approved');
    const querySnapshot = await q.get();

    const salonUrls = querySnapshot.docs.map((doc) => {
      // Using a mapper function is a good practice
      const salonData = mapSalon(doc.data(), doc.id);
      const salonName = salonData.name;
      const slug = salonName.replace(/\s+/g, '_');
      
      return {
        url: `${baseUrl}/salons/${slug}`,
        lastModified: new Date(salonData.lastUpdatedAt || salonData.createdAt || new Date()).toISOString(),
        changeFrequency: 'weekly' as 'weekly',
        priority: 0.9,
      };
    });

    return [...staticRoutes, ...salonUrls];

  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Return only static routes if there's an error fetching dynamic ones
    return staticRoutes;
  }
}

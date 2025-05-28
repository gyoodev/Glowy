import { MetadataRoute } from 'next';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { firestore as db } from '@/lib/firebase';

// Define the base URL of your application; this should match your production domain
const baseUrl = 'https://glowy.bg'; // Replace with your actual domain

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch salon data from Firestore
  const salonsCollectionRef = collection(db, 'salons');
  const querySnapshot = await getDocs(salonsCollectionRef);

  const salonUrls = querySnapshot.docs.map((doc: any) => { // Added any type for simplicity here
    const salonData = doc.data();
    const salonName = salonData.name as string;
    const slug = salonName.replace(/\s+/g, '_'); // Replace spaces with underscores
    return {
      url: `${baseUrl}/salons/${slug}`,
      lastModified: new Date(), // You might want to use a salon's update timestamp if available
      changeFrequency: 'weekly' as 'weekly',
      priority: 0.8, // Higher priority for salon pages
    };
  });

  // Define static pages
  const staticUrls = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as 'daily',
      priority: 1, // Highest priority for the home page
    },
    // Add other static pages here, e.g.:
    // {
    //   url: `${baseUrl}/about`,
    //   lastModified: new Date(),
    //   changeFrequency: 'monthly' as 'monthly',
    //   priority: 0.5,
    // },
    // {
    //   url: `${baseUrl}/contact`,
    //   lastModified: new Date(),
    //   changeFrequency: 'monthly' as 'monthly',
    //   priority: 0.5,
    // },
  ];

  // Combine static and dynamic URLs
  return [...staticUrls, ...salonUrls];
}
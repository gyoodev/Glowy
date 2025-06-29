
import type { Metadata } from 'next';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { adminDb } from '@/lib/firebaseAdmin';
import { mapSalon } from '@/utils/mappers';

// This function runs on the server to generate metadata
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const salonNameFromSlug = params.slug ? params.slug.replace(/_/g, ' ') : '';
  const defaultTitle = `${salonNameFromSlug || 'Салон'} | Glaura`;
  const defaultDescription = `Намерете най-добрите услуги и резервирайте час в ${salonNameFromSlug}.`;

  if (!adminDb || !salonNameFromSlug) {
    return { title: defaultTitle, description: defaultDescription };
  }
  
  try {
    const salonsCollectionRef = collection(adminDb, 'salons');
    const q = query(salonsCollectionRef, where('name', '==', salonNameFromSlug), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const salonDoc = querySnapshot.docs[0];
      const salon = mapSalon(salonDoc.data(), salonDoc.id);
      
      const description = salon.description 
        ? (salon.description.length > 155 ? salon.description.substring(0, 155) + '...' : salon.description)
        : defaultDescription;
      
      return {
        title: `${salon.name} - ${salon.city} | Glaura`,
        description: description,
        keywords: [salon.name, salon.city, 'салон за красота', 'резервация', ...(salon.services?.map(s => s.name) || [])],
        openGraph: {
          title: `${salon.name} | Glaura`,
          description: description,
          images: [
            {
              url: salon.heroImage || 'https://placehold.co/1200x630.png',
              width: 1200,
              height: 630,
              alt: `Снимка на ${salon.name}`,
            },
          ],
          type: 'website',
        },
      };
    }
  } catch (error) {
     console.error("Error fetching metadata for salon:", error);
  }
  
  return { title: defaultTitle, description: defaultDescription };
}

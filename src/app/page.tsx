import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { isFuture, parseISO, subDays, isWithinInterval } from 'date-fns';
import type { Salon, BusinessStatus } from '@/types';
import { firestore } from '@/lib/firebase';
import { mapSalon } from '@/utils/mappers';
import { HeroSlider } from '@/components/layout/HeroSlider';
import { slidesData } from '@/lib/hero-slides-data';
import { SalonDirectory } from '@/components/salon/SalonDirectory';
import { bulgarianRegionsAndCities, mockServices as allMockServices } from '@/lib/mock-data';
import type { CategorizedService } from '@/components/salon/filter-sidebar';
import { SiteAlertsDisplay } from '@/components/layout/SiteAlertsDisplay';

async function getInitialSalons() {
  try {
    const salonsCollectionRef = collection(firestore, 'salons');
    // PERFORMANCE OPTIMIZATION: Fetch only the top 100 salons ordered by rating initially,
    // instead of all approved salons. This reduces the initial server load and TTFB.
    const q = query(
      salonsCollectionRef, 
      where('status', '==', 'approved' as BusinessStatus),
      orderBy('rating', 'desc'), // Order by rating to get the best ones first
      limit(100) // Limit the initial fetch
    );
    const salonsSnapshot = await getDocs(q);
    const allSalons = salonsSnapshot.docs.map(doc => mapSalon(doc.data(), doc.id));
    
    const activePromoted = allSalons
        .filter(s => s.promotion?.isActive && s.promotion.expiresAt && isFuture(parseISO(s.promotion.expiresAt)))
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    
    const nonPromotedSalons = allSalons.filter(s => !activePromoted.some(p => p.id === s.id));

    const recent = nonPromotedSalons
        .filter(s => s.createdAt && isWithinInterval(new Date(s.createdAt), { start: subDays(new Date(), 30), end: new Date() }))
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
        .slice(0, 6);

    return { allSalons, promotedSalons: activePromoted, recentlyAddedSalons: recent };
  } catch (error) {
    console.error("Error fetching initial salons on server:", error);
    return { allSalons: [], promotedSalons: [], recentlyAddedSalons: [] };
  }
}

function getCategorizedServices(): CategorizedService[] {
    const categoriesMap: Record<string, { id: string; name: string }[]> = {};
    allMockServices.forEach(service => {
      if (service.category) {
        if (!categoriesMap[service.category]) {
          categoriesMap[service.category] = [];
        }
        categoriesMap[service.category].push({ id: service.id, name: service.name });
      }
    });
    return Object.keys(categoriesMap).map(categoryName => ({
      category: categoryName,
      services: categoriesMap[categoryName],
    })).sort((a, b) => a.category.localeCompare(b.category, 'bg'));
}


export default async function HomePage() {
  const { allSalons, promotedSalons, recentlyAddedSalons } = await getInitialSalons();
  const categorizedServices = getCategorizedServices();

  return (
    <div className="container mx-auto py-10 px-6">
      <SiteAlertsDisplay />
      <header className="mb-10">
        <HeroSlider slides={slidesData} />
      </header>
      <SalonDirectory
        initialSalons={allSalons}
        initialPromotedSalons={promotedSalons}
        initialRecentlyAddedSalons={recentlyAddedSalons}
        categorizedServices={categorizedServices}
        regionsAndCities={bulgarianRegionsAndCities}
      />
    </div>
  );
}

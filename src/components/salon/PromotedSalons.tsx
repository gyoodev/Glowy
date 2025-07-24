
'use client';

import type { Salon } from '@/types';
import { SalonCard } from './salon-card';
import { Gift } from 'lucide-react';

interface PromotedSalonsProps {
  salons: Salon[];
}

export function PromotedSalons({ salons }: PromotedSalonsProps) {
  if (salons.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>В момента няма промотирани салони. Потърсете, за да намерите най-добрия за вас!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        <div>
            <h2 className="text-2xl font-bold flex items-center mb-4">
                <Gift className="mr-3 h-6 w-6 text-primary" />
                Промотирани Салони
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {salons.map((salon) => (
                    <SalonCard key={salon.id} salon={salon} />
                ))}
            </div>
        </div>
        <div className="text-center py-8 text-muted-foreground">
            <p>За повече резултати, използвайте филтрите и търсачката.</p>
        </div>
    </div>
  );
}

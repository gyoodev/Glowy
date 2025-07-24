
'use client';

import type { Salon } from '@/types';
import { SalonCard } from './salon-card';
import { Gift } from 'lucide-react';

interface PromotedSalonsProps {
  salons: Salon[];
}

export function PromotedSalons({ salons }: PromotedSalonsProps) {
  if (salons.length === 0) {
    // This component now returns null if there are no promoted salons, 
    // allowing the parent to decide what to render instead.
    return null; 
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
    </div>
  );
}

'use client';

import { useState } from 'react';
import { RecommendationForm } from '@/components/ai/recommendation-form';
import { RecommendationResults } from '@/components/ai/recommendation-results';
import { recommendSalons, type RecommendSalonsInput, type RecommendSalonsOutput } from '@/ai/flows/recommend-salons';
import { useToast } from '@/hooks/use-toast';
import { Wand2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function RecommendationsPage() {
  const [recommendationOutput, setRecommendationOutput] = useState<RecommendSalonsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFormSubmit = async (data: RecommendSalonsInput) => {
    setIsLoading(true);
    setRecommendationOutput(null);
    try {
      const result = await recommendSalons(data);
      setRecommendationOutput(result);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      toast({
        title: 'Error',
        description: 'Failed to get recommendations. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-foreground mb-4 flex items-center justify-center">
         <Wand2 className="w-12 h-12 mr-3 text-primary" />
          AI-Powered Salon Picks
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Let our smart assistant curate salon and service suggestions tailored just for you. Discover hidden gems and trending treatments!
        </p>
      </header>
      
      <RecommendationForm onSubmit={handleFormSubmit} isLoading={isLoading} />

      {isLoading && (
        <div className="w-full max-w-2xl mx-auto mt-8 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6" />
          <Skeleton className="h-6 w-full" />
        </div>
      )}

      {recommendationOutput && recommendationOutput.recommendations && (
        <RecommendationResults recommendations={recommendationOutput.recommendations} />
      )}
    </div>
  );
}

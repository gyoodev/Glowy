
'use client';

import { useState } from 'react';
import { RecommendationForm } from '@/components/ai/recommendation-form';
import { RecommendationResults } from '@/components/ai/recommendation-results';
import { Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const RecommendSalonsOutputSchema = {
  recommendations: {
    _output: {} as string,
  },
};

type RecommendSalonsOutput = {
  recommendations: string;
};

export default function RecommendationsPage() {
  const [recommendationOutput, setRecommendationOutput] = useState<RecommendSalonsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
 const { toast } = useToast();
  // Define the expected type for the data from the RecommendationForm
  interface RecommendationFormData {
    userPreferences: string;
    pastBookings?: string; // Assuming pastBookings is optional as per previous error
    trendingChoices?: string;
  }


  const handleFormSubmit = async (data: RecommendationFormData) => {
    setIsLoading(true);
    setRecommendationOutput(null);
    try {
      const response = await fetch('/api/recommend-salons', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 },
 body: JSON.stringify({
 ...data,
 pastBookings: data.pastBookings || '', // Ensure pastBookings is always a string
 }),
      });
      toast({
        title: 'Препоръките са генерирани',
        description: 'Разгледайте персонализираните си предложения по-долу.',
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      const result = await response.json();
      setRecommendationOutput(result);
    } catch (error) {
      console.error('Грешка при получаване на препоръки:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно получаване на препоръки. Моля, опитайте отново.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-6">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-foreground mb-4 flex items-center justify-center">
         <Wand2 className="w-12 h-12 mr-3 text-primary" />
          AI Препоръки за Салони
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Позволете на нашия интелигентен асистент да подбере предложения за салони и услуги, съобразени специално с Вас. Открийте скрити бижута и модерни процедури!
        </p>
      </header>
      
      <RecommendationForm onSubmit={handleFormSubmit} isLoading={isLoading} />

      {recommendationOutput && recommendationOutput.recommendations && (
        <RecommendationResults recommendations={recommendationOutput.recommendations} />
      )}
    </div>
  );
}


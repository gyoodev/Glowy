import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award } from 'lucide-react';

interface RecommendationResultsProps {
  recommendations: string;
}

export function RecommendationResults({ recommendations }: RecommendationResultsProps) {
  // Simple formatting: split by newline and render as paragraphs
  const formattedRecommendations = recommendations.split('\n').map((line, index) => (
    <p key={index} className="mb-2 last:mb-0 leading-relaxed">
      {line}
    </p>
  ));

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8 shadow-lg animate-in fade-in-50 duration-500">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <Award className="mr-2 h-6 w-6 text-primary" />
          Вашите Персонализирани Препоръки
        </CardTitle>
        <CardDescription>
          Въз основа на Вашата информация, ето някои салони и услуги, които може да Ви харесат:
        </CardDescription>
      </CardHeader>
      <CardContent className="prose prose-sm max-w-none text-foreground">
        {formattedRecommendations}
      </CardContent>
    </Card>
  );
}

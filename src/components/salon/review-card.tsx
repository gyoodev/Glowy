import type { Review } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center space-x-3 pb-3">
        <Avatar>
          <AvatarImage src={review.userAvatar || `https://placehold.co/40x40.png?text=${review.userName.charAt(0)}`} alt={review.userName} data-ai-hint="person portrait" />
          <AvatarFallback>{review.userName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-base font-semibold">{review.userName}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(review.date), { addSuffix: true })}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50'}`}
            />
          ))}
        </div>
        <p className="text-sm text-foreground leading-relaxed">{review.comment}</p>
      </CardContent>
    </Card>
  );
}

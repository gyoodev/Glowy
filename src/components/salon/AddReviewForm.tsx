'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface AddReviewFormProps {
  onAddReview: (rating: number, comment: string) => void;
  onCancel: () => void;
}

const AddReviewForm: React.FC<AddReviewFormProps> = ({ onAddReview, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = () => {
    if (rating === 0) {
      // Optionally show a toast or message asking for a rating
      return;
    }
    onAddReview(rating, comment);
    setRating(0);
    setComment('');
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="rating" className="block text-sm font-medium text-foreground mb-2">
          Оценка (1-5 звезди)
        </Label>
        <div className="flex items-center" data-ai-hint="Star rating input">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                'h-6 w-6 cursor-pointer transition-colors duration-200',
                (hoverRating || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'
              )}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
            />
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="comment" className="block text-sm font-medium text-foreground mb-2">
          Вашият коментар
        </Label>
        <Textarea
          id="comment"
          placeholder="Разкажете за Вашия опит..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          data-ai-hint="Review comment text area"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel} data-ai-hint="Cancel review button">
          Откажи
        </Button>
        <Button onClick={handleSubmit} disabled={rating === 0} data-ai-hint="Submit review button">
          Изпрати Отзив
        </Button>
      </div>
    </div>
  );
};

export default AddReviewForm;
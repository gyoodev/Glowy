
import {z} from 'genkit';

export const RecommendSalonsInputSchema = z.object({
  userPreferences: z
    .string()
    .describe('The user preferences for salon services, e.g., preferred service types, price range, location.'),
  pastBookings: z
    .string()
    .optional()
    .describe('The user past booking history with salon, including salon names, services, and dates.'),
  trendingChoices: z
    .string()
    .optional()
    .describe('Trending salon choices among other users, including popular services and salons in specific locations.'),
});
export type RecommendSalonsInput = z.infer<typeof RecommendSalonsInputSchema>;

export const RecommendSalonsOutputSchema = z.object({
  recommendations: z
    .string()
    .optional()
    .describe('A list of recommended salons and services based on the user preferences, past bookings, and trending choices.'),
  error: z.string().optional().describe('An error message if the recommendation failed.'),
});
export type RecommendSalonsOutput = z.infer<typeof RecommendSalonsOutputSchema>;

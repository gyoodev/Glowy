'use server';

/**
 * @fileOverview Salon recommendation AI agent.
 *
 * - recommendSalons - A function that handles the salon recommendation process.
 * - RecommendSalonsInput - The input type for the recommendSalons function.
 * - RecommendSalonsOutput - The return type for the recommendSalons function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendSalonsInputSchema = z.object({
  userPreferences: z
    .string()
    .describe('The user preferences for salon services, e.g., preferred service types, price range, location.'),
  pastBookings: z
    .string()
    .describe('The user past booking history with salon, including salon names, services, and dates.'),
  trendingChoices: z
    .string()
    .describe('Trending salon choices among other users, including popular services and salons in specific locations.'),
});
export type RecommendSalonsInput = z.infer<typeof RecommendSalonsInputSchema>;

const RecommendSalonsOutputSchema = z.object({
  recommendations: z
    .string()
    .describe('A list of recommended salons and services based on the user preferences, past bookings, and trending choices.'),
});
export type RecommendSalonsOutput = z.infer<typeof RecommendSalonsOutputSchema>;

export async function recommendSalons(input: RecommendSalonsInput): Promise<RecommendSalonsOutput> {
  return recommendSalonsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendSalonsPrompt',
  input: {schema: RecommendSalonsInputSchema},
  output: {schema: RecommendSalonsOutputSchema},
  prompt: `You are an AI beauty consultant. Based on user preferences, past bookings and current trending choices, recommend salons and services to the user.

User Preferences: {{{userPreferences}}}
Past Bookings: {{{pastBookings}}}
Trending Choices: {{{trendingChoices}}}

Recommendations:`, // Handlebars syntax is used here
});

const recommendSalonsFlow = ai.defineFlow(
  {
    name: 'recommendSalonsFlow',
    inputSchema: RecommendSalonsInputSchema,
    outputSchema: RecommendSalonsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

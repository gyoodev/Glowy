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
    .optional()
    .describe('A list of recommended salons and services based on the user preferences, past bookings, and trending choices.'),
  error: z.string().optional().describe('An error message if the recommendation failed.'),
});
export type RecommendSalonsOutput = z.infer<typeof RecommendSalonsOutputSchema>;

export async function recommendSalons(input: RecommendSalonsInput): Promise<RecommendSalonsOutput> {
  try {
    const result = await recommendSalonsFlow(input);
    // The flow now directly returns the output schema.
    return result;
  } catch (e: any) {
    console.error("Error directly in recommendSalons exported function:", e);
    return { error: e.message || "Failed to generate recommendations due to an unexpected error." };
  }
}

const prompt = ai.definePrompt({
  name: 'recommendSalonsPrompt',
  input: {schema: RecommendSalonsInputSchema},
  output: {schema: RecommendSalonsOutputSchema}, // Output schema for prompt
  prompt: `You are an AI beauty consultant. Based on user preferences, past bookings and current trending choices, recommend salons and services to the user.

User Preferences: {{{userPreferences}}}
Past Bookings: {{{pastBookings}}}
Trending Choices: {{{trendingChoices}}}

Recommendations:`,
});

const recommendSalonsFlow = ai.defineFlow(
  {
    name: 'recommendSalonsFlow',
    inputSchema: RecommendSalonsInputSchema,
    // The flow's direct output schema does not include the error field.
    outputSchema: z.object({ recommendations: z.string() }),
  },
  async (input): Promise<{ recommendations: string }> => {
    const {output} = await prompt(input);
    if (!output || !output.recommendations) {
        throw new Error("AI did not return recommendations.");
    }
    return { recommendations: output.recommendations };
  }
);
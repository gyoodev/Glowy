
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
    return { recommendations: result.recommendations };
  } catch (e: any) {
    console.error("Error in recommendSalons flow execution:", e);
    let errorMessage = "Failed to generate recommendations due to an unexpected error.";
    if (typeof e?.message === 'string') {
      errorMessage = e.message;
    } else if (typeof e === 'string') {
      errorMessage = e;
    } else if (e && typeof e.toString === 'function') {
      errorMessage = e.toString();
    }
    return { error: errorMessage };
  }
}

const prompt = ai.definePrompt({
  name: 'recommendSalonsPrompt',
  input: {schema: RecommendSalonsInputSchema},
  output: {schema: z.object({ recommendations: z.string().optional() })}, // Allow optional here, flow will handle if required
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
    outputSchema: z.object({ recommendations: z.string() }), // Flow requires recommendations
  },
  async (input): Promise<{ recommendations: string }> => {
    const {output} = await prompt(input);
    if (!output || typeof output.recommendations !== 'string' || output.recommendations.trim() === '') {
        throw new Error("AI did not return valid recommendations.");
    }
    return { recommendations: output.recommendations };
  }
);

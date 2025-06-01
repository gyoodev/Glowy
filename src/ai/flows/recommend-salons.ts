
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

export const RecommendSalonsInputSchema = z.object({
  userPreferences: z
    .string()
    .describe('The user preferences for salon services, e.g., preferred service types, price range, location.'),
  pastBookings: z
    .string()
    .optional() // Marking as optional based on schema
    .describe('The user past booking history with salon, including salon names, services, and dates.'),
  trendingChoices: z
    .string()
    .optional() // Marking as optional based on schema
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
    const result = await recommendSalonsFlow(input); // result.recommendations is now string | undefined
    // The RecommendSalonsOutputSchema already has recommendations as optional, so this is fine.
    return { recommendations: result.recommendations };
  } catch (e: unknown) {
    console.error("Error in recommendSalons flow execution.");
    let errorMessage = "Failed to generate recommendations due to an unexpected error.";

    if (e instanceof Error) {
      console.error("Error Type:", e.name);
      console.error("Error Message:", e.message);
      console.error("Error Stack:", e.stack);
      errorMessage = e.message; // Use the error's message
    } else if (typeof e === 'string') {
        console.error("Error (string):", e);
        errorMessage = e;
    } else {
      console.error("Error (unknown type):", JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
    }
    return { error: errorMessage };
  }
}

const prompt = ai.definePrompt({
  name: 'recommendSalonsPrompt',
  input: {schema: RecommendSalonsInputSchema},
  output: {schema: z.object({ recommendations: z.string().optional() })},
  prompt: `You are an AI beauty consultant. Based on user preferences, past bookings and current trending choices, recommend salons and services to the user.

User Preferences: {{{userPreferences}}}
{{#if pastBookings}}Past Bookings: {{{pastBookings}}}{{/if}}
{{#if trendingChoices}}Trending Choices: {{{trendingChoices}}}{{/if}}

Recommendations:`,
});

const recommendSalonsFlow = ai.defineFlow(
  {
    name: 'recommendSalonsFlow',
    inputSchema: RecommendSalonsInputSchema,
    outputSchema: z.object({ recommendations: z.string().optional() }), // Made recommendations optional here
  },
  async (input): Promise<{ recommendations?: string }> => { // Return type also reflects optional recommendations
    const {output} = await prompt(input);
    // If output.recommendations is a string and it's empty after trimming,
    // we might want to treat it as 'no recommendation' (undefined) or throw an error.
    // For now, we'll pass through what the prompt gives, including an empty string if that's what it returns.
    // If the prompt returns undefined for recommendations, output.recommendations will be undefined.
    if (output && typeof output.recommendations === 'string' && output.recommendations.trim() === '') {
      // Optionally, to be strict like before and consider an empty string an error:
      // throw new Error("AI returned an empty recommendation string.");
      // Or, to treat empty string as 'no recommendation' (undefined):
      // return { recommendations: undefined };
    }
    return { recommendations: output?.recommendations };
  }
);

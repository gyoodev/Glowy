
'use server';

/**
 * @fileOverview Salon recommendation AI agent.
 *
 * - recommendSalons - A function that handles the salon recommendation process.
 * - RecommendSalonsInput - The input type for the recommendSalons function (imported from schemas).
 * - RecommendSalonsOutput - The return type for the recommendSalons function (imported from schemas).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
  RecommendSalonsInputSchema,
  type RecommendSalonsInput,
  // RecommendSalonsOutputSchema, // Not directly used for flow's outputSchema
  type RecommendSalonsOutput
} from '@/ai/schemas/recommend-salons-schemas';

export type { RecommendSalonsInput, RecommendSalonsOutput }; // Re-export types

export async function recommendSalons(input: RecommendSalonsInput): Promise<RecommendSalonsOutput> {
  try {
    const result = await recommendSalonsFlow(input);
    return { recommendations: result.recommendations };
  } catch (e: unknown) {
    console.error("Error in recommendSalons flow execution.");
    let errorMessage = "Failed to generate recommendations due to an unexpected error.";

    if (e instanceof Error) {
      console.error("Error Type:", e.name);
      console.error("Error Message:", e.message);
      console.error("Error Stack:", e.stack);
      errorMessage = e.message;
    } else if (typeof e === 'string') {
        console.error("Error (string):", e);
        errorMessage = e;
    } else {
      console.error("Error (unknown type):", JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
    }
    return { error: errorMessage };
  }
}

const PromptOutputSchema = z.object({ recommendations: z.string().optional() });

const prompt = ai.definePrompt({
  name: 'recommendSalonsPrompt',
  input: {schema: RecommendSalonsInputSchema},
  output: {schema: PromptOutputSchema },
  prompt: `You are an AI beauty consultant. Based on user preferences, past bookings and current trending choices, recommend salons and services to the user.

User Preferences: {{{userPreferences}}}
{{#if pastBookings}}Past Bookings: {{{pastBookings}}}{{/if}}
{{#if trendingChoices}}Trending Choices: {{{trendingChoices}}}{{/if}}

Recommendations:`,
});

// This schema should match the actual return type of the flow's async function
const FlowOutputSchema = z.object({ recommendations: z.string().optional() });

const recommendSalonsFlow = ai.defineFlow(
  {
    name: 'recommendSalonsFlow',
    inputSchema: RecommendSalonsInputSchema,
    outputSchema: FlowOutputSchema,
  },
  async (input): Promise<{ recommendations?: string }> => {
    const {output} = await prompt(input);
    if (output && typeof output.recommendations === 'string' && output.recommendations.trim() === '') {
      // return { recommendations: undefined }; // Or handle as per desired logic
    }
    return { recommendations: output?.recommendations };
  }
);

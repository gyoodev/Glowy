
'use server';

/**
 * @fileOverview AI agent that generates a compelling salon description.
 *
 * - generateSalonDescription - A function that handles the salon description generation.
 * - GenerateSalonDescriptionInput - The input type (imported).
 * - GenerateSalonDescriptionOutput - The return type (imported).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
  GenerateSalonDescriptionInputSchema,
  type GenerateSalonDescriptionInput,
  // GenerateSalonDescriptionOutputSchema, // Not directly used for flow's outputSchema
  type GenerateSalonDescriptionOutput
} from '@/ai/schemas/generate-salon-description-schemas';

export type { GenerateSalonDescriptionInput, GenerateSalonDescriptionOutput }; // Re-export types

export async function generateSalonDescription(
  input: GenerateSalonDescriptionInput
): Promise<GenerateSalonDescriptionOutput> {
  try {
    const result = await generateSalonDescriptionFlow(input);
    return { salonDescription: result.salonDescription };
  } catch (e: unknown) {
    console.error("Error in generateSalonDescription flow execution.");
    let errorMessage = "An unexpected error occurred during salon description generation.";

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

// This schema should match what the prompt directly produces.
const PromptOutputSchema = z.object({ salonDescription: z.string().optional() });

const prompt = ai.definePrompt({
  name: 'generateSalonDescriptionPrompt',
  input: {schema: GenerateSalonDescriptionInputSchema},
  output: {schema: PromptOutputSchema}, 
  prompt: `You are an expert marketing copywriter for beauty salons. Your task is to create a compelling and attractive description for a salon based on the information provided.

Salon Name: {{salonName}}
Services: {{serviceDescription}}
Atmosphere: {{atmosphereDescription}}
Target Customer: {{targetCustomerDescription}}
Unique Selling Points: {{uniqueSellingPoints}}

Write a salon description that will attract customers and highlight the unique qualities of the salon. The description should be concise, engaging, and no more than 150 words.
`,
});

// This schema should match what the flow's async function returns.
const FlowOutputSchema = z.object({ salonDescription: z.string() });

const generateSalonDescriptionFlow = ai.defineFlow(
  {
    name: 'generateSalonDescriptionFlow',
    inputSchema: GenerateSalonDescriptionInputSchema,
    outputSchema: FlowOutputSchema, 
  },
  async (input): Promise<{ salonDescription: string }> => {
    const {output} = await prompt(input);
    if (!output || typeof output.salonDescription !== 'string' || output.salonDescription.trim() === '') {
        throw new Error("AI did not return a valid salon description.");
    }
    return { salonDescription: output.salonDescription };
  }
);

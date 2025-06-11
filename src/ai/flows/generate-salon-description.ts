
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
  prompt: `Ти си експерт маркетинг копирайтър за козметични салони. Твоята задача е да създадеш завладяващо и привлекателно описание за салон въз основа на предоставената информация.

Име на салона: {{salonName}}
Услуги: {{serviceDescription}}
Атмосфера: {{atmosphereDescription}}
Целеви клиент: {{targetCustomerDescription}}
Уникални предимства: {{uniqueSellingPoints}}

Напиши описание на салона, което ще привлече клиенти и ще подчертае уникалните качества на салона. Описанието трябва да е кратко, ангажиращо и не повече от 150 думи. Моля, генерирайте описанието на български език.
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
        throw new Error("AI не върна валидно описание на салона.");
    }
    return { salonDescription: output.salonDescription };
  }
);

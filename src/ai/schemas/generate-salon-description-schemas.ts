
import {z} from 'genkit';

export const GenerateSalonDescriptionInputSchema = z.object({
  salonName: z.string().describe('The name of the salon.'),
  serviceDescription: z.string().describe('Detailed description of the salon services.'),
  atmosphereDescription: z.string().describe('Description of the salon atmosphere.'),
  targetCustomerDescription: z.string().describe('Description of the target customer.'),
  uniqueSellingPoints: z.string().describe('Unique selling points of the salon.'),
});
export type GenerateSalonDescriptionInput = z.infer<typeof GenerateSalonDescriptionInputSchema>;

export const GenerateSalonDescriptionOutputSchema = z.object({
  salonDescription: z.string().optional().describe('A compelling description of the salon.'),
  error: z.string().optional().describe('An error message if the generation failed.'),
});
export type GenerateSalonDescriptionOutput = z.infer<typeof GenerateSalonDescriptionOutputSchema>;

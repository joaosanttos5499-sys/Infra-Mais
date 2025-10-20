'use server';

/**
 * @fileOverview Summarizes a user report for a city employee.
 *
 * - summarizeReport - A function that takes a report and summarizes it.
 * - SummarizeReportInput - The input type for the summarizeReport function.
 * - SummarizeReportOutput - The return type for the summarizeReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeReportInputSchema = z.object({
  description: z.string().describe('The description of the infrastructure problem.'),
  photoDataUri: z
    .string()
    .describe(
      'A photo of the infrastructure problem, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
    ),
  location: z.string().describe('The location of the infrastructure problem.'),
  category: z.string().describe('The category of the infrastructure problem (e.g., potholes, broken streetlights, water leaks).'),
});
export type SummarizeReportInput = z.infer<typeof SummarizeReportInputSchema>;

const SummarizeReportOutputSchema = z.object({
  summary: z.string().describe('A short summary of the infrastructure problem.'),
});
export type SummarizeReportOutput = z.infer<typeof SummarizeReportOutputSchema>;

export async function summarizeReport(input: SummarizeReportInput): Promise<SummarizeReportOutput> {
  return summarizeReportFlow(input);
}

const summarizeReportPrompt = ai.definePrompt({
  name: 'summarizeReportPrompt',
  input: {schema: SummarizeReportInputSchema},
  output: {schema: SummarizeReportOutputSchema},
  prompt: `You are a city employee who needs to understand infrastructure problems reported by citizens.

  Please summarize the following report so that another city employee can quickly understand the issue.

  Category: {{{category}}}
  Location: {{{location}}}
  Description: {{{description}}}
  Photo: {{media url=photoDataUri}}
  \n  Summary:`, 
});

const summarizeReportFlow = ai.defineFlow(
  {
    name: 'summarizeReportFlow',
    inputSchema: SummarizeReportInputSchema,
    outputSchema: SummarizeReportOutputSchema,
  },
  async input => {
    const {output} = await summarizeReportPrompt(input);
    return output!;
  }
);

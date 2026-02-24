/**
 * Generate Daily Summary Flow
 * This module handles the AI generation of daily summaries for doctors and clinic-wide reports
 */

const { ai } = require('../genkit');
const { z } = require('genkit');

// Define the schema for the input data
const DailySummaryInputSchema = z.object({
    date: z.string().describe('The date for which the summary is being generated, in YYYY-MM-DD format.'),
    doctorName: z.string().optional().describe('The name of the doctor for whom the summary is being generated. If not provided, the summary is for the entire clinic.'),
    totalAppointments: z.number().describe('The total number of appointments for the day.'),
    confirmed: z.number().describe('The number of confirmed appointments.'),
    pending: z.number().describe('The number of pending appointments.'),
    cancelled: z.number().describe('The number of cancelled appointments.'),
    newPatients: z.number().describe('The number of new patients with appointments today.'),
    returningPatients: z.number().describe('The number of returning patients who had appointments today.'),
    topServices: z.array(z.object({
        name: z.string(),
        count: z.number(),
    })).describe('A list of the most frequent services provided today.'),
    doctorLoad: z.array(z.object({
        name: z.string(),
        count: z.number(),
    })).optional().describe('A breakdown of appointments per doctor. Only provided for clinic-wide summaries.'),
});

// Define the Genkit flow
const dailySummaryFlow = ai.defineFlow(
    {
        name: 'dailySummaryFlow',
        inputSchema: DailySummaryInputSchema,
        outputSchema: z.string(), // The flow will output a raw string
    },
    async (input) => {
        try {
            // Create the prompt text directly
            const promptText = `You are a helpful clinic management assistant.
Your task is to write a concise daily briefing in markdown format based on the provided data.

${input.doctorName ? `Start with a heading like "# Daily Briefing for Dr. ${input.doctorName} on ${input.date}".` : `Start with a heading like "# Clinic-Wide Daily Briefing for ${input.date}".`}

Use bullet points for key stats.
End with a short, insightful analysis paragraph.

Here is the data for your analysis:
Date: ${input.date}
${input.doctorName ? `Summary for: Dr. ${input.doctorName}` : ''}
Total Appointments: ${input.totalAppointments}.
Confirmed: ${input.confirmed}. Pending: ${input.pending}. Cancelled: ${input.cancelled}.
Patient Mix: ${input.newPatients} new, ${input.returningPatients} returning.
Top Services: ${input.topServices.map(service => `${service.name} (${service.count})`).join(', ')}.
${input.doctorLoad ? `Doctor Workload: ${input.doctorLoad.map(doctor => `Dr. ${doctor.name} (${doctor.count})`).join(', ')}.` : ''}

Generate the markdown summary now.`;

            // Use ai.generate directly instead of definePrompt
            const result = await ai.generate({
                prompt: promptText,
                model: 'googleai/gemini-2.0-flash-exp',
            });

            if (!result.text) {
                throw new Error("AI returned an empty response.");
            }
            return result.text;
        } catch (e) {
            console.error(`Error generating summary in flow for date ${input.date}:`, e);
            // Throw a new error to be caught by the API route
            throw new Error(`Could not generate a summary. Details: ${e.message}`);
        }
    }
);

/**
 * The main export function
 * @param {Object} input The daily summary data
 * @returns {Promise<string>} A promise that resolves to the markdown summary as a string
 */
async function generateDailySummary(input) {
    return dailySummaryFlow(input);
}

module.exports = {
    generateDailySummary
};







/**
 * Improve Text Flow
 * This module handles the AI improvement of text content
 */

const { ai } = require('../genkit');
const { z } = require('genkit');

const ImproveTextInputSchema = z.object({
    text: z.string().describe('The original text to be improved.'),
    context: z.string().optional().describe('The context of the text, e.g., "a doctor\'s biography", "a service description", "appointment notes".'),
});

const ImproveTextOutputSchema = z.object({
    improvedText: z.string().describe('The improved and revised text.'),
});

const improveTextFlow = ai.defineFlow(
    {
        name: 'improveTextFlow',
        inputSchema: ImproveTextInputSchema,
        outputSchema: ImproveTextOutputSchema,
    },
    async (input) => {
        try {
            if (!input.text.trim()) {
                return { improvedText: '' };
            }

            // Create the prompt text directly
            const promptText = `You are an expert copy editor. Your task is to revise the following text.
You must improve its clarity, grammar, spelling, and overall readability while preserving the original meaning and key information.
The tone should be professional and engaging.

${input.context ? `The text is for a specific context: ${input.context}. Please tailor your improvements to fit this context.` : ''}

Original Text:
"${input.text}"

Rewrite the text and provide only the improved version. Do not add any commentary or explanation.`;

            // Use ai.generate directly
            const result = await ai.generate({
                prompt: promptText,
                model: 'googleai/gemini-2.0-flash-exp',
            });

            if (!result.text) {
                throw new Error("AI returned an empty response.");
            }

            return { improvedText: result.text };
        } catch (e) {
            console.error(`Error improving text:`, e);
            throw new Error(`Could not improve text. Details: ${e.message}`);
        }
    }
);

/**
 * The main export function
 * @param {Object} input The text improvement data
 * @returns {Promise<Object>} A promise that resolves to the improved text object
 */
async function improveText(input) {
    return improveTextFlow(input);
}

module.exports = {
    improveText
};
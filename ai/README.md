# AI System - Genkit Integration

This directory contains the AI-powered features for the SRM Backend using Google's Genkit framework.

## Overview

The AI system provides two main capabilities:

1. **Daily Summary Generation** - Automated daily briefings for doctors and clinic-wide operations
2. **Text Improvement** - AI-powered text enhancement for better clarity and professionalism

## Setup

### 1. Install Dependencies

```bash
npm install genkit @genkit-ai/googleai
```

### 2. Configure Environment Variables

Add to your `.env` file:

```env
GOOGLE_AI_API_KEY=your-google-ai-api-key-here
```

### 3. Get Google AI API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your environment variables

## Files Structure

```
ai/
├── genkit.js              # Main Genkit configuration
├── dev.js                 # Development imports
└── flows/
    ├── generate-summary-flow.js  # Daily summary generation
    └── improve-text-flow.js      # Text improvement
```

## Usage

### Daily Summary Generation

**Endpoint:** `POST /api/actions/generate-summary`

**Input:**

```json
{
  "date": "2025-01-15",
  "doctorName": "Dr. Smith", // Optional - omit for clinic-wide
  "totalAppointments": 12,
  "confirmed": 10,
  "pending": 1,
  "cancelled": 1,
  "newPatients": 3,
  "returningPatients": 9,
  "topServices": [
    { "name": "Consultation", "count": 8 },
    { "name": "Follow-up", "count": 4 }
  ],
  "doctorLoad": [
    // Only for clinic-wide summaries
    { "name": "Dr. Smith", "count": 6 },
    { "name": "Dr. Johnson", "count": 6 }
  ]
}
```

**Output:**

```markdown
# Daily Briefing for Dr. Smith on 2025-01-15

• **Total Appointments:** 12
• **Confirmed:** 10 | **Pending:** 1 | **Cancelled:** 1
• **Patient Mix:** 3 new, 9 returning

## Top Services

- Consultation (8 appointments)
- Follow-up (4 appointments)

## Analysis

High confirmation rate of 83.3% indicates strong patient engagement...
```

### Text Improvement

**Endpoint:** `POST /api/actions/improve-text`

**Input:**

```json
{
  "text": "dr smith is a good doctor who helps patients",
  "context": "doctor biography" // Optional
}
```

**Output:**

```json
{
  "success": true,
  "data": {
    "improvedText": "Dr. Smith is an excellent physician dedicated to providing comprehensive patient care with expertise and compassion."
  }
}
```

## Access Control

- **Generate Summary:** Admin users can generate clinic-wide summaries, doctors can generate personal summaries
- **Improve Text:** Available to all authenticated users

## Genkit Features

### Prompts

- Structured prompts with Handlebars templating
- Type-safe input/output schemas using Zod
- Contextual AI responses

### Flows

- Error handling and validation
- Structured data processing
- Consistent response formats

### Models

- Uses Google's Gemini 2.0 Flash model
- Optimized for medical practice management context
- Professional tone and medical terminology awareness

## Development

### Testing Flows Locally

```bash
# Install Genkit CLI
npm install -g genkit

# Start Genkit dev server
genkit start -- node ai/dev.js
```

### Monitoring

- All AI requests are logged via LogService
- Performance metrics tracked
- Error handling with detailed logging

## Security

- API keys secured via environment variables
- Input validation using Zod schemas
- Rate limiting on AI endpoints
- Activity logging for audit trails

## Error Handling

The system includes comprehensive error handling:

- Input validation errors
- AI service unavailability
- Token limit exceeded
- Network connectivity issues

All errors are logged and return user-friendly messages while preserving technical details for debugging.

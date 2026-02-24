# Prescription Settings API - Testing Guide

This document provides curl commands and test scenarios for the prescription settings API.

## Prerequisites

1. **Running Server**: Ensure backend server is running on port 9002 (or your configured port)
2. **Valid JWT Token**: Obtain a valid JWT token by logging in through `/api/auth/login`
3. **Authentication**: All endpoints require authentication

## Getting a JWT Token

First, login to get a JWT token:

```bash
curl -X POST http://localhost:9002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@example.com",
    "password": "your_password"
  }'
```

Copy the `token` from the response and use it in the commands below (replace `<JWT_TOKEN>`).

---

## Test Scenarios

### 1. GET Settings (No Settings Exist - Expect 404)

**Purpose**: Verify that the API returns 404 when a doctor has no saved settings

```bash
curl -X GET http://localhost:9002/api/prescription-settings \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Expected Response** (404):
```json
{
  "success": false,
  "message": "Settings not found, using defaults"
}
```

---

### 2. POST Create Settings (Expect 201)

**Purpose**: Create new prescription settings for the authenticated doctor

```bash
curl -X POST http://localhost:9002/api/prescription-settings \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "headerColor": "#2563eb",
    "logoShape": "circle",
    "fontStyle": "Arial, sans-serif",
    "fontSize": 100,
    "textColor": "#000000"
  }'
```

**Expected Response** (201):
```json
{
  "success": true,
  "message": "Settings created successfully",
  "data": {
    "_id": "...",
    "headerColor": "#2563eb",
    "logoShape": "circle",
    "fontStyle": "Arial, sans-serif",
    "fontSize": 100,
    "textColor": "#000000"
  }
}
```

---

### 3. GET Settings (Settings Exist - Expect 200)

**Purpose**: Retrieve existing settings after creation

```bash
curl -X GET http://localhost:9002/api/prescription-settings \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Expected Response** (200):
```json
{
  "success": true,
  "data": {
    "headerColor": "#2563eb",
    "logoShape": "circle",
    "fontStyle": "Arial, sans-serif",
    "fontSize": 100,
    "textColor": "#000000"
  }
}
```

---

### 4. PUT Update Settings - Full Update (Expect 200)

**Purpose**: Update all settings fields

```bash
curl -X PUT http://localhost:9002/api/prescription-settings \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "headerColor": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "logoShape": "square",
    "fontStyle": "Georgia, serif",
    "fontSize": 110,
    "textColor": "#1e3a8a"
  }'
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "_id": "...",
    "headerColor": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "logoShape": "square",
    "fontStyle": "Georgia, serif",
    "fontSize": 110,
    "textColor": "#1e3a8a",
    "updatedAt": "2024-01-15T11:45:00Z"
  }
}
```

---

### 5. PUT Update Settings - Partial Update (Expect 200)

**Purpose**: Update only specific fields

```bash
curl -X PUT http://localhost:9002/api/prescription-settings \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "fontSize": 95,
    "textColor": "#374151"
  }'
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "_id": "...",
    "headerColor": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "logoShape": "square",
    "fontStyle": "Georgia, serif",
    "fontSize": 95,
    "textColor": "#374151",
    "updatedAt": "..."
  }
}
```

---

### 6. DELETE Settings (Expect 200)

**Purpose**: Reset settings to defaults by deleting the document

```bash
curl -X DELETE http://localhost:9002/api/prescription-settings \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Settings reset to defaults"
}
```

---

## Validation Tests

### 7. Invalid Font Size (Out of Range - Expect 400)

**Purpose**: Test validation for fontSize outside allowed range (80-120)

```bash
curl -X POST http://localhost:9002/api/prescription-settings \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "headerColor": "#000000",
    "logoShape": "circle",
    "fontStyle": "Arial",
    "fontSize": 150,
    "textColor": "#000000"
  }'
```

**Expected Response** (400):
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "fontSize": "Path `fontSize` (150) is more than maximum allowed value (120)."
  }
}
```

---

### 8. Invalid Logo Shape (Expect 400)

**Purpose**: Test validation for invalid enum value

```bash
curl -X POST http://localhost:9002/api/prescription-settings \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "headerColor": "#000000",
    "logoShape": "triangle",
    "fontStyle": "Arial",
    "fontSize": 100,
    "textColor": "#000000"
  }'
```

**Expected Response** (400):
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "logoShape": "`triangle` is not a valid enum value for path `logoShape`."
  }
}
```

---

### 9. Duplicate Creation (Expect 400)

**Purpose**: Test that creating settings when they already exist returns an error

```bash
# First create settings
curl -X POST http://localhost:9002/api/prescription-settings \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "headerColor": "#000000",
    "logoShape": "circle",
    "fontStyle": "Arial",
    "fontSize": 100,
    "textColor": "#000000"
  }'

# Try to create again
curl -X POST http://localhost:9002/api/prescription-settings \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "headerColor": "#111111",
    "logoShape": "square",
    "fontStyle": "Georgia",
    "fontSize": 110,
    "textColor": "#111111"
  }'
```

**Expected Response** (400):
```json
{
  "success": false,
  "message": "Settings already exist. Use PUT to update."
}
```

---

### 10. Unauthorized Access (No Token - Expect 401)

**Purpose**: Test that endpoints are protected and require authentication

```bash
curl -X GET http://localhost:9002/api/prescription-settings
```

**Expected Response** (401):
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

---

## Default Values

When no settings are saved, the frontend should use these defaults:

```javascript
{
  headerColor: '#0d9488',
  logoShape: 'circle',
  fontStyle: 'system-ui, -apple-system, sans-serif',
  fontSize: 100,
  textColor: '#000000'
}
```

---

## Database Verification

After running tests, you can verify the data in MongoDB:

```bash
# Connect to MongoDB
mongosh

# Use your database
use srk_arnkin

# View all prescription settings
db.prescription_settings.find().pretty()

# Find settings for a specific doctor
db.prescription_settings.findOne({ doctor_id: ObjectId("your_doctor_id") })

# Count total settings
db.prescription_settings.countDocuments()
```

---

## Testing Checklist

- [ ] GET returns 404 when no settings exist
- [ ] POST creates new settings successfully
- [ ] POST returns 400 when settings already exist
- [ ] GET returns 200 with data after creation
- [ ] PUT updates all fields successfully
- [ ] PUT updates partial fields successfully
- [ ] PUT returns 404 when no settings exist
- [ ] DELETE removes settings successfully
- [ ] Validation rejects fontSize < 80
- [ ] Validation rejects fontSize > 120
- [ ] Validation rejects invalid logoShape
- [ ] Unauthorized requests return 401
- [ ] Settings are isolated per doctor (test with multiple doctors)

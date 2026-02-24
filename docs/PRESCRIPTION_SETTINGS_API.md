# Prescription Settings API Documentation

## Overview

The Prescription Settings API allows authenticated doctors to customize and persist their prescription template style settings including header color, logo shape, font style, font size, and text color.

**Base URL**: `/api/prescription-settings`

**Authentication**: All endpoints require JWT authentication via `Authorization: Bearer <token>` header

---

## Endpoints

### GET `/api/prescription-settings`

Retrieve prescription settings for the authenticated doctor.

#### Request

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters**: None

#### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "data": {
    "headerColor": "#0d9488",
    "logoShape": "circle",
    "fontStyle": "system-ui, -apple-system, sans-serif",
    "fontSize": 100,
    "textColor": "#000000"
  }
}
```

**Not Found (404)**:
```json
{
  "success": false,
  "message": "Settings not found, using defaults"
}
```

**Unauthorized (401)**:
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

---

### POST `/api/prescription-settings`

Create new prescription settings for the authenticated doctor.

#### Request

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body**:
```json
{
  "headerColor": "#2563eb",
  "logoShape": "circle",
  "fontStyle": "Arial, sans-serif",
  "fontSize": 100,
  "textColor": "#000000"
}
```

**Field Descriptions**:
| Field | Type | Required | Validation | Default |
|-------|------|----------|------------|---------|
| `headerColor` | String | Yes | Any valid CSS color (hex or gradient) | `#0d9488` |
| `logoShape` | String | Yes | Enum: `"circle"`, `"square"`, `"none"` | `circle` |
| `fontStyle` | String | Yes | Valid CSS font-family value | `system-ui, -apple-system, sans-serif` |
| `fontSize` | Number | Yes | Range: 80-120 (percentage) | `100` |
| `textColor` | String | Yes | Valid CSS color (hex) | `#000000` |

#### Response

**Success (201 Created)**:
```json
{
  "success": true,
  "message": "Settings created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "headerColor": "#2563eb",
    "logoShape": "circle",
    "fontStyle": "Arial, sans-serif",
    "fontSize": 100,
    "textColor": "#000000"
  }
}
```

**Validation Error (400)**:
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "fontSize": "Path `fontSize` (150) is more than maximum allowed value (120)."
  }
}
```

**Settings Already Exist (400)**:
```json
{
  "success": false,
  "message": "Settings already exist. Use PUT to update."
}
```

---

### PUT `/api/prescription-settings`

Update existing prescription settings for the authenticated doctor. Supports partial updates (only send fields you want to change).

#### Request

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body** (full update):
```json
{
  "headerColor": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "logoShape": "square",
  "fontStyle": "Georgia, serif",
  "fontSize": 110,
  "textColor": "#1e3a8a"
}
```

**Body** (partial update - only fontSize and textColor):
```json
{
  "fontSize": 95,
  "textColor": "#374151"
}
```

#### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "headerColor": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "logoShape": "square",
    "fontStyle": "Georgia, serif",
    "fontSize": 95,
    "textColor": "#374151",
    "updatedAt": "2024-01-15T11:45:00Z"
  }
}
```

**Not Found (404)**:
```json
{
  "success": false,
  "message": "Settings not found"
}
```

**Validation Error (400)**:
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

### DELETE `/api/prescription-settings`

Delete prescription settings and revert to defaults. The frontend should use default values after this operation.

#### Request

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

#### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "message": "Settings reset to defaults"
}
```

---

## Data Models

### PrescriptionSettings Schema

```javascript
{
  _id: ObjectId,
  doctor_id: ObjectId,  // Reference to ManagedUser, unique per doctor
  headerColor: String,  // Color hex or gradient CSS
  logoShape: String,    // "circle" | "square" | "none"
  fontStyle: String,    // Font family CSS value
  fontSize: Number,     // 80-120 (percentage)
  textColor: String,    // Color hex value
  createdAt: Date,      // Auto-generated
  updatedAt: Date       // Auto-generated
}
```

### Default Values

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

## Frontend Integration Examples

### Fetching Settings on Component Mount

```javascript
useEffect(() => {
  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/prescription-settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const { data } = await response.json();
        setPrescriptionSettings(data);
      } else if (response.status === 404) {
        // Use default values
        setPrescriptionSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setPrescriptionSettings(DEFAULT_SETTINGS);
    }
  };
  
  fetchSettings();
}, []);
```

### Saving Settings (Create or Update)

```javascript
const handleSave = async (settings) => {
  try {
    // Try PUT first
    let response = await fetch('/api/prescription-settings', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    });

    // If settings don't exist, create them
    if (response.status === 404) {
      response = await fetch('/api/prescription-settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
    }

    if (!response.ok) {
      throw new Error('Failed to save settings');
    }

    const { data } = await response.json();
    setPrescriptionSettings(data);
    toast({ title: "Settings saved successfully" });
  } catch (error) {
    toast({ title: "Failed to save settings", variant: "destructive" });
  }
};
```

### Resetting to Defaults

```javascript
const handleReset = async () => {
  try {
    const response = await fetch('/api/prescription-settings', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      setPrescriptionSettings(DEFAULT_SETTINGS);
      toast({ title: "Settings reset to defaults" });
    }
  } catch (error) {
    toast({ title: "Failed to reset settings", variant: "destructive" });
  }
};
```

---

## Error Handling

| Status Code | Meaning | Action |
|-------------|---------|--------|
| 200 | Success | Process data |
| 201 | Created | Settings created successfully |
| 400 | Validation Error | Show validation errors to user |
| 401 | Unauthorized | Redirect to login |
| 404 | Not Found | Use default values |
| 500 | Server Error | Show generic error message |

---

## Validation Rules

1. **headerColor**: Any valid CSS color string (hex, rgb, gradient)
2. **logoShape**: Must be one of `"circle"`, `"square"`, or `"none"`
3. **fontStyle**: Any valid CSS font-family value
4. **fontSize**: Must be a number between 80 and 120 (inclusive)
5. **textColor**: Should be a valid CSS color string (preferably hex)

---

## Security Considerations

1. **Authentication Required**: All endpoints require valid JWT token
2. **User Isolation**: Doctors can only access/modify their own settings (doctorId extracted from JWT)
3. **Input Validation**: All fields validated against schema constraints
4. **No XSS Risk**: CSS gradient strings should be sanitized in frontend before applying
5. **Rate Limiting**: Standard API rate limits apply

---

## Database Collection

**Collection Name**: `prescription_settings`

**Indexes**:
- `doctor_id`: Unique index (one settings document per doctor)
- `createdAt`, `updatedAt`: Automatic timestamps

---

## Testing

See [PRESCRIPTION_SETTINGS_API_TESTING.md](./PRESCRIPTION_SETTINGS_API_TESTING.md) for comprehensive testing guide with curl commands.

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-12-31 | Initial release with CRUD operations |

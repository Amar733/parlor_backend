# Time-Based Access Control API Documentation

## Overview
This API provides time-based access control for protected pages (POS, Inventory, etc.). It supports configurable operating hours, break times, holidays, grace periods, and user overrides.

**Base URL**: `http://localhost:3000/api/settings/access-time`

---

## Endpoints

### 1. Get Access Time Configuration

Retrieve the access time configuration and validate current access status.

**Endpoint**: `GET /api/settings/access-time`

**Access**: Public (no authentication required)

**Query Parameters**:
- `key` (string, optional) - Configuration key. Default: `"pos_access_time"`

**Example Request**:
```bash
curl -X GET "http://localhost:3000/api/settings/access-time?key=pos_access_time"
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "key": "pos_access_time",
    "pageName": "Point of Sale",
    "openTime": "09:00",
    "closeTime": "21:00",
    "timezone": "Asia/Kolkata",
    "isEnabled": true,
    "allowWeekends": true,
    "daysOfWeek": [1, 2, 3, 4, 5, 6, 0],
    "breakTimes": [
      {
        "startTime": "13:00",
        "endTime": "14:00",
        "reason": "Lunch Break"
      }
    ],
    "holidays": [
      {
        "date": "2024-01-26",
        "reason": "Republic Day"
      }
    ],
    "gracePeriodMinutes": 15,
    "messages": {
      "beforeOpen": "POS will open at {openTime}. Please wait.",
      "afterClose": "POS is closed. Operating hours: {openTime} - {closeTime}. Contact admin for access.",
      "onBreak": "System is on break until {endTime}.",
      "onHoliday": "System is closed today for {reason}."
    },
    "serverTime": "2024-01-15T08:45:30.123Z",
    "isAccessible": false,
    "reason": "BEFORE_OPEN",
    "message": "POS will open at 09:00. Please wait.",
    "nextOpenTime": "2024-01-15T03:30:00.000Z"
  }
}
```

**Access Validation Reasons**:
- `NO_RESTRICTION` - No configuration found, access allowed
- `OVERRIDE_USER` - User has override access
- `WITHIN_HOURS` - Current time is within operating hours
- `BEFORE_OPEN` - Current time is before opening (includes nextOpenTime)
- `AFTER_CLOSE` - Current time is after closing
- `DAY_NOT_ALLOWED` - Current day is not in allowed days
- `HOLIDAY` - Today is a configured holiday
- `ON_BREAK` - Current time is during a break period (includes nextOpenTime)

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "message": "Access time configuration not found"
}
```

---

### 2. Create/Update Access Time Configuration

Create a new configuration or update an existing one (upsert operation).

**Endpoint**: `POST /api/settings/access-time`

**Access**: Private (requires authentication via Bearer token)

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "key": "pos_access_time",
  "pageName": "Point of Sale",
  "openTime": "09:00",
  "closeTime": "21:00",
  "timezone": "Asia/Kolkata",
  "isEnabled": true,
  "allowWeekends": true,
  "daysOfWeek": [1, 2, 3, 4, 5, 6],
  "breakTimes": [
    {
      "startTime": "13:00",
      "endTime": "14:00",
      "reason": "Lunch Break"
    }
  ],
  "holidays": [
    {
      "date": "2024-01-26",
      "reason": "Republic Day"
    }
  ],
  "gracePeriodMinutes": 15,
  "overrideUsers": ["USER_OBJECT_ID_1", "USER_OBJECT_ID_2"],
  "messages": {
    "beforeOpen": "POS will open at {openTime}. Please wait.",
    "afterClose": "POS is closed. Operating hours: {openTime} - {closeTime}. Contact admin for access.",
    "onBreak": "System is on break until {endTime}.",
    "onHoliday": "System is closed today for {reason}."
  }
}
```

**Field Descriptions**:
- `key` (string, required) - Unique identifier for the configuration
- `pageName` (string) - Display name for the page
- `openTime` (string) - Opening time in HH:mm format (24-hour)
- `closeTime` (string) - Closing time in HH:mm format (24-hour)
- `timezone` (string) - IANA timezone (e.g., "Asia/Kolkata")
- `isEnabled` (boolean) - Enable/disable the access control
- `allowWeekends` (boolean) - Allow access on weekends
- `daysOfWeek` (array) - Allowed days (0=Sunday, 1=Monday, ..., 6=Saturday)
- `breakTimes` (array) - Break periods during the day
- `holidays` (array) - Special dates when access is blocked
- `gracePeriodMinutes` (number) - Minutes before opening to allow access (0-60)
- `overrideUsers` (array) - User IDs who bypass all restrictions
- `messages` (object) - Custom messages for different scenarios

**Example Request - Create**:
```bash
curl -X POST "http://localhost:3000/api/settings/access-time" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "key": "pos_access_time",
    "pageName": "Point of Sale",
    "openTime": "09:00",
    "closeTime": "21:00",
    "timezone": "Asia/Kolkata",
    "isEnabled": true,
    "gracePeriodMinutes": 15
  }'
```

**Example Request - Update (Partial)**:
```bash
curl -X POST "http://localhost:3000/api/settings/access-time" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "key": "pos_access_time",
    "openTime": "08:00",
    "breakTimes": [
      {
        "startTime": "13:00",
        "endTime": "14:00",
        "reason": "Lunch Break"
      }
    ]
  }'
```

**Success Response - Created** (201 Created):
```json
{
  "success": true,
  "message": "Access time configuration created successfully",
  "data": {
    "_id": "65a5f5c5e5f5e5f5e5f5e5f5",
    "key": "pos_access_time",
    "pageName": "Point of Sale",
    "openTime": "09:00",
    "closeTime": "21:00",
    "timezone": "Asia/Kolkata",
    "isEnabled": true,
    "allowWeekends": true,
    "daysOfWeek": [0, 1, 2, 3, 4, 5, 6],
    "breakTimes": [],
    "holidays": [],
    "gracePeriodMinutes": 15,
    "overrideUsers": [],
    "messages": {
      "beforeOpen": "This page will open at {openTime}. Please wait.",
      "afterClose": "This page is closed. Operating hours: {openTime} - {closeTime}. Contact admin for access.",
      "onBreak": "System is on break until {endTime}.",
      "onHoliday": "System is closed today for {reason}."
    }
  }
}
```

**Success Response - Updated** (200 OK):
```json
{
  "success": true,
  "message": "Access time configuration updated successfully",
  "data": {
    "_id": "65a5f5c5e5f5e5f5e5f5e5f5",
    "key": "pos_access_time",
    "pageName": "Point of Sale",
    "openTime": "08:00",
    "closeTime": "21:00",
    // ... other fields
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response - Validation** (400 Bad Request):
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "openTime": "Invalid time format. Use HH:mm (24-hour format)",
    "gracePeriodMinutes": "Grace period must be between 0 and 60"
  }
}
```

**Error Response - Missing Key** (400 Bad Request):
```json
{
  "success": false,
  "message": "Key is required"
}
```

---

### 3. Check User Access (Override)

Check if the authenticated user has override access for a specific page.

**Endpoint**: `GET /api/settings/access-time/check`

**Access**: Private (requires authentication via Bearer token)

**Headers**:
```
Authorization: Bearer <user_token>
```

**Query Parameters**:
- `key` (string, required) - Configuration key to check

**Example Request**:
```bash
curl -X GET "http://localhost:3000/api/settings/access-time/check?key=pos_access_time" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Success Response - Has Access** (200 OK):
```json
{
  "success": true,
  "data": {
    "hasAccess": true,
    "reason": "OVERRIDE_USER",
    "message": "You have access to this page"
  }
}
```

**Success Response - No Access** (200 OK):
```json
{
  "success": true,
  "data": {
    "hasAccess": false,
    "reason": "BEFORE_OPEN",
    "message": "POS will open at 09:00. Please wait.",
    "nextOpenTime": "2024-01-15T03:30:00.000Z"
  }
}
```

**Error Response - Missing Key** (400 Bad Request):
```json
{
  "success": false,
  "message": "Key parameter is required"
}
```

**Error Response - Not Authenticated** (401 Unauthorized):
```json
{
  "success": false,
  "message": "Authentication required"
}
```

---

## Testing Examples

### Test 1: Create Initial Configuration
```bash
curl -X POST "http://localhost:3000/api/settings/access-time" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "key": "pos_access_time",
    "pageName": "Point of Sale",
    "openTime": "09:00",
    "closeTime": "21:00",
    "timezone": "Asia/Kolkata",
    "isEnabled": true,
    "allowWeekends": true,
    "daysOfWeek": [1,2,3,4,5,6,0],
    "gracePeriodMinutes": 15,
    "breakTimes": [
      {
        "startTime": "13:00",
        "endTime": "14:00",
        "reason": "Lunch Break"
      }
    ],
    "messages": {
      "beforeOpen": "POS will open at {openTime}. Please wait.",
      "afterClose": "POS is closed. Operating hours: {openTime} - {closeTime}.",
      "onBreak": "System is on break until {endTime}.",
      "onHoliday": "System is closed today for {reason}."
    }
  }'
```

### Test 2: Get Configuration and Check Access
```bash
curl -X GET "http://localhost:3000/api/settings/access-time?key=pos_access_time"
```

### Test 3: Add Holiday
```bash
curl -X POST "http://localhost:3000/api/settings/access-time" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "key": "pos_access_time",
    "holidays": [
      {
        "date": "2026-01-26",
        "reason": "Republic Day"
      },
      {
        "date": "2026-08-15",
        "reason": "Independence Day"
      }
    ]
  }'
```

### Test 4: Update Operating Hours
```bash
curl -X POST "http://localhost:3000/api/settings/access-time" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "key": "pos_access_time",
    "openTime": "08:00",
    "closeTime": "22:00"
  }'
```

### Test 5: Disable Access Control
```bash
curl -X POST "http://localhost:3000/api/settings/access-time" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "key": "pos_access_time",
    "isEnabled": false
  }'
```

### Test 6: Check User Override Access
```bash
curl -X GET "http://localhost:3000/api/settings/access-time/check?key=pos_access_time" \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

---

## Integration Guide

### Frontend Integration

#### 1. Check Access Before Rendering Protected Page

```javascript
const checkAccess = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/settings/access-time?key=pos_access_time`
    );
    const data = await response.json();
    
    if (!data.data.isAccessible) {
      // Show blocked UI with message
      showBlockedMessage(data.data.message, data.data.nextOpenTime);
    } else {
      // Allow access to page
      renderPage();
    }
  } catch (error) {
    console.error('Error checking access:', error);
  }
};
```

#### 2. Poll for Real-Time Updates (Every 30 seconds)

```javascript
useEffect(() => {
  checkAccess(); // Initial check
  
  const interval = setInterval(() => {
    checkAccess();
  }, 30000); // 30 seconds
  
  return () => clearInterval(interval);
}, []);
```

#### 3. Admin Panel - Update Configuration

```javascript
const updateAccessTime = async (config) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/settings/access-time`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(config)
      }
    );
    
    const data = await response.json();
    console.log('Configuration updated:', data);
  } catch (error) {
    console.error('Error updating config:', error);
  }
};
```

---

## Security Considerations

1. **Authentication**: POST endpoint requires valid JWT token
2. **Authorization**: Only admin users should update configurations
3. **Server Time**: All time validation uses server time (cannot be bypassed by client)
4. **Rate Limiting**: Consider adding rate limits to prevent abuse
5. **Audit Logging**: Log all configuration changes for compliance

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `200` - Success (GET, POST update)
- `201` - Created (POST create)
- `400` - Bad Request (validation errors, missing parameters)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not Found (configuration doesn't exist)
- `500` - Internal Server Error

---

## Notes

- All times should be in 24-hour format (HH:mm)
- Dates should be in YYYY-MM-DD format
- Timezone should be a valid IANA timezone identifier
- The GET endpoint is public to support client-side access checking before authentication
- Grace period allows users to access the page before official opening time
- Override users bypass all time restrictions
- Messages support placeholders: `{openTime}`, `{closeTime}`, `{endTime}`, `{reason}`

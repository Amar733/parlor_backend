# Log Service Documentation

The Log Service provides comprehensive activity logging for your Express.js backend, similar to your Next.js implementation.

## Features

- **Automatic Activity Logging**: Middleware that automatically logs CRUD operations, auth events, and file operations
- **Manual Logging**: Service methods for custom logging scenarios
- **IP Detection**: Reliable IP address extraction from requests (handles proxies and load balancers)
- **Flexible Filtering**: Support for various filters when retrieving logs
- **Error Handling**: Logging failures don't break application flow

## Setup

The log service is already integrated into your server. The `ActivityLog` model stores the logs in MongoDB.

## Usage

### 1. Automatic Logging (via Middleware)

The `activityLogger` middleware is already configured in `server.js` and will automatically log:

- **Authentication events** (login, register, logout)
- **CRUD operations** (create, read, update, delete)
- **File operations** (upload, download, access)

Configuration options:

```javascript
app.use(
  activityLogger({
    logAllRequests: false, // Log every request (use cautiously)
    logAuth: true, // Log auth events
    logCrud: true, // Log CRUD operations
    logFiles: true, // Log file operations
    excludePaths: ["/health", "/api$", "/uploads"], // Paths to exclude
    excludeMethods: ["OPTIONS"], // HTTP methods to exclude
  })
);
```

### 2. Manual Logging

Import the LogService in your routes:

```javascript
const LogService = require("../services/logService");
```

#### Basic Activity Logging

```javascript
await LogService.logActivity({
  actor: req.user, // User performing the action
  action: "custom.action", // Action name
  entity: {
    // Entity being acted upon
    type: "patient",
    id: patientId,
    name: "John Doe",
  },
  details: {
    // Additional details
    customField: "value",
  },
  request: req, // Express request object
});
```

#### Authentication Logging

```javascript
// Log successful login
await LogService.logAuth(user, "login", req, {
  loginMethod: "email",
  success: true,
});

// Log logout
await LogService.logAuth(user, "logout", req);

// Log registration
await LogService.logAuth(user, "register", req, {
  role: user.role,
});
```

#### CRUD Operations Logging

```javascript
// Log patient creation
await LogService.logCrud(
  req.user, // Actor
  "create", // Operation
  "patient", // Entity type
  newPatient, // Entity object or ID
  req, // Request
  {
    // Additional details
    source: "api",
  }
);

// Log patient update
await LogService.logCrud(req.user, "update", "patient", patientId, req, {
  fieldsChanged: ["name", "email"],
});

// Log patient deletion
await LogService.logCrud(req.user, "delete", "patient", patientId, req);
```

#### File Operations Logging

```javascript
// Log file upload
await LogService.logFile(req.user, "upload", req.file, req, {
  category: "prescription",
  patientId: req.body.patientId,
});

// Log file download
await LogService.logFile(req.user, "download", fileInfo, req);
```

#### System Events Logging

```javascript
// Log system events (no user required)
await LogService.logSystem("startup", {
  version: "1.0.0",
  environment: process.env.NODE_ENV,
});

await LogService.logSystem("backup.completed", {
  duration: "5 minutes",
  recordCount: 1000,
});
```

### 3. Retrieving Activity Logs

#### In Routes (Admin only)

```javascript
// Get activity logs with filtering
const { logs, pagination } = await LogService.getActivityLogs(
  {
    action: "patient.create", // Filter by action
    entityType: "patient", // Filter by entity type
    actorId: userId, // Filter by user
    startDate: "2025-01-01", // Date range start
    endDate: "2025-01-31", // Date range end
  },
  page,
  limit
);

res.json({
  success: true,
  data: logs,
  pagination,
});
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "607c1f77bcf86cd799439011",
      "actor": {
        "id": "607c1f77bcf86cd799439010",
        "name": "Dr. Smith"
      },
      "action": "patient.create",
      "entity": {
        "type": "patient",
        "id": "607c1f77bcf86cd799439012",
        "name": "John Doe"
      },
      "details": {
        "source": "api",
        "method": "POST"
      },
      "request": {
        "ip": "192.168.1.100",
        "userAgent": "Mozilla/5.0..."
      },
      "createdAt": "2025-01-29T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "itemsPerPage": 20
  }
}
```

## Integration Examples

### Route-level Logging

```javascript
// Example in patients route
router.post("/", auth, async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();

    // Manual logging (optional, automatic middleware will also log this)
    await LogService.logCrud(req.user, "create", "patient", patient, req);

    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
```

### Custom Action Logging

```javascript
router.post("/:id/approve", auth, authorize("admin"), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    appointment.status = "Approved";
    await appointment.save();

    // Log custom action
    await LogService.logActivity({
      actor: req.user,
      action: "appointment.approve",
      entity: {
        type: "appointment",
        id: appointment._id.toString(),
        name: `Appointment with ${appointment.patientName}`,
      },
      details: {
        previousStatus: "Pending",
        newStatus: "Approved",
        approvalReason: req.body.reason,
      },
      request: req,
    });

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
```

## Environment Variables

Add to your `.env` file:

```env
# Optional: Log all requests (use with caution in production)
LOG_ALL_REQUESTS=false
```

## Best Practices

1. **Don't over-log**: Avoid logging every GET request in production
2. **Include context**: Add relevant details to help with debugging
3. **Handle errors gracefully**: Logging should never break your app
4. **Use appropriate log levels**: System events vs user actions
5. **Consider privacy**: Don't log sensitive information like passwords

## Performance Considerations

- Logs are written asynchronously and won't block requests
- Consider log rotation and cleanup for high-volume applications
- Index the `createdAt` field for better query performance
- Use pagination when retrieving large sets of logs

## Security

- Activity logs contain sensitive information - restrict access appropriately
- The IP detection handles various proxy configurations
- User-agent strings are stored for debugging but can be sanitized if needed

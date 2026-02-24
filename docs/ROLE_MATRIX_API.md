# Role Matrix API Documentation

## Overview

The Role Matrix API provides endpoints for managing roles and their associated permissions in the hospital management system. This API allows administrators to create, update, delete, and restore roles with specific permission sets.

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. Get All Roles

**GET** `/api/role-matrix`

Retrieves all active roles with their permissions.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "64f1234567890abcdef12345",
      "role_name": "Admin",
      "allpermissions": [
        "patients.create",
        "patients.read",
        "patients.update",
        "patients.delete",
        "appointments.create",
        "appointments.read"
      ],
      "createdAt": "2023-09-01T10:00:00.000Z",
      "updatedAt": "2023-09-01T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

### 2. Create Role

**POST** `/api/role-matrix`

Creates a new role with specified permissions.

**Request Body:**

```json
{
  "role_name": "Doctor",
  "allpermissions": [
    "patients.read",
    "patients.update",
    "appointments.read",
    "prescriptions.create"
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Role created successfully",
  "data": {
    "_id": "64f1234567890abcdef12346",
    "role_name": "Doctor",
    "allpermissions": [
      "patients.read",
      "patients.update",
      "appointments.read",
      "prescriptions.create"
    ],
    "createdAt": "2023-09-01T11:00:00.000Z",
    "updatedAt": "2023-09-01T11:00:00.000Z"
  }
}
```

### 3. Update Role

**PUT** `/api/role-matrix/:id`

Updates an existing role's name and/or permissions.

**Request Body:**

```json
{
  "role_name": "Senior Doctor",
  "allpermissions": [
    "patients.read",
    "patients.update",
    "appointments.read",
    "appointments.update",
    "prescriptions.create",
    "prescriptions.update"
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Role updated successfully",
  "data": {
    "_id": "64f1234567890abcdef12346",
    "role_name": "Senior Doctor",
    "allpermissions": [
      "patients.read",
      "patients.update",
      "appointments.read",
      "appointments.update",
      "prescriptions.create",
      "prescriptions.update"
    ],
    "updatedAt": "2023-09-01T12:00:00.000Z"
  }
}
```

### 4. Delete Role (Soft Delete)

**DELETE** `/api/role-matrix/:id`

Soft deletes a role (marks as deleted without permanently removing).

**Response:**

```json
{
  "success": true,
  "message": "Role deleted successfully"
}
```

### 5. Restore Role

**PUT** `/api/role-matrix/:id/restore`

Restores a previously soft-deleted role.

**Response:**

```json
{
  "success": true,
  "message": "Role restored successfully",
  "data": {
    "_id": "64f1234567890abcdef12346",
    "role_name": "Doctor",
    "allpermissions": [...],
    "deletedAt": null
  }
}
```

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Role name is required"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Role not found"
}
```

### 409 Conflict

```json
{
  "success": false,
  "message": "Role with this name already exists"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details..."
}
```

## Available Permissions

The following permissions are available for assignment to roles:

### Patient Management

- `patients.create` - Create new patients
- `patients.read` - View patient information
- `patients.update` - Update patient information
- `patients.delete` - Delete patients

### Appointment Management

- `appointments.create` - Create appointments
- `appointments.read` - View appointments
- `appointments.update` - Update appointments
- `appointments.delete` - Delete appointments

### Prescription Management

- `prescriptions.create` - Create prescriptions
- `prescriptions.read` - View prescriptions
- `prescriptions.update` - Update prescriptions
- `prescriptions.delete` - Delete prescriptions

### Blood Test Management

- `bloodTests.create` - Create blood tests
- `bloodTests.read` - View blood tests
- `bloodTests.update` - Update blood tests
- `bloodTests.delete` - Delete blood tests

### Blood Report Management

- `bloodReports.create` - Create blood reports
- `bloodReports.read` - View blood reports
- `bloodReports.update` - Update blood reports
- `bloodReports.delete` - Delete blood reports

### Service Management

- `services.create` - Create services
- `services.read` - View services
- `services.update` - Update services
- `services.delete` - Delete services

### User Management

- `managedUsers.create` - Create managed users
- `managedUsers.read` - View managed users
- `managedUsers.update` - Update managed users
- `managedUsers.delete` - Delete managed users

### Portfolio Management

- `portfolio.create` - Create portfolio items
- `portfolio.read` - View portfolio
- `portfolio.update` - Update portfolio items
- `portfolio.delete` - Delete portfolio items

### Blog Management

- `blog.create` - Create blog posts
- `blog.read` - View blog posts
- `blog.update` - Update blog posts
- `blog.delete` - Delete blog posts

### CMS Management

- `cms.create` - Create CMS content
- `cms.read` - View CMS content
- `cms.update` - Update CMS content
- `cms.delete` - Delete CMS content

### Testimonial Management

- `testimonials.create` - Create testimonials
- `testimonials.read` - View testimonials
- `testimonials.update` - Update testimonials
- `testimonials.delete` - Delete testimonials

### Activity & Log Management

- `activities.read` - View activities
- `activityLogs.read` - View activity logs

### System Administration

- `bin.read` - View recycle bin
- `bin.restore` - Restore deleted items
- `bin.delete` - Permanently delete items

## Usage Examples

### Creating a Nurse Role

```bash
curl -X POST http://localhost:3000/api/role-matrix \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "role_name": "Nurse",
    "allpermissions": [
      "patients.read",
      "patients.update",
      "appointments.read",
      "bloodReports.read"
    ]
  }'
```

### Updating Role Permissions

```bash
curl -X PUT http://localhost:3000/api/role-matrix/64f1234567890abcdef12346 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "allpermissions": [
      "patients.read",
      "patients.update",
      "appointments.read",
      "appointments.create",
      "bloodReports.read"
    ]
  }'
```

### Getting All Roles

```bash
curl -X GET http://localhost:3000/api/role-matrix \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

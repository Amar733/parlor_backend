# Appointment Booking API Documentation

## Overview
This API manages doctor appointment bookings with time slot capacity management. Each doctor can have predefined available time slots for each day, and each slot has a maximum patient capacity.

## Features
- ✅ Time slot availability checking
- ✅ Capacity-based booking validation
- ✅ Overbooking prevention
- ✅ New patient creation during booking
- ✅ Appointment cancellation with slot freeing
- ✅ Real-time slot status tracking

## Base URL
```
http://localhost:5001/api/appointment-booking
```

## Endpoints

### 1. Check Slot Availability
Check if a specific time slot is available for booking.

**Endpoint:** `GET /check-availability`

**Parameters:**
- `doctorId` (required): Doctor's MongoDB ObjectId
- `date` (required): Date in YYYY-MM-DD format
- `time` (required): Time in HH:MM format

**Example Request:**
```bash
GET /api/appointment-booking/check-availability?doctorId=68889eaf2837bec04fdef000&date=2025-08-03&time=10:00
```

**Example Response:**
```json
{
    "success": true,
    "data": {
        "doctorId": "68889eaf2837bec04fdef000",
        "doctorName": "Dr. Awresh",
        "date": "2025-08-03",
        "time": "10:00",
        "availability": {
            "available": true,
            "reason": "Slot available",
            "capacity": 5,
            "booked": 2,
            "remaining": 3
        }
    }
}
```

### 2. Book Appointment
Book an appointment with automatic capacity validation.

**Endpoint:** `POST /book`

**Request Body:**
```json
{
    "doctorId": "68889eaf2837bec04fdef000",
    "service": "General Consultation",
    "serviceId": "optional_service_id",
    "date": "2025-08-03",
    "time": "10:00",
    "notes": "Patient has knee pain",
    
    // For existing patients
    "patientId": "existing_patient_id",
    
    // OR for new patients (required if patientId not provided)
    "patientFirstName": "John",
    "patientLastName": "Doe",
    "patientContact": "+1234567890",
    "patientAge": 30,
    "patientGender": "Male",
    "patientAddress": "123 Main St"
}
```

**Example Response (Success):**
```json
{
    "success": true,
    "message": "Appointment booked successfully",
    "data": {
        "appointment": {
            "id": "appointment_id",
            "patientId": "patient_id",
            "patientName": "John Doe",
            "doctorId": "68889eaf2837bec04fdef000",
            "doctorName": "Dr. Awresh",
            "service": "General Consultation",
            "date": "2025-08-03",
            "time": "10:00",
            "status": "Confirmed",
            "notes": "Patient has knee pain"
        },
        "slotInfo": {
            "capacity": 5,
            "booked": 3,
            "remaining": 2
        }
    }
}
```

**Example Response (Slot Full):**
```json
{
    "success": false,
    "message": "This time slot is fully booked",
    "data": {
        "capacity": 5,
        "booked": 5,
        "remaining": 0
    }
}
```

### 3. Get Slot Appointments (Admin/Doctor)
Get all appointments for a specific time slot.

**Endpoint:** `GET /slot-appointments`
**Access:** Private (Admin or Doctor only)

**Parameters:**
- `doctorId` (required): Doctor's MongoDB ObjectId
- `date` (required): Date in YYYY-MM-DD format
- `time` (required): Time in HH:MM format

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Example Response:**
```json
{
    "success": true,
    "data": {
        "doctorId": "68889eaf2837bec04fdef000",
        "doctorName": "Dr. Awresh",
        "date": "2025-08-03",
        "time": "10:00",
        "capacity": 5,
        "booked": 3,
        "remaining": 2,
        "appointments": [
            {
                "id": "appointment_id_1",
                "patientName": "John Doe",
                "patientEmail": "john@email.com",
                "patientPhone": "+1234567890",
                "service": "General Consultation",
                "status": "Confirmed",
                "notes": "Patient has knee pain",
                "bookedAt": "2025-08-02T10:30:00.000Z"
            },
            {
                "id": "appointment_id_2",
                "patientName": "Jane Smith",
                "patientEmail": "jane@email.com",
                "patientPhone": "+0987654321",
                "service": "Follow-up",
                "status": "Confirmed",
                "notes": "Regular checkup",
                "bookedAt": "2025-08-02T11:15:00.000Z"
            }
        ]
    }
}
```

### 4. Cancel Appointment
Cancel an appointment and free up the slot.

**Endpoint:** `PUT /cancel/:appointmentId`

**Parameters:**
- `appointmentId` (URL parameter): Appointment's MongoDB ObjectId

**Request Body:**
```json
{
    "reason": "Patient cannot make it due to emergency"
}
```

**Example Response:**
```json
{
    "success": true,
    "message": "Appointment cancelled successfully",
    "data": {
        "appointmentId": "appointment_id",
        "status": "Cancelled",
        "slotInfo": {
            "capacity": 5,
            "booked": 2,
            "remaining": 3
        }
    }
}
```

## Error Responses

### Validation Errors (400)
```json
{
    "success": false,
    "message": "doctorId, date, and time are required query parameters"
}
```

### Not Found Errors (404)
```json
{
    "success": false,
    "message": "Doctor not found"
}
```

### Conflict Errors (409) - Slot Full
```json
{
    "success": false,
    "message": "This time slot is fully booked",
    "data": {
        "capacity": 5,
        "booked": 5,
        "remaining": 0
    }
}
```

### Server Errors (500)
```json
{
    "success": false,
    "message": "Error booking appointment"
}
```

## Business Logic

### Slot Availability Rules
1. **Doctor Availability**: Doctor must have the time slot configured for the specific day
2. **Capacity Check**: Number of confirmed appointments must be less than doctor's slot capacity
3. **Date Validation**: Cannot book appointments for past dates
4. **Time Format**: Time must be in HH:MM format and match doctor's available slots

### Booking Process
1. Validate input parameters
2. Check if doctor exists and is active
3. Verify doctor has the requested time slot available for the day
4. Count existing non-cancelled appointments for the slot
5. Check if slot capacity allows more bookings
6. Handle patient (existing or create new)
7. Double-check availability (race condition protection)
8. Create appointment record
9. Log activity
10. Return updated slot status

### Capacity Management
- Each doctor has a global `patientsPerSlot` setting that applies to all their time slots
- Default capacity is 1 patient per slot if not configured
- Cancelled appointments don't count towards capacity
- Real-time capacity checking prevents overbooking

## Integration Examples

### Frontend Integration (JavaScript)
```javascript
// Check availability before showing booking form
async function checkSlotAvailability(doctorId, date, time) {
    const response = await fetch(
        `/api/appointment-booking/check-availability?doctorId=${doctorId}&date=${date}&time=${time}`
    );
    const data = await response.json();
    return data.data.availability;
}

// Book appointment
async function bookAppointment(appointmentData) {
    const response = await fetch('/api/appointment-booking/book', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
    });
    return await response.json();
}
```

### Error Handling
Always check the `success` field in responses and handle different error scenarios:
- Show capacity information when slots are full
- Validate date/time formats on frontend
- Handle network errors gracefully
- Provide alternative time slots when requested slot is full

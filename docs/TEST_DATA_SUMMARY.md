# Test Data Summary for Hospital Management System

## 🏥 **System Overview**
Your hospital management system is now fully set up with comprehensive test data for testing all APIs.

## 👥 **User Accounts**

### Admin User
- **ID**: `688ba862b79249c2062db7f8`
- **Name**: Admin User
- **Email**: admin@hospital.com
- **Role**: admin
- **Permissions**: Full access to all features

### Doctor User
- **ID**: `68889eaf2837bec04fdef000`
- **Name**: Dr. Awresh Kumar
- **Email**: dr.awresh@hospital.com
- **Role**: doctor
- **Specialization**: General Medicine
- **Bio**: Experienced general practitioner with 10+ years of experience

## 🏥 **Medical Services**

| Service Name | ID | Price | Duration | Description |
|-------------|-------|-------|----------|-------------|
| General Consultation | `688f03c3b79249c2062dc311` | ₹500 | 30 min | General medical consultation and checkup |
| Follow-up Consultation | `688f03c3b79249c2062dc312` | ₹300 | 20 min | Follow-up visit for existing patients |
| Health Checkup | `688f03c4b79249c2062dc313` | ₹1000 | 45 min | Comprehensive health screening |
| Blood Pressure Check | `688f03c4b79249c2062dc314` | ₹200 | 15 min | Blood pressure monitoring and consultation |
| Diabetes Consultation | `688f03c4b79249c2062dc315` | ₹600 | 30 min | Specialized consultation for diabetes management |

## ⏰ **Time Slots Configuration**

### Master Time Slots
Available time slots: `09:00`, `09:30`, `10:00`, `10:30`, `11:00`, `11:30`, `12:00`, `12:30`, `14:00`, `14:30`, `15:00`, `15:30`, `16:00`, `16:30`, `17:00`, `17:30`, `18:00`

### Doctor Availability (Dr. Awresh Kumar)
- **Capacity**: 5 patients per time slot
- **Monday-Friday**: `09:00`, `09:30`, `10:00`, `10:30`, `11:00`, `14:00`, `14:30`, `15:00`, `15:30`, `16:00`
- **Saturday**: `09:00`, `09:30`, `10:00`, `10:30`, `11:00`
- **Sunday**: `10:00`, `10:30`, `11:00`, `15:00`, `15:30`, `16:00`

## 👤 **Test Patients**

| Name | ID | Contact | Age | Gender | Address |
|------|-------|---------|-----|--------|---------|
| John Doe | `686b6bb290eaf25a8dc49e83` | +1234567890 | 30 | Male | 123 Main St, City |
| Jane Smith | `688f02e2a92d732bfa177b0f` | +0987654321 | 25 | Female | 456 Oak Ave, City |
| Bob Johnson | `688f041bb79249c2062dc316` | +1122334455 | 45 | Male | 789 Pine St, City |
| Alice Brown | `688f041cb79249c2062dc317` | +5566778899 | 35 | Female | 321 Elm St, City |
| Charlie Wilson | `688f041cb79249c2062dc318` | +9988776655 | 50 | Male | 654 Maple Dr, City |

## 📅 **Pre-created Appointments**

| Patient | Service | Date | Time | Status | Notes |
|---------|---------|------|------|--------|-------|
| John Doe | General Consultation | 2025-08-04 | 09:00 | Confirmed | Regular checkup |
| Jane Smith | Follow-up Consultation | 2025-08-04 | 09:00 | Confirmed | Follow-up for previous treatment |
| Bob Johnson | Health Checkup | 2025-08-04 | 10:00 | Confirmed | Annual health screening |
| Alice Brown | Diabetes Consultation | 2025-08-05 | 14:00 | Confirmed | Diabetes management consultation |

## 🧪 **API Testing**

### Quick Test Commands

1. **Check Slot Availability**:
```bash
curl "http://localhost:5001/api/appointment-booking/check-availability?doctorId=68889eaf2837bec04fdef000&date=2025-08-04&time=09:00"
```

2. **Book New Appointment**:
```bash
curl -X POST "http://localhost:5001/api/appointment-booking/book" \
-H "Content-Type: application/json" \
-d '{
  "doctorId": "68889eaf2837bec04fdef000",
  "service": "General Consultation",
  "serviceId": "688f03c3b79249c2062dc311",
  "date": "2025-08-04",
  "time": "11:00",
  "notes": "Test booking",
  "patientFirstName": "Test",
  "patientLastName": "User",
  "patientContact": "+1111111111",
  "patientAge": 25,
  "patientGender": "Male"
}'
```

3. **Get Master Time Slots**:
```bash
curl "http://localhost:5001/api/timeslots?source=master"
```

4. **Get Doctor Availability**:
```bash
curl "http://localhost:5001/api/timeslots/availability/68889eaf2837bec04fdef000/2025-08-04"
```

### Automated Test Suite
Run the comprehensive test suite:
```bash
cd /Users/akash/Desktop/srm_arnik/srm_arnik/backend
./test-api.sh
```

## 📊 **Current Slot Status**

### Monday, August 4, 2025
- **09:00**: 2/5 slots booked (John Doe, Jane Smith) - 3 remaining
- **10:00**: 1/5 slots booked (Bob Johnson) - 4 remaining
- **Other times**: Available (0/5 booked)

### Tuesday, August 5, 2025
- **14:00**: 1/5 slots booked (Alice Brown) - 4 remaining
- **Other times**: Available (0/5 booked)

## 🔐 **Authentication Notes**

- Public endpoints (appointment booking, availability check) don't require authentication
- Admin endpoints require JWT token with admin role
- Doctor endpoints require JWT token with doctor role or admin role

## 🚀 **Testing Scenarios**

### 1. **Capacity Management**
- Book 5 appointments for the same time slot
- Verify the 6th booking is rejected with "fully booked" message

### 2. **Availability Checking**
- Check availability before and after booking
- Verify remaining capacity updates correctly

### 3. **Patient Creation**
- Book appointment with new patient data
- Verify patient is created automatically

### 4. **Time Slot Validation**
- Try booking at unavailable times
- Verify proper error messages

### 5. **Date Validation**
- Try booking in the past
- Verify date format validation

## ✅ **All Systems Ready**

Your database now contains:
- ✅ Admin and Doctor users with proper permissions
- ✅ 5 Medical services with pricing
- ✅ Master time slots and doctor availability
- ✅ 5 Test patients
- ✅ 4 Pre-existing appointments
- ✅ Capacity management (5 patients per slot)
- ✅ Full API endpoints for booking and management

**Server Status**: Running on http://localhost:5001
**APIs Ready**: All appointment booking and time slot management endpoints are functional!

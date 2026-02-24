# 📮 Postman Collection Import Guide

## 🚀 **Quick Import**

### **Files to Import**
1. **Collection**: `Hospital_Management_APIs.postman_collection.json`
2. **Environment**: `Hospital_Management_Environment.postman_environment.json`

### **Import Steps**

#### 1. Import Collection
1. Open Postman
2. Click "Import" button (top left)
3. Drag & drop or select `Hospital_Management_APIs.postman_collection.json`
4. Click "Import"

#### 2. Import Environment
1. Click "Import" button again
2. Drag & drop or select `Hospital_Management_Environment.postman_environment.json`
3. Click "Import"

#### 3. Set Environment
1. Click environment dropdown (top right)
2. Select "Hospital Management Environment"

## 📁 **Collection Structure**

### **1. Authentication**
- Admin Login
- Doctor Login

### **2. Appointment Booking (Public)**
- Check Slot Availability
- Book Appointment (New Patient)
- Book Appointment (Existing Patient)
- Get Slot Appointments
- Cancel Appointment

4. **Get Doctor Availability**:
```bash
curl "http://localhost:5001/api/timeslots/availability/68889eaf2837bec04fdef000/2025-08-04"
```

5. **Get Doctor Time Slots**:
```bash
curl "http://localhost:5001/api/timeslots/doctor/68889eaf2837bec04fdef000"
```

### **4. Appointments Management**
- Get All Appointments
- Get Appointment by ID
- Create Appointment (Admin)
- Update Appointment Status

### **5. Patients Management**
- Get All Patients
- Get Patient by ID
- Create Patient
- Update Patient

### **6. Services Management**
- Get All Services
- Get Service by ID
- Create Service

### **7. Capacity Testing**
- Test Capacity - Book 1st Patient
- Test Capacity - Book 2nd Patient
- Test Capacity - Book 5th Patient
- Test Capacity - Book 6th Patient (Should Fail)

## 🔐 **Authentication Setup**

### **Step 1: Login as Admin**
1. Run "Authentication → Admin Login"
2. Copy the `token` from response
3. Set it in environment variable `adminToken`

### **Step 2: Login as Doctor**
1. Run "Authentication → Doctor Login"
2. Copy the `token` from response
3. Set it in environment variable `doctorToken`

## 🧪 **Testing Workflow**

### **Basic Flow**
1. **Login** → Get authentication tokens
2. **Check Availability** → Verify slot availability
3. **Book Appointment** → Create new booking
4. **Verify Booking** → Check appointment was created
5. **Test Capacity** → Try overbooking to test limits

### **Capacity Testing Flow**
1. Run all 4 "Capacity Testing" requests in order
2. First 3 should succeed (patients 1, 2, 5)
3. Last request (6th patient) should fail with "fully booked"

## 📊 **Pre-configured Test Data**

### **User Credentials**
```
Admin: admin@hospital.com / admin123
Doctor: dr.awresh@hospital.com / doctor123
```

### **Test Patients (IDs already set)**
- John Doe: `686b6bb290eaf25a8dc49e83`
- Jane Smith: `688f02e2a92d732bfa177b0f`
- Bob Johnson: `688f041bb79249c2062dc316`
- Alice Brown: `688f041cb79249c2062dc317`
- Charlie Wilson: `688f041cb79249c2062dc318`

### **Services (IDs already set)**
- General Consultation: `688f03c3b79249c2062dc311`
- Follow-up Consultation: `688f03c3b79249c2062dc312`
- Health Checkup: `688f03c4b79249c2062dc313`
- Blood Pressure Check: `688f03c4b79249c2062dc314`
- Diabetes Consultation: `688f03c4b79249c2062dc315`

## 🎯 **Key Features Tested**

### **✅ Capacity Management**
- 5 patients per time slot limit
- Automatic rejection of 6th booking
- Real-time availability checking

### **✅ Patient Handling**
- Automatic patient creation for new bookings
- Existing patient booking with just ID
- Complete patient management

### **✅ Time Slot Management**
- Master time slots
- Doctor-specific availability
- Day-wise scheduling

### **✅ Authentication & Authorization**
- Public booking endpoints (no auth needed)
- Admin-only management endpoints
- Doctor-specific operations

## 🔧 **Environment Variables**

All test data IDs are pre-configured:

| Variable | Description | Value |
|----------|-------------|-------|
| `baseUrl` | Server URL | `http://localhost:5001` |
| `adminId` | Admin User ID | `688ba862b79249c2062db7f8` |
| `doctorId` | Doctor User ID | `68889eaf2837bec04fdef000` |
| `adminToken` | Admin JWT Token | (Set after login) |
| `doctorToken` | Doctor JWT Token | (Set after login) |

## 🚨 **Important Notes**

1. **Server**: Ensure your server is running on `http://localhost:5001`
2. **Database**: All test data should be already created in your database
3. **Authentication**: Get tokens first before testing protected endpoints
4. **Capacity**: Each time slot supports exactly 5 patients
5. **Dates**: Use future dates (2025-08-04 and later) for testing

## 📝 **Quick Test Commands**

### **1. Test Booking Flow**
```
1. Authentication → Admin Login
2. Appointment Booking → Check Slot Availability
3. Appointment Booking → Book Appointment (New Patient)
4. Appointment Booking → Get Slot Appointments
```

### **2. Test Capacity Limits**
```
1. Capacity Testing → Book 1st Patient
2. Capacity Testing → Book 2nd Patient
3. Capacity Testing → Book 5th Patient
4. Capacity Testing → Book 6th Patient (Should Fail)
```

### **3. Test Management**
```
1. Time Slots → Get Doctor Availability
2. Appointments → Get All Appointments
3. Patients → Get All Patients
4. Services → Get All Services
```

## ✅ **Success Indicators**

- ✅ All public booking APIs work without authentication
- ✅ Capacity management prevents overbooking
- ✅ New patients are created automatically
- ✅ Existing patients can book with just ID
- ✅ Admin operations require authentication
- ✅ Time slot availability updates in real-time

**Your complete Hospital Management API collection is ready to use!** 🏥

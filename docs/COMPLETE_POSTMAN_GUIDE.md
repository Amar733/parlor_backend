# Hospital Management System - Complete Postman Collection

This comprehensive Postman collection includes **ALL APIs** for the Hospital Management System with **150+ endpoints** across 15 main categories.

## 📋 What's Included

### 🔐 Authentication & User Management
- **Admin Login/Registration**: Full admin authentication
- **Doctor Authentication**: Doctor login and profile management  
- **User Management**: Create, update, delete users with roles
- **Profile Management**: Update profiles and change passwords

### 👨‍⚕️ Doctor Management & Slots
- **Create Doctor**: Complete doctor creation with specializations
- **Doctor CRUD**: Full doctor management operations
- **Doctor Slots Management**: 
  - Set weekly time slots for doctors
  - Update specific day slots (monday, tuesday, etc.)
  - Configure patient capacity per slot
  - Get doctor's current slot configuration

### 🏥 Core Hospital Operations
- **Services Management**: Medical services with pricing and categories
- **Appointments**: Book, manage, and track patient appointments
- **Patient Management**: Complete patient records and history
- **Time Slots**: Advanced scheduling with capacity management

### 📊 Medical Records & Reports
- **Blood Tests**: Create and manage blood test types
- **Blood Reports**: Upload and manage patient blood test results
- **Prescriptions**: Upload and manage prescription files
- **Medical Summaries**: Patient medical summaries and reports

### 💰 Business Operations
- **Coupons Management**: Create discount coupons with validation
- **Portfolio**: Hospital portfolio and facility showcases
- **Testimonials**: Patient testimonials and feedback

### 📝 Content Management
- **Blog Management**: Health articles and blog posts
- **CMS Content**: Dynamic website content management
- **Activities**: Health and wellness activities with videos
- **Public APIs**: Contact forms and public information

### 📁 File Management
- **File Upload**: Multi-format file upload system
- **File Download**: Secure file retrieval
- **Image Management**: Medical images and documents

### 🔍 Advanced Features
- **Activity Logging**: Track all system activities
- **Permission Management**: Role-based access control
- **Search & Filter**: Advanced search across all modules
- **Audit Trails**: Complete system audit capabilities

## 🚀 Quick Start

### 1. Import Collection
1. Open Postman
2. Click **Import** button
3. Upload `Hospital_Management_APIs.postman_collection.json`
4. Upload `Hospital_Management_Environment.postman_environment.json`

### 2. Set Environment
1. Select "Hospital Management Environment" from dropdown
2. Update the `baseUrl` variable to your server URL (default: `http://localhost:5001`)

### 3. Get Authentication Tokens
First, get admin token:
```bash
# Admin Login
POST {{baseUrl}}/api/auth/login
{
  "email": "admin@srmarnik.com",
  "password": "1234567"
}
```

Copy the token and set it in environment variable `adminToken`.

## 📚 API Categories Overview

### 1. Authentication (5 endpoints)
- Login, register, profile management
- Token-based JWT authentication

### 2. User Management (8 endpoints)  
- CRUD operations for all user types
- Role-based user management

### 3. Doctor Management (6 endpoints)
- **Create Doctor** - Complete doctor registration
- **Update Doctor** - Modify doctor information
- **Get All Doctors** - List all doctors
- **Get Doctor by ID** - Specific doctor details
- **Delete Doctor** - Remove doctor account

### 4. Doctor Slots Management (4 endpoints)
- **Get Doctor Slots** - Current weekly schedule
- **Set Weekly Slots** - Configure all weekly time slots
- **Update Day Slots** - Modify specific day (monday, tuesday, etc.)
- **Update Capacity** - Set patients per time slot

### 5. Services Management (5 endpoints)
- Medical services with pricing and categories
- Service creation and management

### 6. Appointments (15 endpoints)
- Complete appointment lifecycle management
- Booking, confirmation, cancellation, completion

### 7. Patient Management (12 endpoints)
- Patient records and medical history
- Patient registration and updates

### 8. Time Slots (8 endpoints)
- Advanced scheduling system
- Capacity management and availability

### 9. Blood Tests & Reports (6 endpoints)
- Blood test type management
- Report upload and management

### 10. Prescriptions (4 endpoints)
- Prescription file management
- Patient prescription history

### 11. Blog Management (5 endpoints)
- Health articles and blog posts
- Content creation and publishing

### 12. Coupons (3 endpoints)
- Discount coupon creation
- Coupon validation system

### 13. Activities (4 endpoints)
- Health and wellness activities
- Video content management

### 14. Testimonials (6 endpoints)
- Patient feedback and testimonials
- Rating and review system

### 15. CMS & Portfolio (8 endpoints)
- Website content management
- Hospital portfolio showcase

### 16. File Management (3 endpoints)
- Multi-format file upload
- Secure file download

### 17. Public APIs (3 endpoints)
- Public information access
- Contact form submissions

## 🔧 Environment Variables

The environment includes **25+ pre-configured variables**:

```json
{
  "baseUrl": "http://localhost:5001",
  "adminToken": "your_admin_jwt_token",
  "doctorToken": "your_doctor_jwt_token",
  "adminId": "admin_user_id",
  "doctorId": "doctor_user_id",
  "patientIds": "multiple_patient_ids",
  "serviceIds": "medical_service_ids",
  "appointmentIds": "appointment_ids",
  "bloodTestId": "blood_test_id",
  "couponId": "coupon_id",
  "blogPostId": "blog_post_id",
  "activityId": "activity_id",
  "testimonialId": "testimonial_id",
  "portfolioItemId": "portfolio_item_id",
  "cmsContentId": "cms_content_id",
  "filename": "sample_filename"
}
```

## 🎯 Testing Workflows

### Complete Doctor Setup Workflow
1. **Login as Admin** → Get admin token
2. **Create Doctor** → Create new doctor account
3. **Set Doctor Slots** → Configure weekly schedule  
4. **Update Capacity** → Set patients per slot
5. **Test Doctor Login** → Verify doctor authentication

### Appointment Booking Workflow
1. **Get Services** → Available medical services
2. **Get Doctor Slots** → Available time slots
3. **Create Patient** → Register patient
4. **Book Appointment** → Schedule appointment
5. **Confirm Appointment** → Finalize booking

### Medical Records Workflow
1. **Upload Blood Report** → Patient test results
2. **Upload Prescription** → Medication details
3. **Create Medical Summary** → Patient summary
4. **Track Activities** → Patient wellness activities

## 📋 Sample API Calls

### Create Doctor (Admin Only)
```bash
POST {{baseUrl}}/api/users
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "name": "Dr. Sarah Johnson",
  "email": "sarah.johnson@hospital.com", 
  "password": "doctor123",
  "role": "doctor",
  "specialization": "Cardiology",
  "bio": "Experienced cardiologist with 15+ years",
  "permissions": [
    "appointments:view",
    "appointments:edit", 
    "patients:view",
    "patients:edit",
    "timeslots:view",
    "timeslots:edit"
  ]
}
```

### Set Doctor Weekly Slots  
```bash
PUT {{baseUrl}}/api/timeslots/doctor/{{doctorId}}
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "monday": ["09:00", "09:30", "10:00", "14:00", "14:30"],
  "tuesday": ["09:00", "09:30", "10:00", "14:00", "14:30"], 
  "wednesday": ["09:00", "09:30", "10:00", "14:00", "14:30"],
  "thursday": ["09:00", "09:30", "10:00", "14:00", "14:30"],
  "friday": ["09:00", "09:30", "10:00", "14:00", "14:30"],
  "saturday": ["09:00", "09:30", "10:00"],
  "sunday": ["10:00", "15:00", "15:30"]
}
```

### Create Service
```bash
POST {{baseUrl}}/api/services
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "name": "Cardiology Consultation",
  "description": "Comprehensive heart health consultation",
  "price": 1200,
  "duration": 60,
  "category": "consultation",
  "isActive": true
}
```

### Book Appointment
```bash
POST {{baseUrl}}/api/appointments
Content-Type: application/json

{
  "patientId": "{{johnDoeId}}",
  "doctorId": "{{doctorId}}",
  "serviceId": "{{generalConsultationId}}",
  "date": "2025-08-10",
  "time": "09:00",
  "notes": "Regular checkup appointment"
}
```

### Upload Blood Report
```bash
POST {{baseUrl}}/api/blood-reports/upload
Authorization: Bearer {{adminToken}}
Content-Type: multipart/form-data

file: [blood_report.pdf]
patientId: {{johnDoeId}}
testType: Complete Blood Count
```

### Create Coupon
```bash
POST {{baseUrl}}/api/coupons
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "code": "HEALTH20",
  "discount": 20,
  "discountType": "percentage", 
  "expiryDate": "2025-12-31",
  "description": "20% discount on all services",
  "maxUses": 100
}
```

## 🔒 Authentication Requirements

- **Public APIs**: No authentication required
- **Patient APIs**: Patient authentication (some endpoints)
- **Doctor APIs**: Doctor authentication required  
- **Admin APIs**: Admin authentication required
- **File Upload**: Authentication required for most operations

## ⚡ Performance Testing

The collection includes capacity testing scenarios:
- **Load Testing**: Multiple concurrent appointments
- **Stress Testing**: High-volume data operations
- **Capacity Testing**: Doctor slot availability under load

## 🛠️ Customization

### Adding New Tests
1. Duplicate existing requests
2. Modify endpoints and payloads
3. Update environment variables as needed

### Custom Environments  
1. Create new environment
2. Copy variables from existing environment
3. Update URLs and credentials

## 📞 Support

For issues or questions:
1. Check API documentation in each request
2. Verify authentication tokens are valid
3. Ensure server is running on correct port
4. Check environment variable values

## 🎉 Ready to Use!

This collection provides **complete API coverage** for the Hospital Management System. You can:

✅ **Manage Complete Doctor Lifecycle** - Create, update, schedule doctors  
✅ **Handle All Appointments** - Book, confirm, manage appointments  
✅ **Process Medical Records** - Upload reports, prescriptions, summaries  
✅ **Manage Hospital Operations** - Services, coupons, content, files  
✅ **Test All Workflows** - End-to-end testing scenarios  

**Import the collection and start testing immediately!** 🚀

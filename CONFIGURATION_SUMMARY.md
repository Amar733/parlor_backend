# SRM Backend - Configuration Summary

## 🚀 Server Status

✅ **Server Running**: http://localhost:5001
✅ **Database Connected**: MongoDB Atlas (srk_arnkin)
✅ **AI Integration**: Google Gemini API configured

## 🔧 Environment Configuration

```env
PORT=5001
MONGODB_URI=mongodb+srv://akashsingh4321a:z8m0OYcAjqGbGVaO@cluster0.ctar15f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB=srk_arnkin
GEMINI_API_KEY=AIzaSyDkLIGnNdLXNpl-y3P_hNgIEAJXaceYgdg
```

## 📋 All API Endpoints

### Public Endpoints (No Authentication Required)

```
GET    /api/public/doctors              - Get all doctors
GET    /api/public/doctors/:id          - Get specific doctor
GET    /api/public/specializations      - Get specializations
GET    /api/services                    - Get all services
GET    /api/portfolio                   - Get portfolio items
GET    /api/testimonials                - Get testimonials
GET    /api/activities                  - Get activity videos
GET    /api/activities/:id              - Get specific activity
GET    /api/blog                        - Get blog posts
GET    /api/cms/:page/:section          - Get CMS content
GET    /api/timeslots                   - Get available timeslots
GET    /uploads/:filename               - Serve uploaded files
POST   /api/auth/login                  - User login
POST   /api/auth/register               - User registration
POST   /api/appointments                - Create appointment (public booking)
POST   /api/upload                      - File upload
```

### Private Endpoints (Authentication Required)

#### Actions & AI

```
POST   /api/actions/generate-summary    - Generate AI summary
POST   /api/actions/improve-text        - Improve text with AI
```

#### Appointments Management

```
GET    /api/appointments                - Get all appointments
GET    /api/appointments/:id            - Get specific appointment
PUT    /api/appointments/:id            - Update appointment
DELETE /api/appointments/:id            - Soft delete appointment
POST   /api/appointments/:id/restore    - Restore appointment
DELETE /api/appointments/:id/permanent  - Permanently delete
PATCH  /api/appointments/:id/status     - Update appointment status
```

#### Patient Management

```
GET    /api/patients                    - Get all patients
POST   /api/patients                    - Create new patient
GET    /api/patients/:id                - Get specific patient
PUT    /api/patients/:id                - Update patient
DELETE /api/patients/:id                - Soft delete patient
POST   /api/patients/:id/restore        - Restore patient
DELETE /api/patients/:id/permanent      - Permanently delete patient
```

#### Medical Records

```
GET    /api/blood-reports               - Get blood reports
POST   /api/blood-reports               - Upload blood report
GET    /api/blood-reports/:id           - Get specific blood report
PUT    /api/blood-reports/:id           - Update blood report
DELETE /api/blood-reports/:id           - Soft delete blood report
POST   /api/blood-reports/:id/restore   - Restore blood report
DELETE /api/blood-reports/:id/permanent - Permanently delete

GET    /api/prescriptions               - Get prescriptions
POST   /api/prescriptions               - Upload prescription
GET    /api/prescriptions/:id           - Get specific prescription
PUT    /api/prescriptions/:id           - Update prescription
DELETE /api/prescriptions/:id           - Soft delete prescription
POST   /api/prescriptions/:id/restore   - Restore prescription
DELETE /api/prescriptions/:id/permanent - Permanently delete
```

#### User & Profile Management

```
GET    /api/profile                     - Get current user profile
PUT    /api/profile                     - Update current user profile
GET    /api/users                       - Get all users
POST   /api/users                       - Create new user
GET    /api/users/:id                   - Get specific user
PUT    /api/users/:id                   - Update user
DELETE /api/users/:id                   - Delete user
```

#### Content Management

```
POST   /api/activities                  - Create activity video
PUT    /api/activities/:id              - Update activity
DELETE /api/activities/:id              - Delete activity
POST   /api/activities/:id/restore      - Restore activity
DELETE /api/activities/:id/permanent    - Permanently delete

GET    /api/blog                        - Get blog posts
POST   /api/blog                        - Create blog post
GET    /api/blog/:id                    - Get specific blog post
PUT    /api/blog/:id                    - Update blog post
DELETE /api/blog/:id                    - Delete blog post

GET    /api/cms/:page/:section          - Get CMS content
PUT    /api/cms/:page/:section          - Update CMS content

POST   /api/portfolio                   - Create portfolio item
PUT    /api/portfolio/:id               - Update portfolio item
DELETE /api/portfolio/:id               - Delete portfolio item

POST   /api/services                    - Create service
PUT    /api/services/:id                - Update service
DELETE /api/services/:id                - Delete service

POST   /api/testimonials                - Create testimonial
PUT    /api/testimonials/:id            - Update testimonial
DELETE /api/testimonials/:id            - Delete testimonial
```

#### Clinic Operations

```
GET    /api/activity-logs               - Get activity logs (Admin)
GET    /api/activity-logs/:id           - Get specific activity log
GET    /api/activity-logs/user/:userId  - Get user activity logs
POST   /api/activity-logs               - Create activity log (Admin)
DELETE /api/activity-logs/:id           - Delete activity log (Admin)

GET    /api/coupons                     - Get coupons
POST   /api/coupons                     - Create coupon
GET    /api/coupons/:id                 - Get specific coupon
PUT    /api/coupons/:id                 - Update coupon
DELETE /api/coupons/:id                 - Delete coupon

GET    /api/summaries                   - Get AI summaries
GET    /api/summaries/:id               - Get specific summary
POST   /api/summaries                   - Create summary
PUT    /api/summaries/:id               - Update summary
DELETE /api/summaries/:id               - Delete summary

GET    /api/timeslots                   - Get timeslots
PUT    /api/timeslots                   - Update timeslots master list
```

#### File & System Management

```
GET    /api/bin                         - Get deleted files (Admin)
POST   /api/bin/restore                 - Restore files from bin (Admin)
DELETE /api/bin/permanent               - Permanently delete files (Admin)

GET    /api/permissions                 - Get permissions
POST   /api/permissions                 - Create permission
PUT    /api/permissions/:id             - Update permission
DELETE /api/permissions/:id             - Delete permission
```

## 🔐 Authentication & Authorization

- **JWT Token Required**: All private endpoints require `Authorization: Bearer <token>`
- **Role-Based Access**: Admin, Doctor, Staff, Receptionist roles
- **Permission-Based Control**: Granular permissions for specific actions
- **Activity Logging**: All operations logged for audit trails

## 🤖 AI Features

- **Daily Summary Generation**: AI-powered clinic summaries using Google Gemini
- **Text Improvement**: Professional text enhancement
- **Context-Aware**: Adapts to medical practice terminology

## 📁 File Management

- **Upload Support**: Images, videos, PDFs, documents
- **Soft Delete System**: Files moved to bin before permanent deletion
- **File Serving**: Direct URL access to uploaded files
- **Security**: File type validation and size limits

## 🗄️ Database Schema

- **MongoDB Atlas**: Cloud-hosted database
- **Collections**: Users, Patients, Appointments, Services, Activities, etc.
- **Soft Delete**: Most entities support soft delete/restore
- **Relationships**: Proper document references and population

## �️ Development Setup

### Available Scripts

```bash
# Production server
npm start                  # Runs server with node

# Development server
npm run dev               # Runs server with nodemon (auto-restart)
npm run dev:verbose       # Runs nodemon with verbose logging
npm run dev:inspect       # Runs nodemon with debugging support
```

### Nodemon Configuration

Nodemon is configured to:

- **Watch**: `server.js`, `routes/`, `models/`, `middleware/`, `services/`, `ai/`, `.env`
- **File Extensions**: `.js`, `.json`
- **Ignore**: `node_modules/`, `uploads/`, `logs/`, test files
- **Restart Delay**: 1 second
- **Manual Restart**: Type `rs` in terminal

### Development Workflow

1. **Start Development Server**:

   ```bash
   npm run dev
   ```

2. **Make Changes**: Edit any watched files and nodemon will automatically restart

3. **Manual Restart**: Type `rs` + Enter in the terminal when needed

4. **Debug Mode**: Use `npm run dev:inspect` for debugging with tools like Chrome DevTools

## �🔧 Frontend Integration Notes

**Base URL for API calls**: `http://localhost:5001`

**Example API Usage**:

```javascript
// Get all services (public)
fetch("http://localhost:5001/api/services");

// Create appointment with auth
fetch("http://localhost:5001/api/appointments", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  },
  body: JSON.stringify(appointmentData),
});

// Generate AI summary
fetch("http://localhost:5001/api/actions/generate-summary", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  },
  body: JSON.stringify({ date: "2025-01-15" }),
});
```

## ✅ Setup Complete

Your Express.js backend is now fully configured and running with:

- ✅ All API endpoints from your documentation implemented
- ✅ MongoDB Atlas connection established
- ✅ Google Gemini AI integration ready
- ✅ File upload and management system
- ✅ Comprehensive security and logging
- ✅ Permission-based access control
- ✅ Activity audit trails

**Server URL**: http://localhost:5001
**Health Check**: http://localhost:5001/health

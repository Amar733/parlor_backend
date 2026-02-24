# SRM Backend API

A comprehensive Node.js Express.js backend API for Student Record Management system with authentication, file uploads, and CRUD operations.

## Features

- 🔐 JWT Authentication & Authorization
- 👥 User Management with Roles (Admin, Doctor, Staff, Receptionist)
- 📋 Patient Management
- 📅 Appointment Scheduling
- 🩺 Medical Records (Blood Reports, Prescriptions)
- 💼 Service Management
- 🎨 Portfolio & Testimonials
- 🎟️ Coupon System
- 🔒 Permission-based Access Control
- 📁 File Upload Support
- 🔍 Search & Pagination
- 🗑️ Soft Delete Functionality

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **File Upload**: Multer
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Joi
- **Logging**: Morgan

## Project Structure

```
srm_backend/
├── models/              # Database models
├── routes/              # API routes
├── middleware/          # Custom middleware
├── uploads/             # File uploads directory
├── .env                 # Environment variables
├── .gitignore          # Git ignore file
├── package.json        # Dependencies and scripts
├── server.js           # Main server file
└── README.md           # Project documentation
```

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd srm_backend
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` file with your configuration:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/srm_backend
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5000000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

4. Create uploads directory:

```bash
mkdir uploads
```

5. Start the server:

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### Patients

- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient (soft delete)

### Appointments

- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `PATCH /api/appointments/:id/status` - Update appointment status
- `DELETE /api/appointments/:id` - Delete appointment

### Services

- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get service by ID
- `POST /api/services` - Create new service (Admin only)
- `PUT /api/services/:id` - Update service (Admin only)
- `DELETE /api/services/:id` - Delete service (Admin only)

### Blood Reports

- `GET /api/blood-reports` - Get all blood reports
- `GET /api/blood-reports/:id` - Get blood report by ID
- `POST /api/blood-reports` - Upload new blood report
- `PUT /api/blood-reports/:id` - Update blood report
- `DELETE /api/blood-reports/:id` - Delete blood report

### Prescriptions

- `GET /api/prescriptions` - Get all prescriptions
- `GET /api/prescriptions/:id` - Get prescription by ID
- `POST /api/prescriptions` - Upload new prescription
- `PUT /api/prescriptions/:id` - Update prescription
- `DELETE /api/prescriptions/:id` - Delete prescription

### Users Management

- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/doctors` - Get all doctors
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user (Admin only)
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id/permissions` - Update user permissions (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Coupons

- `GET /api/coupons` - Get all coupons
- `GET /api/coupons/:id` - Get coupon by ID
- `GET /api/coupons/validate/:code` - Validate coupon
- `POST /api/coupons` - Create new coupon (Admin only)
- `PUT /api/coupons/:id` - Update coupon (Admin only)
- `PATCH /api/coupons/:id/status` - Update coupon status (Admin only)
- `DELETE /api/coupons/:id` - Delete coupon (Admin only)

### Portfolio

- `GET /api/portfolio` - Get all portfolio items
- `GET /api/portfolio/:id` - Get portfolio item by ID
- `POST /api/portfolio` - Create new portfolio item (Admin only)
- `PUT /api/portfolio/:id` - Update portfolio item (Admin only)
- `DELETE /api/portfolio/:id` - Delete portfolio item (Admin only)

### Testimonials

- `GET /api/testimonials` - Get all testimonials
- `GET /api/testimonials/:id` - Get testimonial by ID
- `POST /api/testimonials` - Create new testimonial (Admin only)
- `PUT /api/testimonials/:id` - Update testimonial (Admin only)
- `DELETE /api/testimonials/:id` - Delete testimonial (Admin only)

### Permissions

- `GET /api/permissions` - Get all permissions (Admin only)
- `GET /api/permissions/:id` - Get permission by ID (Admin only)
- `POST /api/permissions` - Create new permission (Admin only)
- `PUT /api/permissions/:id` - Update permission (Admin only)
- `DELETE /api/permissions/:id` - Delete permission (Admin only)

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## User Roles

- **Admin**: Full access to all resources
- **Doctor**: Access to patients, appointments, medical records
- **Staff**: Limited access to patients and appointments
- **Receptionist**: Access to appointments and basic patient info

## File Uploads

Supported file types: JPEG, PNG, GIF, PDF, DOC, DOCX
Maximum file size: 5MB

## Error Handling

The API returns consistent error responses:

```json
{
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

## Security Features

- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet for security headers
- Password hashing with bcrypt
- JWT token expiration
- File type validation
- SQL injection protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License.

# SRM Arnik Clinic - API Endpoints

This document outlines all the available API endpoints for the SRM Arnik Skin & Healthcare Clinic admin panel application.

---

## 1. Public API Endpoints

These endpoints are accessible without authentication and are primarily used by the public-facing booking form and website components.

| Method | Endpoint                    | Description                                                                    |
| :----- | :-------------------------- | :----------------------------------------------------------------------------- |
| `POST` | `/api/auth/login`           | Authenticates a user and returns a JWT token.                                  |
| `POST` | `/api/upload`               | Handles file uploads and returns a public URL to the stored file.              |
| `POST` | `/api/appointments`         | Creates a new appointment, often including new patient creation.               |
| `GET`  | `/api/public/doctors`       | _Note: This route is defined in middleware but has no handler._                |
| `GET`  | `/api/services`             | Retrieves a list of all clinic services.                                       |
| `GET`  | `/api/activities`           | Retrieves a list of all clinic activity videos.                                |
| `GET`  | `/api/portfolio`            | Retrieves all portfolio items.                                                 |
| `GET`  | `/api/testimonials`         | Retrieves all client testimonials.                                             |
| `GET`  | `/api/blog`                 | Retrieves all blog posts.                                                      |
| `GET`  | `/api/cms/[page]/[section]` | Retrieves content for a specific section of a public-facing page.              |
| `GET`  | `/api/timeslots`            | Retrieves available time slots for booking. Supports filtering by doctor/date. |

---

## 2. Private API Endpoints

These endpoints require a valid JWT token in the `Authorization` header. Access may be further restricted by user role and permissions.

### Actions

| Method | Endpoint                        | Description                               |
| :----- | :------------------------------ | :---------------------------------------- |
| `POST` | `/api/actions/generate-summary` | Generates a daily AI summary.             |
| `POST` | `/api/actions/improve-text`     | Uses AI to improve a given block of text. |

### Appointments

| Method   | Endpoint                           | Description                                 |
| :------- | :--------------------------------- | :------------------------------------------ |
| `GET`    | `/api/appointments`                | Retrieves all appointments.                 |
| `PUT`    | `/api/appointments/[id]`           | Updates an existing appointment.            |
| `DELETE` | `/api/appointments/[id]`           | Soft deletes an appointment (moves to bin). |
| `POST`   | `/api/appointments/[id]/restore`   | Restores a soft-deleted appointment.        |
| `POST`   | `/api/appointments/[id]/permanent` | Permanently deletes an appointment.         |

### Patients

| Method   | Endpoint                       | Description                      |
| :------- | :----------------------------- | :------------------------------- |
| `GET`    | `/api/patients`                | Retrieves all patients.          |
| `POST`   | `/api/patients`                | Creates a new patient.           |
| `PUT`    | `/api/patients/[id]`           | Updates a patient's details.     |
| `DELETE` | `/api/patients/[id]`           | Soft deletes a patient.          |
| `POST`   | `/api/patients/[id]/restore`   | Restores a soft-deleted patient. |
| `DELETE` | `/api/patients/[id]/permanent` | Permanently deletes a patient.   |

### Medical Records (Blood Reports & Prescriptions)

| Method   | Endpoint                            | Description                               |
| :------- | :---------------------------------- | :---------------------------------------- |
| `GET`    | `/api/blood-reports`                | Retrieves all blood reports.              |
| `POST`   | `/api/blood-reports`                | Uploads a new blood report for a patient. |
| `DELETE` | `/api/blood-reports/[id]`           | Soft deletes a blood report.              |
| `POST`   | `/api/blood-reports/[id]/restore`   | Restores a soft-deleted blood report.     |
| `DELETE` | `/api/blood-reports/[id]/permanent` | Permanently deletes a blood report.       |
| `GET`    | `/api/prescriptions`                | Retrieves all prescriptions.              |
| `POST`   | `/api/prescriptions`                | Uploads a new prescription for a patient. |
| `DELETE` | `/api/prescriptions/[id]`           | Soft deletes a prescription.              |
| `POST`   | `/api/prescriptions/[id]/restore`   | Restores a soft-deleted prescription.     |
| `DELETE` | `/api/prescriptions/[id]/permanent` | Permanently deletes a prescription.       |

### Users & Profile

| Method   | Endpoint          | Description                                            |
| :------- | :---------------- | :----------------------------------------------------- |
| `GET`    | `/api/profile`    | Retrieves the profile of the currently logged-in user. |
| `PUT`    | `/api/profile`    | Updates the profile of the currently logged-in user.   |
| `GET`    | `/api/users`      | Retrieves a list of all users.                         |
| `POST`   | `/api/users`      | Creates a new user.                                    |
| `PUT`    | `/api/users/[id]` | Updates a specific user's details.                     |
| `DELETE` | `/api/users/[id]` | Deletes a user.                                        |

### Content & Website Management

| Method   | Endpoint                    | Description                                    |
| :------- | :-------------------------- | :--------------------------------------------- |
| `POST`   | `/api/activities`           | Creates a new activity video.                  |
| `PUT`    | `/api/activities/[id]`      | Updates an activity video's details.           |
| `DELETE` | `/api/activities/[id]`      | Deletes an activity video.                     |
| `POST`   | `/api/blog`                 | Creates a new blog post.                       |
| `PUT`    | `/api/blog/[id]`            | Updates a blog post.                           |
| `DELETE` | `/api/blog/[id]`            | Deletes a blog post.                           |
| `PUT`    | `/api/cms/[page]/[section]` | Updates a specific section of website content. |
| `POST`   | `/api/portfolio`            | Creates a new portfolio item.                  |
| `PUT`    | `/api/portfolio/[id]`       | Updates a portfolio item.                      |
| `DELETE` | `/api/portfolio/[id]`       | Deletes a portfolio item.                      |
| `POST`   | `/api/services`             | Creates a new service.                         |
| `PUT`    | `/api/services/[id]`        | Updates a service.                             |
| `DELETE` | `/api/services/[id]`        | Deletes a service.                             |
| `POST`   | `/api/testimonials`         | Creates a new testimonial.                     |
| `PUT`    | `/api/testimonials/[id]`    | Updates a testimonial.                         |
| `DELETE` | `/api/testimonials/[id]`    | Deletes a testimonial.                         |

### Clinic Operations

| Method   | Endpoint             | Description                                      |
| :------- | :------------------- | :----------------------------------------------- |
| `GET`    | `/api/activity-logs` | Retrieves all system activity logs (Admin only). |
| `GET`    | `/api/coupons`       | Retrieves all coupons.                           |
| `POST`   | `/api/coupons`       | Creates a new coupon.                            |
| `PUT`    | `/api/coupons/[id]`  | Updates a coupon.                                |
| `DELETE` | `/api/coupons/[id]`  | Deletes a coupon.                                |
| `GET`    | `/api/summaries`     | Retrieves AI-generated summaries.                |
| `PUT`    | `/api/timeslots`     | Updates the master list of time slots.           |

<!-- Obsolete/Unused Routes -->
<!-- The following routes were identified but are not actively used or have been deprecated. -->
<!-- GET /api/blood-tests, POST /api/blood-tests, PUT /api/blood-tests/[id], DELETE /api/blood-tests/[id] -->
<!-- `GET`, `POST`, `PUT`, `DELETE` on `/api/doctors` and `/api/doctors/[id]` -->

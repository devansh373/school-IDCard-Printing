# School ID Card Printing System - API Documentation

## Base URL
```
http://localhost:PORT/api
```

## Authentication
Most endpoints require authentication via JWT token stored in HTTP-only cookies. Include the `access_token` cookie in requests.

## Response Format
All responses are in JSON format.

---

## Health Check

### Get Health Status
- **Endpoint:** `GET /health`
- **Authentication:** Not required
- **Description:** Check if the API is running
- **Response:**
  ```json
  {
    "status": "OK"
  }
  ```

---

## Authentication Endpoints (`/api/auth`)

### 1. Login
- **Endpoint:** `POST /auth/login`
- **Authentication:** Not required
- **Description:** Authenticate user with email and password. Returns JWT token in HTTP-only cookie.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response (Success):**
  ```json
  {
    "message": "Login successful",
    "user": {
      "id": 1,
      "role": "SUPER_ADMIN|SCHOOL_ADMIN|TEACHER|VENDOR",
      "mustChangePassword": false
    }
  }
  ```
- **Response (Failure):** 
  - 400: Email and password required
  - 401: Invalid credentials

---

### 2. Logout
- **Endpoint:** `POST /auth/logout`
- **Authentication:** Not required
- **Description:** Logout user by clearing the authentication cookie
- **Response:**
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

---

### 3. Change Password
- **Endpoint:** `POST /auth/change-password`
- **Authentication:** Required
- **Authorization:** All authenticated users
- **Description:** Change user password. Forces password change on first login.
- **Request Body:**
  ```json
  {
    "currentPassword": "oldPassword123",
    "newPassword": "newPassword123"
  }
  ```
- **Response (Success):**
  ```json
  {
    "message": "Password updated successfully"
  }
  ```
- **Response (Failure):**
  - 400: Current and new password are required / Current password is incorrect
  - 401: Unauthorized

---

## School Endpoints (`/api/schools`)

### 1. Create School
- **Endpoint:** `POST /schools/`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN only
- **Description:** Create a new school
- **Request Body:**
  ```json
  {
    "name": "ABC School",
    "code": "ABC001"
  }
  ```
- **Response (Success):**
  ```json
  {
    "id": 1,
    "name": "ABC School",
    "code": "ABC001",
    "createdAt": "2026-01-10T12:00:00Z"
  }
  ```
- **Response (Failure):**
  - 400: School name and code are required
  - 409: School code already exists
  - 500: Failed to create school

---

### 2. Get All Schools
- **Endpoint:** `GET /schools/`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN only
- **Description:** Retrieve all schools
- **Query Parameters:** None
- **Response (Success):**
  ```json
  [
    {
      "id": 1,
      "name": "ABC School",
      "code": "ABC001",
      "createdAt": "2026-01-10T12:00:00Z"
    }
  ]
  ```

---

### 3. Register School with Admin
- **Endpoint:** `POST /schools/register`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN only
- **Description:** Create a new school and register its admin. Temporary password is sent to admin email.
- **Request Body:**
  ```json
  {
    "name": "ABC School",
    "code": "ABC001",
    "adminEmail": "admin@abcschool.com"
  }
  ```
- **Response (Success):**
  ```json
  {
    "message": "School created and admin credentials sent via email",
    "schoolId": 1
  }
  ```
- **Response (Failure):**
  - 400: name, code and adminEmail are required
  - 409: School code already exists / Admin email already exists
  - 403: Forbidden (not SUPER_ADMIN)
  - 500: Failed to register school

---

## Class Endpoints (`/api/classes`)

### 1. Create Class
- **Endpoint:** `POST /classes/`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN, SCHOOL_ADMIN
- **Description:** Create a new class. SCHOOL_ADMIN can only create for their own school.
- **Request Body:**
  ```json
  {
    "name": "Class 10-A",
    "schoolId": 1
  }
  ```
- **Response (Success):**
  ```json
  {
    "id": 1,
    "name": "Class 10-A",
    "schoolId": 1,
    "createdAt": "2026-01-10T12:00:00Z"
  }
  ```
- **Response (Failure):**
  - 400: name and schoolId required
  - 403: Forbidden (SCHOOL_ADMIN trying to access another school)

---

### 2. Get Classes
- **Endpoint:** `GET /classes/`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER
- **Description:** Retrieve all classes. SCHOOL_ADMIN and TEACHER see only their school's classes.
- **Query Parameters:** None
- **Response (Success):**
  ```json
  [
    {
      "id": 1,
      "name": "Class 10-A",
      "schoolId": 1,
      "sections": [
        {
          "id": 1,
          "name": "Section A",
          "classId": 1
        }
      ],
      "createdAt": "2026-01-10T12:00:00Z"
    }
  ]
  ```

---

## Section Endpoints (`/api/sections`)

### 1. Create Section
- **Endpoint:** `POST /sections/`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN, SCHOOL_ADMIN
- **Description:** Create a new section under a class. SCHOOL_ADMIN isolation enforced.
- **Request Body:**
  ```json
  {
    "name": "Section A",
    "classId": 1
  }
  ```
- **Response (Success):**
  ```json
  {
    "id": 1,
    "name": "Section A",
    "classId": 1,
    "createdAt": "2026-01-10T12:00:00Z"
  }
  ```
- **Response (Failure):**
  - 400: name and classId required
  - 404: Class not found
  - 403: Forbidden (SCHOOL_ADMIN isolation)

---

### 2. Get Sections
- **Endpoint:** `GET /sections/`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER
- **Description:** Retrieve all sections. SCHOOL_ADMIN and TEACHER see only their school's sections.
- **Query Parameters:** None
- **Response (Success):**
  ```json
  [
    {
      "id": 1,
      "name": "Section A",
      "classId": 1,
      "createdAt": "2026-01-10T12:00:00Z"
    }
  ]
  ```

---

## Student Endpoints (`/api/students`)

### 1. Get Students
- **Endpoint:** `GET /students/`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER
- **Description:** Retrieve students with filtering. SCHOOL_ADMIN and TEACHER see only their school's students.
- **Query Parameters:**
  - `schoolCode` (string): Filter by school code (SUPER_ADMIN only)
  - `class` (string): Filter by class name
  - `section` (string): Filter by section name
  - `printStatus` (string): Filter by print status (NOT_STARTED, IN_PROGRESS, COMPLETED, FAILED)
  - `search` (string): Search by student name or enrollment number
- **Example Request:** `GET /students/?schoolCode=ABC001&class=Class 10-A&printStatus=COMPLETED&search=John`
- **Response (Success):**
  ```json
  [
    {
      "id": 1,
      "name": "John Doe",
      "enrollmentNumber": "ABC001001",
      "photoUrl": "https://cdn.example.com/photo.jpg",
      "photoStatus": "UPLOADED|PENDING",
      "printStatus": "COMPLETED",
      "schoolId": 1,
      "classId": 1,
      "sectionId": 1,
      "class": {
        "id": 1,
        "name": "Class 10-A",
        "schoolId": 1
      },
      "section": {
        "id": 1,
        "name": "Section A",
        "classId": 1
      },
      "school": {
        "id": 1,
        "name": "ABC School",
        "code": "ABC001"
      },
      "createdAt": "2026-01-10T12:00:00Z"
    }
  ]
  ```
- **Response (Failure):**
  - 400: Invalid printStatus value
  - 404: School not found (if schoolCode provided)

---

### 2. Get Student by ID
- **Endpoint:** `GET /students/:id`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER
- **Description:** Retrieve a specific student by ID. SCHOOL_ADMIN and TEACHER can only access their school's students.
- **Path Parameters:**
  - `id` (number): Student ID
- **Response (Success):** Same as individual student object from Get Students
- **Response (Failure):**
  - 404: Student not found
  - 403: Forbidden (SCHOOL_ADMIN/TEACHER accessing another school's student)

---

### 3. Import Students
- **Endpoint:** `POST /students/import`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN, SCHOOL_ADMIN
- **Description:** Bulk import students from a CSV or Excel file
- **Request Body:** Form-data
  - `file` (multipart file): CSV/Excel file containing student data
  - `schoolCode` (string): School code to import into (required for SUPER_ADMIN, optional for SCHOOL_ADMIN)
- **Response (Success):**
  ```json
  {
    "message": "Import successful",
    "importedCount": 50,
    "failedCount": 0
  }
  ```
- **Response (Failure):**
  - 400: File is required
  - 400/500: Import processing errors

---

### 4. Upload Student Photo
- **Endpoint:** `POST /students/:id/photo`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN, SCHOOL_ADMIN
- **Description:** Upload or update a student's photo. Photo is stored on ImageKit CDN.
- **Path Parameters:**
  - `id` (number): Student ID
- **Request Body:** Form-data
  - `photo` (multipart file): Image file (JPG, PNG, etc.)
- **Response (Success):**
  ```json
  {
    "message": "Photo uploaded successfully",
    "photoUrl": "https://cdn.imagekit.io/students/1/student_1.jpg"
  }
  ```
- **Response (Failure):**
  - 400: Image file required
  - 404: Student not found
  - 403: Forbidden (SCHOOL_ADMIN accessing another school's student)

---

## Vendor Endpoints (`/api/vendors`)

### 1. Register Vendor
- **Endpoint:** `POST /vendors/register`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN only
- **Description:** Register a new vendor for ID card printing. Temporary password is sent via email.
- **Request Body:**
  ```json
  {
    "vendorName": "ABC Printing Services",
    "email": "vendor@abcprinting.com",
    "phoneNumber": "+1234567890",
    "location": "City, State"
  }
  ```
- **Response (Success):**
  ```json
  {
    "message": "Vendor registered and credentials sent via email"
  }
  ```
- **Response (Failure):**
  - 400: vendorName, email, phoneNumber and location are required
  - 403: Forbidden (not SUPER_ADMIN)
  - 409: Vendor with this email already exists
  - 500: Failed to register vendor

---

## Dashboard Endpoints (`/api/dashboard`)

### 1. Super Admin Dashboard
- **Endpoint:** `GET /dashboard/super-admin`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN only
- **Middleware:** Requires password to have been changed (not default)
- **Description:** Get dashboard statistics and recent data for super admin
- **Response (Success):**
  ```json
  {
    "stats": {
      "totalSchools": 5,
      "activeVendors": 3
    },
    "recentSchools": [
      {
        "id": 1,
        "name": "ABC School",
        "code": "ABC001",
        "createdAt": "2026-01-10T12:00:00Z"
      }
    ]
  }
  ```
- **Response (Failure):**
  - 403: Forbidden (not SUPER_ADMIN or must change password)
  - 500: Failed to load dashboard data

---

## User Roles

The system implements Role-Based Access Control (RBAC) with the following roles:

| Role | Permissions |
|------|------------|
| **SUPER_ADMIN** | Full system access. Can create schools, manage school admins, manage vendors, view all data. |
| **SCHOOL_ADMIN** | Can manage their school's classes, sections, students, and teachers. Cannot access other schools' data. |
| **TEACHER** | Can view their school's classes, sections, and students. Cannot modify data. |
| **VENDOR** | Can access vendor portal for ID card printing operations. |

---

## Error Responses

All errors follow this format:

```json
{
  "message": "Error description"
}
```

### Common HTTP Status Codes
- **200 OK:** Successful GET request
- **201 Created:** Successful resource creation (POST)
- **400 Bad Request:** Invalid input or missing required fields
- **401 Unauthorized:** Authentication required or invalid credentials
- **403 Forbidden:** Authenticated but insufficient permissions
- **404 Not Found:** Resource not found
- **409 Conflict:** Duplicate entry or conflicting data
- **500 Internal Server Error:** Server-side error

---

## Enums

### PrintStatus
- `NOT_STARTED`: Print job not yet started
- `IN_PROGRESS`: Print job is being processed
- `COMPLETED`: Print job completed successfully
- `FAILED`: Print job failed

### PhotoStatus
- `PENDING`: Photo awaiting upload
- `UPLOADED`: Photo successfully uploaded

### VendorStatus
- `ONBOARDING`: Vendor account being set up
- `ACTIVE`: Vendor account is active
- `INACTIVE`: Vendor account is inactive

---

## Security Features

✅ **Authentication:** JWT-based with HTTP-only cookies
✅ **Authorization:** Role-based access control (RBAC)
✅ **Data Isolation:** SCHOOL_ADMIN and TEACHER cannot access data outside their school
✅ **Password Security:** Bcrypt hashing with salt
✅ **CSRF Protection:** SameSite cookie policy
✅ **Input Validation:** All endpoints validate request data
✅ **File Upload Security:** Images stored on ImageKit CDN, not local disk

---

## Generated on
January 10, 2026

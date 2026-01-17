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

### 4. Get User Profile

- **Endpoint:** `GET /auth/profile`
- **Authentication:** Required
- **Authorization:** All authenticated users
- **Description:** Retrieve the authenticated user's profile information including school or vendor details.
- **Response (Success):**
  ```json
  {
    "profile": {
      "id": 1,
      "email": "user@example.com",
      "role": "SUPER_ADMIN",
      "mustChangePassword": false,
      "isActive": true,
      "createdAt": "2026-01-10T12:00:00Z"
    }
  }
  ```
- **Response (School Admin/Teacher includes school):**
  ```json
  {
    "profile": {
      "id": 2,
      "email": "schooladmin@example.com",
      "role": "SCHOOL_ADMIN",
      "school": {
        "id": 1,
        "name": "ABC School",
        "code": "ABC001",
        "logoUrl": "https://ik.imagekit.io/...",
        "templateUrl": "https://ik.imagekit.io/..."
      },
      "mustChangePassword": false,
      "isActive": true,
      "createdAt": "2026-01-10T12:00:00Z"
    }
  }
  ```
- **Response (Vendor includes vendor fields):**
  ```json
  {
    "profile": {
      "id": 5,
      "email": "vendor@example.com",
      "role": "VENDOR",
      "vendorName": "XYZ Printing",
      "phoneNumber": "+919876543210",
      "location": "New York",
      "vendorStatus": "ACTIVE",
      "mustChangePassword": false,
      "isActive": true,
      "createdAt": "2026-01-10T12:00:00Z"
    }
  }
  ```
- **Response (Failure):**
  - 401: Unauthorized

---

### 5. Update User Profile (Self)

- **Endpoint:** `PUT /auth/profile`
- **Authentication:** Required
- **Authorization:** All authenticated users
- **Description:** Update your own profile. Users can only update safe personal fields (not role, access control, etc).
- **Updatable Fields:** `email`, `phoneNumber`, `vendorName`, `location`
- **Request Body:**
  ```json
  {
    "email": "newemail@example.com",
    "phoneNumber": "+919876543210"
  }
  ```
- **Response (Success):**
  ```json
  {
    "message": "Profile updated",
    "user": {
      "id": 5,
      "email": "newemail@example.com",
      "role": "VENDOR",
      "phoneNumber": "+919876543210",
      "vendorName": "XYZ Printing",
      "location": "New York",
      "vendorStatus": "ACTIVE",
      "schoolId": null,
      "mustChangePassword": false,
      "isActive": true,
      "createdAt": "2026-01-10T12:00:00Z"
    }
  }
  ```
- **Response (Failure):**
  - 400: At least one field is required / Email already in use
  - 401: Unauthorized
  - 500: Failed to update profile

---

### 6. Get Any User (Admin Only)

- **Endpoint:** `GET /auth/users/:id`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN only
- **Description:** Admin can view any user's full profile including school or vendor information.
- **Path Parameters:** `id` (user ID)
- **Response (Success):**
  ```json
  {
    "id": 2,
    "email": "schooladmin@example.com",
    "role": "SCHOOL_ADMIN",
    "school": {
      "id": 1,
      "name": "ABC School",
      "code": "ABC001",
      "logoUrl": "https://ik.imagekit.io/...",
      "templateUrl": "https://ik.imagekit.io/..."
    },
    "schoolId": 1,
    "mustChangePassword": false,
    "isActive": true,
    "createdAt": "2026-01-10T12:00:00Z"
  }
  ```
  router.get(
  "/users/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  getUser
  );

router.get(
"/users",
authenticate,
authorizeRoles("SUPER_ADMIN"),
getAllUsers
);

router.get(
"/vendors",
authenticate,
authorizeRoles("SUPER_ADMIN"),
getAllVendors
);

router.get(
"/school-admins",
authenticate,
authorizeRoles("SUPER_ADMIN"),
getAllSchoolAdmins
);

- **Response (Failure):**
  - 401: Unauthorized
  - 403: Forbidden (not SUPER_ADMIN)
  - 404: User not found
  - 500: Failed to fetch user

---

### 8. Get All Users (Admin)

- **Endpoint:** `GET /auth/users`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN only
- **Description:** List all users with optional filters (role, school, active status) and pagination.
- **Query Parameters:**
  - `role` (string): Filter by role (SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, VENDOR)
  - `schoolId` (number): Filter by school ID
  - `isActive` (boolean): Filter by active status (true/false)
  - `search` (string): Search by email or vendor name
  - `limit` (number, optional): Items per page. Default: 10, Max: 100
  - `page` (number, optional): Page number. Default: 1
- **Example Request:** `GET /auth/users?role=VENDOR&isActive=true&search=ABC&limit=20&page=1`
- **Response (Success):**
  ```json
  {
    "data": [
      {
        "id": 5,
        "email": "vendor1@example.com",
        "role": "VENDOR",
        "vendorName": "ABC Printing",
        "phoneNumber": "+919876543210",
        "location": "New York",
        "vendorStatus": "ACTIVE",
        "schoolId": null,
        "mustChangePassword": false,
        "isActive": true,
        "createdAt": "2026-01-10T12:00:00Z",
        "school": null
      },
      {
        "id": 6,
        "email": "vendor2@example.com",
        "role": "VENDOR",
        "vendorName": "XYZ Printing",
        "phoneNumber": "+919876543211",
        "location": "Los Angeles",
        "vendorStatus": "ONBOARDING",
        "schoolId": null,
        "mustChangePassword": true,
        "isActive": true,
        "createdAt": "2026-01-11T12:00:00Z",
        "school": null
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "totalPages": 3
    }
  }
  ```
- **Response (Failure):**
  - 400: Invalid role
  - 401: Unauthorized
  - 403: Forbidden
  - 500: Failed to fetch users

---

### 9. Get All Vendors (Admin)

- **Endpoint:** `GET /auth/vendors`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN only
- **Description:** List all vendors with optional filters (status, active status) and pagination.
- **Query Parameters:**
  - `vendorStatus` (string): Filter by vendor status (ONBOARDING, ACTIVE, INACTIVE)
  - `isActive` (boolean): Filter by active status (true/false)
  - `search` (string): Search by email or vendor name
  - `limit` (number, optional): Items per page. Default: 10, Max: 100
  - `page` (number, optional): Page number. Default: 1
- **Example Request:** `GET /auth/vendors?vendorStatus=ACTIVE&isActive=true&search=Printing&limit=20&page=1`
- **Response (Success):**
  ```json
  {
    "data": [
      {
        "id": 5,
        "email": "vendor@example.com",
        "vendorName": "ABC Printing Services",
        "phoneNumber": "+919876543210",
        "location": "New York",
        "vendorStatus": "ACTIVE",
        "isActive": true,
        "createdAt": "2026-01-10T12:00:00Z",
        "schoolIds": [1, 2, 3]
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 10,
      "totalPages": 2
    }
  }
  ```
- **Response (Failure):**
  - 400: Invalid vendorStatus
  - 401: Unauthorized
  - 403: Forbidden
  - 500: Failed to fetch vendors

---

### 10. Get All School Admins (Admin)

- **Endpoint:** `GET /auth/school-admins`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN only
- **Description:** List all school admins with their assigned schools and pagination.
- **Query Parameters:**
  - `schoolId` (number): Filter by school ID
  - `isActive` (boolean): Filter by active status (true/false)
  - `search` (string): Search by email
  - `limit` (number, optional): Items per page. Default: 10, Max: 100
  - `page` (number, optional): Page number. Default: 1
- **Example Request:** `GET /auth/school-admins?schoolId=1&isActive=true&limit=20&page=1`
- **Response (Success):**
  ```json
  {
    "data": [
      {
        "id": 2,
        "email": "admin1@school.com",
        "schoolId": 1,
        "school": {
          "id": 1,
          "name": "ABC School",
          "code": "ABC001"
        },
        "mustChangePassword": false,
        "isActive": true,
        "createdAt": "2026-01-10T12:00:00Z"
      },
      {
        "id": 3,
        "email": "admin2@school.com",
        "schoolId": 1,
        "school": {
          "id": 1,
          "name": "ABC School",
          "code": "ABC001"
        },
        "mustChangePassword": true,
        "isActive": true,
        "createdAt": "2026-01-11T12:00:00Z"
      }
    ],
    "pagination": {
      "total": 12,
      "page": 1,
      "limit": 10,
      "totalPages": 2
    }
  }
  ```
- **Response (Failure):**
  - 401: Unauthorized
  - 403: Forbidden
  - 500: Failed to fetch school admins

---

### 7. Update Any User (Admin Only)

- **Endpoint:** `PUT /auth/users/:id`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN only
- **Description:** Super Admin can update any user's profile including role, active status, and access control.
- **Path Parameters:** `id` (user ID)
- **Updatable Fields:** `email`, `role`, `isActive`, `vendorName`, `phoneNumber`, `location`, `vendorStatus`, `schoolId`, `mustChangePassword`
- **Request Body:**
  ```json
  {
    "role": "VENDOR",
    "isActive": false,
    "vendorName": "New Vendor",
    "phoneNumber": "+919876543210",
    "location": "City",
    "vendorStatus": "INACTIVE"
  }
  ```
- **Response (Success):**
  ```json
  {
    "message": "User updated",
    "user": {
      "id": 3,
      "email": "user@example.com",
      "role": "VENDOR",
      "vendorName": "New Vendor",
      "phoneNumber": "+919876543210",
      "location": "City",
      "vendorStatus": "INACTIVE",
      "schoolId": null,
      "mustChangePassword": false,
      "isActive": false,
      "createdAt": "2026-01-10T12:00:00Z"
    }
  }
  ```
- **Response (Failure):**
  - 400: At least one field required / Invalid role / Invalid vendorStatus / Email already in use
  - 401: Unauthorized
  - 403: Forbidden (not SUPER_ADMIN)
  - 404: User not found
  - 500: Failed to update user

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
- **Description:** Retrieve all schools with their admin email, profile information, ImageKit configuration, and pagination.
- **Query Parameters:**
  - `limit` (number, optional): Items per page. Default: 10, Max: 100
  - `page` (number, optional): Page number. Default: 1
- **Example Request:** `GET /schools/?limit=20&page=1`
- **Response (Success):**

  ```json
  {
    "data": [
      {
        "id": 1,
        "name": "ABC School",
        "code": "ABC001",
        "adminEmail": "admin@abcschool.com",
        "description": "A premier educational institution",
        "address": "123 Main Street, City",
        "contactNumber": "+1234567890",
        "affiliationNumber": "AFFIL123",
        "registrationNumber": "REG001",
        "registrationDetails": "Central Board of Secondary Education",
        "authoritySignatureUrl": "https://ik.imagekit.io/...",
        "principalSignatureUrl": "https://ik.imagekit.io/...",
        "logoUrl": "https://ik.imagekit.io/...",
        "templateUrl": "https://ik.imagekit.io/...",
        "imagekitPublicKey": "public_xTYabJQlSXddkvABKRZexz03xTU=",
        "imagekitUrlEndpoint": "https://ik.imagekit.io/avvowijga",
        "imagekitFolder": "schools/1",
        "createdAt": "2026-01-10T12:00:00Z"
      },
      {
        "id": 2,
        "name": "XYZ School",
        "code": "XYZ001",
        "adminEmail": "admin@xyzschool.com",
        "description": "Excellence in education",
        "address": "456 Oak Avenue, Town",
        "contactNumber": "+0987654321",
        "affiliationNumber": "AFFIL456",
        "registrationNumber": "REG002",
        "registrationDetails": "International Baccalaureate",
        "authoritySignatureUrl": "https://ik.imagekit.io/...",
        "principalSignatureUrl": "https://ik.imagekit.io/...",
        "imagekitPublicKey": "public_aBcDefGhIjKlMnOpQrStUvWxYz=",
        "imagekitUrlEndpoint": "https://ik.imagekit.io/xyzschool",
        "imagekitFolder": "schools/2",
        "createdAt": "2026-01-11T12:00:00Z"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "totalPages": 3
    }
  }
  ```

- **Response (Failure):**
  - 401: Unauthorized
  - 403: Forbidden
  - 500: Failed to fetch schools

---

- **Path Parameters:** `schoolId` (school ID)
- **Response (Success):**
  ```json
  {
    "id": 1,
    "name": "ABC School",
    "code": "ABC001",
    "adminEmail": "admin@abcschool.com",
    "description": "A premier educational institution",
    "address": "123 Main Street, City",
    "contactNumber": "+1234567890",
    "affiliationNumber": "AFFIL123",
    "registrationNumber": "REG001",
    "registrationDetails": "Central Board of Secondary Education",
    "authoritySignatureUrl": "https://ik.imagekit.io/...",
    "principalSignatureUrl": "https://ik.imagekit.io/...",
    "logoUrl": "https://ik.imagekit.io/...",
    "templateUrl": "https://ik.imagekit.io/...",
    "imagekitPublicKey": "public_xTYabJQlSXddkvABKRZexz03xTU=",
    "imagekitUrlEndpoint": "https://ik.imagekit.io/avvowijga",
    "imagekitFolder": "schools/1",
    "createdAt": "2026-01-10T12:00:00Z"
  }
  ```
- **Response (Failure):**
  - 400: Valid schoolId is required
  - 404: School not found
  - 500: Failed to fetch school

**Note:** The `imagekitPrivateKey` is never returned in responses for security reasons.

---

### 4. Register School with Admin

- **Endpoint:** `POST /schools/register`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN only
- **Description:** Create a new school and register its admin. Temporary password is sent to admin email.
- **Request Body:**
  ```json
  {
    "name": "ABC School",
    "code": "ABC001",
    "adminEmail": "admin@abcschool.com",
    "imagekitPublicKey": "public_x...",
    "imagekitPrivateKey": "private_x...",
    "imagekitUrlEndpoint": "https://ik.imagekit.io/...",
    "imagekitFolder": "folder_name"
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

### 5. Update ImageKit Credentials

- **Endpoint:** `PUT /schools/:schoolId/imagekit`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN only
- **Description:** Update ImageKit CDN credentials for a school. Can update any or all ImageKit configuration fields.
- **Request Body:**
  ```json
  {
    "imagekitPublicKey": "public_xTYabJQlSXddkvABKRZexz03xTU=",
    "imagekitPrivateKey": "private_qznE13fK5B9YBhHVtNXNnPlZgu0=",
    "imagekitUrlEndpoint": "https://ik.imagekit.io/avvowijga",
    "imagekitFolder": "schools/1"
  }
  ```
- **Query Parameters:** None
- **Response (Success):**
  ```json
  {
    "message": "ImageKit credentials updated successfully",
    "school": {
      "id": 1,
      "name": "ABC School",
      "code": "ABC001",
      "imagekitPublicKey": "public_xTYabJQlSXddkvABKRZexz03xTU=",
      "imagekitUrlEndpoint": "https://ik.imagekit.io/avvowijga",
      "imagekitFolder": "schools/1"
    }
  }
  ```
- **Response (Failure):**
  - 400: Valid schoolId is required / At least one credential field required
  - 403: Forbidden (not SUPER_ADMIN)
  - 404: School not found
  - 500: Failed to update ImageKit credentials

**Note:** The `imagekitPrivateKey` is never returned in responses for security reasons. It is stored securely in the database and only used internally for uploads.

---

### 6. Upload School Signatures

- **Endpoint:** `POST /schools/:schoolId/signatures`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN, SCHOOL_ADMIN
- **Content-Type:** `multipart/form-data`
- **Description:** Upload official signatures for the school ID cards. Supports uploading both or either signature.
- **Form Data Fields:**
  - `principal` (file, optional) — Principal's signature image
  - `authority` (file, optional) — Authority's signature image
- **Response (Success):**
  ```json
  {
    "message": "Signatures uploaded and replaced successfully",
    "school": {
      "id": 1,
      "principalSignatureUrl": "...",
      "authoritySignatureUrl": "..."
    }
  }
  ```

---

### 7. School Setup (General Info, Logo, Template)

- **Endpoint:**
  - `PUT /schools/setup` (For **SCHOOL_ADMIN**, uses token schoolId)
  - `PUT /schools/:schoolId/setup` (For **SUPER_ADMIN**)
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN or SCHOOL_ADMIN
- **Content-Type:** `multipart/form-data`
- **Description:** Update school profile details and upload branding assets (logo, ID card background template).
- **Form Data Fields:**
  - `name` (string, optional)
  - `code` (string, optional)
  - `adminEmail` (string, optional)
  - `description` (string, optional)
  - `address` (string, optional)
  - `contactNumber` (string, optional)
  - `affiliationNumber` (string, optional)
  - `registrationNumber` (string, optional)
  - `registrationDetails` (string, optional)
  - `logo` (file, optional) — School logo image
  - `template` (file, optional) — ID card background template image
- **Response (Success):**
  ```json
  {
    "message": "School setup updated successfully",
    "school": { ...updated school object... }
  }
  ```
- **Response (Failure):**
  - 400: Valid schoolId is required / Image upload disabled (ImageKit not configured)
  - 403: Forbidden (trying to access another school)
  - 404: School not found
  - 500: Failed to update school setup

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
- **Description:** Retrieve all classes with pagination. SCHOOL_ADMIN and TEACHER see only their school's classes.
- **Query Parameters:**
  - `limit` (number, optional): Items per page. Default: 10, Max: 100
  - `page` (number, optional): Page number. Default: 1
- **Example Request:** `GET /classes/?limit=20&page=1`
- **Response (Success):**
  ```json
  {
    "data": [
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
      },
      {
        "id": 2,
        "name": "Class 10-B",
        "schoolId": 1,
        "sections": [
          {
            "id": 2,
            "name": "Section B",
            "classId": 2
          }
        ],
        "createdAt": "2026-01-10T12:00:00Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 10,
      "totalPages": 2
    }
  }
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
- **Description:** Retrieve students with advanced filtering. SCHOOL_ADMIN and TEACHER see only their school's students.
- **Query Parameters:**
  - `schoolCode` (string): Filter by school code (SUPER_ADMIN only)
  - `class` (string): Filter by class name
  - `section` (string): Filter by section name
  - `printStatus` (string): Filter by print status (PENDING, READY, PRINTED, DELIVERED)
  - `search` (string): Search by student name or enrollment number
- **Example Request:** `GET /students/?schoolCode=ABC001&class=10th Standard&printStatus=READY&search=Raj`
- **Response (Success):**
  ```json
  [
    {
      "id": 1,
      "name": "Raj Kumar",
      "enrollmentNumber": "STU001",
      "fatherName": "Mr. Kumar",
      "phoneNumber": "+919876543210",
      "email": "raj@example.com",
      "photoUrl": "https://ik.imagekit.io/...",
      "photoStatus": "UPLOADED",
      "printStatus": "READY",
      "schoolId": 1,
      "classId": 1,
      "sectionId": 1,
      "class": {
        "id": 1,
        "name": "10th Standard",
        "schoolId": 1
      },
      "section": {
        "id": 1,
        "name": "A",
        "classId": 1
      },
      "school": {
        "id": 1,
        "name": "ABC School",
        "code": "ABC001"
      }
    }
  ]
  ```
- **Response (Failure):**
  - 400: Invalid printStatus value
  - 404: School not found (if schoolCode provided)

---

### 2. Create Student

- **Endpoint:** `POST /students`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN, SCHOOL_ADMIN
- **Description:** Create a single student. SCHOOL_ADMIN creates students in their school. SUPER_ADMIN must provide schoolCode. Automatically creates class/section if referenced correctly.
- **Request Body:**
  ```json
  {
    "enrollmentNumber": "STU011",
    "firstName": "John",
    "middleName": "David",
    "lastName": "Smith",
    "classId": 1,
    "sectionId": 1,
    "schoolCode": "ABC001",
    "rollNo": "11",
    "admissionNo": "ADM011",
    "dateOfBirth": "2008-06-10",
    "fatherName": "Mr. Smith",
    "motherName": "Mrs. Smith",
    "currentAddress": "123 Test Street",
    "remarks": "New admission",
    "mobileNo": "+919876543220",
    "email": "john@example.com",
    "gender": "Male",
    "religion": "Christian",
    "aadhar": "111222333444",
    "aparId": "AP12355",
    "uniqueId": "UNQ011",
    "pan": "PAN011",
    "bloodGroup": "O+",
    "houseName": "Gryffindor"
  }
  ```
- **Required Fields:** `enrollmentNumber`, `firstName`, `classId`, `sectionId`
- **Optional Fields:** `middleName`, `lastName`, `rollNo`, `admissionNo`, `dateOfBirth`, `fatherName`, `motherName`, `currentAddress`, `remarks`, `mobileNo`, `email`, `gender`, `religion`, `aadhar`, `aparId`, `uniqueId`, `pan`, `bloodGroup`, `houseName`
- **Special Notes:**
  - `schoolCode` is required for SUPER_ADMIN only
  - `classId` and `sectionId` must exist in the school
  - `enrollmentNumber` must be unique across the school
- **Response (Success):**
  ```json
  {
    "message": "Student created successfully",
    "student": {
      "id": 11,
      "enrollmentNumber": "STU011",
      "firstName": "John",
      "middleName": "David",
      "lastName": "Smith",
      "dateOfBirth": "2008-06-10T00:00:00.000Z",
      "fatherName": "Mr. Smith",
      "motherName": "Mrs. Smith",
      "currentAddress": "123 Test Street",
      "remarks": "New admission",
      "mobileNo": "+919876543220",
      "email": "john@example.com",
      "gender": "Male",
      "religion": "Christian",
      "aadhar": "111222333444",
      "apid": "AP12355",
      "uniqueId": "UNQ011",
      "pen": "PEN011",
      "bloodGroup": "O+",
      "houseName": "Gryffindor",
      "schoolId": 1,
      "classId": 1,
      "sectionId": 1,
      "photoUrl": null,
      "photoStatus": "NOT_UPLOADED",
      "printStatus": "PENDING",
      "class": {...},
      "section": {...},
      "school": {...}
    }
  }
  ```
- **Response (Failure):**
  - 400: Required fields missing or invalid schoolCode for SUPER_ADMIN
  - 404: School/Class/Section not found
  - 409: Student with this enrollment number already exists
  - 403: Forbidden (not authorized)
  - 500: Failed to create student

---

### 3. Get Student by ID

- **Endpoint:** `GET /students/:id`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER
- **Description:** Retrieve a specific student. SCHOOL_ADMIN and TEACHER can only access their school's students.
- **Path Parameters:** `id` (student ID)
- **Response (Success):** Same as individual student object from Get Students
- **Response (Failure):**
  - 404: Student not found
  - 403: Forbidden (SCHOOL_ADMIN/TEACHER accessing another school's student)

---

### 4. Update Student

- **Endpoint:** `PUT /students/:id`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN, SCHOOL_ADMIN
- **Description:** Update student information. SCHOOL_ADMIN can only update their school's students. At least one field is required.
- **Path Parameters:** `id` (student ID)
- **Updatable Fields:** `name`, `enrollmentNumber`, `fatherName`, `phoneNumber`, `email`, `classId`, `sectionId`, `printStatus`, `photoStatus`
- **Request Body:**
  ```json
  {
    "name": "Raj Kumar Updated",
    "phoneNumber": "+911234567890",
    "printStatus": "PRINTED",
    "photoStatus": "UPLOADED"
  }
  ```
- **Response (Success):**
  ```json
  {
    "message": "Student updated successfully",
    "student": {
      "id": 1,
      "name": "Raj Kumar Updated",
      "enrollmentNumber": "STU001",
      "fatherName": "Mr. Kumar",
      "phoneNumber": "+911234567890",
      "email": "raj@example.com",
      "photoUrl": "https://ik.imagekit.io/...",
      "photoStatus": "UPLOADED",
      "printStatus": "PRINTED",
      "schoolId": 1,
      "classId": 1,
      "sectionId": 1,
      "class": {...},
      "section": {...},
      "school": {...}
    }
  }
  ```
- **Response (Failure):**
  - 400: At least one field required / Invalid printStatus / Invalid photoStatus
  - 404: Student not found / Class or Section not found
  - 403: Forbidden (SCHOOL_ADMIN accessing another school's student)
  - 409: Enrollment number already exists
  - 500: Failed to update student

---

### 5. Delete Student

- **Endpoint:** `DELETE /students/:id`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN, SCHOOL_ADMIN (Teachers cannot delete)
- **Description:** Delete a student record permanently. SCHOOL_ADMIN can only delete their school's students.
- **Path Parameters:** `id` (student ID)
- **Response (Success):**
  ```json
  {
    "message": "Student deleted successfully",
    "studentId": 1
  }
  ```
- **Response (Failure):**
  - 404: Student not found
  - 403: Forbidden (Teachers cannot delete / SCHOOL_ADMIN accessing another school's student)
  - 500: Failed to delete student

---

### 6. Bulk Import Students (CSV/Excel)

- **Endpoint:** `POST /students/import`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN, SCHOOL_ADMIN
- **Content-Type:** multipart/form-data
- **Description:** Bulk import students from CSV or Excel file. Automatically creates classes and sections if they don't exist. Skips duplicate enrollmentNumbers.
- **Form Data:**
  - `file` (required) — CSV or Excel file (.csv, .xlsx, .xls)
  - `schoolCode` (optional) — Required only for SUPER_ADMIN; SCHOOL_ADMIN uses their own school
- **CSV/Excel Column Headers (Field Names):**
  - **Required:** `enrollmentNumber`, `firstName`, `class`, `section`
  - **Optional:** `rollNo`, `admissionNo`, `middleName`, `lastName`, `dateOfBirth`, `fatherName`, `motherName`, `currentAddress`, `remarks`, `mobileNo`, `email`, `gender`, `religion`, `aadhar`, `aparId`, `uniqueId`, `pan`, `bloodGroup`, `houseName`
- **Example CSV Format:**
  ```csv
  enrollmentNumber,firstName,middleName,lastName,class,section,rollNo,admissionNo,dateOfBirth,fatherName,motherName,currentAddress,mobileNo,email,gender,religion,aadhar,aparId,uniqueId,pan,bloodGroup,houseName,remarks
  enrollmentNumber,firstName,middleName,lastName,class,section,rollNo,admissionNo,dateOfBirth,fatherName,motherName,currentAddress,mobileNo,email,gender,religion,aadhar,apid,uniqueId,pen,bloodGroup,houseName,remarks
  STU001,Raj,Kumar,Singh,10A,A,1,ADM001,2008-05-15,Mr. Kumar,Mrs. Singh,123 Main St,+919876543210,raj@example.com,Male,Hindu,123456789012,AP12345,UNQ001,PAN001,O+,Gryffindor,Good student
  STU002,Priya,,Sharma,10A,B,2,ADM002,2008-07-20,Mr. Sharma,Mrs. Sharma,456 Oak Ave,+919876543211,priya@example.com,Female,Hindu,234567890123,AP12346,UNQ002,PAN002,A+,Slytherin,Excellent performance
  STU003,Arjun,Raj,Patel,10B,A,3,ADM003,2008-03-10,Mr. Patel,Mrs. Patel,789 Pine Rd,+919876543212,arjun@example.com,Male,Hindu,345678901234,AP12347,UNQ003,PAN003,B+,Hufflepuff,Average student
  ```
- **Example Excel Format:**
  - Same headers as CSV, organize data in columns A-V
  - First row contains column headers
  - Data starts from row 2
- **Response (Success):**
  ```json
  {
    "total": 3,
    "inserted": 3,
    "duplicates": 0,
    "skipped": 0,
    "errors": []
  }
  ```
- **Response (With Errors):**
  ```json
  {
    "total": 4,
    "inserted": 3,
    "duplicates": 0,
    "skipped": 1,
    "errors": [
      {
        "row": 3,
        "reason": "Missing required fields: enrollmentNumber, firstName, class, section"
      }
    ]
  }
  ```
- **Response (With Duplicates):**
  ```json
  {
    "total": 5,
    "inserted": 3,
    "duplicates": 2,
    "skipped": 2,
    "errors": []
  }
  ```
- **Response (Failure):**
  - 400: File is required (CSV or Excel) / Unsupported file type / File is empty
  - 500: Failed to import students

---

### 7. Upload Student Photo

- **Endpoint:** `POST /students/:id/photo`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN, SCHOOL_ADMIN
- **Content-Type:** multipart/form-data
- **Description:** Upload or update a student's photo. Photo is stored on ImageKit CDN. SCHOOL_ADMIN can only upload for their school's students.
- **Path Parameters:** `id` (student ID)
- **Form Data:**
  - `photo` (file) — Image file (JPG, PNG, etc.)
- **Response (Success):**
  ```json
  {
    "message": "Photo uploaded successfully",
    "photoUrl": "https://ik.imagekit.io/your-endpoint/schools/1/students/student_1_ABC123.jpg"
  }
  ```
- **Response (Failure):**
  - 400: Image file required / Image upload disabled (ImageKit not configured)
  - 404: Student not found
  - 403: Forbidden (SCHOOL_ADMIN accessing another school's student)
  - 500: Failed to upload photo

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

### 2. Get All Vendors

- **Endpoint:** `GET /vendors/`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN only
- **Description:** List all vendors with optional filters.
- **Query Parameters:**
  - `vendorStatus` (string): Filter by status (ONBOARDING, ACTIVE, INACTIVE)
  - `isActive` (boolean): Filter by active status (true/false)
  - `search` (string): Search by email or vendor name
- **Example Request:** `GET /vendors/?vendorStatus=ACTIVE&isActive=true`
- **Response (Success):**
  ```json
  {
    "total": 2,
    "vendors": [
      {
        "id": 5,
        "email": "vendor@example.com",
        "vendorName": "ABC Printing Services",
        "phoneNumber": "+919876543210",
        "location": "New York",
        "vendorStatus": "ACTIVE",
        "isActive": true,
        "createdAt": "2026-01-10T12:00:00Z"
      }
    ]
  }
  ```
- **Response (Failure):**
  - 400: Invalid vendorStatus
  - 403: Forbidden (not SUPER_ADMIN)
  - 500: Failed to fetch vendors

---

### 3. Assign School to Vendor

- **Endpoint:** `POST /vendors/:vendorId/schools`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN only
- **Description:** Assign a school to a vendor. The school ID is added to vendor's schoolIds array. Vendor can then access students and print operations for that school.
- **Path Parameters:** `vendorId` (vendor user ID)
- **Request Body:**
  ```json
  {
    "schoolId": 1
  }
  ```
- **Response (Success):**
  ```json
  {
    "message": "School assigned to vendor successfully",
    "vendor": {
      "id": 5,
      "email": "vendor@example.com",
      "vendorName": "ABC Printing Services",
      "schoolIds": [1, 2]
    }
  }
  ```
- **Response (Failure):**
  - 400: Valid vendorId/schoolId required / User is not a vendor
  - 403: Forbidden (not SUPER_ADMIN)
  - 404: Vendor not found / School not found
  - 409: Vendor is already assigned to this school
  - 500: Failed to assign school

---

### 4. Remove School from Vendor

- **Endpoint:** `DELETE /vendors/:vendorId/schools/:schoolId`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN only
- **Description:** Remove a school assignment from a vendor. The school ID is removed from vendor's schoolIds array.
- **Path Parameters:**
  - `vendorId` (vendor user ID)
  - `schoolId` (school ID)
- **Response (Success):**
  ```json
  {
    "message": "School removed from vendor successfully",
    "vendor": {
      "id": 5,
      "email": "vendor@example.com",
      "vendorName": "ABC Printing Services",
      "schoolIds": [2]
    }
  }
  ```
- **Response (Failure):**
  - 400: Valid vendorId/schoolId required
  - 403: Forbidden (not SUPER_ADMIN)
  - 404: Vendor is not assigned to this school
  - 500: Failed to remove school

---

### 5. Get Vendor's Assigned Schools

- **Endpoint:** `GET /vendors/:vendorId/schools`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN or the vendor themselves
- **Description:** Retrieve all schools assigned to a vendor. Returns school details with admin email for each assigned school.
- **Path Parameters:** `vendorId` (vendor user ID)
- **Response (Success):**
  ```json
  {
    "total": 2,
    "vendorId": 5,
    "vendorEmail": "vendor@example.com",
    "vendorName": "ABC Printing Services",
    "schools": [
      {
        "id": 1,
        "name": "ABC School",
        "code": "ABC001",
        "description": "Optional description",
        "address": "123 Main St",
        "contactNumber": "+911234567890",
        "adminEmail": "admin@abcschool.com"
      },
      {
        "id": 2,
        "name": "XYZ School",
        "code": "XYZ001",
        "description": null,
        "address": null,
        "contactNumber": null,
        "adminEmail": "admin@xyzschool.com"
      }
    ]
  }
  ```
- **Response (Failure):**
  - 400: Valid vendorId required / User is not a vendor
  - 403: Forbidden (not SUPER_ADMIN and not the vendor)
  - 404: Vendor not found
  - 500: Failed to fetch vendor schools

---

### 6. Get My Assigned Schools (Vendor only)

- **Endpoint:** `GET /vendors/schools`
- **Authentication:** Required
- **Authorization:** VENDOR only
- **Description:** Retrieve schools assigned to the currently logged-in vendor.
- **Response (Success):** Same as "Get Vendor's Assigned Schools"

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

## ID Card Endpoints (`/api/id-cards`)

### 1. Single ID Card Generation

- **Endpoint:** `GET /students/:studentId/id-card/single-generate`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN, SCHOOL_ADMIN, VENDOR
- **Description:** Manually trigger generation of both front and back ID cards for a single student.
- **Response (Success):**
  ```json
  {
    "message": "ID card generated successfully",
    "frontUrl": "...",
    "backUrl": "..."
  }
  ```

### 2. Bulk ID Card Generation

- **Endpoint:** `POST /id-cards/bulk-generate`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN, SCHOOL_ADMIN, VENDOR
- **Description:** Trigger ID card generation for multiple students simultaneously.
- **Request Body:**
  ```json
  {
    "studentIds": [1, 2, 3, 4, 5]
  }
  ```
- **Response (Success):**
  ```json
  {
    "message": "Bulk generation started for 5 students"
  }
  ```

### 3. Print ID Cards (Generate PDF)

- **Endpoint:** `POST /id-cards/print`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN, SCHOOL_ADMIN, VENDOR
- **Description:** Generate a printable PDF containing ID cards for specified students.
- **Request Body:**
  ```json
  {
    "studentIds": [1, 2, 3]
  }
  ```
- **Response (Success):**
  ```json
  {
    "message": "PDF generated",
    "pdfUrl": "..."
  }
  ```

### 4. Get ID Card Previews

- **Endpoint:** `GET /id-cards/previews`
- **Authentication:** Required
- **Authorization:** SUPER_ADMIN, SCHOOL_ADMIN, VENDOR
- **Description:** List students and the status of their ID card previews.
- **Query Parameters:**
  - `schoolId` (number, optional)
  - `classId` (number, optional)
- **Response (Success):**
  ```json
  {
    "data": [
      {
        "studentId": 1,
        "name": "Raj Kumar",
        "frontUrl": "...",
        "backUrl": "...",
        "status": "READY"
      }
    ]
  }
  ```

---

## User Roles

The system implements Role-Based Access Control (RBAC) with the following roles:

| Role             | Permissions                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| **SUPER_ADMIN**  | Full system access. Can create schools, manage school admins, manage vendors, view all data.            |
| **SCHOOL_ADMIN** | Can manage their school's classes, sections, students, and teachers. Cannot access other schools' data. |
| **TEACHER**      | Can view their school's classes, sections, and students. Cannot modify data.                            |
| **VENDOR**       | Can access vendor portal for ID card printing operations.                                               |

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

January 12, 2026

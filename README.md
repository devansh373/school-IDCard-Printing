# 📘 School ID Card Printing System  
## Backend Planning & Architecture (PostgreSQL + Prisma)

---

## 1. Project Overview

### Objective
To design and build a **backend system** for a **3rd-party vendor** that manages the **complete responsibility of school ID card printing**, from student data intake to printing and final delivery back to the school.

Schools hand over student details to a **single external vendor**, and that vendor is fully responsible for:
- Managing student data
- Generating ID cards
- Printing ID cards
- Delivering ID cards back to the school

---

## 2. Business Context

- Schools **do not print ID cards themselves**
- Schools provide student details to a **3rd-party vendor**
- The vendor:
  - Manages all data
  - Handles photo collection
  - Prints ID cards
  - Returns printed ID cards to the school
- There are **no separate printing vendors or third-party software systems**

**High-level flow:**

```
School → 3rd-Party Vendor System → Printed ID Cards → School
```

---

## 3. User Roles & Responsibilities

### Super Admin (Vendor)
- Full system control
- Manages schools
- Controls ID card templates and print settings

### School Admin
- Oversees school-level data
- Coordinates with the vendor

### Class Teacher
- Searches students using enrollment number
- Updates student details if required
- Captures and uploads student photos (mobile-friendly)

> Students do not access the system directly.

---

## 4. Scope of the Backend System

### In Scope
- Student data import and management
- Role-based authentication
- Photo upload and storage
- ID card generation and printing preparation
- Single and bulk print management

---

## 5. Technology Stack

| Layer | Technology |
|------|-----------|
| Backend Runtime | Node.js |
| Framework | Express |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT |
| File Upload | Multer |
| File Storage |  ImageKit       |
|              |   Local storage (development) |
| CSV Import | csv-parser / fast-csv |
| Excel Import | xlsx / exceljs |
| PDF Generation | PDFKit / Puppeteer |

---



## 6. Data Model (High-Level)

### School
- id (PK)
- name
- code

### Class
- id (PK)
- school_id (FK)
- name

### Section
- id (PK)
- class_id (FK)
- name

### Student
- id (PK)
- enrollment_number (UNIQUE)
- school_id (FK)
- class_id (FK)
- section_id (FK)
- name
- photo_url
- print_status

(optional)
- father's name
- Mob. No.
- Address

---

## 8. Core Backend Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control

### Student Data Management
- Import student data using CSV / Excel files
- Backend-controlled parsing and validation
- Enrollment number enforced as unique
- Filter students by:
  - School
  - Class
  - Section
- Update student details with validation

### Photo Upload & Storage
- Mobile-friendly photo upload
- File validation (size, format)
- Secure storage using S3 / Firebase
- Photo URL stored in PostgreSQL

### ID Card Generation & Printing
- Generate print-ready PDFs
- Support:
  - Single student ID card
  - Bulk ID card printing
- Support multiple page sizes (A4, A3, custom)
- Track print status

---

## 9. API Design (Sample)

```
POST   /auth/login
POST   /students/import
GET    /students?schoolId=&classId=&sectionId=
PUT    /students/:id
POST   /students/:id/photo
POST   /print/single
POST   /print/bulk
```

---

## 10. Security Considerations

- JWT expiration and refresh handling
- Role-based route protection
- File upload sanitization
- Secure access to stored photos
- School-level data isolation

---

## 11. Conclusion

This backend system enables a **single 3rd-party vendor** to fully manage school ID card printing responsibilities.  
Using **PostgreSQL with Prisma** ensures strong data integrity, safe bulk imports, and long-term scalability while keeping development simple and maintainable.



<!-- Authentication Roles-
1 super admin
2 school admin
3 vendor

super admin- all permissions
login super admin-> 1 dashboard:-
stats-
 - total schools
 - active vendors
 - storage used
 - system status
Management-
 - manage schools
 - manage vendors
Recently Joined Schools
Manage schools-
add new school-> details -> password will be sent to the mail provided -->


## 🐳 Run Backend with Docker (Recommended)

This backend is fully dockerized using **Docker + Docker Compose**.
It runs Node.js, Prisma, and PostgreSQL in containers with zero local setup.

### Prerequisites
- Docker Desktop (Windows / Mac / Linux)

---

### 🚀 Start the backend

```bash
docker compose up --build

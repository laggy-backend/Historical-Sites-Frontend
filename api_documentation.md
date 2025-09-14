# Historical Sites Backend API Documentation

## Overview

This is a Django REST Framework API for managing historical sites, locations, and media content. The API supports bilingual content (English and Arabic), role-based access control, and comprehensive media management with soft deletion capabilities.

**Base URL:** `http://localhost:8000/api/v1/`  
**Version:** v1  
**Authentication:** JWT Token based

---

## Authentication & Authorization

### JWT Token System

All API endpoints (except authentication endpoints) require JWT token authentication via Bearer token in the Authorization header.

**Token Configuration:**

- Access Token Lifetime: 5 minutes (default)
- Refresh Token Lifetime: 1 day (default)
- Tokens are blacklisted after refresh for security

### User Roles

| Role            | Permissions                                                       |
| --------------- | ----------------------------------------------------------------- |
| **Visitor**     | Read-only access to all public content                            |
| **Contributor** | Can create historical sites, upload media, create tags/categories |
| **Moderator**   | Can edit/delete any content, manage tags/categories               |
| **Admin**       | Full system access including user management                      |

### Authentication Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## Standard Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Detailed error message"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "count": 150,
    "next": "http://localhost:8000/api/v1/historical-sites/sites/?page=3",
    "previous": "http://localhost:8000/api/v1/historical-sites/sites/?page=1",
    "results": [
      // Array of objects
    ]
  }
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Anonymous users:** 100 requests/hour
- **Authenticated users:** 1000 requests/hour
- **Authentication endpoints:** 25 requests/minute

**Rate Limit Headers:**

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

---

# Endpoints Documentation

## 1. Authentication Endpoints

**Important Notes:**

- JWT-related endpoints (token, refresh, verify) return responses directly without the standard `APIResponse` wrapper format, following Django REST Framework SimpleJWT conventions
- Password reset endpoints include both API and template-based versions for different integration needs
- Template endpoints return HTML for browser-based interactions

### 1.1 User Registration

**POST** `/api/v1/auth/register/`

Register a new user account. New users are assigned the 'visitor' role by default.

**Permissions:** Public (AllowAny)  
**Rate Limit:** 25/minute

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "secure_password123"
}
```

#### Validation Rules

- **email:** Must be valid email format, converted to lowercase, max 254 characters
- **password:** Minimum 8 characters, must pass Django's password validation

#### Success Response (201)

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "visitor",
      "created_at": "2024-01-15T10:30:00Z"
    },
    "tokens": {
      "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

#### Error Responses

```json
// Email already exists (400)
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "A user with this email already exists."
  }
}

// Password validation failed (400)
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "This password is too common."
  }
}
```

#### cURL Example

```bash
curl -X POST http://localhost:8000/api/v1/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure_password123"
  }'
```

---

### 1.2 User Login

**POST** `/api/v1/auth/token/`

Authenticate user and obtain JWT tokens.

**Permissions:** Public (AllowAny)  
**Rate Limit:** 25/minute

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "secure_password123"
}
```

#### Success Response (200)

```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note:** Unlike other API endpoints, this endpoint returns tokens directly without the standard `APIResponse` wrapper format (`{"success": true, "data": {...}}`). This follows the standard Django REST Framework SimpleJWT implementation.

#### Error Response (401)

```json
{
  "detail": "No active account found with the given credentials"
}
```

#### cURL Example

```bash
curl -X POST http://localhost:8000/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure_password123"
  }'
```

---

### 1.3 Token Refresh

**POST** `/api/v1/auth/token/refresh/`

Refresh an access token using a valid refresh token.

**Permissions:** Public (AllowAny)  
**Rate Limit:** 25/minute

#### Request Body

```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Success Response (200)

```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note:** This endpoint also returns tokens directly without the `APIResponse` wrapper format, following SimpleJWT standards.

#### Error Response (401)

```json
{
  "detail": "Token is invalid or expired",
  "code": "token_not_valid"
}
```

---

### 1.4 Token Verification

**POST** `/api/v1/auth/token/verify/`

Verify if a token is valid and not expired.

**Permissions:** Public (AllowAny)

#### Request Body

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Success Response (200)

```json
{}
```

**Note:** This endpoint also returns an empty response directly without the `APIResponse` wrapper format, following SimpleJWT standards.

#### Error Response (401)

```json
{
  "detail": "Token is invalid or expired",
  "code": "token_not_valid"
}
```

---

### 1.5 User Logout

**POST** `/api/v1/auth/logout/`

Logout user and blacklist the refresh token.

**Permissions:** Authenticated users only

#### Request Body

```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Success Response (205)

```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

#### Error Responses

```json
// Missing refresh token (400)
{
  "success": false,
  "error": {
    "code": "MISSING_REFRESH_TOKEN",
    "message": "Refresh token is required"
  }
}

// Invalid token (400)
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid or expired token"
  }
}
```

---

### 1.6 Password Reset Request

**POST** `/api/v1/auth/password-reset/`

Request a password reset email. Returns success even if email doesn't exist (security).

**Permissions:** Public (AllowAny)  
**Rate Limit:** 25/minute

#### Request Body

```json
{
  "email": "user@example.com"
}
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Password reset email sent successfully"
}
```

#### Error Responses

```json
// Missing email (400)
{
  "success": false,
  "error": {
    "code": "MISSING_EMAIL",
    "message": "Email is required"
  }
}

// Email too long (400)
{
  "success": false,
  "error": {
    "code": "EMAIL_TOO_LONG",
    "message": "Email address too long"
  }
}
```

---

### 1.7 Password Reset Confirm

**POST** `/api/v1/auth/password-reset-confirm/{uidb64}/{token}/`

Complete password reset using token from email.

**Permissions:** Public (AllowAny)
**Rate Limit:** 25/minute

**Note:** This endpoint also serves a GET request that returns a template-based password reset form for browser-based password resets.

#### URL Parameters

- **uidb64:** Base64 encoded user ID
- **token:** Password reset token

#### Request Body

```json
{
  "password": "new_secure_password123"
}
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

#### Error Responses

```json
// Invalid token (400)
{
  "success": false,
  "error": {
    "code": "INVALID_RESET_TOKEN",
    "message": "Invalid or expired reset token"
  }
}

// Missing password (400)
{
  "success": false,
  "error": {
    "code": "MISSING_PASSWORD",
    "message": "Password is required"
  }
}
```

---

### 1.8 Password Reset Complete

**GET** `/api/v1/auth/password-reset-complete/`

Display password reset completion confirmation page (template-based).

**Permissions:** Public (AllowAny)

#### Success Response

Returns an HTML template confirming successful password reset.

---

## 2. User Profile Endpoints

### 2.1 Get Current User

**GET** `/api/v1/users/me/`

Retrieve the current authenticated user's profile.

**Permissions:** Authenticated users only

#### Success Response (200)

```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "role": "contributor",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### cURL Example

```bash
curl -X GET http://localhost:8000/api/v1/users/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 3. Location Endpoints

### 3.1 List Governorates

**GET** `/api/v1/common/governorates/`

Retrieve all active governorates (provinces/states).

**Permissions:** Public (everyone can read)

#### Success Response (200)

```json
{
  "success": true,
  "message": "Governorates retrieved successfully",
  "data": [
    {
      "id": 1,
      "name_en": "Cairo",
      "name_ar": "القاهرة",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "is_deleted": false
    },
    {
      "id": 2,
      "name_en": "Alexandria",
      "name_ar": "الإسكندرية",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "is_deleted": false
    }
  ]
}
```

---

### 3.2 Create Governorate

**POST** `/api/v1/common/governorates/`

Create a new governorate.

**Permissions:** Admin only (requires is_staff=True and is_superuser=True)

#### Request Body

```json
{
  "name_en": "Giza",
  "name_ar": "الجيزة"
}
```

#### Validation Rules

- **name_en:** Required, max 200 chars, unique, non-empty string
- **name_ar:** Required, max 200 chars, unique, non-empty string

#### Success Response (201)

```json
{
  "success": true,
  "message": "Governorate created successfully",
  "data": {
    "id": 3,
    "name_en": "Giza",
    "name_ar": "الجيزة",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "is_deleted": false
  }
}
```

#### Error Response (400)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Governorate validation failed"
  }
}
```

---

### 3.3 Get Single Governorate

**GET** `/api/v1/common/governorates/{id}/`

Retrieve a specific governorate by ID.

**Permissions:** Public

#### URL Parameters

- **id:** Governorate ID (integer)

#### Success Response (200)

```json
{
  "success": true,
  "message": "Governorate retrieved successfully",
  "data": {
    "id": 1,
    "name_en": "Cairo",
    "name_ar": "القاهرة",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "is_deleted": false
  }
}
```

#### Error Response (404)

```json
{
  "detail": "Not found."
}
```

---

### 3.4 Update Governorate

**PUT/PATCH** `/api/v1/common/governorates/{id}/`

Update a governorate.

**Permissions:** Admin only

#### Request Body (PUT - all fields required, PATCH - partial update)

```json
{
  "name_en": "Greater Cairo",
  "name_ar": "القاهرة الكبرى"
}
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Governorate updated successfully",
  "data": {
    "id": 1,
    "name_en": "Greater Cairo",
    "name_ar": "القاهرة الكبرى",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T11:45:00Z",
    "is_deleted": false
  }
}
```

---

### 3.5 Delete Governorate

**DELETE** `/api/v1/common/governorates/{id}/`

Soft delete a governorate (sets is_deleted=True).

**Permissions:** Admin only

#### Success Response (204)

```json
{
  "success": true,
  "message": "Governorate deleted successfully"
}
```

---

### 3.6 List Cities

**GET** `/api/v1/common/cities/`

Retrieve all active cities with nested governorate details.

**Permissions:** Public

#### Success Response (200)

```json
{
  "success": true,
  "message": "Cities retrieved successfully",
  "data": [
    {
      "id": 1,
      "name_en": "Cairo",
      "name_ar": "القاهرة",
      "governorate": 1,
      "governorate_details": {
        "id": 1,
        "name_en": "Cairo",
        "name_ar": "القاهرة",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
        "is_deleted": false
      },
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "is_deleted": false
    }
  ]
}
```

---

### 3.7 Create City

**POST** `/api/v1/common/cities/`

Create a new city.

**Permissions:** Admin only

#### Request Body

```json
{
  "name_en": "Giza",
  "name_ar": "الجيزة",
  "governorate": 1
}
```

#### Validation Rules

- **name_en:** Required, max 200 chars, unique, non-empty string
- **name_ar:** Required, max 200 chars, unique, non-empty string
- **governorate:** Required, must be valid governorate ID

#### Success Response (201)

```json
{
  "success": true,
  "message": "City created successfully",
  "data": {
    "id": 2,
    "name_en": "Giza",
    "name_ar": "الجيزة",
    "governorate": 1,
    "governorate_details": {
      "id": 1,
      "name_en": "Cairo",
      "name_ar": "القاهرة",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "is_deleted": false
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "is_deleted": false
  }
}
```

---

## 4. Tags Management

### 4.1 List Tags

**GET** `/api/v1/historical-sites/tags/`

Retrieve all active tags.

**Permissions:** Public (everyone can read)

#### Success Response (200)

```json
{
  "success": true,
  "message": "Tags retrieved successfully",
  "data": [
    {
      "id": 1,
      "slug_en": "ancient-egypt",
      "slug_ar": "مصر-القديمة",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "is_deleted": false
    },
    {
      "id": 2,
      "slug_en": "islamic-architecture",
      "slug_ar": "العمارة-الإسلامية",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "is_deleted": false
    }
  ]
}
```

---

### 4.2 Create Tag

**POST** `/api/v1/historical-sites/tags/`

Create a new tag.

**Permissions:** Contributors and above (contributor, moderator, admin)

#### Request Body

```json
{
  "slug_en": "roman-ruins",
  "slug_ar": "الآثار-الرومانية"
}
```

#### Validation Rules

- **slug_en:** Required, max 100 chars, unique, slug format (lowercase with hyphens), non-empty
- **slug_ar:** Required, max 100 chars, unique, Arabic slug format, non-empty

#### Success Response (201)

```json
{
  "success": true,
  "message": "Tag created successfully",
  "data": {
    "id": 3,
    "slug_en": "roman-ruins",
    "slug_ar": "الآثار-الرومانية",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "is_deleted": false
  }
}
```

#### Error Response (400)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Tag validation failed"
  }
}
```

---

### 4.3 Get Single Tag

**GET** `/api/v1/historical-sites/tags/{id}/`

Retrieve a specific tag by ID.

**Permissions:** Public

#### Success Response (200)

```json
{
  "success": true,
  "message": "Tag retrieved successfully",
  "data": {
    "id": 1,
    "slug_en": "ancient-egypt",
    "slug_ar": "مصر-القديمة",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "is_deleted": false
  }
}
```

---

### 4.4 Update Tag

**PUT/PATCH** `/api/v1/historical-sites/tags/{id}/`

Update a tag.

**Permissions:** Moderators and Admins only

#### Request Body

```json
{
  "slug_en": "ancient-egyptian-civilization",
  "slug_ar": "الحضارة-المصرية-القديمة"
}
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Tag updated successfully",
  "data": {
    "id": 1,
    "slug_en": "ancient-egyptian-civilization",
    "slug_ar": "الحضارة-المصرية-القديمة",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T11:45:00Z",
    "is_deleted": false
  }
}
```

---

### 4.5 Delete Tag

**DELETE** `/api/v1/historical-sites/tags/{id}/`

Soft delete a tag (sets is_deleted=True).

**Permissions:** Moderators and Admins only

#### Success Response (204)

```json
{
  "success": true,
  "message": "Tag deleted successfully"
}
```

---

## 5. Categories Management

### 5.1 List Categories

**GET** `/api/v1/historical-sites/categories/`

Retrieve all active categories.

**Permissions:** Public

#### Success Response (200)

```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "id": 1,
      "slug_en": "temple",
      "slug_ar": "معبد",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "is_deleted": false
    },
    {
      "id": 2,
      "slug_en": "mosque",
      "slug_ar": "مسجد",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "is_deleted": false
    }
  ]
}
```

---

### 5.2 Create Category

**POST** `/api/v1/historical-sites/categories/`

Create a new category.

**Permissions:** Contributors and above

#### Request Body

```json
{
  "slug_en": "fortress",
  "slug_ar": "حصن"
}
```

#### Validation Rules

- **slug_en:** Required, max 100 chars, unique, slug format, non-empty
- **slug_ar:** Required, max 100 chars, unique, Arabic slug format, non-empty

#### Success Response (201)

```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": 3,
    "slug_en": "fortress",
    "slug_ar": "حصن",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "is_deleted": false
  }
}
```

---

## 6. Historical Sites Management

### 6.1 List Historical Sites

**GET** `/api/v1/historical-sites/sites/`

Retrieve all historical sites with pagination, filtering, and search capabilities.

**Permissions:** Public

#### Query Parameters

- **page:** Page number for pagination (default: 1)
- **city:** Filter by city ID
- **categories:** Filter by category ID (comma-separated for multiple)
- **tags:** Filter by tag ID (comma-separated for multiple)
- **search:** Search in name_en, name_ar, description_en fields
- **ordering:** Order by created_at, updated_at (prefix with `-` for desc)

#### Example Request

```
GET /api/v1/historical-sites/sites/?city=1&categories=1,2&search=pyramid&ordering=-created_at
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Historical sites retrieved successfully",
  "data": {
    "count": 25,
    "next": "http://localhost:8000/api/v1/historical-sites/sites/?page=2",
    "previous": null,
    "results": [
      {
        "id": 1,
        "name_en": "Great Pyramid of Giza",
        "name_ar": "الهرم الأكبر بالجيزة",
        "description_en": "One of the Seven Wonders of the Ancient World, the Great Pyramid is the largest and oldest of the three pyramids in the Giza pyramid complex.",
        "description_ar": "إحدى عجائب الدنيا السبع في العالم القديم، الهرم الأكبر هو أكبر وأقدم الأهرامات الثلاثة في مجمع أهرامات الجيزة.",
        "latitude": 29.9792,
        "longitude": 31.1342,
        "city": 1,
        "user": 1,
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
        "is_deleted": false,
        "media_files": [
          {
            "id": 1,
            "file": "/media/historical_sites/1/media/uuid_pyramid.jpg",
            "title": "Great Pyramid Main View",
            "caption": "The main facade of the Great Pyramid showing its impressive stone construction",
            "historical_site": 1,
            "user": 1,
            "is_thumbnail": true,
            "created_at": "2024-01-15T10:30:00Z",
            "updated_at": "2024-01-15T10:30:00Z"
          }
        ],
        "tags_detail": [
          {
            "id": 1,
            "slug_en": "ancient-egypt",
            "slug_ar": "مصر-القديمة",
            "created_at": "2024-01-15T10:30:00Z",
            "updated_at": "2024-01-15T10:30:00Z",
            "is_deleted": false
          }
        ],
        "categories_detail": [
          {
            "id": 1,
            "slug_en": "monument",
            "slug_ar": "نصب-تذكاري",
            "created_at": "2024-01-15T10:30:00Z",
            "updated_at": "2024-01-15T10:30:00Z",
            "is_deleted": false
          }
        ]
      }
    ]
  }
}
```

#### cURL Example

```bash
curl -X GET "http://localhost:8000/api/v1/historical-sites/sites/?search=pyramid&city=1&ordering=-created_at" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 6.2 Create Historical Site

**POST** `/api/v1/historical-sites/sites/`

Create a new historical site with optional media upload.

**Permissions:** Contributors and above  
**Content-Type:** `multipart/form-data` or `application/json`

#### Request Body (JSON format)

```json
{
  "name_en": "Abu Simbel Temples",
  "name_ar": "معابد أبو سمبل",
  "description_en": "Two massive rock temples at Abu Simbel, built during the reign of Pharaoh Ramesses II in the 13th century BC.",
  "description_ar": "معبدان صخريان ضخمان في أبو سمبل، بُنيا في عهد الفرعون رمسيس الثاني في القرن الثالث عشر قبل الميلاد.",
  "latitude": 22.3372,
  "longitude": 31.6258,
  "city": 2,
  "tags": [1, 2],
  "categories": [1],
  "media_uploads": [],
  "media_data": []
}
```

#### Validation Rules

- **name_en:** Required, max 255 chars, non-empty string
- **name_ar:** Required, max 255 chars, non-empty string
- **description_en:** Required, non-empty text
- **description_ar:** Required, non-empty text
- **latitude:** Required, float between -90 and 90
- **longitude:** Required, float between -180 and 180
- **city:** Required, valid city ID
- **tags:** Optional, array of valid tag IDs
- **categories:** Optional, array of valid category IDs

#### Media File Constraints

- **Allowed image types:** jpg, jpeg, png, gif, webp
- **Allowed video types:** mp4, avi, mov, wmv, flv, webm, mkv
- **Image size limit:** 10MB
- **Video size limit:** 100MB

#### Success Response (201)

```json
{
  "success": true,
  "message": "Historical site created successfully",
  "data": {
    "id": 2,
    "name_en": "Abu Simbel Temples",
    "name_ar": "معابد أبو سمبل",
    "description_en": "Two massive rock temples at Abu Simbel, built during the reign of Pharaoh Ramesses II in the 13th century BC.",
    "description_ar": "معبدان صخريان ضخمان في أبو سمبل، بُنيا في عهد الفرعون رمسيس الثاني في القرن الثالث عشر قبل الميلاد.",
    "latitude": 22.3372,
    "longitude": 31.6258,
    "city": 2,
    "user": 1,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "is_deleted": false,
    "media_files": [],
    "tags_detail": [
      {
        "id": 1,
        "slug_en": "ancient-egypt",
        "slug_ar": "مصر-القديمة",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
        "is_deleted": false
      }
    ],
    "categories_detail": [
      {
        "id": 1,
        "slug_en": "temple",
        "slug_ar": "معبد",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
        "is_deleted": false
      }
    ]
  }
}
```

#### Error Responses

```json
// Validation error (400)
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Historical site validation failed"
  }
}

// Permission denied (403)
{
  "detail": "You do not have permission to perform this action."
}
```

#### cURL Example

```bash
curl -X POST http://localhost:8000/api/v1/historical-sites/sites/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name_en": "Abu Simbel Temples",
    "name_ar": "معابد أبو سمبل",
    "description_en": "Two massive rock temples...",
    "description_ar": "معبدان صخريان ضخمان...",
    "latitude": 22.3372,
    "longitude": 31.6258,
    "city": 2,
    "tags": [1],
    "categories": [1]
  }'
```

---

### 6.3 Get Single Historical Site

**GET** `/api/v1/historical-sites/sites/{id}/`

Retrieve a specific historical site with all related data.

**Permissions:** Public

#### Success Response (200)

```json
{
  "success": true,
  "message": "Historical site retrieved successfully",
  "data": {
    "id": 1,
    "name_en": "Great Pyramid of Giza",
    "name_ar": "الهرم الأكبر بالجيزة",
    "description_en": "One of the Seven Wonders of the Ancient World...",
    "description_ar": "إحدى عجائب الدنيا السبع في العالم القديم...",
    "latitude": 29.9792,
    "longitude": 31.1342,
    "city": 1,
    "user": 1,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "is_deleted": false,
    "media_files": [],
    "tags_detail": [],
    "categories_detail": []
  }
}
```

---

### 6.4 Update Historical Site

**PUT/PATCH** `/api/v1/historical-sites/sites/{id}/`

Update a historical site.

**Permissions:** Site owner or Moderator/Admin

#### Request Body

```json
{
  "name_en": "Great Pyramid of Giza - Updated",
  "description_en": "Updated description with more detailed information about the construction and history...",
  "tags": [1, 3, 4]
}
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Historical site updated successfully",
  "data": {
    "id": 1,
    "name_en": "Great Pyramid of Giza - Updated",
    "name_ar": "الهرم الأكبر بالجيزة",
    "description_en": "Updated description with more detailed information about the construction and history...",
    "description_ar": "إحدى عجائب الدنيا السبع في العالم القديم...",
    "latitude": 29.9792,
    "longitude": 31.1342,
    "city": 1,
    "user": 1,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T12:00:00Z",
    "is_deleted": false,
    "media_files": [],
    "tags_detail": [],
    "categories_detail": []
  }
}
```

#### Error Response (403)

```json
{
  "detail": "You do not have permission to perform this action."
}
```

---

### 6.5 Delete Historical Site

**DELETE** `/api/v1/historical-sites/sites/{id}/`

Soft delete a historical site (sets is_deleted=True).

**Permissions:** Site owner or Moderator/Admin

#### Success Response (204)

```json
{
  "success": true,
  "message": "Historical site deleted successfully"
}
```

#### Error Response (403)

```json
{
  "detail": "You do not have permission to perform this action."
}
```

---

### 6.6 Bulk Media Upload

**POST** `/api/v1/historical-sites/sites/{id}/bulk_media_upload/`

Upload multiple media files to an existing historical site.

**Permissions:** Site owner or Moderator/Admin  
**Content-Type:** `multipart/form-data`

#### Request Body (Form Data)

```
files: [file1.jpg, file2.mp4, file3.png]
titles: ["Photo 1", "Video Tour", "Photo 2"]
captions: ["Site overview", "Interior walkthrough", "Detail view"]
thumbnails: [true, false, false]
```

#### Constraints

- Maximum file sizes: 10MB (images), 100MB (videos)
- Supported formats: jpg, jpeg, png, gif, webp, mp4, avi, mov, wmv, flv, webm, mkv
- Only one thumbnail per site allowed (automatically removes previous thumbnail)

#### Success Response (201)

```json
{
  "success": true,
  "message": "Successfully uploaded 3 files",
  "data": {
    "media": [
      {
        "id": 10,
        "file": "/media/historical_sites/1/media/uuid_file1.jpg",
        "title": "Photo 1",
        "caption": "Site overview",
        "historical_site": 1,
        "user": 1,
        "is_thumbnail": true,
        "created_at": "2024-01-15T12:00:00Z",
        "updated_at": "2024-01-15T12:00:00Z"
      },
      {
        "id": 11,
        "file": "/media/historical_sites/1/media/uuid_file2.mp4",
        "title": "Video Tour",
        "caption": "Interior walkthrough",
        "historical_site": 1,
        "user": 1,
        "is_thumbnail": false,
        "created_at": "2024-01-15T12:00:00Z",
        "updated_at": "2024-01-15T12:00:00Z"
      },
      {
        "id": 12,
        "file": "/media/historical_sites/1/media/uuid_file3.png",
        "title": "Photo 2",
        "caption": "Detail view",
        "historical_site": 1,
        "user": 1,
        "is_thumbnail": false,
        "created_at": "2024-01-15T12:00:00Z",
        "updated_at": "2024-01-15T12:00:00Z"
      }
    ]
  }
}
```

#### Error Responses

```json
// No files provided (400)
{
  "success": false,
  "error": {
    "code": "MISSING_FILES",
    "message": "No files provided"
  }
}

// File validation error (400)
{
  "success": false,
  "error": {
    "code": "FILE_VALIDATION_ERROR",
    "message": "File 2 validation failed"
  }
}

// Site not found (404)
{
  "success": false,
  "error": {
    "code": "SITE_NOT_FOUND",
    "message": "Historical site not found"
  }
}
```

#### cURL Example

```bash
curl -X POST http://localhost:8000/api/v1/historical-sites/sites/1/bulk_media_upload/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "files=@photo1.jpg" \
  -F "files=@video.mp4" \
  -F "titles=Main View" \
  -F "titles=Site Tour" \
  -F "captions=Front view of the site" \
  -F "captions=Complete walkthrough" \
  -F "thumbnails=true" \
  -F "thumbnails=false"
```

---

## 7. Media Management

### 7.1 List Media Files

**GET** `/api/v1/historical-sites/media/`

Retrieve all media files across all historical sites.

**Permissions:** Public

#### Success Response (200)

```json
{
  "success": true,
  "message": "Media retrieved successfully",
  "data": [
    {
      "id": 1,
      "file": "/media/historical_sites/1/media/uuid_pyramid.jpg",
      "title": "Great Pyramid Main View",
      "caption": "The main facade of the Great Pyramid",
      "historical_site": 1,
      "user": 1,
      "is_thumbnail": true,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 7.2 Create Media File

**POST** `/api/v1/historical-sites/media/`

Upload a single media file.

**Permissions:** Contributors and above  
**Content-Type:** `multipart/form-data`

#### Request Body (Form Data)

```
file: [binary file data]
title: "Photo Title"
caption: "Photo description"
historical_site: 1
is_thumbnail: false
```

#### Validation Rules

- **file:** Required, must be valid image or video format
- **title:** Optional, max 255 chars, cannot be empty string if provided
- **caption:** Optional, text field, cannot be empty string if provided
- **historical_site:** Required, valid historical site ID
- **is_thumbnail:** Boolean, only one thumbnail per site allowed

#### Success Response (201)

```json
{
  "success": true,
  "message": "Media created successfully",
  "data": {
    "id": 11,
    "file": "/media/historical_sites/1/media/uuid_newfile.jpg",
    "title": "Photo Title",
    "caption": "Photo description",
    "historical_site": 1,
    "user": 1,
    "is_thumbnail": false,
    "created_at": "2024-01-15T12:15:00Z",
    "updated_at": "2024-01-15T12:15:00Z"
  }
}
```

#### Error Responses

```json
// Invalid file format (400)
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Media validation failed"
  }
}

// File too large (400)
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Image file too large. Maximum size is 10MB."
  }
}
```

---

### 7.3 Get Single Media File

**GET** `/api/v1/historical-sites/media/{id}/`

Retrieve a specific media file.

**Permissions:** Public

#### Success Response (200)

```json
{
  "success": true,
  "message": "Media retrieved successfully",
  "data": {
    "id": 1,
    "file": "/media/historical_sites/1/media/uuid_pyramid.jpg",
    "title": "Great Pyramid Main View",
    "caption": "The main facade of the Great Pyramid",
    "historical_site": 1,
    "user": 1,
    "is_thumbnail": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### 7.4 Update Media File

**PUT/PATCH** `/api/v1/historical-sites/media/{id}/`

Update media file metadata (cannot change the file itself).

**Permissions:** File owner or Moderator/Admin

#### Request Body

```json
{
  "title": "Updated Photo Title",
  "caption": "Updated photo description with more details",
  "is_thumbnail": true
}
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Media updated successfully",
  "data": {
    "id": 1,
    "file": "/media/historical_sites/1/media/uuid_pyramid.jpg",
    "title": "Updated Photo Title",
    "caption": "Updated photo description with more details",
    "historical_site": 1,
    "user": 1,
    "is_thumbnail": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T12:30:00Z"
  }
}
```

---

### 7.5 Delete Media File

**DELETE** `/api/v1/historical-sites/media/{id}/`

Delete a media file (hard delete - removes file from storage).

**Permissions:** File owner or Moderator/Admin

#### Success Response (204)

```json
{
  "success": true,
  "message": "Media deleted successfully"
}
```

#### Error Response (403)

```json
{
  "detail": "You do not have permission to perform this action."
}
```

---

## 8. API Documentation Endpoints

### 8.1 Swagger UI

**GET** `/api/v1/docs/`

Interactive API documentation interface using Swagger UI.

**Permissions:** Public (AllowAny)

#### Response

Returns an interactive HTML interface for exploring and testing the API endpoints.

---

### 8.2 ReDoc Documentation

**GET** `/api/v1/docs/redoc/`

Alternative API documentation interface using ReDoc.

**Permissions:** Public (AllowAny)

#### Response

Returns a clean, responsive HTML documentation interface.

---

### 8.3 OpenAPI Schema

**GET** `/api/v1/docs/schema/`

Raw OpenAPI 3.0 specification in JSON format.

**Permissions:** Public (AllowAny)

#### Success Response (200)

```json
{
  "openapi": "3.0.2",
  "info": {
    "title": "Historical Sites Backend API",
    "version": "1.0.0"
  },
  "paths": {
    // Complete API specification
  }
}
```

---

## Error Codes Reference

| Error Code                 | Description                      | HTTP Status | Common Causes                                 |
| -------------------------- | -------------------------------- | ----------- | --------------------------------------------- |
| `VALIDATION_ERROR`         | Request validation failed        | 400         | Invalid field values, missing required fields |
| `MISSING_REFRESH_TOKEN`    | Refresh token not provided       | 400         | Logout attempt without token                  |
| `MISSING_EMAIL`            | Email not provided in request    | 400         | Password reset without email                  |
| `MISSING_PASSWORD`         | Password not provided            | 400         | Password reset confirm without password       |
| `MISSING_FILES`            | No files provided for upload     | 400         | Bulk upload without files                     |
| `INVALID_TOKEN`            | Invalid or expired JWT token     | 400         | Expired or malformed token                    |
| `INVALID_RESET_TOKEN`      | Invalid password reset token     | 400         | Expired or invalid reset link                 |
| `INVALID_TOKEN_FORMAT`     | Token format validation failed   | 400         | Malformed token structure                     |
| `INVALID_EMAIL_FORMAT`     | Email format validation failed   | 400         | Invalid email syntax                          |
| `INVALID_SITE_ID`          | Site ID format validation failed | 400         | Non-numeric site ID                           |
| `EMAIL_TOO_LONG`           | Email exceeds maximum length     | 400         | Email longer than 254 characters              |
| `UNAUTHORIZED`             | Authentication required          | 401         | Missing or invalid Authorization header       |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions  | 403         | Role-based access control violation           |
| `PERMISSION_DENIED`        | Access denied for resource       | 403         | Object-level permission failure               |
| `NOT_FOUND`                | Resource not found               | 404         | Invalid resource ID                           |
| `SITE_NOT_FOUND`           | Historical site not found        | 404         | Invalid site ID in request                    |
| `THROTTLED`                | Rate limit exceeded              | 429         | Too many requests within time window          |
| `FILE_VALIDATION_ERROR`    | File upload validation failed    | 400         | Invalid file type or size                     |
| `BULK_UPLOAD_ERROR`        | Bulk file upload failed          | 500         | Server error during bulk operations           |
| `EMAIL_ERROR`              | Email sending failed             | 500         | SMTP configuration issues                     |
| `PASSWORD_RESET_ERROR`     | Password reset system error      | 500         | Internal password reset failure               |
| `SERVER_ERROR`             | Internal server error            | 500         | Unexpected application error                  |

---

## Data Models Reference

### User Model

```json
{
  "id": "integer (primary key, auto-generated)",
  "email": "string (unique, max 254 chars, required)",
  "role": "string (visitor|contributor|moderator|admin, default: visitor)",
  "is_active": "boolean (default: true)",
  "created_at": "datetime (ISO 8601, auto-generated)",
  "updated_at": "datetime (ISO 8601, auto-updated)",
  "is_deleted": "boolean (default: false)"
}
```

### Governorate Model

```json
{
  "id": "integer (primary key, auto-generated)",
  "name_en": "string (max 200 chars, unique, required)",
  "name_ar": "string (max 200 chars, unique, required)",
  "created_at": "datetime (ISO 8601, auto-generated)",
  "updated_at": "datetime (ISO 8601, auto-updated)",
  "is_deleted": "boolean (default: false)"
}
```

### City Model

```json
{
  "id": "integer (primary key, auto-generated)",
  "name_en": "string (max 200 chars, unique, required)",
  "name_ar": "string (max 200 chars, unique, required)",
  "governorate": "integer (foreign key to Governorate, required)",
  "created_at": "datetime (ISO 8601, auto-generated)",
  "updated_at": "datetime (ISO 8601, auto-updated)",
  "is_deleted": "boolean (default: false)"
}
```

### Tag Model

```json
{
  "id": "integer (primary key, auto-generated)",
  "slug_en": "string (max 100 chars, unique, slug format, required)",
  "slug_ar": "string (max 100 chars, unique, required)",
  "created_at": "datetime (ISO 8601, auto-generated)",
  "updated_at": "datetime (ISO 8601, auto-updated)",
  "is_deleted": "boolean (default: false)"
}
```

### Category Model

```json
{
  "id": "integer (primary key, auto-generated)",
  "slug_en": "string (max 100 chars, unique, slug format, required)",
  "slug_ar": "string (max 100 chars, unique, required)",
  "created_at": "datetime (ISO 8601, auto-generated)",
  "updated_at": "datetime (ISO 8601, auto-updated)",
  "is_deleted": "boolean (default: false)"
}
```

### Historical Site Model

```json
{
  "id": "integer (primary key, auto-generated)",
  "name_en": "string (max 255 chars, required)",
  "name_ar": "string (max 255 chars, required)",
  "description_en": "text (required)",
  "description_ar": "text (required)",
  "latitude": "float (-90 to 90, required)",
  "longitude": "float (-180 to 180, required)",
  "city": "integer (foreign key to City, required)",
  "user": "integer (foreign key to User, nullable, set on creation)",
  "tags": "array of tag IDs (many-to-many, optional)",
  "categories": "array of category IDs (many-to-many, optional)",
  "created_at": "datetime (ISO 8601, auto-generated)",
  "updated_at": "datetime (ISO 8601, auto-updated)",
  "is_deleted": "boolean (default: false)"
}
```

### Historical Site Media Model

```json
{
  "id": "integer (primary key, auto-generated)",
  "file": "string (file URL, required)",
  "title": "string (max 255 chars, optional, cannot be empty if provided)",
  "caption": "text (optional, cannot be empty if provided)",
  "historical_site": "integer (foreign key to HistoricalSite, required)",
  "user": "integer (foreign key to User, nullable, set on creation)",
  "is_thumbnail": "boolean (default: false, only one per site)",
  "created_at": "datetime (ISO 8601, auto-generated)",
  "updated_at": "datetime (ISO 8601, auto-updated)"
}
```

---

## Special Considerations

### 1. Soft Deletion

Most models use soft deletion (`is_deleted` field) rather than hard deletion. When an object is "deleted":

- The `is_deleted` field is set to `True`
- The object is excluded from normal queries automatically via the `BaseManager`
- Related objects are not affected unless explicitly handled
- Data is preserved in the database for audit and recovery purposes

### 2. Bilingual Support

The system supports both English and Arabic content:

- All user-facing content fields have `_en` and `_ar` suffixes
- Both language versions are required for most content
- Slug fields support both English (slug format) and Arabic characters
- API responses include both languages for frontend flexibility

### 3. Geographic Coordinates

Historical sites require valid GPS coordinates:

- **Latitude:** -90 to 90 degrees (validated at model and database level)
- **Longitude:** -180 to 180 degrees (validated at model and database level)
- Coordinates are stored as float fields for precision

### 4. File Organization and Storage

Media files are organized hierarchically:

```
/media/historical_sites/{site_id}/media/{uuid}_{original_filename}
```

- Files are stored with UUID prefixes to prevent naming conflicts
- Directory structure organizes files by historical site
- File paths are relative to `MEDIA_URL` setting

### 5. Thumbnail Management

Thumbnail constraints ensure data integrity:

- Only one thumbnail allowed per historical site
- Setting `is_thumbnail: true` on a new media file automatically removes the flag from other files
- Database constraint enforces uniqueness at the database level
- Thumbnail status affects only active (`is_deleted=False`) media files

### 6. Permission Hierarchy

User roles have hierarchical permissions enforced at the view level:

- **Admin** → Full access to everything (requires `is_staff=True` and `is_superuser=True`)
- **Moderator** → Can moderate all content, manage tags/categories
- **Contributor** → Can create/edit own content, create tags/categories
- **Visitor** → Read-only access to all public content

Permission methods available on User model:

- `can_create_content()` → True for contributor, moderator, admin
- `can_moderate_content()` → True for moderator, admin

### 7. Validation Rules and Constraints

**String Validation:**

- Email addresses are normalized to lowercase automatically
- Empty strings are not allowed for required fields (enforced by `validate_non_empty_string`)
- Slug fields must follow proper format (lowercase, hyphen-separated for English)
- Arabic slugs support Arabic characters and hyphens

**File Validation:**

- File extensions are validated (case-insensitive)
- Size limits enforced: 10MB for images, 100MB for videos
- Supported formats defined in constants module
- MIME type validation at upload time

**Database Constraints:**

- Unique constraints on email, governorate names, city names, tag/category slugs
- Check constraints for coordinate ranges, non-empty required fields
- Foreign key constraints with appropriate `on_delete` behavior

### 8. Rate Limiting Configuration

Rate limits are applied per IP address for anonymous users and per user for authenticated users:

- Limits reset on a rolling window basis
- Different scopes for different endpoint types
- Headers provided to inform clients of current limits

### 9. Pagination

All list endpoints support pagination:

- Default page size: 20 items
- Configurable via `PAGE_SIZE` setting
- Standard pagination response format with `count`, `next`, `previous`, `results`
- Page numbers start from 1

---

## Testing the API

### Authentication Flow

```bash
# 1. Register a new user
curl -X POST http://localhost:8000/api/v1/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "secure_password123"
  }'

# 2. Login and get tokens
curl -X POST http://localhost:8000/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "secure_password123"
  }'

# 3. Use access token for authenticated requests
curl -X GET http://localhost:8000/api/v1/users/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Historical Site Creation with Media

```bash
# Create a historical site with metadata only
curl -X POST http://localhost:8000/api/v1/historical-sites/sites/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name_en": "Test Site",
    "name_ar": "موقع تجريبي",
    "description_en": "A test historical site for API demonstration",
    "description_ar": "موقع تاريخي تجريبي لتوضيح واجهة برمجة التطبيقات",
    "latitude": 30.0444,
    "longitude": 31.2357,
    "city": 1,
    "tags": [1, 2],
    "categories": [1]
  }'

# Upload media files to the created site
curl -X POST http://localhost:8000/api/v1/historical-sites/sites/1/bulk_media_upload/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "files=@photo1.jpg" \
  -F "files=@photo2.jpg" \
  -F "titles=Main View" \
  -F "titles=Side View" \
  -F "captions=Front facade of the site" \
  -F "captions=Side perspective showing architectural details" \
  -F "thumbnails=true" \
  -F "thumbnails=false"
```

### Search and Filtering

```bash
# Search historical sites with multiple filters
curl -X GET "http://localhost:8000/api/v1/historical-sites/sites/?search=pyramid&city=1&categories=1,2&tags=1&ordering=-created_at&page=1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get all governorates and cities
curl -X GET http://localhost:8000/api/v1/common/governorates/
curl -X GET http://localhost:8000/api/v1/common/cities/

# Get all tags and categories
curl -X GET http://localhost:8000/api/v1/historical-sites/tags/
curl -X GET http://localhost:8000/api/v1/historical-sites/categories/
```

### Error Handling Examples

```bash
# Test rate limiting (make 26 requests rapidly to auth endpoint)
for i in {1..26}; do
  curl -X POST http://localhost:8000/api/v1/auth/token/ \
    -H "Content-Type: application/json" \
    -d '{"email":"invalid","password":"invalid"}'
  echo "Request $i completed"
done

# Test permission denied (try to create governorate as non-admin)
curl -X POST http://localhost:8000/api/v1/common/governorates/ \
  -H "Authorization: Bearer CONTRIBUTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name_en":"Test","name_ar":"تجربة"}'

# Test validation error (invalid coordinates)
curl -X POST http://localhost:8000/api/v1/historical-sites/sites/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name_en": "Invalid Site",
    "name_ar": "موقع غير صحيح",
    "description_en": "Site with invalid coordinates",
    "description_ar": "موقع بإحداثيات غير صحيحة",
    "latitude": 91.0,
    "longitude": 181.0,
    "city": 1
  }'
```

---

This documentation provides comprehensive coverage of the Historical Sites Backend API with accurate endpoint definitions, proper validation rules, complete error handling, and practical examples for frontend integration. All information has been verified against the actual Django backend implementation to ensure accuracy and consistency.

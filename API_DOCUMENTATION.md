# Journal Entries Application - API Documentation

This document provides comprehensive documentation for all API endpoints in the Journal Entries application.

## Base URL

When running locally, the base URL is: `http://localhost:3000/api`

## Authentication

Most endpoints in this API require authentication using NextAuth.js sessions.

### Authentication Methods

The API uses JWT-based authentication via HTTP-only cookies. To authenticate:

1. Send a POST request to `/api/auth/callback/credentials` with email and password
2. The server will set the authentication cookie automatically
3. Include the cookie in subsequent requests

### Request Headers

For authenticated endpoints, the session cookie will be automatically included in your requests from the browser.

For programmatic access, you'll need to include the session cookie:

```
Cookie: next-auth.session-token=<your-session-token>
```

## Error Handling

All API endpoints return appropriate HTTP status codes:

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error responses follow this format:

```json
{
  "error": "Error message description"
}
```

## API Endpoints

### Authentication Endpoints

#### User Login

```
POST /api/auth/callback/credentials
```

Authenticates a user and creates a session.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Response:**

```json
{
  "user": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "USER"
  },
  "expires": "2023-04-01T00:00:00.000Z"
}
```

#### User Registration

```
POST /api/auth/register
```

Creates a new user account.

**Request Body:**

```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "newuserpassword"
}
```

**Response:**

```json
{
  "user": {
    "id": "new-user-id",
    "name": "New User",
    "email": "newuser@example.com",
    "role": "USER"
  }
}
```

#### Get Session

```
GET /api/auth/session
```

Returns the current user session.

**Response:**

```json
{
  "user": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "USER"
  },
  "expires": "2023-04-01T00:00:00.000Z"
}
```

#### Logout

```
POST /api/auth/signout
```

Ends the current user session.

**Response:**

```json
{
  "success": true
}
```

### Journal Endpoints

#### Get All Journals

```
GET /api/journals
```

Returns all journals for the current user.

**Query Parameters:**

| Parameter | Type   | Description                            |
|-----------|--------|----------------------------------------|
| page      | number | Page number (default: 1)              |
| limit     | number | Items per page (default: 10)          |
| category  | string | Filter by category ID                  |
| tag       | string | Filter by tag ID                       |
| search    | string | Search in title and content            |

**Response:**

```json
{
  "journals": [
    {
      "id": "journal-id-1",
      "title": "My First Journal",
      "content": "Journal content here...",
      "mood": "HAPPY",
      "date": "2023-03-15T00:00:00.000Z",
      "categoryId": "category-id",
      "category": {
        "id": "category-id",
        "name": "Personal",
        "color": "#FF5733"
      },
      "tags": [
        {
          "id": "tag-id-1",
          "name": "important"
        }
      ],
      "createdAt": "2023-03-15T14:30:00.000Z",
      "updatedAt": "2023-03-15T14:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "pages": 3,
    "currentPage": 1,
    "limit": 10
  }
}
```

#### Get Journal by ID

```
GET /api/journals/{id}
```

Returns a specific journal by ID.

**Path Parameters:**

| Parameter | Type   | Description    |
|-----------|--------|----------------|
| id        | string | Journal ID     |

**Response:**

```json
{
  "id": "journal-id-1",
  "title": "My First Journal",
  "content": "Journal content here...",
  "mood": "HAPPY",
  "date": "2023-03-15T00:00:00.000Z",
  "categoryId": "category-id",
  "category": {
    "id": "category-id",
    "name": "Personal",
    "color": "#FF5733"
  },
  "tags": [
    {
      "id": "tag-id-1",
      "name": "important"
    }
  ],
  "createdAt": "2023-03-15T14:30:00.000Z",
  "updatedAt": "2023-03-15T14:30:00.000Z"
}
```

#### Create Journal

```
POST /api/journals
```

Creates a new journal entry.

**Request Body:**

```json
{
  "title": "My New Journal",
  "content": "This is the content of my new journal...",
  "mood": "HAPPY",
  "date": "2023-03-20T00:00:00.000Z",
  "categoryId": "category-id",
  "tagIds": ["tag-id-1", "tag-id-2"]
}
```

**Response:**

```json
{
  "id": "new-journal-id",
  "title": "My New Journal",
  "content": "This is the content of my new journal...",
  "mood": "HAPPY",
  "date": "2023-03-20T00:00:00.000Z",
  "categoryId": "category-id",
  "userId": "user-id",
  "createdAt": "2023-03-20T14:30:00.000Z",
  "updatedAt": "2023-03-20T14:30:00.000Z"
}
```

#### Update Journal

```
PUT /api/journals/{id}
```

Updates an existing journal entry.

**Path Parameters:**

| Parameter | Type   | Description    |
|-----------|--------|----------------|
| id        | string | Journal ID     |

**Request Body:**

```json
{
  "title": "Updated Journal Title",
  "content": "Updated content...",
  "mood": "NEUTRAL",
  "date": "2023-03-20T00:00:00.000Z",
  "categoryId": "category-id",
  "tagIds": ["tag-id-1", "tag-id-3"]
}
```

**Response:**

```json
{
  "id": "journal-id",
  "title": "Updated Journal Title",
  "content": "Updated content...",
  "mood": "NEUTRAL",
  "date": "2023-03-20T00:00:00.000Z",
  "categoryId": "category-id",
  "userId": "user-id",
  "updatedAt": "2023-03-21T10:15:00.000Z"
}
```

#### Delete Journal

```
DELETE /api/journals/{id}
```

Deletes a journal entry.

**Path Parameters:**

| Parameter | Type   | Description    |
|-----------|--------|----------------|
| id        | string | Journal ID     |

**Response:**

```json
{
  "success": true
}
```

### Category Endpoints

#### Get All Categories

```
GET /api/categories
```

Returns all categories.

**Response:**

```json
[
  {
    "id": "category-id-1",
    "name": "Personal",
    "color": "#FF5733",
    "createdAt": "2023-02-15T14:30:00.000Z",
    "updatedAt": "2023-02-15T14:30:00.000Z"
  },
  {
    "id": "category-id-2",
    "name": "Work",
    "color": "#3498DB",
    "createdAt": "2023-02-16T10:20:00.000Z",
    "updatedAt": "2023-02-16T10:20:00.000Z"
  }
]
```

#### Create Category

```
POST /api/categories
```

Creates a new category. **Requires ADMIN role.**

**Request Body:**

```json
{
  "name": "Health",
  "color": "#27AE60"
}
```

**Response:**

```json
{
  "id": "new-category-id",
  "name": "Health",
  "color": "#27AE60",
  "createdAt": "2023-03-21T11:30:00.000Z",
  "updatedAt": "2023-03-21T11:30:00.000Z"
}
```

#### Update Category

```
PUT /api/categories/{id}
```

Updates an existing category. **Requires ADMIN role.**

**Path Parameters:**

| Parameter | Type   | Description    |
|-----------|--------|----------------|
| id        | string | Category ID    |

**Request Body:**

```json
{
  "name": "Updated Category",
  "color": "#9B59B6"
}
```

**Response:**

```json
{
  "id": "category-id",
  "name": "Updated Category",
  "color": "#9B59B6",
  "updatedAt": "2023-03-21T14:45:00.000Z"
}
```

#### Delete Category

```
DELETE /api/categories/{id}
```

Deletes a category. **Requires ADMIN role.**

**Path Parameters:**

| Parameter | Type   | Description    |
|-----------|--------|----------------|
| id        | string | Category ID    |

**Response:**

```json
{
  "success": true
}
```

### Tag Endpoints

#### Get All Tags

```
GET /api/tags
```

Returns all tags.

**Response:**

```json
[
  {
    "id": "tag-id-1",
    "name": "important",
    "createdAt": "2023-02-10T09:30:00.000Z",
    "updatedAt": "2023-02-10T09:30:00.000Z"
  },
  {
    "id": "tag-id-2",
    "name": "personal",
    "createdAt": "2023-02-11T11:20:00.000Z",
    "updatedAt": "2023-02-11T11:20:00.000Z"
  }
]
```

#### Create Tag

```
POST /api/tags
```

Creates a new tag.

**Request Body:**

```json
{
  "name": "achievement"
}
```

**Response:**

```json
{
  "id": "new-tag-id",
  "name": "achievement",
  "createdAt": "2023-03-22T16:30:00.000Z",
  "updatedAt": "2023-03-22T16:30:00.000Z"
}
```

#### Update Tag

```
PUT /api/tags/{id}
```

Updates an existing tag.

**Path Parameters:**

| Parameter | Type   | Description    |
|-----------|--------|----------------|
| id        | string | Tag ID         |

**Request Body:**

```json
{
  "name": "updated-tag"
}
```

**Response:**

```json
{
  "id": "tag-id",
  "name": "updated-tag",
  "updatedAt": "2023-03-22T17:15:00.000Z"
}
```

#### Delete Tag

```
DELETE /api/tags/{id}
```

Deletes a tag.

**Path Parameters:**

| Parameter | Type   | Description    |
|-----------|--------|----------------|
| id        | string | Tag ID         |

**Response:**

```json
{
  "success": true
}
```

### User Management Endpoints (Admin Only)

#### Get All Users

```
GET /api/admin/users
```

Returns all users. **Requires ADMIN role.**

**Response:**

```json
[
  {
    "id": "user-id-1",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "ADMIN",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  },
  {
    "id": "user-id-2",
    "name": "Regular User",
    "email": "user@example.com",
    "role": "USER",
    "createdAt": "2023-01-02T00:00:00.000Z",
    "updatedAt": "2023-01-02T00:00:00.000Z"
  }
]
```

#### Update User

```
PUT /api/admin/users
```

Updates a user's details. **Requires ADMIN role.**

**Request Body:**

```json
{
  "id": "user-id",
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "ADMIN",
  "password": "newpassword" // Optional, only if changing password
}
```

**Response:**

```json
{
  "id": "user-id",
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "ADMIN",
  "updatedAt": "2023-03-23T09:45:00.000Z"
}
```

#### Delete User

```
DELETE /api/admin/users?id={id}
```

Deletes a user. **Requires ADMIN role.**

**Query Parameters:**

| Parameter | Type   | Description    |
|-----------|--------|----------------|
| id        | string | User ID        |

**Response:**

```json
{
  "success": true
}
```

### User Settings Endpoints

#### Get User Settings

```
GET /api/user/settings
```

Returns the current user's settings.

**Response:**

```json
{
  "id": "settings-id",
  "userId": "user-id",
  "theme": "LIGHT",
  "notifyEmail": false,
  "createdAt": "2023-02-01T00:00:00.000Z",
  "updatedAt": "2023-02-01T00:00:00.000Z"
}
```

#### Update User Settings

```
PUT /api/user/settings
```

Updates the current user's settings.

**Request Body:**

```json
{
  "theme": "DARK",
  "notifyEmail": true
}
```

**Response:**

```json
{
  "id": "settings-id",
  "userId": "user-id",
  "theme": "DARK",
  "notifyEmail": true,
  "updatedAt": "2023-03-24T14:20:00.000Z"
}
```

### AI Analysis Endpoints

#### Get Journal Analysis

```
POST /api/ai-analysis
```

Analyzes the content of a journal entry.

**Request Body:**

```json
{
  "journalId": "journal-id",
  "content": "The content to analyze..."
}
```

**Response:**

```json
{
  "sentiment": "POSITIVE",
  "topics": ["work", "achievement", "goals"],
  "summary": "A positive reflection on work accomplishments and future goals.",
  "recommendations": "Consider setting specific milestones for your goals."
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- Authentication endpoints: 5 requests per minute
- General API endpoints: 60 requests per minute per user
- Admin endpoints: 120 requests per minute per admin user

Exceeding these limits will result in a `429 Too Many Requests` response.

## Versioning

The current API version is v1 (implicit in the URLs). Future versions will be explicitly versioned as `/api/v2/...` etc.

## Webhook Support

For integration with external services, the Journal Entries application will support webhooks in a future release.

## Testing the API

You can test the API using tools like:

- [Insomnia](https://insomnia.rest/)
- [Postman](https://www.postman.com/)
- [curl](https://curl.se/)

Example curl command to get all journals:

```bash
curl -X GET http://localhost:3000/api/journals \
  -H "Cookie: next-auth.session-token=your-session-token"
```

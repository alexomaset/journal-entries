# Journal Entries Application - System Design Document

## Overview

The Journal Entries application is a personal journaling platform that allows users to create, manage, and analyze their journal entries. It features a modern, responsive UI, role-based access control, and AI-powered insights.

## Architecture

The application follows a modern web application architecture with:

- **Next.js 15.2.3** as the React framework
- **Server-side and client-side rendering** for optimal performance
- **API Routes** for backend functionality
- **Prisma ORM** for database interactions
- **NextAuth.js** for authentication

### System Architecture Diagram

```
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │     │                   │
│   Client Browser  │◄────┤    Next.js App    │◄────┤    Database       │
│                   │     │                   │     │    (SQLite)       │
└───────────────────┘     └───────────────────┘     └───────────────────┘
                                    ▲                         
                                    │                         
                                    ▼                         
                          ┌───────────────────┐               
                          │                   │               
                          │   External APIs   │               
                          │  (AI Analysis)    │               
                          │                   │               
                          └───────────────────┘               
```

## Component Structure

### Frontend Components

- **Layout Components**
  - `RootLayout`: Main application layout
  - `DashboardLayout`: Dashboard-specific layout with navigation
  
- **Authentication Components**
  - `LoginPage`: User login interface
  - `RegisterPage`: New user registration
  - `AuthProvider`: Authentication context provider
  
- **Journal Management**
  - `DashboardPage`: Overview with recent journals and statistics
  - `JournalList`: List of all journal entries
  - `NewJournalPage`: Create new journal entries
  - `EditJournalPage`: Edit existing entries
  - `JournalDetailPage`: View detailed journal entry
  
- **Settings and Preferences**
  - `SettingsPage`: User profile and application settings
  - `ThemeProvider`: Theme management
  
- **Admin Features**
  - `UserManagementPage`: Manage user accounts (admin only)

### Backend API Routes

- **Authentication**
  - `/api/auth/[...nextauth]`: NextAuth.js authentication endpoints
  
- **User Management**
  - `/api/user/settings`: User profile and settings
  - `/api/admin/users`: Admin-only user management
  
- **Content Management**
  - `/api/journals`: Journal CRUD operations
  - `/api/categories`: Category management
  - `/api/tags`: Tag management
  
- **AI Features**
  - `/api/ai-analysis`: AI-powered journal analysis

## Data Model

### Core Entities

#### User
- `id`: Unique identifier
- `name`: User's name
- `email`: Email address (unique)
- `password`: Hashed password
- `role`: User role (USER or ADMIN)
- `settings`: Related settings
- `journals`: Related journal entries
- `createdAt`: Timestamp of creation
- `updatedAt`: Timestamp of last update

#### Journal
- `id`: Unique identifier
- `title`: Journal title
- `content`: Journal content
- `date`: Date of the journal
- `mood`: User's mood
- `userId`: Owner of the journal
- `categoryId`: Related category
- `tags`: Related tags
- `createdAt`: Timestamp of creation
- `updatedAt`: Timestamp of last update

#### Category
- `id`: Unique identifier
- `name`: Category name
- `color`: Color code for UI
- `journals`: Related journal entries

#### Tag
- `id`: Unique identifier
- `name`: Tag name
- `journals`: Related journal entries

#### UserSettings
- `id`: Unique identifier
- `userId`: Related user
- `theme`: UI theme preference
- `notifyEmail`: Email notification preferences

### Entity Relationship Diagram

```
┌─────────┐       ┌─────────┐       ┌─────────┐
│         │       │         │       │         │
│  User   │──┐    │ Journal │       │ Category│
│         │  │    │         │       │         │
└─────────┘  │    └─────────┘       └─────────┘
     │       │         │                 │     
     │       │         │                 │     
     ▼       │         │                 │     
┌─────────┐  │         │                 │     
│         │  │         │                 │     
│ Settings│  └─────────┼─────────────────┘     
│         │            │                       
└─────────┘            ▼                       
                   ┌─────────┐                 
                   │         │                 
                   │   Tag   │                 
                   │         │                 
                   └─────────┘                 
```

## Authentication Flow

1. **Registration**:
   - User provides name, email, and password
   - Password is hashed with bcryptjs
   - User record is created in the database
   - Default settings are created for the user

2. **Login**:
   - User submits email and password
   - Password is verified against hashed version
   - JWT token is generated with user ID and role
   - Session is established

3. **Authorization**:
   - JWT token is verified on protected routes
   - User permissions are checked based on role
   - Admin-specific features are only available to ADMIN users

## Role-Based Access Control

The application implements two primary roles:

### USER Role
- Create and manage personal journal entries
- View and manage personal profile
- Customize application settings
- View personal statistics and insights

### ADMIN Role
- All USER permissions
- Manage all users (create, edit, delete)
- Promote/demote user roles
- Create and manage categories
- View system statistics

## Technologies Used

### Frontend
- **React 19**: UI library
- **Next.js 15.2.3**: React framework
- **TailwindCSS**: Utility-first CSS framework
- **React Hook Form**: Form handling and validation
- **Zod**: Schema validation
- **React Hot Toast**: Toast notifications
- **Chart.js**: Data visualization

### Backend
- **Next.js API Routes**: Backend API endpoints
- **Prisma ORM**: Database access layer
- **NextAuth.js**: Authentication
- **bcryptjs**: Password hashing
- **JWT**: Token-based authentication

### Database
- **SQLite**: Development database
- **Prisma**: ORM and migration tool

## Performance Considerations

- **Server-side rendering** for initial page loads
- **Client-side rendering** for interactive components
- **Debounced AI analysis** to prevent excessive API calls
- **Optimistic UI updates** for better user experience
- **Lazy loading** for certain components and features

## Security Measures

- **Password hashing** with bcryptjs
- **JWT-based authentication** with proper secret key
- **Role-based access control** for protected resources
- **Input validation** with Zod schema
- **CSRF protection** via Next.js built-in protections
- **HTTP-only cookies** for session management

## Future Enhancements

- **Export/Import** functionality for journals
- **Enhanced AI analysis** with more insights
- **Collaborative journaling** with shared entries
- **Multi-language support**
- **Mobile application** using the same API backend
- **Integration with calendar and reminder systems**

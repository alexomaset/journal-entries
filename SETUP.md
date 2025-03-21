# Journal Entries Application - Setup Documentation

This guide will help you set up and run the Journal Entries application locally.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **Git** (for cloning the repository)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/journal-entries.git
cd journal-entries
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory with the following variables:

```
# Database
DATABASE_URL="file:./dev.db"

# Authentication
AUTH_SECRET="your-secret-key-at-least-32-chars-long"
NEXTAUTH_URL="http://localhost:3000"

# Optional: For production only
# DATABASE_URL="your-production-database-url"
```

Notes:
- `AUTH_SECRET` should be a secure random string (min 32 characters)
- The default database is SQLite which requires no additional setup

### 4. Database Setup

Initialize and seed the database:

```bash
# Generate Prisma client
npx prisma generate

# Create database and run migrations
npx prisma migrate dev

# Seed the database with initial data
npx prisma db seed
```

This will create:
- An admin user (email: `admin@example.com`, password: `password123`)
- A regular user (email: `user@example.com`, password: `password123`)
- Sample categories and tags

### 5. Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Database Schema

The application uses Prisma ORM with a SQLite database (by default). The schema is defined in `prisma/schema.prisma`.

### Core Models:

- **User**: Application users with role-based access
- **Journal**: Journal entries with content and metadata
- **Category**: Journal categories for organization
- **Tag**: Tags for filtering and organizing journals
- **UserSettings**: User preferences like theme settings

## Folder Structure

```
journal-entries/
├── prisma/                # Database schema and migrations
├── public/                # Static assets
├── src/
│   ├── app/               # Next.js application routes
│   │   ├── api/           # API routes
│   │   ├── dashboard/     # Dashboard pages
│   │   ├── login/         # Authentication pages
│   │   └── register/
│   ├── components/        # Reusable React components
│   ├── lib/               # Utility functions and shared code
│   └── providers/         # Context providers
├── .env                   # Environment variables
├── package.json           # Project dependencies
└── next.config.js         # Next.js configuration
```

## Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm start`: Start the production server
- `npm run lint`: Run ESLint to check code quality
- `npm run prisma:studio`: Open Prisma Studio to view/edit database

## Testing Accounts

After seeding the database, you can log in with the following accounts:

1. **Admin User**
   - Email: `admin@example.com`
   - Password: `password123`
   - Has full access to all features including user management

2. **Regular User**
   - Email: `user@example.com`
   - Password: `password123`
   - Has standard user permissions

## Troubleshooting

### Common Issues

1. **Database connection errors**:
   - Verify your DATABASE_URL in the .env file
   - Ensure you've run the Prisma migrations

2. **Authentication failures**:
   - Check that AUTH_SECRET is properly set in your .env file
   - Verify NEXTAUTH_URL matches your development URL

3. **Missing database tables**:
   - Run `npx prisma migrate reset` to reset and recreate the database

4. **Node.js version issues**:
   - Upgrade to Node.js v18+ if you encounter compatibility issues

### Getting Help

If you encounter issues not covered in this guide, please:
1. Check the GitHub repository issues section
2. Create a new issue with detailed reproduction steps

## Deployment

For production deployment:

1. Update the `.env` file with production values
2. Build the application: `npm run build`
3. Start the server: `npm start`

For cloud providers like Vercel or Netlify, follow their specific deployment guides for Next.js applications.

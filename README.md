# Journal Entries Application

A modern web application for personal journaling with AI-powered insights, built with Next.js 15.2.3 and TypeScript.

![Journal Entries App](https://example.com/screenshot.png)

## Features

- **User Authentication**: Secure login and registration with role-based access control
- **Journal Management**: Create, edit, view, and delete personal journal entries
- **Categories & Tags**: Organize entries with customizable categories and tags
- **Dashboard**: Visual overview of journal activity and mood trends
- **Theme Support**: Light and dark mode with dynamic switching
- **Admin Panel**: User management for administrators
- **Responsive Design**: Mobile-friendly interface
- **API Backend**: RESTful API for all functionality

## Technology Stack

- **Frontend**: React 19, Next.js 15.2.3, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (development), can be configured for PostgreSQL/MySQL
- **Authentication**: NextAuth.js with JWT
- **Form Handling**: React Hook Form, Zod validation
- **UI Components**: Custom components with Tailwind
- **Notifications**: React Hot Toast
- **Data Visualization**: Chart.js

## Documentation

This repository includes comprehensive documentation:

- [System Design Document](./SYSTEM_DESIGN.md): Architecture, component structure, data models
- [Setup Documentation](./SETUP.md): Installation, configuration, and environment setup
- [API Documentation](./API_DOCUMENTATION.md): Endpoints, request/response formats, authentication

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/journal-entries.git
cd journal-entries

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up the database
npx prisma migrate dev
npx prisma db seed

# Start the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Screenshots

### Dashboard
![Dashboard](https://example.com/dashboard.png)

### Journal Entry
![Journal Entry](https://example.com/journal.png)

### Admin Panel
![Admin Panel](https://example.com/admin.png)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

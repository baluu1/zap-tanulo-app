# Overview

ZAP is a modern Hungarian learning platform that combines flashcard-based study, AI-powered content processing, focus modes, and progress tracking. The application is designed as a full-stack web application with a React frontend and Express backend, targeted specifically at Hungarian students with all UI text in Hungarian.

The platform provides core features including manual and AI-generated flashcard creation, spaced repetition algorithms, Pomodoro-style focus sessions with XP rewards, AI chat assistance, and comprehensive progress tracking. The application emphasizes a clean, minimalist design with customizable themes and accent colors.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **Routing**: Client-side routing using Wouter for lightweight navigation
- **State Management**: Zustand with persistence for global application state
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **UI Components**: Radix UI primitives for accessible, unstyled components with custom styling
- **Theme System**: Light/dark mode toggle with customizable accent colors and CSS custom properties

## Backend Architecture
- **Runtime**: Node.js with Express server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with consistent JSON responses
- **Storage Strategy**: Abstracted storage interface allowing easy migration from in-memory to database
- **Current Storage**: In-memory storage for development, designed for easy PostgreSQL migration
- **Build Process**: ESBuild for server bundling, separate from Vite client build

## Data Architecture
- **Schema Definition**: Drizzle ORM with shared schema types between client and server
- **Database Ready**: PostgreSQL schema defined but currently using memory storage
- **Type Safety**: Full TypeScript coverage with Zod validation for API boundaries
- **Data Models**: Users, Materials, Decks, Flashcards, Study Sessions, and Settings entities

## Authentication and Authorization
- **Current State**: Basic demo user system for development
- **Prepared Infrastructure**: User schema and session handling ready for implementation
- **Session Management**: Cookie-based sessions with connect-pg-simple for PostgreSQL

## External Dependencies

### Core Development Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type safety across the entire application
- **Tailwind CSS**: Utility-first CSS framework
- **Drizzle ORM**: Type-safe database toolkit for PostgreSQL

### UI and Component Libraries
- **Radix UI**: Comprehensive set of accessible UI primitives
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form**: Form handling and validation
- **TanStack Query**: Data fetching and caching for API calls

### State Management and Utilities
- **Zustand**: Lightweight state management with persistence
- **Date-fns**: Date manipulation and formatting utilities
- **Class Variance Authority**: Type-safe CSS class composition
- **CLSX**: Conditional className utility

### Database and Storage
- **@neondatabase/serverless**: PostgreSQL connection for serverless environments
- **Drizzle Kit**: Database migrations and schema management
- **Connect-pg-simple**: PostgreSQL session store for Express

### AI Integration
- **OpenAI API**: GPT-5 integration for content summarization, flashcard generation, and chat
- **Configurable Keys**: User-provided API keys stored in settings, never hardcoded
- **Service Abstraction**: Centralized OpenAI service for consistent API usage

### Development and Deployment
- **@replit/vite-plugins**: Replit-specific development tools and error handling
- **ESBuild**: Fast server-side bundling for production builds
- **PostCSS**: CSS processing with Tailwind integration

### Specialized Features
- **Spaced Repetition**: Custom SM-2 based algorithm for flashcard scheduling
- **Focus Detection**: Browser API integration for Pomodoro session monitoring
- **File Processing**: Prepared infrastructure for PDF and image OCR (placeholder functions)
- **Hungarian Localization**: All UI text and user-facing content in Hungarian language
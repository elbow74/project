# Calendar Assistant - Next.js Application

A modern calendar scheduling application built with Next.js 14+ App Router, TypeScript, and Tailwind CSS. This application provides a clean interface for managing calendar events, groups, and scheduling coordination.

## 🏗️ Framework & Architecture

### Tech Stack

- **Next.js 14+** - App Router with TypeScript
- **React 19** - Client-side components and hooks
- **Tailwind CSS v4** - Modern utility-first styling
- **TypeScript** - Full type safety throughout
- **Local Storage** - Client-side data persistence
- **Sonner** - Toast notifications
- **Radix UI** - Accessible component primitives

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Home page (redirects to dashboard)
│   ├── globals.css        # Global styles and Tailwind imports
│   └── (app)/             # Route group for main app
│       ├── layout.tsx     # App layout with sidebar navigation
│       ├── dashboard/     # Dashboard page
│       ├── calendar/      # Calendar view page
│       ├── groups/       # Groups management page
│       └── ai-assistant/ # AI assistant page
├── components/            # Reusable UI components
│   └── ui/               # Base UI components
│       ├── button.tsx    # Button component
│       └── sonner.tsx   # Toast notifications
├── state/                # State management
│   └── AppStateContext.tsx # React Context for global state
├── types.ts              # TypeScript type definitions
├── utils/                # Utility functions
│   └── storage.ts        # Local storage helpers
└── lib/                  # Library utilities
    └── cn.ts            # Class name utility
```

## 📱 Page Structure & Navigation

### Navigation Flow

The application uses a **persistent sidebar navigation** that remains visible across all pages:

```
┌─────────────────────────────────────────┐
│  Calendar App                           │
├─────────────────────────────────────────┤
│  📊 Dashboard                           │
│  📅 Calendar                            │
│  👥 Groups                              │
│  🤖 AI Assistant                        │
└─────────────────────────────────────────┘
```

### Page Descriptions

#### 1. **Dashboard** (`/dashboard`)

- **Purpose**: Main landing page with overview and quick actions
- **Features**:
  - Statistics cards showing Users, Events, and Groups count
  - Calendar link status indicator
  - Quick action buttons for creating groups/events
- **Data**: Displays aggregated stats from global state

#### 2. **Calendar** (`/calendar`)

- **Purpose**: Personal calendar view for managing availability
- **Features**:
  - Event display (currently shows JSON for demo)
  - Placeholder for interactive calendar component
  - Integration point for Google Calendar sync
- **Data**: Shows user's events and availability

#### 3. **Groups** (`/groups`)

- **Purpose**: Group management and member coordination
- **Features**:
  - List of all groups with member counts
  - "New Group" button for creating groups
  - Member management interface
- **Data**: Displays groups and their members

#### 4. **AI Assistant** (`/ai-assistant`)

- **Purpose**: AI-powered scheduling assistance
- **Features**:
  - Placeholder for AI chat interface
  - "Open Assistant" button for future AI integration
  - Ready for Gemini AI or other AI service integration
- **Data**: Prepared for AI message history

## 🔄 Data Flow & State Management

### State Architecture

The application uses **React Context** for global state management with the following data structure:

```typescript
interface AppState {
  users: User[]; // All users in the system
  events: Event[]; // Calendar events
  groups: Group[]; // Scheduling groups
  availability: Availability[]; // User availability slots
  linkStatus: boolean; // Calendar integration status
}
```

### Data Flow

1. **Initialization**: Demo data loaded from `AppStateContext.tsx`
2. **Persistence**: All state changes saved to localStorage via `storage.ts`
3. **Updates**: State updates trigger re-renders across all components
4. **Sharing**: State shared via `useAppState()` hook throughout the app

### Data Types

```typescript
User: { id, name, email }
Group: { id, name, members[] }
Event: { id, title, start, end, attendees[] }
TimeSlot: { start, end }
Availability: { userId, slots[] }
```

## 🎨 Design System

### Visual Style

- **Color Palette**: Light pastels and neutrals (soft blues, grays, whites)
- **Typography**: Clean, modern fonts with proper hierarchy
- **Spacing**: Generous whitespace and consistent padding
- **Components**: Rounded corners, subtle shadows, smooth transitions

### Responsive Design

- **Desktop**: Persistent sidebar with main content area
- **Mobile**: Responsive layouts (ready for hamburger menu)
- **Grid System**: CSS Grid and Flexbox for layouts

### Component Library

- **Button**: Reusable button with variants (default, outline)
- **Toast**: Notification system via Sonner
- **Layout**: Consistent spacing and typography utilities

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Development Server

The application runs on `http://localhost:3000` with:

- Hot reloading for development
- TypeScript compilation
- Tailwind CSS processing
- Automatic route generation

## 🔧 Configuration

### TypeScript

- Path aliases configured (`@/*` → `src/*`)
- Strict type checking enabled
- Next.js TypeScript plugin

### Tailwind CSS

- Custom color variables defined
- Responsive breakpoints configured
- Dark mode support ready

### Next.js

- App Router enabled
- Webpack configuration optimized
- Static generation ready

## 📋 Current Features

### ✅ Implemented

- [x] Responsive sidebar navigation
- [x] Dashboard with statistics
- [x] Basic calendar view
- [x] Groups management
- [x] AI assistant placeholder
- [x] Local storage persistence
- [x] Toast notifications
- [x] TypeScript type safety
- [x] Tailwind CSS styling

### 🚧 Ready for Enhancement

- [ ] Interactive calendar component
- [ ] Google Calendar integration
- [ ] AI chat interface
- [ ] Group creation forms
- [ ] Event management
- [ ] User authentication
- [ ] Real-time updates

## 🔮 Future Enhancements

### Phase 1: Core Features

- Interactive calendar with drag-to-select
- Group creation and management forms
- Event scheduling interface

### Phase 2: Integrations

- Google Calendar API integration
- Real-time collaboration
- Email notifications

### Phase 3: AI Features

- Gemini AI integration
- Natural language scheduling
- Smart meeting suggestions

## 📝 Development Notes

### Code Organization

- **Pages**: Route-based components in `app/` directory
- **Components**: Reusable UI components in `components/`
- **State**: Global state management in `state/`
- **Utils**: Helper functions in `utils/`
- **Types**: TypeScript definitions in `types.ts`

### Best Practices

- Use TypeScript for all components
- Follow Next.js App Router conventions
- Implement proper error boundaries
- Use semantic HTML elements
- Follow accessibility guidelines

### Performance

- Client-side state management
- Local storage for persistence
- Optimized bundle with Next.js
- Lazy loading ready for future features

---

This framework provides a solid foundation for building a comprehensive calendar scheduling application with modern web technologies and best practices.

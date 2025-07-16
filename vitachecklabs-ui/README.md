# VitaCheckLabs UI

A React TypeScript application for VitaCheckLabs - a healthcare diagnostics platform.

## Features

- **Modern React Setup**: Built with React 18 and TypeScript
- **Material-UI Design**: Professional healthcare-themed UI components
- **Routing**: React Router v6 for navigation between tabs
- **Testing**: Vitest and React Testing Library for comprehensive testing
- **Three Main Sections**:
  - **Lab Tests**: Browse and book laboratory tests
  - **Reports**: View and manage lab test reports
  - **About**: Company information and contact details

## Technology Stack

- **React 18** with TypeScript
- **Material-UI (MUI)** for UI components
- **React Router v6** for navigation
- **Vite** for build tool
- **Vitest** for testing
- **Axios** for API calls (ready for backend integration)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.tsx      # Main navigation header
│   └── Header.test.tsx # Header component tests
├── pages/              # Page components
│   ├── LabTests.tsx    # Lab tests page
│   ├── Reports.tsx     # Reports page
│   ├── About.tsx       # About page
│   └── *.test.tsx      # Page component tests
├── services/           # API service layers (ready for backend)
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── styles/             # Theme and styling
│   └── theme.ts        # MUI theme configuration
└── test/               # Test setup and utilities
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Development Notes

- The application follows Material-UI design principles
- Healthcare-themed color palette with professional styling
- Mobile-first responsive design
- Comprehensive test coverage for all components
- Ready for backend API integration

## Backend Integration

The application is structured to easily integrate with the VitaCheckLabs backend API:

- Service layer ready for API calls
- Type definitions for all data models
- Error handling structure in place
- Authentication context prepared

## Testing

Tests are written using Vitest and React Testing Library:

- Component rendering tests
- Navigation functionality tests
- UI interaction tests
- Accessibility considerations

## Future Enhancements

- User authentication and authorization
- Real-time data integration
- Advanced filtering and search
- Report upload and download functionality
- Booking system integration

# AWAKE Connect - Student Sponsorship Platform

A comprehensive platform connecting donors with students in Pakistan who need educational funding. Built with React frontend and Node.js + Express + PostgreSQL backend.

## Features

- **HashRouter Support**: Works with static hosting (/#/marketplace, /#/students/1, etc.)
- **Whole-Student Sponsorship Model**: No partial funding bars, clean sponsor-student matching
- **Modern UI**: Emerald/slate design system with shadcn/ui components
- **Mock Data with API Ready**: Fallback to mock data when backend is unavailable
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## Project Structure

```
src/
├── api/
│   ├── client.js          # Axios instance with baseURL config
│   └── endpoints.js       # API functions with mock fallbacks
├── components/
│   ├── layout/
│   │   └── Header.jsx     # Main navigation
│   └── ui/                # shadcn/ui components (JS versions)
├── data/
│   └── mockData.js        # Mock data for development
├── hooks/
│   └── use-toast.js       # Toast notification hook
├── pages/                 # All page components
└── lib/
    └── utils.js           # Utility functions
```

## Quick Start

### Option 1: Quick Setup (Recommended for New Developers)

1. **Run the quick setup script**:
   ```bash
   cd database
   bash quick_setup.sh  # Linux/Mac
   # or
   # Run quick_setup.sh in Git Bash on Windows
   ```
   
   This will:
   - Check prerequisites (PostgreSQL, Node.js)
   - Create the database
   - Install dependencies
   - Run migrations and seed data
   - Create environment files

2. **Start the servers**:
   ```bash
   # Backend (in one terminal)
   cd server && npm run dev
   
   # Frontend (in another terminal)
   npm run dev
   ```

### Option 2: Manual Setup

1. **Install dependencies**:
   ```bash
   npm install
   cd server && npm install
   ```

2. **Setup database** (see [Database Setup](#database-setup)):
   ```bash
   createdb donors_dev
   cd server
   npx prisma migrate deploy
   npm run seed
   ```

3. **Configure environment**:
   - Copy `server/.env.example` to `server/.env`
   - Update database credentials

4. **Run development servers**:
   ```bash
   # Backend
   cd server && npm run dev
   
   # Frontend  
   npm run dev
   ```
   
   Open [http://localhost:8080](http://localhost:8080) in your browser.

5. **Build for production**:
   ```bash
   npm run build
   ```

## Database Setup

The project uses PostgreSQL with Prisma ORM. Database utilities are located in the `database/` directory.

### Quick Database Setup

```bash
# Quick setup for new developers
cd database
bash quick_setup.sh  # Linux/Mac
# or use Git Bash on Windows
```

### Manual Database Setup

1. **Create database**:
   ```bash
   createdb donors_dev
   ```

2. **Run migrations**:
   ```bash
   cd server
   npx prisma migrate deploy
   npx prisma generate
   ```

3. **Seed with sample data**:
   ```bash
   npm run seed
   ```

### Database Management Commands

```bash
# Export database (for sharing with team)
cd database
./export_database.sh      # Linux/Mac
export_database.bat       # Windows

# Import database (for new developers)
./import_database.sh      # Linux/Mac  
import_database.bat       # Windows

# Reset database (fresh start)
./reset_database.sh       # Linux/Mac
powershell reset_database.ps1  # Windows
```

### Using with npm scripts

Add to your `server/package.json`:

```json
{
  "scripts": {
    "db:export": "cd ../database && bash export_database.sh",
    "db:import": "cd ../database && bash import_database.sh", 
    "db:reset": "cd ../database && bash reset_database.sh",
    "db:fresh": "npm run db:reset && npm run seed"
  }
}
```

## Configuration

### Environment Variables

**Frontend** - Create `.env` in root directory:
```env
# Optional: Backend API URL
VITE_API_URL=http://localhost:3001
# When not set, the app uses mock data
```

**Backend** - Create `server/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/donors_dev"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:8080"
```

### API Integration

The app is designed to work with or without a backend:

- **With Backend**: Set `VITE_API_URL` in `.env`
- **Without Backend**: Remove/comment out `VITE_API_URL` to use mock data

## Routes

All routes use HashRouter for static hosting compatibility:

- `/#/` - Landing page
- `/#/marketplace` - Browse students needing sponsorship  
- `/#/donor` - Donor dashboard
- `/#/preferences` - Donor preferences
- `/#/receipts` - Donation receipts
- `/#/apply` - Student application form
- `/#/admin` - Admin hub
- `/#/reports` - Analytics and reports
- `/#/matrix` - Sponsorship matrix
- `/#/update` - Student term updates
- `/#/students/:id` - Individual student detail

## Key Features

### Whole-Student Sponsorship Model
- Students display total need (USD)
- "Max I'll donate" filter for donors
- Single "Sponsor student" CTA (no partial funding)
- Status chips: "Sponsored" / "Repaying"

### Mock Data System
- Complete student profiles with realistic data
- Donor sponsorship history
- Application workflows
- Admin management features

### Modern Stack
- **React 18** (JavaScript, not TypeScript)
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for component library
- **React Query** for data fetching
- **Axios** for HTTP requests
- **React Router** with HashRouter

## Development

### Adding New Pages

1. Create component in `src/pages/`
2. Add route in `src/App.jsx`
3. Update navigation in `src/components/layout/Header.jsx`

### API Integration

Add new endpoints in `src/api/endpoints.js`:

```javascript
export const getNewData = async () => {
  if (!import.meta.env.VITE_API_URL) {
    // Return mock data
    return mockData.newData;
  }
  
  // Make API call
  const response = await apiClient.get('/new-data');
  return response.data;
};
```

### Styling

The project uses a consistent design system:
- **Colors**: Emerald primary, slate secondary
- **Borders**: Rounded corners (rounded-2xl)
- **Components**: shadcn/ui with custom variants
- **Layout**: Cards and lists with consistent spacing

## Deployment

Since the app uses HashRouter, it can be deployed to any static hosting service:

1. Build the project: `npm run build`
2. Upload the `dist/` folder to your hosting provider
3. No server-side routing configuration needed

## Next Steps

This frontend is ready for backend integration. The API client and endpoints are configured to switch between mock data and real API calls based on the `VITE_API_URL` environment variable.

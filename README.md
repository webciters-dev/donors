# AWAKE Connect - Student Sponsorship Platform

A modern React frontend for managing student sponsorships with donors and administrators.

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

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:8080](http://localhost:8080) in your browser.

3. **Build for production**:
   ```bash
   npm run build
   ```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Optional: Backend API URL
VITE_API_URL=http://localhost:3001

# When VITE_API_URL is not set, the app uses mock data
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

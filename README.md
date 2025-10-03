# 🚨 Cebu Emergency Relief Dashboard

A modern Next.js application for analyzing and visualizing emergency relief data with interactive charts, statistics, and real-time data from live API endpoints.

## ✨ Features

- **Live Data Integration**: Real-time data from Cebu emergency relief API with 3-minute caching
- **Interactive Dashboard**: Comprehensive statistics with visual charts and analytics
- **Advanced Search**: Search across all emergency fields with real-time filtering
- **Smart Pagination**: 100 records per page with intelligent navigation
- **Clickable Records**: Click any emergency to view full details in a modal
- **Data Analysis**:
  - Most requested needs analysis (food, water, shelter, medical, etc.)
  - Urgency level distribution (HIGH/MEDIUM/LOW with color coding)
  - Status tracking (pending, in-progress, resolved, cancelled)
  - People affected statistics with outlier filtering
- **Modern UI**: Beautiful glass morphism design with background images
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Performance Optimized**: Efficient caching, pagination, and data processing

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v18.17.0 or higher (v21 recommended)
- **npm**: v8.0.0 or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd emergency
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Open in Browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production Build
```bash
npm run build
npm run start
```

## 📁 Project Structure

```
emergency/
├── app/
│   ├── api/emergencies/route.ts    # API endpoint with 3-min caching
│   ├── globals.css                 # Global styles with Tailwind
│   ├── layout.tsx                  # Root layout with background image
│   └── page.tsx                    # Main dashboard with pagination
├── components/
│   └── ChartComponents.tsx         # Reusable chart components
├── types/
│   └── emergency.ts                # TypeScript type definitions
├── public/
│   └── background.png              # Background image for dashboard
├── .gitignore                      # Comprehensive git ignore rules
├── next.config.js                  # Next.js configuration
├── package.json                    # Dependencies and scripts
└── README.md                       # This file
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📊 Data Analysis

The dashboard analyzes live emergency relief data from the Cebu API to provide insights on:

- **Needs Analysis**: Most commonly requested necessities (food, water, shelter, medical, clothing, other)
- **Urgency Distribution**: Breakdown by HIGH/MEDIUM/LOW priority with color-coded indicators
- **Status Tracking**: Current status of emergency cases (pending, in-progress, resolved, cancelled)
- **People Impact**: Distribution by number of people affected with outlier filtering for realistic averages
- **Geographic Data**: Location-based emergency distribution with Google Maps integration
- **Contact Information**: Emergency contact numbers for direct response coordination
- **Real-time Updates**: Data refreshes every 3 minutes with cache status indicators

### Key Statistics Displayed:
- Total emergency cases (600+ active cases)
- Total people affected across all emergencies
- Average people per emergency (filtered for outliers)
- Pending cases requiring immediate attention

## 🎨 Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better development experience
- **Tailwind CSS** - Utility-first CSS framework
- **Chart.js** - Interactive charts and visualizations
- **React Chart.js 2** - React wrapper for Chart.js

## 🌐 Live Data Source

The application fetches real-time data from the Cebu Emergency Relief API:

**API Endpoint**: `https://calamity-response-app.onrender.com/api/emergencies`

### Data Features:
- **Real-time Updates**: Fresh data every 3 minutes
- **Intelligent Caching**: Prevents API overload while maintaining data freshness
- **Fallback Support**: Serves cached data if API is temporarily unavailable
- **Error Handling**: Graceful degradation with user-friendly error messages

### Data Structure:
```json
{
  "success": true,
  "count": 603,
  "data": [
    {
      "id": "uuid",
      "latitude": 11.1478855,
      "longitude": 123.9507801,
      "placename": "Daanlungsod, Medellin, Cebu, Central Visayas, 6012, Philippines",
      "contactno": "09050654717",
      "needs": ["food", "water", "shelter"],
      "urgencyLevel": "MEDIUM",
      "additionalNotes": "Detailed emergency description...",
      "numberOfPeople": 22,
      "status": "pending",
      "timestamp": "2025-10-03T01:27:42.973Z",
      "createdAt": "2025-10-03T01:27:43.092Z",
      "updatedAt": "2025-10-03T01:27:43.092Z"
    }
  ]
}
```

## 🎨 Customization

### Background Image
Replace `/public/background.png` with your custom background image:
- **Recommended size**: 1920x1080 or larger
- **Formats**: JPG, PNG, or WebP
- **File size**: Under 2MB for optimal loading

### API Configuration
The API endpoint can be modified in `/app/api/emergencies/route.ts`:
- **Cache duration**: Currently set to 3 minutes
- **Timeout settings**: 30-second API timeout
- **Error handling**: Configurable fallback behavior

## 🌐 Deployment

The application can be deployed to any platform that supports Next.js:

- **Vercel** (recommended): `vercel --prod`
- **Netlify**: Connect your GitHub repository
- **Railway**: One-click deployment
- **Self-hosted**: `npm run build && npm run start`

### Environment Requirements:
- **Node.js**: v18.17.0+ (v21 recommended)
- **Memory**: 512MB+ recommended
- **Storage**: Minimal (static files only)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Submit a pull request

## 📄 License

MIT License - feel free to use this project for your emergency response needs!

---

**Built with ❤️ for emergency response coordination in Cebu, Philippines**

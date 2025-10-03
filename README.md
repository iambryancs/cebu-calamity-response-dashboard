# 🚨 Emergency Data Dashboard

A modern Next.js application for analyzing and visualizing emergency response data with interactive charts and statistics.

## ✨ Features

- **Real-time Statistics**: Total emergencies, people affected, pending cases
- **Interactive Charts**: Bar charts, pie charts, and doughnut charts using Chart.js
- **Data Analysis**:
  - Most requested needs analysis
  - Urgency level distribution
  - Status tracking
  - Keyword extraction from notes
  - People affected distribution
  - Recent activity trends
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Type Safety**: Full TypeScript support

## 🚀 Quick Start

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```

3. **Open in Browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
emergency/
├── app/
│   ├── api/emergencies/route.ts    # API endpoint for emergency data
│   ├── globals.css                 # Global styles with Tailwind
│   ├── layout.tsx                  # Root layout component
│   └── page.tsx                    # Main dashboard page
├── components/
│   └── ChartComponents.tsx         # Reusable chart components
├── types/
│   └── emergency.ts                # TypeScript type definitions
├── public/
│   └── emergencies.json            # Emergency data file
└── package.json
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📊 Data Analysis

The dashboard analyzes your emergency data to provide insights on:

- **Needs Analysis**: Most commonly requested necessities
- **Urgency Distribution**: Breakdown by HIGH/MEDIUM/LOW priority
- **Status Tracking**: Current status of emergency cases
- **Keyword Extraction**: Common terms in additional notes
- **People Impact**: Distribution by number of people affected
- **Temporal Analysis**: Recent activity trends

## 🎨 Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better development experience
- **Tailwind CSS** - Utility-first CSS framework
- **Chart.js** - Interactive charts and visualizations
- **React Chart.js 2** - React wrapper for Chart.js

## 📝 Data Format

The application expects your emergency data in the following format:

```json
{
  "success": true,
  "count": 424,
  "data": [
    {
      "id": "uuid",
      "needs": ["food", "water", "shelter"],
      "urgencyLevel": "MEDIUM",
      "additionalNotes": "Description...",
      "numberOfPeople": 10,
      "status": "pending",
      "createdAt": "2025-10-03T00:29:18.228Z",
      // ... other fields
    }
  ]
}
```

## 🌐 Deployment

The application can be deployed to any platform that supports Next.js:

- **Vercel** (recommended): `vercel --prod`
- **Netlify**: Connect your GitHub repository
- **Docker**: Use the included Dockerfile
- **Self-hosted**: `npm run build && npm run start`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project for your emergency response needs!

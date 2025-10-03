import { NextResponse } from 'next/server';
import { EmergencyResponse } from '@/types/emergency';

// In-memory cache for API responses
let cachedData: EmergencyResponse | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes in milliseconds

export async function GET() {
  const now = Date.now();
  
  // Check if we have cached data and it's still fresh (within 3 minutes)
  if (cachedData && (now - lastFetchTime) < CACHE_DURATION) {
    console.log('Serving cached emergency data');
    return NextResponse.json({
      ...cachedData,
      cached: true,
      lastUpdated: new Date(lastFetchTime).toISOString(),
      nextUpdate: new Date(lastFetchTime + CACHE_DURATION).toISOString()
    });
  }

  try {
    console.log('Fetching fresh emergency data from API');
    
    // Fetch data from the live API endpoint
    const response = await fetch('https://calamity-response-app.onrender.com/api/emergencies', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Emergency-Dashboard/1.0'
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data: EmergencyResponse = await response.json();
    
    // Validate the response structure
    if (!data.success || !data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid API response structure');
    }

    // Update cache
    cachedData = data;
    lastFetchTime = now;

    console.log(`Successfully fetched ${data.count} emergency records`);

    return NextResponse.json({
      ...data,
      cached: false,
      lastUpdated: new Date(lastFetchTime).toISOString(),
      nextUpdate: new Date(lastFetchTime + CACHE_DURATION).toISOString()
    });

  } catch (error) {
    console.error('Error fetching emergency data from API:', error);
    
    // If we have cached data, serve it even if it's stale
    if (cachedData) {
      console.log('Serving stale cached data due to API error');
      return NextResponse.json({
        ...cachedData,
        cached: true,
        stale: true,
        lastUpdated: new Date(lastFetchTime).toISOString(),
        error: 'Using cached data due to API error'
      });
    }

    // No cached data available, return error
    return NextResponse.json(
      { 
        error: 'Failed to load emergency data from API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

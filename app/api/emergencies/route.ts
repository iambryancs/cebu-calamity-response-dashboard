import { NextResponse } from 'next/server';
import { EmergencyResponse } from '@/types/emergency';

// Force dynamic rendering to ensure we can use caching headers
export const dynamic = 'force-dynamic';

// In-memory cache for API responses (works within the same function instance)
let cachedData: EmergencyResponse | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes in milliseconds

export async function GET() {
  const now = Date.now();
  const timeSinceLastFetch = cachedData ? now - lastFetchTime : 0;
  
  // Check if we have cached data and it's still fresh (within 3 minutes)
  if (cachedData && timeSinceLastFetch < CACHE_DURATION) {
    console.log('Serving cached emergency data from memory');
    return NextResponse.json({
      ...cachedData,
      cached: true,
      lastUpdated: new Date(lastFetchTime).toISOString(),
      nextUpdate: new Date(lastFetchTime + CACHE_DURATION).toISOString(),
      cacheSource: 'memory',
      debug: {
        timeSinceLastFetch: Math.round(timeSinceLastFetch / 1000),
        cacheDuration: CACHE_DURATION / 1000,
        environment: process.env.VERCEL ? 'production' : 'development'
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=180, s-maxage=180',
        'CDN-Cache-Control': 'max-age=180',
        'Vercel-CDN-Cache-Control': 'max-age=180',
        'X-Cache-Status': 'HIT',
        'X-Debug-Info': 'memory-cached'
      }
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

    // Update cache (store only the core data, not the cache metadata)
    cachedData = {
      success: data.success,
      count: data.count,
      data: data.data
    };
    lastFetchTime = now;

    console.log(`Successfully fetched ${data.count} emergency records`);

    return NextResponse.json({
      ...data,
      cached: false,
      lastUpdated: new Date(lastFetchTime).toISOString(),
      nextUpdate: new Date(lastFetchTime + CACHE_DURATION).toISOString(),
      cacheSource: 'api',
      debug: {
        timeSinceLastFetch: Math.round(timeSinceLastFetch / 1000),
        cacheDuration: CACHE_DURATION / 1000,
        environment: process.env.VERCEL ? 'production' : 'development'
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=180, s-maxage=180',
        'CDN-Cache-Control': 'max-age=180',
        'Vercel-CDN-Cache-Control': 'max-age=180',
        'X-Cache-Status': 'MISS',
        'X-Debug-Info': 'fresh-api-call'
      }
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
        error: 'Using cached data due to API error',
        cacheSource: 'memory-stale'
      }, {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=60',
          'CDN-Cache-Control': 'max-age=60',
          'Vercel-CDN-Cache-Control': 'max-age=60'
        }
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

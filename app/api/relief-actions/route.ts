import { NextResponse } from 'next/server';
import { ReliefActionsResponse } from '@/types/emergency';

// Force dynamic rendering to ensure we can use caching headers
export const dynamic = 'force-dynamic';

// In-memory cache for relief actions data
let cachedReliefData: ReliefActionsResponse | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache for relief actions

// Function to fetch relief actions from upstream API
async function fetchReliefActionsFromAPI(): Promise<ReliefActionsResponse> {
  const reliefActionsApiUrl = process.env.RELIEF_ACTIONS_API;
  
  if (!reliefActionsApiUrl) {
    throw new Error('RELIEF_ACTIONS_API environment variable is not set');
  }

  const response = await fetch(reliefActionsApiUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Emergency-Dashboard/1.0'
    },
    signal: AbortSignal.timeout(30000) // 30 second timeout
  });

  if (!response.ok) {
    throw new Error(`Relief actions API responded with status: ${response.status}`);
  }

  const data: ReliefActionsResponse = await response.json();
  
  if (!data.success || !data.data || !Array.isArray(data.data)) {
    throw new Error('Invalid relief actions API response structure');
  }
  
  return data;
}

export async function GET() {
  const now = Date.now();
  const timeSinceLastFetch = cachedReliefData ? now - lastFetchTime : 0;
  
  // Check if we have cached data and it's still fresh
  if (cachedReliefData && timeSinceLastFetch < CACHE_DURATION) {
    return NextResponse.json({
      ...cachedReliefData,
      cached: true,
      lastUpdated: new Date(lastFetchTime).toISOString(),
      nextUpdate: new Date(lastFetchTime + CACHE_DURATION).toISOString(),
      cacheSource: 'memory',
    }, {
      headers: {
        'Cache-Control': 'public, max-age=600, s-maxage=600',
        'CDN-Cache-Control': 'max-age=600',
        'Vercel-CDN-Cache-Control': 'max-age=600',
        'X-Cache-Status': 'HIT',
      }
    });
  }

  // Fetch fresh data from API
  try {
    const data = await fetchReliefActionsFromAPI();
    
    // Update cache
    cachedReliefData = data;
    lastFetchTime = now;
    
    return NextResponse.json({
      ...data,
      cached: false,
      lastUpdated: new Date(lastFetchTime).toISOString(),
      nextUpdate: new Date(lastFetchTime + CACHE_DURATION).toISOString(),
      cacheSource: 'api',
    }, {
      headers: {
        'Cache-Control': 'public, max-age=600, s-maxage=600',
        'CDN-Cache-Control': 'max-age=600',
        'Vercel-CDN-Cache-Control': 'max-age=600',
        'X-Cache-Status': 'MISS'
      }
    });

  } catch (error) {
    // If we have stale cached data, serve that
    if (cachedReliefData) {
      return NextResponse.json({
        ...cachedReliefData,
        cached: true,
        stale: true,
        lastUpdated: new Date(lastFetchTime).toISOString(),
        error: 'Using stale cached data due to API error',
        cacheSource: 'memory-stale'
      }, {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=60',
          'CDN-Cache-Control': 'max-age=60',
          'Vercel-CDN-Cache-Control': 'max-age=60'
        }
      });
    }
    
    // No data available, return error
    return NextResponse.json(
      { 
        error: 'Failed to load relief actions data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

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

  console.log('🚀 Fetching relief actions from upstream API...');
  console.log(`📍 API URL: ${reliefActionsApiUrl}`);
  
  const response = await fetch(reliefActionsApiUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Emergency-Dashboard/1.0'
    },
    signal: AbortSignal.timeout(30000) // 30 second timeout
  });

  if (!response.ok) {
    console.error(`❌ Relief actions API error: ${response.status} ${response.statusText}`);
    throw new Error(`Relief actions API responded with status: ${response.status}`);
  }

  const data: ReliefActionsResponse = await response.json();
  
  if (!data.success || !data.data || !Array.isArray(data.data)) {
    console.error('❌ Invalid relief actions API response structure:', data);
    throw new Error('Invalid relief actions API response structure');
  }

  console.log(`✅ Relief actions API returned ${data.count} records`);
  
  // Debug: Show sample of relief actions data
  if (data.data.length > 0) {
    console.log('🔍 Sample relief action data:');
    const sample = data.data[0];
    console.log(`   • DonationID: ${sample.DonationID}`);
    console.log(`   • Donor: ${sample.DonorName} (${sample.DonorType})`);
    console.log(`   • Location: ${sample.LocationLat}, ${sample.LocationLong}`);
    console.log(`   • Items: ${sample.DonatedItems.join(', ')}`);
    console.log(`   • Status: ${sample.Status}`);
  }
  
  return data;
}

export async function GET() {
  const now = Date.now();
  const timeSinceLastFetch = cachedReliefData ? now - lastFetchTime : 0;
  
  // Check if we have cached data and it's still fresh
  if (cachedReliefData && timeSinceLastFetch < CACHE_DURATION) {
    console.log('Serving cached relief actions data from memory');
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
    console.log('Fetching fresh relief actions data from upstream API');
    const data = await fetchReliefActionsFromAPI();
    
    // Update cache
    cachedReliefData = data;
    lastFetchTime = now;

    console.log(`Successfully fetched ${data.count} relief action records from API`);
    
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
    console.error('Error fetching relief actions data:', error);
    
    // If we have stale cached data, serve that
    if (cachedReliefData) {
      console.log('Serving stale cached relief actions data due to API error');
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

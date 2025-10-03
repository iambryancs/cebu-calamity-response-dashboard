import { NextResponse } from 'next/server';
import { EmergencyResponse } from '@/types/emergency';
import * as vercelBlob from '@vercel/blob';

// Force dynamic rendering to ensure we can use caching headers
export const dynamic = 'force-dynamic';

// In-memory cache for API responses (works within the same function instance)
let cachedData: EmergencyResponse | null = null;
let lastFetchTime: number = 0;
let lastSuccessfulFetchTime: number = 0;
let isRetryingUpstream: boolean = false;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const RETRY_INTERVAL = 5 * 60 * 1000; // Retry upstream API every 5 minutes when it's down (since API can take 267s+)

// Function to update blob storage with fresh data
async function updateBlobStorage(data: EmergencyResponse): Promise<void> {
  try {
    console.log('📝 Updating blob storage with fresh emergency data...');
    const jsonData = JSON.stringify(data, null, 2);
    
    await vercelBlob.put('emergencies.json', jsonData, {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true,
    });
    
    console.log(`✅ Successfully updated blob storage with ${data.count} emergency records`);
  } catch (error) {
    console.error('❌ Error updating blob storage:', error);
    // Don't throw error - blob update failure shouldn't break the main flow
  }
}

// Function to fetch emergency data from Vercel Blob storage
async function fetchFromBlobStorage(): Promise<EmergencyResponse> {
  try {
    console.log('Fetching emergency data from Vercel Blob storage');
    
    // First check if the file exists and get its info
    const blobInfo = await vercelBlob.head('emergencies.json');
    console.log('Blob info:', blobInfo);
    
    // Use the downloadUrl directly from the blob info
    const downloadUrl = blobInfo.downloadUrl;
    console.log('Download URL:', downloadUrl);
    
    // Fetch the data from the download URL
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch blob data: ${response.status}`);
    }
    
    const data = await response.text();
    const emergencyData: EmergencyResponse = JSON.parse(data);
    
    if (!emergencyData.success || !emergencyData.data || !Array.isArray(emergencyData.data)) {
      throw new Error('Invalid data structure in blob storage');
    }
    
    console.log(`Successfully loaded ${emergencyData.count} emergency records from blob storage`);
    return emergencyData;
  } catch (error) {
    console.error('Error fetching from blob storage:', error);
    throw new Error('Failed to load emergency data from blob storage');
  }
}

// Function to fetch from upstream API
async function fetchFromUpstreamAPI(): Promise<EmergencyResponse> {
  const startTime = Date.now();
  console.log('🚀 Starting upstream API fetch (timeout: 5 minutes)...');
  
  const response = await fetch('https://calamity-response-app.onrender.com/api/emergencies', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Emergency-Dashboard/1.0'
    },
    signal: AbortSignal.timeout(300000) // 300 second timeout (5 minutes) to handle 267s+ responses
  });

  const fetchTime = Date.now() - startTime;
  console.log(`⏱️ Upstream API fetch completed in ${Math.round(fetchTime / 1000)}s`);

  if (!response.ok) {
    throw new Error(`API responded with status: ${response.status}`);
  }

  const data: EmergencyResponse = await response.json();
  
  if (!data.success || !data.data || !Array.isArray(data.data)) {
    throw new Error('Invalid API response structure');
  }

  console.log(`✅ Upstream API returned ${data.count} emergency records`);
  return data;
}

// Background retry function for upstream API
async function retryUpstreamAPI() {
  if (isRetryingUpstream) {
    console.log('⏳ Background retry already in progress, skipping...');
    return; // Already retrying
  }

  isRetryingUpstream = true;
  console.log('🔄 Starting background retry of upstream API (this may take up to 5 minutes)...');

  try {
    const data = await fetchFromUpstreamAPI();
    
    // Update cache with fresh data from upstream
    cachedData = {
      success: data.success,
      count: data.count,
      data: data.data
    };
    lastFetchTime = Date.now();
    lastSuccessfulFetchTime = lastFetchTime;
    
    console.log(`✅ Background retry successful! Updated cache with ${data.count} emergency records from upstream API`);
    
    // Update blob storage with fresh data
    await updateBlobStorage(data);
    
    isRetryingUpstream = false;
  } catch (error) {
    console.log('❌ Background retry failed, will retry again in 5 minutes:', error instanceof Error ? error.message : 'Unknown error');
    isRetryingUpstream = false;
    
    // Schedule another retry
    setTimeout(retryUpstreamAPI, RETRY_INTERVAL);
  }
}

export async function GET() {
  const now = Date.now();
  const timeSinceLastFetch = cachedData ? now - lastFetchTime : 0;
  
  // Check if we should retry upstream API in background
  const timeSinceLastSuccessfulFetch = now - lastSuccessfulFetchTime;
  if (cachedData && timeSinceLastSuccessfulFetch > RETRY_INTERVAL && !isRetryingUpstream) {
    console.log('Scheduling background retry of upstream API...');
    setTimeout(retryUpstreamAPI, 1000); // Retry after 1 second
  }

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

  // No fresh cache, try to get data from blob storage first (fast response)
  try {
    console.log('Fetching emergency data from Vercel Blob storage (fast response)');
    const blobData = await fetchFromBlobStorage();
    
    // Update cache with blob data
    cachedData = {
      success: blobData.success,
      count: blobData.count,
      data: blobData.data
    };
    lastFetchTime = now;
    
    // Start background fetch from upstream API
    console.log('🔄 Starting background fetch from upstream API (may take up to 5 minutes)...');
    setTimeout(async () => {
      try {
        const apiData = await fetchFromUpstreamAPI();
        console.log('✅ Background API fetch successful! Updating cache...');
        
        // Update cache with fresh API data
        cachedData = {
          success: apiData.success,
          count: apiData.count,
          data: apiData.data
        };
        lastFetchTime = Date.now();
        lastSuccessfulFetchTime = lastFetchTime;
        
        console.log(`✅ Cache updated with ${apiData.count} emergency records from upstream API`);
        
        // Update blob storage with fresh data
        await updateBlobStorage(apiData);
      } catch (error) {
        console.log('❌ Background API fetch failed, keeping blob data:', error instanceof Error ? error.message : 'Unknown error');
        // Schedule retry for later
        setTimeout(retryUpstreamAPI, RETRY_INTERVAL);
      }
    }, 2000); // Start background fetch after 2 seconds

    return NextResponse.json({
      ...blobData,
      cached: false,
      lastUpdated: new Date(lastFetchTime).toISOString(),
      nextUpdate: new Date(lastFetchTime + CACHE_DURATION).toISOString(),
      cacheSource: 'blob-primary',
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
        'X-Cache-Status': 'BLOB-PRIMARY'
      }
    });

  } catch (blobError) {
    console.error('Error fetching from blob storage:', blobError);
    
    // Blob storage failed, try upstream API directly
    try {
      console.log('Fetching fresh emergency data from API (fallback)');
      const data = await fetchFromUpstreamAPI();

      // Update cache with fresh data
      cachedData = {
        success: data.success,
        count: data.count,
        data: data.data
      };
      lastFetchTime = now;
      lastSuccessfulFetchTime = now;

      console.log(`Successfully fetched ${data.count} emergency records`);

      // Update blob storage with fresh data
      await updateBlobStorage(data);

      return NextResponse.json({
        ...data,
        cached: false,
        lastUpdated: new Date(lastFetchTime).toISOString(),
        nextUpdate: new Date(lastFetchTime + CACHE_DURATION).toISOString(),
        cacheSource: 'api-fallback',
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
          'X-Debug-Info': 'api-fallback'
        }
      });

    } catch (apiError) {
      console.error('Error fetching emergency data from API:', apiError);
      
      // If we have stale cached data, serve that
      if (cachedData) {
        console.log('Serving stale cached data due to API and blob errors');
        return NextResponse.json({
          ...cachedData,
          cached: true,
          stale: true,
          lastUpdated: new Date(lastFetchTime).toISOString(),
          error: 'Using stale cached data due to API and blob storage errors',
          cacheSource: 'memory-stale'
        }, {
          headers: {
            'Cache-Control': 'public, max-age=60, s-maxage=60',
            'CDN-Cache-Control': 'max-age=60',
            'Vercel-CDN-Cache-Control': 'max-age=60'
          }
        });
      }
      
      // No data available from any source, return error
      return NextResponse.json(
        { 
          error: 'Failed to load emergency data from API and blob storage',
          details: {
            apiError: apiError instanceof Error ? apiError.message : 'Unknown API error',
            blobError: blobError instanceof Error ? blobError.message : 'Unknown blob error'
          }
        },
        { status: 500 }
      );
    }
  }
}

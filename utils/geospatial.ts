/**
 * Calculate the distance between two points on Earth using the Haversine formula
 * @param lat1 Latitude of first point in degrees
 * @param lon1 Longitude of first point in degrees
 * @param lat2 Latitude of second point in degrees
 * @param lon2 Longitude of second point in degrees
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Convert degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if two points are within a specified distance
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @param maxDistance Maximum distance in kilometers
 * @returns True if points are within the specified distance
 */
export function isWithinDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  maxDistance: number
): boolean {
  const distance = calculateHaversineDistance(lat1, lon1, lat2, lon2);
  return distance <= maxDistance;
}

/**
 * Find the closest relief action to an emergency location
 * @param emergencyLat Emergency latitude
 * @param emergencyLon Emergency longitude
 * @param reliefActions Array of relief actions
 * @param maxDistance Maximum distance to consider (in kilometers)
 * @returns Closest relief action within maxDistance, or null if none found
 */
export function findClosestReliefAction(
  emergencyLat: number,
  emergencyLon: number,
  reliefActions: Array<{ LocationLat: string; LocationLong: string; [key: string]: any }>,
  maxDistance: number = 1 // Default 1km radius
): { reliefAction: any; distance: number } | null {
  let closestReliefAction = null;
  let minDistance = Infinity;
  let validReliefActions = 0;
  let invalidCoordinates = 0;

  for (const reliefAction of reliefActions) {
    const reliefLat = parseFloat(reliefAction.LocationLat);
    const reliefLon = parseFloat(reliefAction.LocationLong);
    
    // Skip invalid coordinates
    if (isNaN(reliefLat) || isNaN(reliefLon)) {
      invalidCoordinates++;
      continue;
    }

    validReliefActions++;
    const distance = calculateHaversineDistance(
      emergencyLat,
      emergencyLon,
      reliefLat,
      reliefLon
    );

    if (distance <= maxDistance && distance < minDistance) {
      minDistance = distance;
      closestReliefAction = reliefAction;
    }
  }


  return closestReliefAction ? { reliefAction: closestReliefAction, distance: minDistance } : null;
}

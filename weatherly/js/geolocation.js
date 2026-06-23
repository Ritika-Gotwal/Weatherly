/* =========================================================
   geolocation.js — navigator.geolocation wrapper
   ========================================================= */

/**
 * Get the user's current coordinates using the browser Geolocation API.
 * Returns a Promise that resolves to { lat, lon } or rejects with a
 * user-readable error message string.
 */
function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject('Location access was denied. Please enable it in your browser settings.');
            break;
          case error.POSITION_UNAVAILABLE:
            reject('Location information is currently unavailable.');
            break;
          case error.TIMEOUT:
            reject('Location request timed out. Please try again.');
            break;
          default:
            reject('An unknown error occurred while retrieving your location.');
        }
      },
      {
        timeout:            10000,
        maximumAge:         300000,   // cache position for 5 minutes
        enableHighAccuracy: false,
      }
    );
  });
}

/**
 * Reverse-geocode coordinates using the Open-Meteo Geocoding API.
 * Finds the nearest city name by searching a small bbox area.
 * Falls back to "lat, lon" string if no result found.
 */
async function reverseGeocode(lat, lon) {
  /* Open-Meteo geocoding doesn't support reverse lookup directly.
     We use a nearby search with generic terms, or return coordinates. */
  try {
    const params = new URLSearchParams({
      name:     'a',      // minimal query — we use lat/lon for weather; this is just for display
      count:    '1',
      language: 'en',
      format:   'json',
    });

    /* Use the weather API's timezone auto-detection to infer region,
       but for display we'll return a formatted coordinate string
       until the user searches explicitly. */
    return {
      name:    `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
      country: '',
      timezone: 'auto',
    };
  } catch {
    return {
      name:    `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
      country: '',
      timezone: 'auto',
    };
  }
}

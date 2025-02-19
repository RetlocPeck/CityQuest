import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import * as turf from '@turf/turf'; // For buffering and creating bezier curves
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import fogTextureImage from '../images/fogTexture.png';

import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';

// Mapbox access token
const mapboxAccessToken = import.meta.env.VITE_MAPBOX_API_KEY!;
mapboxgl.accessToken = mapboxAccessToken;

interface MapboxMapProps {
  location: string | [number, number];
}

// Helper: Calculate distance (in meters) between two coordinates
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Earth radius in meters
  const phi_1 = (lat1 * Math.PI) / 180;
  const phi_2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi_1) * Math.cos(phi_2) * Math.sin(deltaLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Helper: Round coordinate to 4 decimals (≈11m resolution)
const roundCoordinate = (coord: number) => Number(coord.toFixed(4));

/**
 * Instead of using "visitedLocations", we now use "activePath".
 * Every time a new coordinate is available, we add it to the current session’s
 * activePath. (We also do a reverse geocode lookup for optional city/state info.)
 */
const saveVisitedLocation = async (longitude: number, latitude: number) => {
  // Get the active path from localStorage
  let activePath: any[] = [];
  try {
    activePath = JSON.parse(localStorage.getItem('activePath') || '[]');
  } catch (e) {
    activePath = [];
  }

  // Prevent duplicate entries
  const exists = activePath.some(
    (loc) => loc.longitude === longitude && loc.latitude === latitude
  );
  if (!exists) {
    // (Optional) Reverse geocode to get city and state
    let city = "";
    let state = "";
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxAccessToken}&types=place,region`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.features && Array.isArray(data.features)) {
        for (const feature of data.features) {
          if (feature.place_type && feature.place_type.includes("place") && !city) {
            city = feature.text;
          }
          if (feature.place_type && feature.place_type.includes("region") && !state) {
            state = feature.text;
          }
          if (city && state) break;
        }
      }
    } catch (err) {
      console.error("Error during reverse geocoding", err);
    }
    const newEntry = {
      longitude,
      latitude,
      city,
      state,
      timestamp: new Date().toISOString(),
    };
    activePath.push(newEntry);
    localStorage.setItem('activePath', JSON.stringify(activePath));
    console.log('Active path updated:', newEntry);
  }
};

/**
 * Generates the fog geometry by starting with an outer polygon covering the world
 * and then subtracting (difference) the buffered geometries of:
 *   a) Every previously saved session (from "savedPaths")
 *   b) The current active session (from "activePath")
 *
 * For each session:
 * - If only one point exists, we create a 100m circle.
 * - If at least two points exist, we form a line (sorted by timestamp), smooth it
 *   using turf.bezierSpline(), and then buffer it by 100m.
 */
const generateFogGeometry = (): FeatureCollection<Polygon | MultiPolygon> => {
  // 1. Outer polygon covering the entire world.
  const outerRing = [
    [-180, 90],   // top-left
    [180, 90],    // top-right
    [180, -90],   // bottom-right
    [-180, -90],  // bottom-left
    [-180, 90]    // close ring
  ];
  let fogGeometry: Feature<Polygon | MultiPolygon> = turf.polygon([outerRing]);

  // 2. Retrieve saved session paths (each is a buffered feature) from localStorage.
  let savedPaths: any[] = [];
  try {
    savedPaths = JSON.parse(localStorage.getItem('savedPaths') || '[]');
  } catch (e) {
    savedPaths = [];
  }
  savedPaths.forEach((feature: any) => {
    const diff = turf.difference(turf.featureCollection([fogGeometry, feature]));
    if (diff) {
      fogGeometry = diff;
    }
  });

  // 3. Retrieve the active session path.
  let activePath: any[] = [];
  try {
    activePath = JSON.parse(localStorage.getItem('activePath') || '[]');
  } catch (e) {
    activePath = [];
  }
  if (activePath.length > 0) {
    // Sort by timestamp so the line is in the correct order.
    activePath.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    let bufferedFeature: Feature<Polygon | MultiPolygon> | undefined;
    if (activePath.length === 1) {
      // Only one coordinate: create a 100m circle.
      const pt = turf.point([activePath[0].longitude, activePath[0].latitude]);
      bufferedFeature = turf.buffer(pt, 0.01, { units: 'kilometers' });
    } else {
      // Two or more coordinates: create a line, smooth with a Bezier, then buffer by 100m.
      const lineCoords = activePath.map((loc) => [loc.longitude, loc.latitude]);
      const line = turf.lineString(lineCoords);
      const bezierLine = turf.bezierSpline(line);
      bufferedFeature = turf.buffer(bezierLine, 0.01, { units: 'kilometers' });
    }

    if (bufferedFeature) {
      const diff = turf.difference(
        turf.featureCollection([fogGeometry, bufferedFeature])
      );
      if (diff) {
        fogGeometry = diff;
      }
    }
  }

  // Always return the resulting fog geometry.
  return turf.featureCollection([fogGeometry]);
};

/**
 * loadFogOverlay: Removes any existing fog layer/source and then adds the updated
 * fog overlay using the geometry generated from saved paths and the current active path.
 */
const loadFogOverlay = (map: mapboxgl.Map) => {
  // Remove existing fog layer and source, if they exist.
  if (map.getLayer('fog-layer')) {
    map.removeLayer('fog-layer');
  }
  if (map.getSource('fog')) {
    map.removeSource('fog');
  }

  const fogData = generateFogGeometry();
  map.addSource('fog', {
    type: 'geojson',
    data: fogData,
  });
  map.addLayer({
    id: 'fog-layer',
    type: 'fill',
    source: 'fog',
    paint: {
      'fill-pattern': 'fogTexture', // Alternatively, you can test with a solid fill color.
      'fill-opacity': 0.8,
    },
  });

  console.log('Fog overlay refreshed.');
};

export const MapboxMap: React.FC<MapboxMapProps> = ({ location }) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const previousLatitude = useRef<number | null>(null);
  const previousLongitude = useRef<number | null>(null);
  const [distanceTraveled, setDistanceTraveled] = useState(0);

  useEffect(() => {
    // 1. Create the map.
    const map = new mapboxgl.Map({
      container: mapContainer.current as HTMLElement,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-97.4395, 35.2226], // Norman, OK
      zoom: 16,
      pitch: 40,
      bearing: 0,
      attributionControl: false,
    });
    map.on('load', () => {
      map.resize(); // Ensure the map fits its container.
    });

    // 2. Create and add the user marker.
    const userMarkerEl = document.createElement('div');
    userMarkerEl.className = 'user-marker';
    userMarkerEl.style.width = '30px';
    userMarkerEl.style.height = '30px';
    userMarkerEl.style.backgroundColor = '#007cbf';
    userMarkerEl.style.borderRadius = '50%';
    userMarkerEl.style.border = '2px solid white';
    userMarkerEl.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';
    const userMarker = new mapboxgl.Marker({ element: userMarkerEl })
      .setLngLat([-97.4395, 35.2226])
      .addTo(map);

    // 3. Load the fog texture and initial fog overlay.
    map.on('load', () => {
      map.loadImage(fogTextureImage, (imgError, image) => {
        if (imgError) {
          console.error('Error loading fog texture:', imgError);
          return;
        }
        if (image && !map.hasImage('fogTexture')) {
          map.addImage('fogTexture', image);
        }
        loadFogOverlay(map);
      });
    });

    // 4. Geolocation callback: update marker, map, save location, update fog, and update distance.
    const handlePositionUpdate = async (position: GeolocationPosition) => {
      const rawLon = position.coords.longitude;
      const rawLat = position.coords.latitude;
      const lon = roundCoordinate(rawLon);
      const lat = roundCoordinate(rawLat);

      console.log('User location:', lat, lon);
      map.setCenter([rawLon, rawLat]);
      userMarker.setLngLat([rawLon, rawLat]);

      // If previous coordinates exist, calculate the traveled distance and update Firestore.
      if (previousLatitude.current !== null && previousLongitude.current !== null) {
        console.log('Previous location:', previousLatitude.current, previousLongitude.current);
        const distance = calculateDistance(
          previousLatitude.current,
          previousLongitude.current,
          rawLat,
          rawLon
        );
        console.log('Distance traveled:', distance);

        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          const db = getFirestore();
          const userDocRef = doc(db, 'users', user.uid);
          try {
            const userData = await getDoc(userDocRef);
            if (userData.exists()) {
              const currentDistance = userData.data().distanceTravelled || 0;
              const newDistance = currentDistance + distance;
              setDistanceTraveled(newDistance);
              await updateDoc(userDocRef, {
                distanceTravelled: newDistance,
              });
              console.log('Distance updated in Firestore:', newDistance);
            } else {
              console.warn('User document does not exist.');
            }
          } catch (error) {
            console.error('Error updating distance in Firestore:', error);
          }
        } else {
          console.warn('No authenticated user found.');
        }
      }

      // Update previous coordinates.
      previousLatitude.current = rawLat;
      previousLongitude.current = rawLon;

      // Fly to the new location.
      map.flyTo({
        center: [lon, lat],
        zoom: 16,
        pitch: 40,
        bearing: 0,
      });

      // Save the new coordinate to the active session path and update the fog overlay.
      saveVisitedLocation(lon, lat);
      loadFogOverlay(map);
    };

    // 5. Geolocation error callback.
    const handlePositionError = (geoError: GeolocationPositionError) => {
      console.error('Geolocation error:', geoError);
      setError('Error retrieving location.');
    };

    // 6. Start watching the user’s position.
    let watchId: number | null = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(handlePositionUpdate, handlePositionError, {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      });
    } else {
      setError('Geolocation is not supported by this browser.');
    }

    // 7. If a "location" prop is provided, fly to that location.
    const queryLocation = async (locationName: string) => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            locationName
          )}.json?access_token=${mapboxAccessToken}`
        );
        const data = await response.json();
        if (!data.features || data.features.length === 0) {
          setError('Location not found.');
          return;
        }
        const [longitude, latitude] = data.features[0].center;
        map.flyTo({
          center: [longitude, latitude],
          zoom: 18,
          pitch: 40,
          speed: 0.8,
          curve: 1,
        });
      } catch (err) {
        console.error('Error fetching location:', err);
      }
    };

    if (Array.isArray(location)) {
      map.flyTo({
        center: location,
        zoom: 16,
        pitch: 40,
      });
    } else if (typeof location === 'string') {
      queryLocation(location);
    }

    // 8. Add navigation controls.
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // 9. On map click, update the user location, save it, and update the fog.
    map.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      const roundedLon = roundCoordinate(lng);
      const roundedLat = roundCoordinate(lat);

      console.log('Map clicked at:', roundedLat, roundedLon);
      userMarker.setLngLat([lng, lat]);
      saveVisitedLocation(roundedLon, roundedLat);
      loadFogOverlay(map);
    });

    // 10. Cleanup: stop geolocation watch, save the current session's path into savedPaths,
    // and clear the activePath so that the next session starts fresh.
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      // Retrieve the active path.
      let activePath: any[] = [];
      try {
        activePath = JSON.parse(localStorage.getItem('activePath') || '[]');
      } catch (e) {
        activePath = [];
      }
      if (activePath.length > 0) {
        activePath.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        let newSavedFeature;
        if (activePath.length === 1) {
          const pt = turf.point([activePath[0].longitude, activePath[0].latitude]);
          newSavedFeature = turf.buffer(pt, 0.1, { units: 'kilometers' });
        } else {
          const lineCoords = activePath.map((loc) => [loc.longitude, loc.latitude]);
          const line = turf.lineString(lineCoords);
          const bezierLine = turf.bezierSpline(line);
          newSavedFeature = turf.buffer(bezierLine, 0.1, { units: 'kilometers' });
        }
        // Retrieve any previously saved paths.
        let savedPaths: any[] = [];
        try {
          savedPaths = JSON.parse(localStorage.getItem('savedPaths') || '[]');
        } catch (e) {
          savedPaths = [];
        }
        savedPaths.push(newSavedFeature);
        localStorage.setItem('savedPaths', JSON.stringify(savedPaths));
        // Clear the active path for the next session.
        localStorage.removeItem('activePath');
      }
      map.remove();
    };
  }, [location]);

  return (
    <div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div ref={mapContainer} style={{ width: '100%', height: '900px' }} />
    </div>
  );
};

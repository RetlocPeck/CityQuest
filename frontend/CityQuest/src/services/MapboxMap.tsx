import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import * as turf from '@turf/turf'; // For creating circle polygons
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// Import the image so the bundler handles its URL correctly

import fogTextureImage from '../images/fogTexture.png';

import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';

// Mapbox access token
const mapboxAccessToken =
  "pk.eyJ1IjoiaGFyaXZhbnNoOSIsImEiOiJjbTc2d3F4OWcwY3BkMmtvdjdyYTh3emR4In0.t9BVaGQAT7kqU8AAfWnGOA";
mapboxgl.accessToken = mapboxAccessToken;

interface MapboxMapProps {
  location: string | [number, number];
}

// Helper function: calculate distance between two coordinates
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Earth radius in meters
  const phi_1 = (lat1 * Math.PI) / 180;
  const phi_2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi_1) * Math.cos(phi_2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Helper function: round to 4 decimals (roughly 11 meters)
const roundCoordinate = (coord: number) => Number(coord.toFixed(4));

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Saves a visited location (rounded to 4 decimals) in localStorage,
 * ensuring no duplicate entries.
 *
 * This function now also performs a reverse geocoding lookup so that
 * the city and state at the given coordinates are saved along with the
 * longitude, latitude, and timestamp.
 */
const saveVisitedLocation = async (longitude: number, latitude: number) => {
  const stored = localStorage.getItem('visitedLocations');
  const visitedLocations: {
    longitude: number;
    latitude: number;
    timestamp: string;
    city?: string;
    state?: string;
  }[] = stored ? JSON.parse(stored) : [];

  console.log(localStorage.longitude);
  console.log(localStorage.latitude);
  console.log(longitude);
  console.log(latitude);
  
  const exists = visitedLocations.some(
    (loc) => loc.longitude === longitude && loc.latitude === latitude
  );
  
  if (!exists) {
    // Build the reverse geocoding URL using Mapbox's API.
    // We request both "place" (city) and "region" (state) types.
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxAccessToken}&types=place,region`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      let city = "";
      let state = "";
      
      // Iterate over the returned features to find city and state.
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
      
      const newEntry = {
        longitude,
        latitude,
        city,
        state,
        timestamp: new Date().toISOString(),
      };
      visitedLocations.push(newEntry);
      localStorage.setItem('visitedLocations', JSON.stringify(visitedLocations));
      console.log('New location saved:', newEntry);
    } catch (err) {
      console.error("Error during reverse geocoding", err);
    }
  }
};

/**
 * Generates the fog geometry by iteratively subtracting each square hole
 * from a large outer polygon.
 *
 * Instead of unioning the holes, we subtract each square individually using Turf's difference.
 */
const generateFogGeometry = (): FeatureCollection<Polygon | MultiPolygon> => {
  // 1. Define an outer polygon covering the entire world.
  // Outer ring must be in counter-clockwise (CCW) order.
  const outerRing = [
    [-180, 90],   // top-left
    [180, 90],    // top-right
    [180, -90],   // bottom-right
    [-180, -90],  // bottom-left
    [-180, 90]    // close ring (back to top-left)
  ];
  let fogGeometry: Feature<Polygon | MultiPolygon> = turf.polygon([outerRing]);

  // 2. Get visited locations from localStorage
  const stored = localStorage.getItem('visitedLocations');
  const visitedLocations: { longitude: number; latitude: number }[] = stored
    ? JSON.parse(stored)
    : [];

  // 3. For each visited location, create a square polygon and subtract it from the fog.
  // Adjust offset as needed: 0.0001° latitude ~ 11m.
  const offset = 0.0001;
  visitedLocations.forEach((loc) => {
    const squareCoords = [
      [loc.longitude - offset, loc.latitude - offset], // bottom-left
      [loc.longitude + offset, loc.latitude - offset], // bottom-right
      [loc.longitude + offset, loc.latitude + offset], // top-right
      [loc.longitude - offset, loc.latitude + offset], // top-left
      [loc.longitude - offset, loc.latitude - offset]  // close the ring
    ];
    const square = turf.polygon([squareCoords]);

    // Subtract the square from the fog geometry.
    const diff = turf.difference(turf.featureCollection([fogGeometry, square]));
    if (diff) {
      fogGeometry = diff as Feature<Polygon | MultiPolygon>;
    } else {
      console.warn('Difference operation failed for square at', loc);
    }
  });

  // 4. Return the final geometry as a FeatureCollection.
  return {
    type: 'FeatureCollection',
    features: [fogGeometry],
  };
};

/**
 * Removes any existing fog layer/source and then adds the updated fog overlay
 * using the generated geometry.
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
      'fill-pattern': 'fogTexture', // You can test with 'fill-color': '#000' for plain fill.
      'fill-opacity': 0.8,
    },
  });

  console.log('Fog overlay loaded/refreshed using iterative difference.');
};

export const MapboxMap: React.FC<MapboxMapProps> = ({ location }) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [error, setError] = React.useState<string | null>(null);
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
    map.on("load", () => {
      map.resize(); // Forces the map to adjust to its container
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

    // 4. Geolocation success callback: update marker, map, save location, and reload fog.
    const handlePositionUpdate = async (position: GeolocationPosition) => {
      const rawLon = position.coords.longitude;
      const rawLat = position.coords.latitude;
      const lon = roundCoordinate(rawLon);
      const lat = roundCoordinate(rawLat);
    
      console.log('User location:', lat, lon);
      map.setCenter([rawLon, rawLat]);
      userMarker.setLngLat([rawLon, rawLat]);
    
      // Calculate distance if previous coordinates are available
      if (previousLatitude.current !== null && previousLongitude.current !== null) {
        console.log('Previous location:', previousLatitude.current, previousLongitude.current);
        const distance = calculateDistance(
          previousLatitude.current,
          previousLongitude.current,
          rawLat,
          rawLon
        );
        console.log('Distance traveled:', distance);
    
        // Update the distanceTravelled field in Firebase
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (user) {
          const db = getFirestore();
          const userDocRef = doc(db, 'users', user.uid);
        
          try {
            // Get the document data
            const userData = await getDoc(userDocRef);
        
            if (userData.exists()) {
              // Retrieve the current distanceTravelled
              const currentDistance = userData.data().distanceTravelled || 0;
        
              // Update the distance in the Firestore document
              const newDistance = currentDistance + distance;
              setDistanceTraveled(newDistance);
              await updateDoc(userDocRef, {
                distanceTravelled: newDistance,  // Add the new distance
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
    
      // Update previous coordinates
      previousLatitude.current = rawLat;
      previousLongitude.current = rawLon;
    
      // Move the map to the new location
      map.flyTo({
        center: [lon, lat],
        zoom: 16,
        pitch: 40,
        bearing: 0,
      });
    
      // Save the visited location
      await saveVisitedLocation(lon, lat);
      await sleep(1000);
      await saveVisitedLocation(-97.4415 - .0011, 35.1975 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4415 - .0011, 35.1976 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4415 - .0011, 35.1977 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4415 - .0011, 35.1978 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4415 - .0011, 35.1979 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4415 - .0011, 35.1980 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4415 - .0011, 35.1981 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4415 - .0011, 35.1982 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4415 - .0011, 35.1983 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4415 - .0011, 35.1984 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4415 - .0011, 35.1985 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4415 - .0011, 35.1986 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4415 - .0011, 35.1987 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4415 - .0011, 35.1988 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4415 - .0011, 35.1989 - .0007);
      await sleep(1000);

      await saveVisitedLocation(-97.4416 - .0011, 35.1975 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4417 - .0011, 35.1975 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4418 - .0011, 35.1975 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4419 - .0011, 35.1975 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4420 - .0011, 35.1975 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4421 - .0011, 35.1975 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4422 - .0011, 35.1975 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4423 - .0011, 35.1975 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4424 - .0011, 35.1975 - .0007);
      await sleep(1000);

      await saveVisitedLocation(-97.4424 - .0011, 35.1975 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4424 - .0011, 35.1976 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4424 - .0011, 35.1977 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4424 - .0011, 35.1978 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4424 - .0011, 35.1979 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4424 - .0011, 35.1980 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4424 - .0011, 35.1981 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4424 - .0011, 35.1982 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4424 - .0011, 35.1983 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4424 - .0011, 35.1984 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4424 - .0011, 35.1985 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4424 - .0011, 35.1986 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4424 - .0011, 35.1987 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4424 - .0011, 35.1988 - .0007);
      await sleep(1000);
      await saveVisitedLocation(-97.4424 - .0011, 35.1989 - .0007);
      await sleep(1000);

      await saveVisitedLocation(-97.4432, 35.1975);
      await sleep(1000);
      await saveVisitedLocation(-97.4432, 35.1976);
      await sleep(1000);
      await saveVisitedLocation(-97.4432, 35.1977);
      await sleep(1000);
      await saveVisitedLocation(-97.4432, 35.1978);
      await sleep(1000);
      await saveVisitedLocation(-97.4432, 35.1979);
      await sleep(1000);
      await saveVisitedLocation(-97.4432, 35.1980);
      await sleep(1000);
      await saveVisitedLocation(-97.4432, 35.1981);
      await sleep(1000);
      await saveVisitedLocation(-97.4432, 35.1982);
      await sleep(1000);
      await saveVisitedLocation(-97.4432, 35.1983);
      await sleep(1000);
      await saveVisitedLocation(-97.4432, 35.1984);
      await sleep(1000);
      await saveVisitedLocation(-97.4432, 35.1985);
      await sleep(1000);
      await saveVisitedLocation(-97.4432, 35.1986);
      await sleep(1000);
      await saveVisitedLocation(-97.4432, 35.1987);
      await sleep(1000);
      await saveVisitedLocation(-97.4432, 35.1988);
      await sleep(1000);
      await saveVisitedLocation(-97.4432, 35.1989);
      await sleep(1000);

      await saveVisitedLocation(-97.4432, 35.1975);
      await sleep(1000);
      await saveVisitedLocation(-97.4433, 35.1975);
      await sleep(1000);
      await saveVisitedLocation(-97.4434, 35.1975);
      await sleep(1000);
      await saveVisitedLocation(-97.4435, 35.1975);
      await sleep(1000);
      await saveVisitedLocation(-97.4436, 35.1975);
      await sleep(1000);
      await saveVisitedLocation(-97.4437, 35.1975);
      await sleep(1000);
      await saveVisitedLocation(-97.4438, 35.1975);
      await sleep(1000);

      await saveVisitedLocation(-97.4439, 35.1975);
      await sleep(1000);
      await saveVisitedLocation(-97.4439, 35.1976);
      await sleep(1000);
      await saveVisitedLocation(-97.4439, 35.1977);
      await sleep(1000);
      await saveVisitedLocation(-97.4439, 35.1978);
      await sleep(1000);
      await saveVisitedLocation(-97.4439, 35.1979);
      await sleep(1000);
      await saveVisitedLocation(-97.4439, 35.1980);
      await sleep(1000);
      await saveVisitedLocation(-97.4439, 35.1981);
      await sleep(1000);
      await saveVisitedLocation(-97.4439, 35.1982);
      await sleep(1000);
      await saveVisitedLocation(-97.4439, 35.1983);
      await sleep(1000);
      await saveVisitedLocation(-97.4439, 35.1984);
      await sleep(1000);
      await saveVisitedLocation(-97.4439, 35.1985);
      await sleep(1000);
      await saveVisitedLocation(-97.4439, 35.1986);
      await sleep(1000);
      await saveVisitedLocation(-97.4439, 35.1987);
      await sleep(1000);
      await saveVisitedLocation(-97.4439, 35.1988);
      await sleep(1000);
      await saveVisitedLocation(-97.4439, 35.1989);
      await sleep(1000);

      await saveVisitedLocation(-97.4432, 35.1989);
      await sleep(1000);
      await saveVisitedLocation(-97.4433, 35.1989);
      await sleep(1000);
      await saveVisitedLocation(-97.4434, 35.1989);
      await sleep(1000);
      await saveVisitedLocation(-97.4435, 35.1989);
      await sleep(1000);
      await saveVisitedLocation(-97.4436, 35.1989);
      await sleep(1000);
      await saveVisitedLocation(-97.4437, 35.1989);
      await sleep(1000);
      await saveVisitedLocation(-97.4438, 35.1989);
      await sleep(1000);

      loadFogOverlay(map);
    };

    // 5. Geolocation error callback.
    const handlePositionError = (geoError: GeolocationPositionError) => {
      console.error('Geolocation error:', geoError);
      setError('Error retrieving location.');
    };

    // 6. Watch the user's position.
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

    // 7. If the "location" prop is provided, fly to that location.
    const queryLocation = async (locationName: string) => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json?access_token=${mapboxAccessToken}`
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

    // 9. Add click event listener to update user location.
    map.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      const roundedLon = roundCoordinate(lng);
      const roundedLat = roundCoordinate(lat);

      console.log('Map clicked at:', roundedLat, roundedLon);
      userMarker.setLngLat([lng, lat]);
      saveVisitedLocation(roundedLon, roundedLat);
      loadFogOverlay(map);
    });

    // 10. Cleanup on component unmount.
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
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
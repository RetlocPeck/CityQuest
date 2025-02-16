import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
<<<<<<< HEAD
import * as turf from '@turf/turf'; // Other turf functions if needed
=======
import * as turf from '@turf/turf'; // For creating circle polygons
import { getFirestore, doc, updateDoc, getDoc} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// Import the image so the bundler handles its URL correctly
>>>>>>> a59db320262eb63a37f408167b45931b864f87db
import fogTextureImage from '../images/fogTexture.png';

import type { Feature, FeatureCollection, Polygon, MultiPolygon, GeoJsonProperties } from 'geojson';

// Mapbox access token
const mapboxAccessToken =
  "pk.eyJ1IjoiaGFyaXZhbnNoOSIsImEiOiJjbTc2d3F4OWcwY3BkMmtvdjdyYTh3emR4In0.t9BVaGQAT7kqU8AAfWnGOA";
mapboxgl.accessToken = mapboxAccessToken;

interface MapboxMapProps {
  location: string | [number, number];
}

<<<<<<< HEAD
/**
 * Rounds a coordinate to 4 decimals (~11 meters accuracy)
 */
=======
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
>>>>>>> a59db320262eb63a37f408167b45931b864f87db
const roundCoordinate = (coord: number) => Number(coord.toFixed(4));

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

<<<<<<< HEAD
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

    // 3. On map load, load the fog texture and fog overlay.
=======
    // Function to get the user's current location
    const getUserLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (previousLatitude.current !== null && previousLongitude.current !== null) {
            const distance = calculateDistance(
              previousLatitude.current,
              previousLongitude.current,
              latitude,
              longitude
            );
            setDistanceTraveled((prevDistance) => prevDistance + distance);

            // Update the distanceTravelled field in Firebase
            const auth = getAuth();
            const user = auth.currentUser;
            console.log('User:', user);
            if (user) {
              const db = getFirestore();
              const userDocRef = doc(db, 'users', user.uid);
              updateDoc(userDocRef, {
                distanceTravelled: distanceTraveled + distance,
              });
            }
          }

          // Update previous coordinates
          previousLatitude.current = latitude;
          previousLongitude.current = longitude;

          // Move the map to the user's current location
          map.flyTo({
            center: [longitude, latitude],
            zoom: 16,
            pitch: 40,
            bearing: 0,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Unable to retrieve location.');
        },
        { enableHighAccuracy: true } // High accuracy for more precise location
      );
    };

    // Function to handle map click and update user position
    const handleMapClick = async (e: mapboxgl.MapMouseEvent) => {
      const { lng: longitude, lat: latitude } = e.lngLat;
      console.log('Clicked at:', longitude, latitude);

      // Calculate distance if previous coordinates are available
      if (previousLatitude.current !== null && previousLongitude.current !== null) {
        const distance = calculateDistance(
          previousLatitude.current,
          previousLongitude.current,
          latitude,
          longitude
        );
        //setDistanceTraveled((prevDistance) => prevDistance + distance);

        // Update the distanceTravelled field in Firebase
        const auth = getAuth();
const user = auth.currentUser;

if (user) {
  const db = getFirestore();
  const userDocRef = doc(db, 'users', user.uid); 

  // Get the document data
  const userData = await getDoc(userDocRef);
  
  if (userData.exists()) {
    // Retrieve the current distanceTravelled
    const currentDistance = userData.data().distanceTravelled || 0;
    
    // Update the distance in the Firestore document
    setDistanceTraveled(currentDistance + distance);
    await updateDoc(userDocRef, {
      distanceTravelled: currentDistance + distance,  // Add the new distance
    });

        }
      }
    };

      // Update previous coordinates
      previousLatitude.current = latitude;
      previousLongitude.current = longitude;

      // Move the map to the new location
      map.flyTo({
        center: [longitude, latitude],
        zoom: 16,
        pitch: 40,
        bearing: 0,
      });

      // Save the visited location
      saveVisitedLocation(longitude, latitude);
    };

    // Add click event listener to the map
    map.on('click', handleMapClick);

    // This function reads visited locations from localStorage and updates the fog overlay.
    const updateFogOverlay = () => {
      try {
        const stored = localStorage.getItem('visitedLocations');
        const visitedLocations: { longitude: number; latitude: number }[] = stored
          ? JSON.parse(stored)
          : [];
        console.log('Visited locations:', visitedLocations);
        // Outer polygon: covers the entire world
        const outerRing: number[][] = [
          [-180, -90],
          [180, -90],
          [180, 90],
          [-180, 90],
          [-180, -90],
        ];

        // For each visited location, create a circle polygon (11 meters ~ 0.011 km).
        const holes: number[][][] = visitedLocations
          .map((loc) => {
            const circle = turf.circle([loc.longitude, loc.latitude], 0.011, {
              steps: 64,
              units: 'kilometers',
            });
            if (!circle || !circle.geometry || !circle.geometry.coordinates) {
              console.error('Invalid circle generated for', loc);
              return null;
            }
            return circle.geometry.coordinates[0] as number[][];
          })
          .filter((h): h is number[][] => Boolean(h));

        // Build the new fog polygon, explicitly typing it as a Feature with Polygon geometry.
        const newFogPolygon: Feature<Polygon> = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: holes.length ? [outerRing, ...holes] : [outerRing],
          },
          properties: {},
        };

        // Log the data to be set:
        console.log('Updating fog with:', newFogPolygon);

        // Build the FeatureCollection data.
        const newData: FeatureCollection<Polygon> = {
          type: 'FeatureCollection',
          features: [newFogPolygon],
        };

        // Update the fog source data if it exists.
        const fogSource = map.getSource('fog') as mapboxgl.GeoJSONSource | undefined;
        if (fogSource && typeof fogSource.setData === 'function') {
          fogSource.setData(newData);
          console.log('Fog overlay updated successfully.');
        } else {
          console.warn('Fog source not found or setData unavailable.');
        }
      } catch (err) {
        console.error('Error updating fog overlay:', err);
      }
    };

    // When the map loads, add the fog overlay.
>>>>>>> a59db320262eb63a37f408167b45931b864f87db
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
    const handlePositionUpdate = (position: GeolocationPosition) => {
      const rawLon = position.coords.longitude;
      const rawLat = position.coords.latitude;
      const lon = roundCoordinate(rawLon);
      const lat = roundCoordinate(rawLat);

      console.log('User location:', lat, lon);
      map.setCenter([rawLon, rawLat]);
      userMarker.setLngLat([rawLon, rawLat]);

      // Save the visited location (reverse geocoding runs in the background).
      saveVisitedLocation(lon, lat);
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

    // 9. Cleanup on component unmount.
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
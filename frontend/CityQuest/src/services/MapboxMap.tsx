import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as turf from '@turf/turf'; // For creating circle polygons
import { getFirestore, doc, updateDoc, getDoc} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// Import the image so the bundler handles its URL correctly
import fogTextureImage from '../images/fogTexture.png';

import type { FeatureCollection, Feature, Polygon } from 'geojson';

const mapboxvar =
  "pk.eyJ1IjoiaGFyaXZhbnNoOSIsImEiOiJjbTc2d3F4OWcwY3BkMmtvdjdyYTh3emR4In0.t9BVaGQAT7kqU8AAfWnGOA";
mapboxgl.accessToken = mapboxvar;

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

// Helper function to save a visited location (if not already present)
const saveVisitedLocation = (longitude: number, latitude: number) => {
  const stored = localStorage.getItem('visitedLocations');
  const visitedLocations: { longitude: number; latitude: number; timestamp: string }[] =
    stored ? JSON.parse(stored) : [];
  const exists = visitedLocations.some(
    (loc) => loc.longitude === longitude && loc.latitude === latitude
  );
  if (!exists) {
    const newEntry = {
      longitude,
      latitude,
      timestamp: new Date().toISOString(),
    };
    visitedLocations.push(newEntry);
    localStorage.setItem('visitedLocations', JSON.stringify(visitedLocations));
    console.log('New location saved:', newEntry);
  }
};

export const MapboxMap: React.FC<MapboxMapProps> = ({ location }) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const previousLatitude = useRef<number | null>(null);
  const previousLongitude = useRef<number | null>(null);
  const [distanceTraveled, setDistanceTraveled] = useState(0);

  useEffect(() => {
    // Create the map
    const map = new mapboxgl.Map({
      container: mapContainer.current as HTMLElement,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-97.4395, 35.2226], // Set initial center to Norman, OK
      zoom: 16,
      pitch: 40,
      bearing: 0,
      attributionControl: false,
    });
    map.on("load", () => {
      map.resize(); // Forces the map to adjust to its container
    });

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
    map.on('load', () => {
      // Load the fog texture image.
      map.loadImage(fogTextureImage, (imgError, image) => {
        if (imgError) {
          console.error('Error loading fog texture:', imgError);
          return;
        }
        if (!map.hasImage('fogTexture')) {
          map.addImage('fogTexture', image!);
        }
        // Create the initial world-covering polygon.
        const worldFog: FeatureCollection<Polygon> = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [-180, -90],
                    [180, -90],
                    [180, 90],
                    [-180, 90],
                    [-180, -90],
                  ],
                ],
              },
              properties: {},
            },
          ],
        };
        // Add the fog source and layer.
        map.addSource('fog', {
          type: 'geojson',
          data: worldFog,
        });
        map.addLayer({
          id: 'fog-layer',
          type: 'fill',
          source: 'fog',
          paint: {
            'fill-pattern': 'fogTexture',
            'fill-opacity': 0.8,
          },
        });
        // Update the fog overlay on load in case there are any visited locations already saved.
        updateFogOverlay();
        getUserLocation();
      });
    });

    // Watch the user's position.
    let watchId: number | null = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const rawLongitude = position.coords.longitude;
          const rawLatitude = position.coords.latitude;
          const longitude = roundCoordinate(rawLongitude);
          const latitude = roundCoordinate(rawLatitude);
          saveVisitedLocation(longitude, latitude);
          updateFogOverlay();
        },
        (geoError) => {
          console.error('Geolocation error:', geoError);
          setError('Error retrieving location.');
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 10000,
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }

    // (Optional) Handle the location prop to fly to a certain location.
    const queryLocation = async (locationName: string) => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            locationName
          )}.json?access_token=${mapboxvar}`
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

    // Add navigation controls.
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

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
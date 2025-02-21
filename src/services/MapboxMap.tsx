import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import * as turf from '@turf/turf'; // For spatial operations like buffering and smoothing
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import fogTextureImage from '../images/fogTextureDark.png';

import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';

// Set Mapbox access token
const mapboxAccessToken = import.meta.env.VITE_MAPBOX_API_KEY!;
mapboxgl.accessToken = mapboxAccessToken;

interface MapboxMapProps {
  location: string | [number, number];
}

// ---------------------- Helper Functions ---------------------- //

// Round a coordinate value to 6 decimal places.
const roundCoordinate = (coord: number) => Number(coord.toFixed(6));

/**
 * Smooth an array of coordinates using the Chaikin smoothing algorithm.
 * Preserves the first and last points.
 * @param coords Array of [lon, lat] coordinates.
 * @param iterations Number of smoothing iterations.
 */
function smoothChaikin(coords: number[][], iterations = 1): number[][] {
  let smoothed = coords;
  for (let iter = 0; iter < iterations; iter++) {
    const temp: number[][] = [];
    // Always keep the first point.
    temp.push(smoothed[0]);
    for (let i = 0; i < smoothed.length - 1; i++) {
      const p0 = smoothed[i];
      const p1 = smoothed[i + 1];
      // Generate two new points between p0 and p1.
      const q = [
        0.75 * p0[0] + 0.25 * p1[0],
        0.75 * p0[1] + 0.25 * p1[1]
      ];
      const r = [
        0.25 * p0[0] + 0.75 * p1[0],
        0.25 * p0[1] + 0.75 * p1[1]
      ];
      temp.push(q, r);
    }
    // Always keep the last point.
    temp.push(smoothed[smoothed.length - 1]);
    smoothed = temp;
  }
  return smoothed;
}

/**
 * Save a visited location to localStorage as part of the current active path.
 * Records the start timestamp if this is the first coordinate.
 * @param longitude Longitude of the visited location.
 * @param latitude Latitude of the visited location.
 */
const saveVisitedLocation = async (longitude: number, latitude: number) => {
  let activePath: any[] = [];
  try {
    activePath = JSON.parse(localStorage.getItem('activePath') || '[]');
  } catch (e) {
    activePath = [];
  }
  // If this is the first coordinate, record the start timestamp.
  if (activePath.length === 0) {
    localStorage.setItem('activePathStartTimestamp', new Date().toISOString());
  }
  const newEntry = { longitude, latitude };
  activePath.push(newEntry);
  localStorage.setItem('activePath', JSON.stringify(activePath));
  console.log('Active path updated:', newEntry);
};

/**
 * Generate the fog overlay geometry.
 * Starts with an outer polygon covering the world, then subtracts (difference)
 * the buffered geometries for all saved paths and the current active path.
 */
const generateFogGeometry = (): FeatureCollection<Polygon | MultiPolygon> => {
  // Outer polygon covering the entire world.
  const outerRing = [
    [-180, 90],
    [180, 90],
    [180, -90],
    [-180, -90],
    [-180, 90]
  ];
  let fogGeometry: Feature<Polygon | MultiPolygon> = turf.polygon([outerRing]);

  // Process previously saved paths.
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

  // Process the active path.
  let activePath: any[] = [];
  try {
    activePath = JSON.parse(localStorage.getItem('activePath') || '[]');
  } catch (e) {
    activePath = [];
  }
  if (activePath.length > 0) {
    let bufferedFeature: Feature<Polygon | MultiPolygon> | undefined;
    if (activePath.length === 1) {
      // Single point: create a small circular buffer.
      const pt = turf.point([activePath[0].longitude, activePath[0].latitude]);
      bufferedFeature = turf.buffer(pt, 0.03, { units: 'kilometers' });
    } else {
      // Multiple points: smooth the line then buffer it.
      const lineCoords = activePath.map((loc) => [loc.longitude, loc.latitude]);
      const smoothedCoords = smoothChaikin(lineCoords, 2);
      const smoothedLine = turf.lineString(smoothedCoords);
      bufferedFeature = turf.buffer(smoothedLine, 0.03, { units: 'kilometers' });
    }
    if (bufferedFeature) {
      const diff = turf.difference(turf.featureCollection([fogGeometry, bufferedFeature]));
      if (diff) {
        fogGeometry = diff;
      }
    }
  }
  return turf.featureCollection([fogGeometry]);
};

/**
 * Load or update the fog overlay on the Mapbox map.
 * Either updates the existing source data or adds a new source and layer.
 * @param map Mapbox GL map instance.
 */
const loadFogOverlay = (map: mapboxgl.Map) => {
  const fogData = generateFogGeometry();
  if (map.getSource('fog')) {
    (map.getSource('fog') as mapboxgl.GeoJSONSource).setData(fogData);
  } else {
    map.addSource('fog', {
      type: 'geojson',
      data: fogData,
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
  }
  console.log('Fog overlay refreshed.');
};

/**
 * Snap a given coordinate to the nearest road if it falls within a set distance threshold.
 * Utilizes Mapbox's Tilequery API.
 * @param lon Longitude to snap.
 * @param lat Latitude to snap.
 * @param threshold Distance threshold in meters (default 10).
 * @returns A promise resolving to the snapped coordinate as [longitude, latitude].
 */
const snapCoordinateToRoad = async (
  lon: number,
  lat: number,
  threshold = 10
): Promise<[number, number]> => {
  const roadQueryUrl = `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${lon},${lat}.json?radius=15&layers=road&access_token=${mapboxAccessToken}`;
  try {
    const response = await fetch(roadQueryUrl);
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const nearestRoad = data.features[0];
      if (nearestRoad.geometry.type === "Point") {
        const [roadLon, roadLat] = nearestRoad.geometry.coordinates;
        const distance = turf.distance(
          turf.point([lon, lat]),
          turf.point([roadLon, roadLat]),
          { units: "meters" }
        );
        if (distance <= threshold) {
          console.log(`Snapped to road (distance: ${distance.toFixed(2)}m):`, roadLat, roadLon);
          return [roadLon, roadLat];
        } else {
          console.log(`Location is off-road (distance: ${distance.toFixed(2)}m), using original coordinates.`);
        }
      } else {
        console.log("No valid road point found, using original coordinates.");
      }
    } else {
      console.log("No nearby roads found, using original coordinates.");
    }
  } catch (error) {
    console.error("Error fetching road data:", error);
  }
  return [lon, lat];
};

/**
 * Query a location by name using Mapbox's Geocoding API.
 * If found, the map flies to that location (provided the current zoom is 19).
 * @param locationName Name of the location to query.
 * @param map Mapbox GL map instance.
 * @param setError Callback to set error state.
 */
const queryLocation = async (locationName: string, map: mapboxgl.Map, setError: (msg: string) => void) => {
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
    if (map.getZoom() === 19) {
      map.flyTo({
        center: [longitude, latitude],
        zoom: 19,
        speed: 0.8,
        curve: 1,
        easing: (t) => t,
      });
    }
  } catch (err) {
    console.error('Error fetching location:', err);
  }
};

/**
 * Create and return a custom HTML element to be used as the user marker.
 * @returns A styled HTMLDivElement representing the user marker.
 */
const createUserMarkerElement = (): HTMLDivElement => {
  const markerEl = document.createElement('div');
  markerEl.className = 'user-marker';
  markerEl.style.width = '30px';
  markerEl.style.height = '30px';
  markerEl.style.backgroundColor = '#007cbf';
  markerEl.style.borderRadius = '50%';
  markerEl.style.border = '2px solid white';
  markerEl.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';
  return markerEl;
};

// ---------------------- Main Component ---------------------- //

export const MapboxMap: React.FC<MapboxMapProps> = ({ location }) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const previousLatitude = useRef<number | null>(null);
  const previousLongitude = useRef<number | null>(null);
  const [distanceTraveled, setDistanceTraveled] = useState(0);

  useEffect(() => {
    let map: mapboxgl.Map;
    let watchId: number | null = null;

    /**
     * Initialize the Mapbox map with a given center coordinate.
     * Sets up the map instance, user marker, fog overlay, geolocation watchers, and event handlers.
     * @param center [longitude, latitude] for the initial map center.
     */
    const initializeMap = (center: [number, number]) => {
      // Create the map instance.
      map = new mapboxgl.Map({
        container: mapContainer.current as HTMLElement,
        style: 'mapbox://styles/mapbox/streets-v11',
        center,
        zoom: 19,
        pitch: 40,
        bearing: 0,
        attributionControl: false,
      });

      // Resize map on load.
      map.on('load', () => {
        map.resize();
      });

      // Add the custom user marker at the center.
      const userMarkerEl = createUserMarkerElement();
      const userMarker = new mapboxgl.Marker({ element: userMarkerEl })
        .setLngLat(center)
        .addTo(map);

      // Load the fog texture image and initialize the fog overlay.
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

      /**
       * Handle geolocation updates.
       * Snaps the received coordinate to the nearest road, updates the marker,
       * saves the coordinate, and refreshes the fog overlay.
       * @param position GeolocationPosition object.
       */
      const handlePositionUpdate = async (position: GeolocationPosition) => {
        const rawLon = roundCoordinate(position.coords.longitude);
        const rawLat = roundCoordinate(position.coords.latitude);
        console.log('Raw GPS location:', rawLat, rawLon);

        // Snap the coordinate to the nearest road if applicable.
        const [snappedLon, snappedLat] = await snapCoordinateToRoad(rawLon, rawLat);

        // If the zoom level is 19, recenter the map.
        if (map.getZoom() === 19) {
          map.setCenter([snappedLon, snappedLat]);
        }
        // Update the user marker position.
        userMarker.setLngLat([snappedLon, snappedLat]);

        // Save the new location and update the fog overlay.
        previousLatitude.current = snappedLat;
        previousLongitude.current = snappedLon;
        saveVisitedLocation(snappedLon, snappedLat);
        loadFogOverlay(map);
      };

      /**
       * Handle geolocation errors.
       * @param geoError GeolocationPositionError object.
       */
      const handlePositionError = (geoError: GeolocationPositionError) => {
        console.error('Geolocation error:', geoError);
        setError('Error retrieving location.');
      };

      // Begin watching the user's position if geolocation is available.
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(handlePositionUpdate, handlePositionError, {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 10000,
        });
      } else {
        setError('Geolocation is not supported by this browser.');
      }

      // If a location string is provided, query and fly to that location.
      if (typeof location === 'string') {
        queryLocation(location, map, setError);
      }

      // ----- Map Click Handler: Teleport & Snap to Road ----- //
      map.on('click', async (e) => {
        const clickedLon = roundCoordinate(e.lngLat.lng);
        const clickedLat = roundCoordinate(e.lngLat.lat);
        console.log("Map clicked. Teleporting to:", clickedLat, clickedLon);
        
        // Snap the clicked coordinate to the nearest road.
        const [snappedLon, snappedLat] = await snapCoordinateToRoad(clickedLon, clickedLat);
        
        // Smoothly move the camera to the snapped location.
        map.flyTo({
          center: [snappedLon, snappedLat],
          zoom: map.getZoom(),
          speed: 0.6,
          curve: 1,
          easing: (t) => t,
        });
        // Update the user marker and save the new coordinate.
        userMarker.setLngLat([snappedLon, snappedLat]);
        saveVisitedLocation(snappedLon, snappedLat);
        loadFogOverlay(map);
      });
    };

    // Initialize the map using the current geolocation, or fall back to the prop/default.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLon = roundCoordinate(position.coords.longitude);
          const userLat = roundCoordinate(position.coords.latitude);
          const userCenter: [number, number] = [userLon, userLat];
          initializeMap(userCenter);
        },
        (geoError) => {
          console.error('Error retrieving geolocation:', geoError);
          setError('Error retrieving your location.');
          // Use fallback location from props or a default coordinate.
          const fallbackCenter: [number, number] = Array.isArray(location) ? location : [-97.4395, 35.2226];
          initializeMap(fallbackCenter);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
      const fallbackCenter: [number, number] = Array.isArray(location) ? location : [-97.4395, 35.2226];
      initializeMap(fallbackCenter);
    }

    // Cleanup: Stop geolocation watch, save active path to Firestore, and remove the map.
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      // Retrieve and save the active path segment if available.
      let activePath: any[] = [];
      try {
        activePath = JSON.parse(localStorage.getItem('activePath') || '[]');
      } catch (e) {
        activePath = [];
      }
      if (activePath.length > 0) {
        const startTimestamp = localStorage.getItem('activePathStartTimestamp') || new Date().toISOString();
        const endTimestamp = new Date().toISOString();
        
        const segment = {
          userId: getAuth().currentUser?.uid || 'unknown',
          startTimestamp,
          endTimestamp,
          points: activePath,
        };
  
        const db = getFirestore();
        addDoc(collection(db, 'segments'), segment)
          .then(() => {
            console.log('Segment saved to Firestore:', segment);
          })
          .catch((error) => {
            console.error('Error saving segment:', error);
          });
  
        // Clean up localStorage.
        localStorage.removeItem('activePath');
        localStorage.removeItem('activePathStartTimestamp');
      }
      if (map) {
        map.remove();
      }
    };
  }, [location]);

  return (
    <div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div ref={mapContainer} style={{ width: '100%', height: '900px' }} />
    </div>
  );
};

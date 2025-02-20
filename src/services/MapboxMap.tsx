import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import * as turf from '@turf/turf'; // For buffering and creating lines/polygons
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import fogTextureImage from '../images/fogTextureDark.png';

import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';

// Mapbox access token
const mapboxAccessToken = import.meta.env.VITE_MAPBOX_API_KEY!;
mapboxgl.accessToken = mapboxAccessToken;

interface MapboxMapProps {
  location: string | [number, number];
}

// Helper: Calculate distance (in meters) between two coordinates
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper: Round coordinate to 6 decimals.
const roundCoordinate = (coord: number) => Number(coord.toFixed(6));

/**
 * Helper: Smooth an array of coordinates using Chaikin smoothing.
 * The algorithm preserves the first and last points.
 * iterations: number of times to perform the smoothing.
 */
function smoothChaikin(coords: number[][], iterations = 1): number[][] {
  let smoothed = coords;
  for (let iter = 0; iter < iterations; iter++) {
    const temp: number[][] = [];
    // Always keep first point.
    temp.push(smoothed[0]);
    for (let i = 0; i < smoothed.length - 1; i++) {
      const p0 = smoothed[i];
      const p1 = smoothed[i + 1];
      // Create two new points between p0 and p1.
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
    // Keep last point.
    temp.push(smoothed[smoothed.length - 1]);
    smoothed = temp;
  }
  return smoothed;
}

/**
 * Instead of using "visitedLocations", we now use "activePath".
 * Every time a new coordinate is available, we add it to the current session’s activePath.
 */
const saveVisitedLocation = async (longitude: number, latitude: number) => {
  let activePath: any[] = [];
  try {
    activePath = JSON.parse(localStorage.getItem('activePath') || '[]');
  } catch (e) {
    activePath = [];
  }
  const exists = activePath.some(
    (loc) => loc.longitude === longitude && loc.latitude === latitude
  );
  if (!exists) {
    const newEntry = { longitude, latitude };
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
 * - If only one point exists, we create a 30m circle.
 * - If at least two points exist, we form a line (sorted by timestamp), smooth it using Chaikin smoothing, then buffer it by 30m.
 */
const generateFogGeometry = (): FeatureCollection<Polygon | MultiPolygon> => {
  const outerRing = [
    [-180, 90],
    [180, 90],
    [180, -90],
    [-180, -90],
    [-180, 90]
  ];
  let fogGeometry: Feature<Polygon | MultiPolygon> = turf.polygon([outerRing]);

  let savedPaths: any[] = [];
  try {
    savedPaths = JSON.parse(localStorage.getItem('savedPaths') || '[]');
  } catch (e) {
    savedPaths = [];
  }
  savedPaths.forEach((feature: any) => {
    const diff = turf.difference(
      turf.featureCollection([fogGeometry, feature])
    );
    if (diff) {
      fogGeometry = diff;
    }
  });

  let activePath: any[] = [];
  try {
    activePath = JSON.parse(localStorage.getItem('activePath') || '[]');
  } catch (e) {
    activePath = [];
  }
  if (activePath.length > 0) {
    activePath.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    let bufferedFeature: Feature<Polygon | MultiPolygon> | undefined;
    if (activePath.length === 1) {
      const pt = turf.point([activePath[0].longitude, activePath[0].latitude]);
      bufferedFeature = turf.buffer(pt, 0.03, { units: 'kilometers' });
    } else {
      const lineCoords = activePath.map((loc) => [loc.longitude, loc.latitude]);
      // Apply Chaikin smoothing with 2 iterations.
      const smoothedCoords = smoothChaikin(lineCoords, 2);
      const smoothedLine = turf.lineString(smoothedCoords);
      bufferedFeature = turf.buffer(smoothedLine, 0.03, { units: 'kilometers' });
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
  return turf.featureCollection([fogGeometry]);
};

/**
 * loadFogOverlay: Instead of removing and re-adding the layer, update the GeoJSON source data.
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

export const MapboxMap: React.FC<MapboxMapProps> = ({ location }) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const previousLatitude = useRef<number | null>(null);
  const previousLongitude = useRef<number | null>(null);
  const [distanceTraveled, setDistanceTraveled] = useState(0);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainer.current as HTMLElement,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-97.4395, 35.2226],
      zoom: 19,
      pitch: 40,
      bearing: 0,
      attributionControl: false,
    });
    map.on('load', () => {
      map.resize();
    });

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

    const handlePositionUpdate = async (position: GeolocationPosition) => {
      const rawLon = position.coords.longitude;
      const rawLat = position.coords.latitude;
      const lon = roundCoordinate(rawLon);
      const lat = roundCoordinate(rawLat);
      console.log('Raw GPS location:', lat, lon);

      const roadQueryUrl = `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${lon},${lat}.json?radius=15&layers=road&access_token=${mapboxAccessToken}`;
      let snappedLon = lon;
      let snappedLat = lat;
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
            if (distance <= 10) {
              snappedLon = roadLon;
              snappedLat = roadLat;
              console.log(`Snapped to road (distance: ${distance.toFixed(2)}m):`, snappedLat, snappedLon);
            } else {
              console.log(`GPS is off-road (distance: ${distance.toFixed(2)}m), keeping raw location.`);
            }
          } else {
            console.log("No valid road point found, keeping raw GPS location.");
          }
        } else {
          console.log("No nearby roads found, keeping raw GPS location.");
        }
      } catch (error) {
        console.error("Error fetching road data:", error);
      }
  
      map.setCenter([snappedLon, snappedLat]);
      userMarker.setLngLat([snappedLon, snappedLat]);
  
      previousLatitude.current = snappedLat;
      previousLongitude.current = snappedLon;
  
      saveVisitedLocation(snappedLon, snappedLat);
      loadFogOverlay(map);
    };
  
    const handlePositionError = (geoError: GeolocationPositionError) => {
      console.error('Geolocation error:', geoError);
      setError('Error retrieving location.');
    };
  
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
          zoom: 19,
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
        zoom: 19,
        pitch: 40,
      });
    } else if (typeof location === 'string') {
      queryLocation(location);
    }
  
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
  
    map.on('click', async (e) => {
      const rawLon = e.lngLat.lng;
      const rawLat = e.lngLat.lat;
      const lon = roundCoordinate(rawLon);
      const lat = roundCoordinate(rawLat);
      console.log("Map clicked at:", lat, lon);
  
      const roadQueryUrl = `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${lon},${lat}.json?radius=15&layers=road&access_token=${mapboxAccessToken}`;
      let snappedLon = lon;
      let snappedLat = lat;
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
            if (distance <= 10) {
              snappedLon = roadLon;
              snappedLat = roadLat;
              console.log(`Snapped to road (distance: ${distance.toFixed(2)}m):`, snappedLat, snappedLon);
            } else {
              console.log(`Click is off-road (distance: ${distance.toFixed(2)}m), keeping clicked location.`);
            }
          } else {
            console.log("No valid road point found, keeping clicked location.");
          }
        } else {
          console.log("No nearby roads found, keeping clicked location.");
        }
      } catch (error) {
        console.error("Error fetching road data:", error);
      }
  
      userMarker.setLngLat([snappedLon, snappedLat]);
  
      saveVisitedLocation(snappedLon, snappedLat);
      loadFogOverlay(map);
    });
  
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
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
          newSavedFeature = turf.buffer(pt, 0.03, { units: 'kilometers' });
        } else {
          const lineCoords = activePath.map((loc) => [loc.longitude, loc.latitude]);
          const line = turf.lineString(lineCoords);
          const smoothedCoords = smoothChaikin(lineCoords, 2);
          const smoothedLine = turf.lineString(smoothedCoords);
          newSavedFeature = turf.buffer(smoothedLine, 0.03, { units: 'kilometers' });
        }
        let savedPaths: any[] = [];
        try {
          savedPaths = JSON.parse(localStorage.getItem('savedPaths') || '[]');
        } catch (e) {
          savedPaths = [];
        }
        savedPaths.push(newSavedFeature);
        localStorage.setItem('savedPaths', JSON.stringify(savedPaths));
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

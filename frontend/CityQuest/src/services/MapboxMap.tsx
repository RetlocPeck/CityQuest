import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

const mapboxvar = "pk.eyJ1IjoiaGFyaXZhbnNoOSIsImEiOiJjbTc2d3F4OWcwY3BkMmtvdjdyYTh3emR4In0.t9BVaGQAT7kqU8AAfWnGOA";
mapboxgl.accessToken = mapboxvar;

export const MapboxMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null); // Reference to the div that will contain the map

  useEffect(() => {
    // Initialize the map when the component is mounted
    const map = new mapboxgl.Map({
      container: mapContainer.current as HTMLElement, // The DOM element to contain the map
      style: 'mapbox://styles/mapbox/outdoors-v11', // Use a style that supports terrain
      center: [-74.5, 40], // Starting position [longitude, latitude]
      zoom: 16, // Starting zoom level
      pitch: 45, // Tilt the map for a 3D effect
      bearing: 0, // Map rotation
    });

    // Enable 3D terrain
    map.on('load', () => {
      map.setTerrain({
        source: 'mapbox-dem', // DEM (Digital Elevation Model) source for terrain
        exaggeration: 1.5, // Exaggeration of the terrain's height
      });

      /** 
      // Add 3D buildings
      map.addLayer({
        id: '2d-buildings',
        type: 'fill-extrusion',
        source: 'composite',
        'source-layer': 'building',
        paint: {
          'fill-extrusion-color': '#aaa', // Color of buildings
          'fill-extrusion-height': ['get', 'height'], // Building height from source data
          'fill-extrusion-base': ['get', 'min_height'], // Minimum height (if any)
          'fill-extrusion-opacity': 0.6, // Transparency of buildings
        },
      });
      */
    });
    

    // Function to query the location by name (geocoding)
    const queryLocation = async (locationName: string) => {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json?access_token=${mapboxvar}`
      );
      const data = await response.json();
      const [longitude, latitude] = data.features[0].center; // Get the coordinates from the first result

      // Move the map to the queried location with 3D effect
      map.flyTo({
        center: [longitude, latitude],
        zoom: 18, // Set zoom level to an appropriate value
        pitch: 45, // Tilt to maintain 3D effect
        speed: 0.8, // Smooth flying animation
        curve: 1, // Flight curve for smooth transition
      });
    };

    // Example usage: Query a location by name and fly to it
    queryLocation('Oklahoma'); // You can change this to any location name

    // Optional: Add navigation controls for zoom and rotation
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Cleanup the map instance when the component is unmounted
    return () => map.remove();
  }, []);

  return (
    <div
      ref={mapContainer}
      style={{ width: '100%', height: '500px' }} // Adjust the size as needed
    />
  );
};

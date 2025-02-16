import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

const mapboxvar = "pk.eyJ1IjoiaGFyaXZhbnNoOSIsImEiOiJjbTc2d3F4OWcwY3BkMmtvdjdyYTh3emR4In0.t9BVaGQAT7kqU8AAfWnGOA";
mapboxgl.accessToken = mapboxvar;

interface MapboxMapProps {
  location: string | [number, number]; // Can be a location name (string) or coordinates (latitude, longitude)
}

export const MapboxMap: React.FC<MapboxMapProps> = ({ location }) => {
  const mapContainer = useRef<HTMLDivElement | null>(null); // Reference to the div that will contain the map

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainer.current as HTMLElement, // The DOM element to contain the map
      style: 'mapbox://styles/mapbox/streets-v11', // You can switch to a 2D style (e.g., 'streets-v11')
      center: [-74.5, 40], // Default starting position [longitude, latitude]
      zoom: 16, // Starting zoom level
      pitch: 0, // Set pitch to 0 for 2D view
      bearing: 0, // Map rotation to 0 (no rotation)
      attributionControl: false, // Disable Mapbox attribution control
    });

    // Function to query the location by name (geocoding)
    const queryLocation = async (locationName: string) => {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json?access_token=${mapboxvar}`
      );
      const data = await response.json();
      const [longitude, latitude] = data.features[0].center; // Get the coordinates from the first result

      // Move the map to the queried location with 2D view
      map.flyTo({
        center: [longitude, latitude],
        zoom: 16, // Set zoom level to an appropriate value
        pitch: 0, // No tilt for 2D view
        speed: 0.8, // Smooth flying animation
        curve: 1, // Flight curve for smooth transition
      });
    };

    // Handle the location prop
    if (Array.isArray(location)) {
      // If location is an array of [longitude, latitude], use it directly
      map.flyTo({
        center: location,
        zoom: 16,
        pitch: 0,
      });
    } else if (typeof location === 'string') {
      // If location is a string (place name), query it
      queryLocation(location);
    }

    // Optional: Add navigation controls for zoom and rotation
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Cleanup the map instance when the component is unmounted
    return () => map.remove();
  }, [location]); // Rerun the effect if the location changes

  return (
    <div
      ref={mapContainer}
      style={{ width: '100%', height: '500px' }} // Adjust the size as needed
    />
  );
};

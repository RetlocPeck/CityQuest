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
      style: 'mapbox://styles/mapbox/streets-v11', // Style of the map
      center: [-74.5, 40], // Starting position [longitude, latitude]
      zoom: 9, // Starting zoom level
    });

    // Optional: Add navigation controls to the map
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

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
// Import the image so the bundler handles its URL correctly
import fogTextureImage from '../images/fogTexture.png';

const mapboxvar = "pk.eyJ1IjoiaGFyaXZhbnNoOSIsImEiOiJjbTc2d3F4OWcwY3BkMmtvdjdyYTh3emR4In0.t9BVaGQAT7kqU8AAfWnGOA";
mapboxgl.accessToken = mapboxvar;

interface MapboxMapProps {
  location: string | [number, number];
}

export const MapboxMap: React.FC<MapboxMapProps> = ({ location }) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainer.current as HTMLElement,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-74.5, 40],
      zoom: 16,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

    map.on('load', () => {
      // Use the imported image URL instead of a relative path
      map.loadImage(fogTextureImage, (error, image) => {
        if (error) {
          console.error('Error loading fog texture:', error);
          return;
        }

        // Add the image if it hasn't been added already
        if (!map.hasImage('fogTexture')) {
          map.addImage('fogTexture', image!);
        }

        // Create a world-covering polygon
        const worldFog: GeoJSON.FeatureCollection = {
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

        // Add a GeoJSON source with the polygon
        map.addSource('fog', {
          type: 'geojson',
          data: worldFog,
        });

        // Add a fill layer using the fog texture
        map.addLayer({
          id: 'fog-layer',
          type: 'fill',
          source: 'fog',
          paint: {
            'fill-pattern': 'fogTexture', // Pattern from the image added above
            'fill-opacity': 0.8,
          },
        });
      });
    });

    // Handle the location prop (either geocoding a name or using coordinates)
    const queryLocation = async (locationName: string) => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            locationName
          )}.json?access_token=${mapboxvar}`
        );
        const data = await response.json();
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
        pitch: 0,
      });
    } else if (typeof location === 'string') {
      queryLocation(location);
    }

    // Optional: Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.remove();
    };
  }, [location]);

  return <div ref={mapContainer} style={{ width: '100%', height: '500px' }} />;
};
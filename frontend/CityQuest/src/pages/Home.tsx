import React, { useState } from 'react';
import { 
  IonContent, 
  IonPage, 
  IonSearchbar, 
  IonList, 
  IonItem 
} from '@ionic/react';
import Toolbar from '../components/Toolbar';
import { MapboxMap } from '../services/MapboxMap';
import '../stylesheets/Home.css';

const Home: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | [number, number]>("Oklahoma City");

  const handleSearchChange = async (event: CustomEvent) => {
    const query = event.detail.value;
    setSearchQuery(query);
    
    if (query && query.length > 2) {
      const accessToken = "mapboxAPIKey"; 
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${accessToken}`;
      
      try {
        const response = await fetch(url);
        const data = await response.json();
        setSuggestions(data.features);
      } catch (error) {
        console.error("Error fetching geocoding data: ", error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (feature: any) => {
    setSelectedLocation(feature.place_name);
    setSearchQuery(feature.place_name);
    setSuggestions([]);
  };

  return (
    <IonPage>
    <IonContent fullscreen className="home-container">
      {/* Map as background */}
      <div className="map-container">
        <MapboxMap location={selectedLocation} />
      </div>
  
      {/* Search and suggestions on top */}
      <IonSearchbar
        value={searchQuery}
        onIonInput={handleSearchChange}
        className="searchbar"
        
      />
      {suggestions.length > 0 && (
        <IonList className="suggestions-list">
          {suggestions.map((feature: any) => (
            <IonItem button key={feature.id} onClick={() => handleSuggestionClick(feature)}>
              {feature.place_name}
            </IonItem>
          ))}
        </IonList>
      )}
  
      {/* Toolbar fixed at the bottom */}
      <div className="toolbar">
        <Toolbar />
      </div>
    </IonContent>
  </IonPage>
  
  );
};

export default Home;

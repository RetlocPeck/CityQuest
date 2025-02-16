import React, { useState } from 'react';
import { 
  IonButton, 
  IonCard, 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonSearchbar, 
  IonTitle, 
  IonToolbar, 
  IonList, 
  IonItem 
} from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import '../stylesheets/Home.css';
import Toolbar from '../components/Toolbar';
import { MapboxMap } from '../services/MapboxMap';

const Home: React.FC = () => {
<<<<<<< HEAD
  return (
    <>
    <IonPage>
     <IonContent fullscreen className = "home-bg">
     <IonSearchbar style={{ paddingTop: "16px", '--border-radius': '20px', "--height": "60px", }} color = "medium">
        </IonSearchbar>
    <div className="home-center-con"> 
    </div>
      {/**
       * 
       * Map will be on this screen
       * 
       * Add a toolbar at bottom that contains buttons for:
       * - Acccount, Achievments
       */}
        <Toolbar />
=======
  // State for the search query, suggestions and selected location.
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  // Default location can be a name or coordinates; here we use "Oklahoma City" as default.
  const [selectedLocation, setSelectedLocation] = useState<string | [number, number]>("Oklahoma City");
>>>>>>> mapbox

  // Update suggestions when the user types into the search bar.
  const handleSearchChange = async (event: CustomEvent) => {
    const query = event.detail.value;
    setSearchQuery(query);
    
    // Only search if query has enough characters
    if (query && query.length > 2) {
      const accessToken = "pk.eyJ1IjoiaGFyaXZhbnNoOSIsImEiOiJjbTc2d3F4OWcwY3BkMmtvdjdyYTh3emR4In0.t9BVaGQAT7kqU8AAfWnGOA"; // Replace with your Mapbox token
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${accessToken}`;
      
      try {
        const response = await fetch(url);
        const data = await response.json();
        // data.features contains the location suggestions.
        setSuggestions(data.features);
      } catch (error) {
        console.error("Error fetching geocoding data: ", error);
      }
    } else {
      setSuggestions([]);
    }
  };

  // When a suggestion is clicked, update the selected location.
  const handleSuggestionClick = (feature: any) => {
    // You can choose to pass the full feature or just the place_name.
    setSelectedLocation(feature.place_name);
    // Optionally, update the search bar text to reflect the selection.
    setSearchQuery(feature.place_name);
    // Clear the suggestion list.
    setSuggestions([]);
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonSearchbar
          value={searchQuery}
          onIonInput={handleSearchChange}
          style={{
            paddingTop: "16px",
            '--border-radius': '20px',
            "--height": "60px",
          }}
        />
        
        {/* Display suggestions as a dropdown list */}
        {suggestions.length > 0 && (
          <IonList>
            {suggestions.map((feature: any) => (
              <IonItem button key={feature.id} onClick={() => handleSuggestionClick(feature)}>
                {feature.place_name}
              </IonItem>
            ))}
          </IonList>
        )}

        {/* Pass the selected location to MapboxMap */}
        <MapboxMap location={selectedLocation} />
      </IonContent>
     
    </IonPage>
  );
};

export default Home;

import { IonButton, IonCard, IonContent, IonHeader, IonPage, IonSearchbar, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import '.././stylesheets/Home.css';
import Toolbar from '../components/Toolbar';
import  {MapboxMap } from '../services/MapboxMap';
const Home: React.FC = () => {
  return (
    <>
    <IonPage>
     <IonContent fullscreen>
     <IonSearchbar style={{ paddingTop: "16px", '--border-radius': '20px', "--height": "60px", }}>
        </IonSearchbar>
    
      {/**
       * 
       * Map will be on this screen
       * 
       * Add a toolbar at bottom that contains buttons for:
       * - Acccount, Achievments
       */}
       
        <MapboxMap location={"Oklahoma City"}/>
      </IonContent>
      <Toolbar />
    </IonPage>
    
    </>
    
  );
};

export default Home;

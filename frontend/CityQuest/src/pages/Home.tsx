import { IonButton, IonCard, IonContent, IonHeader, IonPage, IonSearchbar, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import '.././stylesheets/Home.css';
import Toolbar from '../components/Toolbar';

const Home: React.FC = () => {
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

      </IonContent>
     
    </IonPage>
    
    </>
    
  );
};

export default Home;

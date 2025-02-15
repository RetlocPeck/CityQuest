import { IonButton, IonCard, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import '.././stylesheets/Home.css';

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Blank</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Blank</IonTitle>
          </IonToolbar>
        </IonHeader>
      {/**
       * 
       * Map will be on this screen
       * 
       * Add a toolbar at bottom that contains buttons for:
       * - Acccount, Achievments
       */}
       <IonCard>
        <IonToolbar>
          <IonButton>Account</IonButton>
          <IonButton>Achievments</IonButton>
        </IonToolbar>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Home;

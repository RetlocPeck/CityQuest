import { IonButton, IonIcon, IonCard, IonContent, IonHeader, IonPage, IonSearchbar, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import '.././stylesheets/Home.css';
import Toolbar from '../components/Toolbar';
import { arrowBackOutline } from 'ionicons/icons';
const Diary: React.FC = () => {
    return (
        <IonPage>
          <IonContent fullscreen className="profile-bg">
            <IonToolbar color="clear">
              <IonButton
                size="large"
                color="dark"
                fill="clear"
                routerLink="/home"
              >
                <IonIcon icon={arrowBackOutline}></IonIcon>
              </IonButton>
    
              <IonButton
                slot="end"
                color="dark"
                fill="clear"
                routerLink="/settings"
                size="large"
              >
              </IonButton>
            </IonToolbar>
    
            <div className="profile">
              <IonCard className="card1">

              </IonCard>
              <IonCard className="card2">
              </IonCard>
            </div>
         
            <Toolbar />
          </IonContent>
          
        </IonPage>
      );
};

export default Diary;

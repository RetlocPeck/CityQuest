import { IonButton, IonIcon, IonCard, IonCol, IonContent, IonHeader, IonPage, IonRow, IonTitle, IonToolbar } from '@ionic/react';
import '.././stylesheets/Profile.css';
import { useEffect, useState } from 'react';
import { arrowBackOutline } from 'ionicons/icons';

const Profile: React.FC = () => {

    const [error, setError] = useState(""); //Stores the error message if there is one
    const [visitationStatuses, setVisitationStatuses] = useState([]); //Stores the current vistation statuses

    useEffect(() => {
        const fetchUserProfile = async () => {
        try{
            const results = await fetch("url", {}); // Fetch posts data from the external function
        } catch (e) {
            console.error(e);
            setError("Error loading achievements list");
        };
        };
        fetchUserProfile();
      }, []);

  return (
    <IonPage>
    <IonContent fullscreen className="signup-bg">
        <IonCard>
            <IonRow>
                <IonToolbar>
                    <IonButton fill='clear' routerLink='/home'>
                    <IonIcon icon={arrowBackOutline}></IonIcon>
                    </IonButton>
                </IonToolbar>
            </IonRow>
            
            <IonRow>
                <IonCol size="3" className="profile-picture">
                    <img src="path_to_profile_picture" alt="Profile" />
                </IonCol>
                <IonCol size="9" className="username">
                    <h2>Username</h2>
                </IonCol>
            </IonRow>
        </IonCard>
        <IonCard className="main-card">
            
            {visitationStatuses.map((status, index) => (
                <IonRow key={index}>
                    <IonCol size="12">
                        <p>{status}</p>
                    </IonCol>
                </IonRow>
            ))}

        </IonCard>
        
    </IonContent>
    </IonPage>
  );
};

export default Profile;

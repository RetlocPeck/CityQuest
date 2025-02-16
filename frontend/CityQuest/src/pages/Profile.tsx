import {
  IonButton,
  IonIcon,
  IonCard,
  IonCol,
  IonContent,
  IonHeader,
  IonPage,
  IonRow,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import ".././stylesheets/Profile.css";
import { useEffect, useState } from "react";
import { arrowBackOutline, settingsOutline } from "ionicons/icons";
import Toolbar from "../components/Toolbar";

import star from "./pin.png";
const Profile: React.FC = () => {
  const [error, setError] = useState(""); //Stores the error message if there is one
  const [visitationStatuses, setVisitationStatuses] = useState([]); //Stores the current vistation statuses

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const results = await fetch("url", {}); // Fetch posts data from the external function
      } catch (e) {
        console.error(e);
        setError("Error loading achievements list");
      }
    };
    fetchUserProfile();
  }, []);

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
            <IonIcon icon={settingsOutline}></IonIcon>
          </IonButton>
        </IonToolbar>

        <div className="profile">
          <IonCard className="card1">
            <img
              className="profpic"
              src={star}
              alt="Star"
              style={{ width: "80px" }}
            />
            <div className="labels">
              <div className="username">Name:</div>
              <div className="username">Email:</div>
            </div>
          </IonCard>
          <IonCard className="card2">
            {visitationStatuses.map((status, index) => (
              <IonRow key={index}>
                <IonCol size="12">
                  <p>{status}</p>
                </IonCol>
              </IonRow>
            ))}
          </IonCard>
        </div>
     
        <Toolbar />
      </IonContent>
      
    </IonPage>
  );
};

export default Profile;

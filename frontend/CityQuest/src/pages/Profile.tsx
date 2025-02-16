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
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { app, analytics, auth, firestore, storage } from '../firebase-config';

import star from "./pin.png";
const Profile: React.FC = () => {
  const [error, setError] = useState(""); //Stores the error message if there is one
  const [name, setName] = useState<string>(""); // Stores the user's name
  const [email, setEmail] = useState<string>(""); // Stores the user's email
  const [visitationStatuses, setVisitationStatuses] = useState([]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const user = auth.currentUser; // Get the currently authenticated user
        if (user) {
          // Fetch user data from Firestore
          const userDocRef = doc(firestore, "users", user.uid); // Reference to the user's document in Firestore
          const userDocSnap = await getDoc(userDocRef); // Get the document snapshot
          
          if (userDocSnap.exists()) {
            // If document exists, extract the name and email
            const userData = userDocSnap.data();
            setName(userData.displayName || "No name found");
            setEmail(userData.email || "No email found");
          } else {
            setError("User data not found.");
          }
        }
      } catch (e) {
        console.error(e);
        setError("Error loading user profile");
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
              <div className="username">Name: {name}</div>
              <div className="username">Email: {email}</div>
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
function setEmail(arg0: any) {
    throw new Error("Function not implemented.");
}

function setName(arg0: any) {
    throw new Error("Function not implemented.");
}


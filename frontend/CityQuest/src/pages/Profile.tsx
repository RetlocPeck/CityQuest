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
  IonText,
} from "@ionic/react";
import ".././stylesheets/Profile.css";
import { useEffect, useState } from "react";
import { arrowBackOutline, settingsOutline } from "ionicons/icons";
import Toolbar from "../components/Toolbar";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { app, analytics, auth, firestore, storage } from '../firebase-config';

import star from "./pin.png";
import { onAuthStateChanged } from "@firebase/auth";
const Profile: React.FC = () => {
  const [error, setError] = useState(""); //Stores the error message if there is one
  const [name, setName] = useState<string>(""); // Stores the user's name
  const [email, setEmail] = useState<string>(""); // Stores the user's email
  const [visitationStatuses, setVisitationStatuses] = useState([]);
  const [loading, setLoading] = useState<boolean>(true); // Tracks loading state


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // If the user is authenticated, fetch the user profile data
        fetchUserProfile(user.uid);
      } else {
        // If the user is not authenticated, handle it accordingly
        setError("User not authenticated.");
        setLoading(false); // Stop loading when user is not authenticated
      }
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const userDocRef = doc(firestore, "users", userId); // Get the user's document reference from Firestore
      const userDocSnap = await getDoc(userDocRef); // Fetch the document snapshot

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setName(userData.displayName || "No name found"); // Set the name from the document data
        setEmail(userData.email || "No email found"); // Set the email from the document data
      } else {
        setError("User data not found.");
      }
    } catch (e) {
      console.error(e);
      setError("Error loading user profile.");
    } finally {
      setLoading(false); // Stop loading once the data is fetched
    }
  };
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
             {loading ? (
          <IonText className="username">Loading...</IonText> 
        ) : (
            <div className="labels">
              <div className="username">{name}</div>
              <div className="email">{email}</div>
            </div>
                )}
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

import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonCardContent,
  IonCard,
  IonCardHeader,
  IonRow,
  IonCol,
  IonCardTitle,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import ExploreContainer from "../components/ExploreContainer";
import { useEffect, useState } from "react";
import "../stylesheets/SignUp.css";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { signUp } from '../services/authService';
import { app, analytics, auth, firestore, storage } from '../firebase-config';

import star from "./sparkles.gif";

const SignUp: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastSecond: "",
    password: "",
    email: "",
    city: "",
  });

const history = useHistory();
const goToHome = () => {
  history.push("/home");
};

  const handleSignup = async () => {
      var user;
      

      
      try {
        const userCredential = await signUp(formData.email, formData.password);
        console.log("Signed up successfully!", userCredential.user);
        user = userCredential.user;
        // Save additional user data to Firestore
        await setDoc(doc(firestore, "users", user.uid), {
          email: user.email,
          createdAt: new Date(),
          displayName: formData.firstName + " " + formData.lastSecond,
          pinnedCities: [formData.city],
          distanceTraveled: 0,
        });
        goToHome();
      } catch (error) {
        console.error("Signup error:", error);
        // Optionally, show an error message to the user
      }

      
    };

  const sendUserData = async () => {
    const response = await fetch("url/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      console.log("signup successful");
    } else {
      console.log("signup failed");
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="signup-bg">
      <div className="signup-center-con">
      <img src= {star} alt="Star animation" style = {{width: "150px"}} />

        <IonCard className="signup-card1">
          <IonCardHeader>
            <IonCardTitle className="signup-initial-title">CityQuest</IonCardTitle>
          </IonCardHeader>

          <IonCardContent className="signup-topalign">
            <div className="signup-buttons">
              
                <input className="signup-textboxes"
                placeholder="First Name"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
      
              <input className="signup-textboxes"
                placeholder="Last Name"
                type="text"
                value={formData.lastSecond}
                onChange={(e) =>
                  setFormData({ ...formData, lastSecond: e.target.value })
                }
              />
              <input className="signup-textboxes"
                placeholder="Email"
                type="text"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              <input className="signup-textboxes"
                placeholder="Password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              </div>
              </IonCardContent>
              </IonCard>
              <IonCard className="signup-card2">
              <IonCardHeader className = "signup-citybox">
                  Enter your current city below:
              </IonCardHeader>
                  <IonCardContent className="signup-topalign">
                  <div className="signup-buttons">
                  <input className="signup-textboxes"
                placeholder="City"
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                
              />
              </div>
              </IonCardContent>
              <IonButton
                className="signup-hover-solid wide"
                fill="clear"
                onClick={handleSignup}
              >
                Submit
              </IonButton>
              </IonCard>
              </div>
      </IonContent>
    </IonPage>
  );
};

export default SignUp;
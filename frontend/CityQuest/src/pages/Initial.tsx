import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonRow,
  IonCol,
  IonRouterLink,
  IonItem,
  IonLabel,
  IonInput
} from "@ionic/react";
import ExploreContainer from "../components/ExploreContainer";

import "../stylesheets/Initial.css";
import star from "./pin.png";

import React, { useState } from 'react';
import { login } from '../services/authService';
import { useHistory } from "react-router-dom";

const Initial: React.FC = () => {

  /**
   * TODO:
   *
   * Add quick explanation of the product
   * Add Title Toolbar and fix it to where you pass in custom components
   */

  const history = useHistory(); // for navigation
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Function to handle login
  const handleLogin = async () => {
    try {
      const userCredential = await login(email, password);
      console.log("Logged in successfully!", userCredential.user);
      // Here you could navigate to another page (e.g., using history.push or IonRouter)
      history.push("/home");
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === "auth/invalid-credential") {
        setPassword("");
      }
      // Optionally, show an error message to the user
    }
  };

  return (
    <IonPage >
      <IonContent fullscreen className="initial-initial-bg">

        <div className="initial-center-con">
          {/*TOP CARD*/}
          <IonCard className="initial-card1">
          <img src= {star} alt="Star animation" style = {{width: "70px"}} />

            {/*CITY QUEST LABEL*/}
            <IonCardHeader>
              <IonCardTitle className="initial-initial-title">
                Sign in with email
              </IonCardTitle>
              <IonCardTitle className="initial-initial-body">
                Get started exploring your city and seeing the world
              </IonCardTitle>
            </IonCardHeader>

            <IonCardContent >
              {/*TOP CARD BUTTONS*/}
              <div className="initial-buttons">
              {/*USERNAME*/}
              {/* Email Input */}
              <IonItem>
                  {/* <IonLabel position="floating">Email</IonLabel> */}
                  <IonInput
                  className = "initial-input"
                    type="text"
                    value={email}
                    placeholder="Email"
                    onIonInput={(e) => setEmail(e.detail.value!)}
                  />
                </IonItem>
                {/* Password Input */}
                <IonItem>
                  {/* <IonLabel position="floating">Password</IonLabel> */}
                  <IonInput
                   className = "initial-input"
                    type="password"
                    value={password}
                    placeholder="Password"
                    onIonInput={(e) => setPassword(e.detail.value!)}
                  />
                </IonItem>
                <IonButton className="initial-hover-solid" fill="clear" onClick={handleLogin}>
                  Get Started
                </IonButton>
     </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Initial;

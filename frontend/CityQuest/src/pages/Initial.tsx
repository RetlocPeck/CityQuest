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
import star from "./star.gif";

import React, { useState } from 'react';
import { login } from '../services/authService';

const Initial: React.FC = () => {

  /**
   * TODO:
   *
   * Add quick explanation of the product
   * Add Title Toolbar and fix it to where you pass in custom components
   */

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Function to handle login
  const handleLogin = async () => {
    try {
      const userCredential = await login(email, password);
      console.log("Logged in successfully!", userCredential.user);
      // Here you could navigate to another page (e.g., using history.push or IonRouter)
    } catch (error) {
      console.error("Login error:", error);
      // Optionally, show an error message to the user
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="initial-bg">

        <div className="center-con">
        <img src= {star} alt="Star animation" style = {{width: "200px"}} />

          {/*TOP CARD*/}
          <IonCard className="card1">
            {/*CITY QUEST LABEL*/}
            <IonCardHeader>
              <IonCardTitle className="initial-title">
                CityQuest
              </IonCardTitle>
            </IonCardHeader>

            <IonCardContent className="topalign">
              {/*TOP CARD BUTTONS*/}
              <div className="buttons">
              {/*USERNAME*/}
              {/* Email Input */}
              <IonItem>
                  {/* <IonLabel position="floating">Email</IonLabel> */}
                  <IonInput
                    type="text"
                    value={email}
                    placeholder="Username"
                    onIonChange={(e) => setEmail(e.detail.value!)}
                  />
                </IonItem>
                {/* Password Input */}
                <IonItem>
                  {/* <IonLabel position="floating">Password</IonLabel> */}
                  <IonInput
                    type="password"
                    value={password}
                    placeholder="Password"
                    onIonChange={(e) => setPassword(e.detail.value!)}
                  />
                </IonItem>
                <IonRouterLink routerLink="/home">
                  <IonButton className="hover-solid wide" fill="clear">
                    Log In
                  </IonButton>
                </IonRouterLink>
              </div>
            </IonCardContent>
          </IonCard>
          <div className="or-container">
  <div className="line"></div>
  <span className="or-text">or</span>
  <div className="line"></div>
</div>

          {/*BOTTOM CARD*/}
          <IonCard className="card2">
            <IonRouterLink routerLink="/sign-up">
              <IonButton className="hover-solid signup" fill="clear">
                Sign Up
              </IonButton>
            </IonRouterLink>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Initial;

import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonInput,
  IonButton,
  IonText,
  IonRouterLink,
} from "@ionic/react";
import React, { useState } from 'react';
import { login } from '../services/authService'; // Import login function
import { useHistory } from "react-router-dom";
import "../stylesheets/Initial.css";
import star from "../assets/pin.png";

const Initial: React.FC = () => {
  const history = useHistory(); // For navigation
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>(""); // State for error message

  // Function to handle login
  const handleLogin = async () => {
    try {
      // Attempt login
      const userCredential = await login(email, password);
      console.log("Logged in successfully!", userCredential.user);

      // If successful, redirect to home
      history.push("/home");
    } catch (error: any) {
      console.error("Login error:", error);

      // If login fails, show error message and provide a link to sign-up
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        setErrorMessage(
          "Invalid credentials. "
        );
      } else {
        setErrorMessage("It looks like these credientials are not found!");
      }
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="initial-initial-bg">
        <div className="initial-center-con">
          {/*TOP CARD*/}
          <IonCard className="initial-card1">
            <img src={star} alt="Star animation" style={{ width: "70px" }} />
            {/*CITY QUEST LABEL*/}
            <IonCardHeader>
              <IonCardTitle className="initial-initial-title">
                Sign in with email
              </IonCardTitle>
              <IonCardTitle className="initial-initial-body">
                Get started exploring your city and seeing the world
              </IonCardTitle>
            </IonCardHeader>

            <IonCardContent>
              {/*Login Form*/}
              <div className="initial-buttons">
                {/* Email Input */}
                <IonItem>
                  <IonInput
                    className="initial-input"
                    type="text"
                    value={email}
                    placeholder="Email"
                    onIonInput={(e) => setEmail(e.detail.value!)}
                  />
                </IonItem>
                {/* Password Input */}
                <IonItem>
                  <IonInput
                    className="initial-input"
                    type="password"
                    value={password}
                    placeholder="Password"
                    onIonInput={(e) => setPassword(e.detail.value!)}
                  />
                </IonItem>
                <IonButton className="initial-hover-solid" fill="clear" onClick={handleLogin}>
                  Get Started
                </IonButton>

                {/* Display error message if login fails */}
                {errorMessage && (
                  <IonText color="danger" className="login-error-message">
                    {errorMessage}{" "}
                    <IonRouterLink href={`/sign-up?email=${encodeURIComponent(email)}`} color="primary">
                      Click here to sign up.
                    </IonRouterLink>
                  </IonText>
                )}
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Initial;

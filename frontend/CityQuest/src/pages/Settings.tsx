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
  import ExploreContainer from "../components/ExploreContainer";
  import { useEffect, useState } from "react";
  import "../stylesheets/SignUp.css";
  import "../stylesheets/Initial.css";
  
  const Settings: React.FC = () => {


  
    return (
      <IonPage>
        <IonContent fullscreen className="signup-bg">
        </IonContent>
      </IonPage>
    );
  };
  
  export default Settings;
  
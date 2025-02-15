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
  import { useEffect, useState } from "react";
  import "../stylesheets/Settings.css";
  
  const Settings: React.FC = () => {


  
    return (
      <IonPage>
        <IonContent fullscreen className="signup-bg">
          <IonHeader>
            <IonToolbar>
              <IonTitle>Account Settings</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Edit Profile</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonRow>
                <IonCol>
                  <IonButton expand="block">Change Username</IonButton>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonButton expand="block">Change Email</IonButton>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonButton expand="block">Change Password</IonButton>
                </IonCol>
              </IonRow>
            </IonCardContent>
          </IonCard>
        </IonContent>
      </IonPage>
    );
  };
  
  export default Settings;
  
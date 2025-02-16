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
    IonIcon,
  } from "@ionic/react";
   
  import { useEffect, useState } from "react";
  import "../stylesheets/Settings.css";
  import { arrowBackOutline } from "ionicons/icons";
  
  const Settings: React.FC = () => {


  
    return (
      <IonPage>
        <IonContent fullscreen className="signup-bg">
          <IonHeader>
            <IonToolbar>
              <IonTitle>Account Settings</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonCard className="main-card">
            <IonCardHeader>
              <IonToolbar>
              <IonButton size='large' fill='clear' routerLink='/home'>
              <IonIcon icon={arrowBackOutline}></IonIcon>
            </IonButton>
              </IonToolbar>

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
  
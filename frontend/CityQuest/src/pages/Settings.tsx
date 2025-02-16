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
  import cog from "./nanner.gif";

  
  const Settings: React.FC = () => {


  
    return (
      <IonPage>
        <IonContent fullscreen className="settings-bg">
     
        

        <IonButton
            size="large"
            color="warning"
            fill="clear"
            routerLink="/profile"
          >
            <IonIcon icon={arrowBackOutline}></IonIcon>
          </IonButton>

          <div className="cog-center">
        <img src={cog}  alt="Cog animation" style={{ width: "150px" }}/>
       

        
          <IonCard className = "settings-main-card">
            
            <IonCardHeader>
        
                

              <IonCardTitle className = "settings-title">Edit Profile</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonRow>
                <IonCol>
                  <IonButton fill = "clear" className = "settings-buttons">Change Username</IonButton>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonButton fill = "clear" className = "settings-buttons">Change Email</IonButton>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonButton fill = "clear" className = "settings-buttons">Change Password</IonButton>
                </IonCol>
              </IonRow>
            </IonCardContent>
          </IonCard>
          </div>
        </IonContent>
       
      </IonPage>
    );
  };
  
  export default Settings;
  
import { IonToolbar, IonTitle, IonButton, IonIcon, IonSearchbar } from "@ionic/react";
import './Toolbar.css';
import accountImg from "../assets/account.png";
import { mapOutline, bookOutline, starOutline, personOutline} from "ionicons/icons";


//Add option to pass in custom buttons /home or settings
const Toolbar = () => {
    return (
        <>
        <IonToolbar  color = "clear">
            <div className = "bg">
            <IonButton
            className = "tool-button"
            fill = "clear"
              href = "/home"
              color = "light"
              size = "large"
     
   
            >
                <IonIcon icon={mapOutline}></IonIcon>
            </IonButton>


            <IonButton
             className = "tool-button"
            fill = "clear"
              href = "/achievements"
              color = "light"
              size = "large"
            >
                <IonIcon icon={starOutline}></IonIcon>
            </IonButton>


            <IonButton
             className = "tool-button"
            fill = "clear"
            color = "light"
              href = "/profile"
              size = "large"
            >
                <IonIcon icon={personOutline}></IonIcon>
            </IonButton>

            <IonButton
             className = "tool-button"
            fill = "clear"
            color = "light"
              href = "/diary"
              size = "large"
            >
                <IonIcon icon={bookOutline}></IonIcon>
            </IonButton>
            </div>

        </IonToolbar>
        </>
    )
};

export default Toolbar;
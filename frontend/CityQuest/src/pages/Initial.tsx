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
} from "@ionic/react";
import ExploreContainer from "../components/ExploreContainer";

import "../stylesheets/Initial.css";
import star from "./star.gif";

const Initial: React.FC = () => {
  /**
   * TODO:
   *
   * Add quick explanation of the product
   * Add Title Toolbar and fix it to where you pass in custom components
   */

  return (
    <IonPage>
      <IonContent fullscreen className="initial-bg">

        <div className="center-con">
        <img src= {star} alt="Star animation" style = {{width: "200px"}} />

          <IonCard className="card1">
            <IonCardHeader>
              <IonCardTitle className="initial-title">
                CityQuest
              </IonCardTitle>
            </IonCardHeader>

            <IonCardContent className="topalign">
              <div className="buttons">
              <input className="textboxes signup"
                placeholder="Username"
                  type="text"
                  />
                 <input className="textboxes signup"
                placeholder="Password"
                  type="text"
                  />
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

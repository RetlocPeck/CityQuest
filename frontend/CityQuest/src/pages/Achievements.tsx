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
import star from "./star.gif";
import shadow from "./shadow.png";
import "../stylesheets/Achievements.css";
import { useEffect, useState } from "react";

const Achievements: React.FC = () => {
  const [achievements, setAchievements] = useState([]); //Stores the achievements
  const [loadingState, setLoadingState] = useState(true); //Stores the current loading state
  const [error, setError] = useState(""); //Stores the error message if there is one

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const results = await fetch("url", {}); // Fetch posts data from the external function
      } catch (e) {
        console.error(e);
        setError("Error loading achievements list");
      }
    };
    fetchPosts();
  }, []);

  return (
    <>
      <IonPage>
        <IonContent className="a-initial-bg">
          <div className="star">
            <img src={star} alt="Star animation" style={{ width: "200px"}} />
        
          <IonCard className="a-card"> 
          <div className="a-card-title"> Achievements </div>

 {/**
                 * CARDS GO HERE!!!!!!!
                 */}
            
          </IonCard>
          </div>
        </IonContent>
      </IonPage>
      
      {loadingState ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <IonContent>
          {achievements.map((achievement, index) => (
            <IonCard key={index}>
              <IonCardHeader>
                {/**
                 * Once the structuer of an achievemnet model is known
                 * iterate over the achievements and display information
                 */}
                <IonCardTitle>{/**achievement.title*/}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>{/**achievement.description*/}</IonCardContent>
            </IonCard>
          ))}
        </IonContent>
      )}
    </>
  );
};

export default Achievements;

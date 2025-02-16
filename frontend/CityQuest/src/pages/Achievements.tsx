import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonRow,
  IonCol,
  IonGrid,
  IonCard,
} from "@ionic/react";
import Toolbar from '../components/Toolbar';

import ExploreContainer from "../components/ExploreContainer";
import pin from "./pin.png";
import star from "./star.gif";
import "../stylesheets/Achievements.css";
import { useEffect, useState } from "react";

const Achievements: React.FC = () => {
  const [achievements, setAchievements] = useState([]); // Stores the achievements
  const [loadingState, setLoadingState] = useState(true); // Stores the current loading state
  const [error, setError] = useState(""); // Stores the error message if there is one

  const [completedAchievements, setCompletedAchievements] = useState(
    new Set<number>() // Set to track completed achievements
  );


  
    // Sample placeholder for achievements (custom sample data)
    const sampleAchievements = [
      {
        id: 0,
        title: "First Achievement",
        description: "Complete your first task.",
        imageUrl: pin,
      },
      {
        id: 1,
        title: "Level Up",
        description: "Reach level 10.",
        imageUrl: pin,
      },
      {
        id: 2,
        title: "Explorer",
        description: "Explore 100 locations.",
        imageUrl: pin,
      },
      {
        id: 3,
        title: "Social Butterfly",
        description: "Make 50 new friends.",
        imageUrl: pin,
      },
      {
        id: 4,
        title: "Master Coder",
        description: "Complete 100 coding challenges.",
        imageUrl: pin,
      },
      {
        id: 5,
        title: "Night Owl",
        description: "Stay awake past midnight for a week.",
        imageUrl: pin,
      },
      {
        id: 6,
        title: "Photographer",
        description: "Take 200 photos.",
        imageUrl: pin,
      },
      {
        id: 7,
        title: "World Traveler",
        description: "Visit 50 countries.",
        imageUrl: pin,
      },
    ];
  
    const handleCompletion = (id: number) => {
      setCompletedAchievements((prev) => new Set(prev).add(id));
    };

  return (
    <>
      <IonPage>
        <IonContent className="a-initial-bg">
          <div className="star">
            <img src={star} alt="Star animation" style={{ width: "150px" }} />
          </div>
          <IonCard className="a-card">
          <div className="a-card-title">Achievements</div>

          {/* Create a 2-column layout */}
          <IonGrid>
            <IonRow>
              {sampleAchievements.map((achievement) => (
                <IonCol size="6" key={achievement.id}>
                 <div
                    className="achievement-item"
                    onClick={() => handleCompletion(achievement.id)}
                  >
                   <img
                      src={achievement.imageUrl}
                      alt={achievement.title}
                      className={`achievement-image ${completedAchievements.has(achievement.id) ? 'completed' : 'incomplete'}`}
                      />
                    <div className="achievement-description">
                      <h3>{achievement.title}</h3>
                      <p>{achievement.description}</p>
                    </div>
                  </div>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
         </IonCard>
          <Toolbar />
        </IonContent>
      </IonPage>

      {loadingState ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <IonContent>
          {achievements.map((achievement, index) => (
            <div key={index}>
              <h3>{/**achievement.title*/}</h3>
              <p>{/**achievement.description*/}</p>
            </div>
          ))}
        </IonContent>
      )}
    </>
  );
};

export default Achievements;

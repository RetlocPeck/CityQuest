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
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { app, analytics, auth, firestore, storage } from '../firebase-config';
import { getAuth } from 'firebase/auth';
import { onAuthStateChanged } from "@firebase/auth";
import ExploreContainer from "../components/ExploreContainer";
import pin from "../assets/reddpin.png";
import star from "../assets/star.gif";
import "../stylesheets/Achievements.css";
import { useEffect, useState } from "react";
import { circle } from "@turf/turf";


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
        title: "Beginner Adventurer",
        description: "A badge for a fledgeling adventurer. Travel 10 meters.",
        criteria: 10,
        imageUrl: pin,
      },
      {
        id: 1,
        title: "Novice Adventurer",
        description: "A badge for those with some interest in exploring. Travel 100 meters.",
        criteria: 100,
        imageUrl: pin,
      },
      {
        id: 2,
        title: "Apprentice Adventurer",
        description: "A badge for adventurers well versed in their surroundings. Travel 3 kilometers.",
        criteria: 3000,
        imageUrl: pin,
      },
      {
        id: 3,
        title: "Master Adventurer",
        description: "A title fit for only the most active of adventurers. Travel 50 kilometers.",
        criteria: 50000,
        imageUrl: pin,
      },
      {
        id: 4,
        title: "Getting the Hang of It",
        description: "Level up for the first time.",
        imageUrl: pin,
        criteria: 100000,
      },
      {
        id: 5,
        title: "Night Owl",
        description: "Stay awake past midnight for a week.",
        imageUrl: pin,
        criteria: 100000,
      },
    ];
  
    useEffect(() => {
      const fetchUserDistance = async (user: any) => {
        try {
          const db = getFirestore();
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const distanceTravelled = userData.distanceTravelled || 0;
            console.log("Distance travelled:", distanceTravelled);
  
            // Determine completed achievements
            const completed = new Set<number>();
            sampleAchievements.forEach((achievement) => {
              if (distanceTravelled >= achievement.criteria) {
                completed.add(achievement.id);
              }
            });
  
            setCompletedAchievements(completed);
          } else {
            setError("User data not found.");
          }
        } catch (err) {
          setError("Error fetching user data.");
          console.error(err);
        } finally {
          setLoadingState(false);
        }
      };
  
      const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
        if (user) {
          console.log("User authenticated:", user.email);
          fetchUserDistance(user);
        } else {
          setError("User not authenticated.");
          setLoadingState(false);
        }
      });
  
      // Cleanup the listener when the component unmounts
      return () => unsubscribe();
    }, []);


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

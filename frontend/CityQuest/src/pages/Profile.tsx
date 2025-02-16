import {
    IonButton,
    IonIcon,
    IonCard,
    IonCol,
    IonContent,
    IonHeader,
    IonPage,
    IonRow,
    IonTitle,
    IonToolbar,
    IonText,
    IonProgressBar,
    IonInput,
    IonLabel,
  } from "@ionic/react";
  import ".././stylesheets/Profile.css";
  import { useEffect, useState } from "react";
  import { arrowBackOutline, checkmarkOutline, settingsOutline } from "ionicons/icons";
  import Toolbar from "../components/Toolbar";
  import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
  import { app, analytics, auth, firestore, storage } from '../firebase-config';
  
  import star from "../assets/pin.png";
  import { onAuthStateChanged } from "@firebase/auth";
  
  const Profile: React.FC = () => {
    const [error, setError] = useState(""); //Stores the error message if there is one
    const [name, setName] = useState<string>(""); // Stores the user's name
    const [email, setEmail] = useState<string>(""); // Stores the user's email
    const [pinnedCities, setPinnedCities] = useState<any[]>([]); // Stores the pinned cities
    const [loading, setLoading] = useState<boolean>(true); // Tracks loading state
    const [newCityName, setNewCityName] = useState<string>(""); // Stores new city name
    const [showInput, setShowInput] = useState<boolean>(false); // Controls the visibility of the city input
  
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          fetchUserProfile(user.uid);
          fetchPinnedCities(user.uid); // Fetch pinned cities for the user
        } else {
          setError("User not authenticated.");
          setLoading(false);
        }
      });
  
      return () => unsubscribe();
    }, []);
  
    const fetchUserProfile = async (userId: string) => {
      try {
        const userDocRef = doc(firestore, "users", userId);
        const userDocSnap = await getDoc(userDocRef);
  
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setName(userData.displayName || "No name found");
          setEmail(userData.email || "No email found");
        } else {
          setError("User data not found.");
        }
      } catch (e) {
        console.error(e);
        setError("Error loading user profile.");
      } finally {
        setLoading(false);
      }
    };
  
    const fetchPinnedCities = async (userId: string) => {
        try {
          const userDocRef = doc(firestore, "users", userId);
          const userDocSnap = await getDoc(userDocRef);
      
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setPinnedCities(userData?.pinnedCities || []); // Fetch the pinned cities array
          } else {
            setError("User data not found.");
          }
        } catch (e) {
          console.error(e);
          setError("Error loading pinned cities.");
        }
      };
      
      
  
    // Function to calculate the exploration progress for a city
    const calculateProgress = (city: any) => {
      const totalLocations = city.totalLocations || 1;
      const visitedLocations = city.visitedLocations || 0;
      return (visitedLocations / totalLocations) * 100;
    };
  
    const addCity = async () => {
        if (!newCityName) {
          setError("Please enter a city name.");
          return;
        }
      
        const userId = auth.currentUser?.uid;
        if (!userId) {
          setError("User not authenticated.");
          return;
        }
      
        try {
          const userDocRef = doc(firestore, "users", userId);
          await setDoc(
            userDocRef,
            {
              pinnedCities: [...pinnedCities, newCityName], // Add new city to the array
            },
            { merge: true } // Merge with existing data, so other fields aren't overwritten
          );
      
          setPinnedCities((prev) => [...prev, newCityName]);
          setNewCityName(""); // Clear input after adding city
          setShowInput(false); // Hide the input field
        } catch (e) {
          console.error(e);
          setError("Error adding city.");
        }
      };
      
  
    return (
      <IonPage>
        <IonContent fullscreen className="profile-bg">
          <IonToolbar color="clear">
            <IonButton size="large" color="dark" fill="clear" routerLink="/home">
              <IonIcon icon={arrowBackOutline}></IonIcon>
            </IonButton>
            <IonButton
              slot="end"
              color="dark"
              fill="clear"
              routerLink="/settings"
              size="large"
            >
              <IonIcon icon={settingsOutline}></IonIcon>
            </IonButton>
          </IonToolbar>
  
          <div className="profile">
            <IonCard className="card1">
              <img className="profpic" src={star} alt="Star" style={{ width: "80px" }} />
              {loading ? (
                <IonText className="username">Loading...</IonText>
              ) : (
                <div className="labels">
                  <div className="username">{name}</div>
                  <div className="email">{email}</div>
                </div>
              )}
            </IonCard>
  
            <IonCard className="card2">
            {pinnedCities.map((city, index) => (
  <IonRow key={index}>
    <IonCol size="12">
        <div className="progress">
        <p className = "cityname">{city} </p>{/* City is now a string in this case */}
      <IonProgressBar className = "bars" value={calculateProgress(city) / 100} />
      <p >{calculateProgress(city).toFixed(2)}% explored</p>
      </div>
    </IonCol>
  </IonRow>
))}

  
              {showInput ? (
                <div>
                  <IonInput
                    value={newCityName}
                    onIonChange={(e) => setNewCityName(e.detail.value!)}
                    placeholder="City name"
                  />
                <IonIcon icon={checkmarkOutline} color="dark"onClick={() => {
    addCity(); 
    setShowInput(false); 
  }}></IonIcon>
                </div>
              ) : (
                <IonButton className="profile-hover-solid" fill="clear" onClick={() => setShowInput(true)}>
                  Add City
                </IonButton>
              )}
            </IonCard>
          </div>
  
          <Toolbar />
        </IonContent>
      </IonPage>
    );
  };
  
  export default Profile;
  
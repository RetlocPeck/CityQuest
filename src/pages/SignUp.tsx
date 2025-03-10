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
    IonRouterLink,
  IonRow,
  IonCol,
  IonCardTitle,
  IonText,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import ExploreContainer from "../components/ExploreContainer";
import { useEffect, useState } from "react";
import "../stylesheets/SignUp.css";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { signUp } from '../services/authService';
import { app, analytics, auth, firestore, storage } from '../firebase-config';



import star from "../assets/sparkles.gif";


const SignUp: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    email: "",
    city: "",
  });

const history = useHistory();
const [errorMessage, setErrorMessage] = useState<string>(""); 

const goToHome = () => {
  history.push("/home");
};

  const handleSignup = async () => {
      var user;
      

      
      try {
        const userCredential = await signUp(formData.email, formData.password);
        console.log("Signed up successfully!", userCredential.user);
        user = userCredential.user;
        // Save additional user data to Firestore
        goToHome();

        await setDoc(doc(firestore, "users", user.uid), {
          email: user.email,
          createdAt: new Date(),
          displayName: formData.name,
          pinnedCities: [formData.city],
          distanceTraveled: 0,
        });
        goToHome();
      } catch (error) {
        console.error("Signup error:", error);
        setErrorMessage("Signup failed. Please try again later."); // Set the error message

        // Optionally, show an error message to the user
      }

      
    };

  const sendUserData = async () => {
    const response = await fetch("url/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      console.log("signup successful");
      
    } else {
      console.log("signup failed");
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="signup-bg">
      <div className="signup-center-con">

        <IonCard className="signup-card1">
        <img src= {star} alt="Star animation" style = {{width: "70px"}} />
          <IonCardHeader>
            <IonCardTitle className="signup-initial-title">Sign Up</IonCardTitle>
            <IonCardTitle className="signup-initial-body">Create your account or {" "}
  <IonRouterLink routerLink="/initial">
    log in
  </IonRouterLink></IonCardTitle>

          </IonCardHeader>

          <IonCardContent className="signup-topalign">
            <div className="signup-buttons">
              
                <input className="signup-textboxes"
                placeholder="Name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
      
             
              
              <input className="signup-textboxes"
                placeholder="Email"
                type="text"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              <input className="signup-textboxes"
                placeholder="Password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              </div>
              </IonCardContent>
              </IonCard>
              <IonCard className="signup-card2">

              <IonCardHeader className = "signup-citybox">
                
                  Enter your current city below:
              </IonCardHeader>
                  <IonCardContent className="signup-topalign">
                  <div className="signup-buttons">
                  <input className="signup-textboxes"
                placeholder="City"
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                
              />
              </div>
              </IonCardContent>
              <IonButton
                className="signup-hover-solid wide"
                fill="clear"
                onClick={handleSignup}
              >
                Submit
              </IonButton>
              {errorMessage && (
            <IonText color="danger" className="signup-error-message">
              <p>{errorMessage}</p>
            </IonText>
          )}
              </IonCard>
             
              </div>
      </IonContent>
    </IonPage>
  );
};

export default SignUp;
function setErrorMessage(arg0: string) {
    throw new Error("Function not implemented.");
}


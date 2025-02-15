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
  import ExploreContainer from "../components/ExploreContainer";
  import { useEffect, useState } from "react";
  import "../stylesheets/SignUp.css";

  import star from "./star.gif";
  const SignUp: React.FC = () => {


    const validate = () => {};
  
    const [formData, setFormData] = useState({
      firstName: "",
      lastSecond: "",
      password: "",
      email: "",
      city: "",
    });
  
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
        <div className="center-con">
        <img src= {star} alt="Star animation" style = {{width: "200px"}} />

          <IonCard className="card1 signup">
            <IonCardHeader>
              <IonCardTitle className="initial-title">City Quest</IonCardTitle>
            </IonCardHeader>
  
            <IonCardContent className="topalign">
              <div className="buttons">
                
                  <input className="textboxes signup"
                  placeholder="First Name"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
        
                <input className="textboxes signup"
                  placeholder="Last Name"
                  type="text"
                  value={formData.lastSecond}
                  onChange={(e) =>
                    setFormData({ ...formData, lastSecond: e.target.value })
                  }
                />
                <input className="textboxes signup"
                  placeholder="Email"
                  type="text"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
                <input className="textboxes signup"
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
                <IonCard className="card2 signup">
                <IonCardHeader className = "citybox">
                    Enter your current city below
                </IonCardHeader>
                    <IonCardContent className="topalign">
                    <div className="buttons">
                    <input className="textboxes signup"
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
                  className="hover-solid wide"
                  fill="clear"
                  onClick={sendUserData}
                >
                  Submit
                </IonButton>
                </IonCard>
                </div>
        </IonContent>
      </IonPage>
    );
  };
  
  export default SignUp;
  
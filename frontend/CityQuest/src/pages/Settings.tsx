import {
    IonContent,
    IonButton,
    IonCardContent,
    IonCard,
    IonCardHeader,
    IonRow,
    IonCol,
    IonCardTitle,
    IonInput,
    IonIcon,
    IonText,
    IonPage
  } from "@ionic/react";
  import { useEffect, useState } from "react";
  import "../stylesheets/Settings.css";
  import { arrowBackOutline, checkmarkOutline, closeOutline } from "ionicons/icons";
  import { auth, firestore } from '../firebase-config'; // Ensure you have firebase-config setup correctly
  import { updateProfile, updatePassword } from "firebase/auth";
  import { doc, setDoc, getDoc } from "firebase/firestore";
  import cog from "./nanner.gif";

  const Settings: React.FC = () => {
    const [isEditingName, setIsEditingName] = useState<boolean>(false); 
    const [isEditingPassword, setIsEditingPassword] = useState<boolean>(false); 
    const [newName, setNewName] = useState<string>(""); 
    const [newPassword, setNewPassword] = useState<string>(""); 
    const [originalName, setOriginalName] = useState<string>("User"); 
    const [errorMessage, setErrorMessage] = useState<string>(""); 
    const [successMessage, setSuccessMessage] = useState<string>(""); 
  
    const clearMessage = (setter: React.Dispatch<React.SetStateAction<string>>) => {
        setTimeout(() => {
          setter("");
        }, 5000); // Clear the message after 5 seconds
      };
    // Update user display name in Firebase Authentication
    const handleConfirmNameChange = async () => {
      if (newName !== originalName) {
        try {
          const user = auth.currentUser;
          if (user) {
            // Update the profile in Firebase Authentication
            await updateProfile(user, { displayName: newName });
            setOriginalName(newName); // Update the original name
            setSuccessMessage("Name updated successfully!");
            clearMessage(setSuccessMessage);
  
            // Optionally, update the name in Firestore if needed
            await setDoc(doc(firestore, "users", user.uid), { displayName: newName }, { merge: true });
          }
        } catch (error) {
          setErrorMessage("Error updating name. Please try again.");
          clearMessage(setErrorMessage);
        }
      }
      setIsEditingName(false);
    };
  
    // Update password in Firebase Authentication
    const handleConfirmPasswordChange = async () => {
      if (newPassword !== "") {
        try {
          const user = auth.currentUser;
          if (user) {
            // Update the password in Firebase Authentication
            await updatePassword(user, newPassword);
            setSuccessMessage("Password updated successfully!");
            clearMessage(setSuccessMessage); // Clear success message after 5 seconds

          }
        } catch (error) {
          setErrorMessage("Error updating password. Please try again.");
        clearMessage(setErrorMessage); // Clear error message after 5 seconds
        }
      }
      setIsEditingPassword(false);
    };
  
    // Cancel changes and revert to original name/password
    const handleCancelChange = (type: string) => {
      if (type === "name") {
        setNewName(originalName);
      } else if (type === "password") {
        setNewPassword(""); 
      }
      if (type === "name") setIsEditingName(false);
      else if (type === "password") setIsEditingPassword(false);
    };
    useEffect(() => {
        const fetchUserName = async () => {
          const user = auth.currentUser; // Get the current logged-in user
          if (user) {
            try {
              // Fetch user data from Firestore
              const userDocRef = doc(firestore, "users", user.uid);
              const userDoc = await getDoc(userDocRef);
              
              if (userDoc.exists()) {
                const userData = userDoc.data();
                setOriginalName(userData.displayName || "User");
              } else {
                console.log("No such user document!");
              }
            } catch (error) {
              console.error("Error fetching user name:", error);
            }
          }
        };
    
        fetchUserName();
      }, []);
    return (
      <IonPage>
        <IonContent fullscreen className="settings-bg">
          <IonButton
            size="large"
            color="warning"
            fill="clear"
            routerLink="/profile"
          >
            <IonIcon icon={arrowBackOutline} color = "dark"></IonIcon>
          </IonButton>
  
          <div className="cog-center">
            <div className="label">Hi, {originalName}! </div>
            <img src={cog}  alt="Cog animation" style={{ width: "100px" }}/>

            <IonCard className="settings-main-card">
              <IonCardHeader>
                <IonCardTitle className="settings-title">Edit Profile</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonRow>
                  <IonCol>
                    {!isEditingName ? (
                      <IonButton
                        fill="clear"
                        className="settings-buttons"
                        onClick={() => setIsEditingName(true)}
                      >
                        Change Name
                      </IonButton>
                    ) : (
                      <>
                        <IonInput
                          value={newName}
                          onIonChange={(e) => setNewName(e.detail.value!)}
                          placeholder="Enter new name"
                          clearInput
                          style={{ backgroundColor: "#f0f0f0", color: "#333", borderRadius: "10px" }} 
                        />
                        <IonButton fill="clear" onClick={handleConfirmNameChange}>
                          <IonIcon icon={checkmarkOutline} color="dark"></IonIcon>
                        </IonButton>
                        <IonButton fill="clear" onClick={() => handleCancelChange("name")}>
                          <IonIcon icon={closeOutline} color="dark"></IonIcon>
                        </IonButton>
                      </>
                    )}
                  </IonCol>
                </IonRow>
  
                <IonRow>
                  <IonCol>
                    {!isEditingPassword ? (
                      <IonButton
                        fill="clear"
                        className="settings-buttons"
                        onClick={() => setIsEditingPassword(true)}
                      >
                        Change Password
                      </IonButton>
                    ) : (
                      <>
                        <IonInput
                          value={newPassword}
                          onIonChange={(e) => setNewPassword(e.detail.value!)}
                          placeholder="Enter new password"
                          type="password"
                          clearInput
                          style={{ backgroundColor: "#f0f0f0", color: "#333", borderRadius: "10px" }}
                        />
                        <IonButton fill="clear" onClick={handleConfirmPasswordChange}>
                          <IonIcon icon={checkmarkOutline} color="dark"></IonIcon>
                        </IonButton>
                        <IonButton fill="clear" onClick={() => handleCancelChange("password")}>
                          <IonIcon icon={closeOutline} color="dark"></IonIcon>
                        </IonButton>
                      </>
                    )}
                  </IonCol>
                </IonRow>
              </IonCardContent>
  
              {errorMessage && <IonText color="danger">{errorMessage}</IonText>}
              {successMessage && <IonText color="success">{successMessage}</IonText>}
            </IonCard>
          </div>
        </IonContent>
      </IonPage>
    );
  };
  
  export default Settings;
  
import {
  IonButton,
  IonIcon,
  IonCard,
  IonCol,
  IonContent,
  IonPage,
  IonRow,
  IonToolbar,
  IonText,
} from "@ionic/react";
import "../stylesheets/Profile.css";
import { useEffect, useState } from "react";
import { arrowBackOutline, settingsOutline } from "ionicons/icons";
import Toolbar from "../components/Toolbar";
import { doc, getDoc } from "firebase/firestore";
import { auth, firestore } from "../firebase-config";
import star from "./pin.png";
import { onAuthStateChanged } from "@firebase/auth";
import * as turf from "@turf/turf";

// --- Helper: Fetch City Area using Overpass API (summing areas of all returned elements) ---
const fetchCityAreaOverpass = async (pinnedCity: string): Promise<number> => {
  try {
    // Split "City, State" into components.
    const [cityName, state] = pinnedCity.split(",").map((s) => s.trim());
    console.log(`Debug: Fetching area for ${cityName}, ${state}`);

    // Build Overpass QL query.
    const query = `
      [out:json][timeout:25];
      relation
        ["name"="${cityName}"]
        ["boundary"="administrative"]
        ["admin_level"~"8|9"];
      out geom;
    `.trim();
    console.log("Debug: Overpass query:", query);

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      console.error("Error parsing Overpass response:", parseErr);
      console.error("Response text was:", responseText);
      return 0;
    }
    console.log("Debug: Overpass response data:", data);

    if (data.elements && data.elements.length > 0) {
      let totalArea = 0;
      // Loop over each element returned.
      data.elements.forEach((element: any, index: number) => {
        if (element.bounds) {
          const { minlat, minlon, maxlat, maxlon } = element.bounds;
          console.log(`Debug: Element ${index} bounds -> minlat: ${minlat}, minlon: ${minlon}, maxlat: ${maxlat}, maxlon: ${maxlon}`);
          // Construct bbox in format [minX, minY, maxX, maxY] = [minlon, minlat, maxlon, maxlat]
          const bboxPolygon = turf.bboxPolygon([minlon, minlat, maxlon, maxlat]);
          const area = turf.area(bboxPolygon);
          console.log(`Debug: Area for element ${index}: ${area} m²`);
          totalArea += area;
        } else {
          console.warn(`Debug: Element ${index} has no bounds.`);
        }
      });
      console.log(`Debug: Total calculated area for ${pinnedCity}: ${totalArea} m²`);
      return totalArea;
    }
    console.warn("Debug: No elements returned from Overpass for", pinnedCity);
    return 0;
  } catch (err) {
    console.error("Error fetching city area via Overpass", err);
    return 0;
  }
};


// --- Constant for tile area (assuming each visited tile is ~22.22m x 22.22m ≈ 493.7 m²) ---
const TILE_AREA = 493.7;

interface CityStat {
  city: string; // e.g., "Norman, Oklahoma"
  unlockedArea: number; // in m²
  totalArea: number; // in m²
  percentage: number; // explored percentage
}

const Profile: React.FC = () => {
  // Profile states
  const [error, setError] = useState("");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [visitationStatuses, setVisitationStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New states for pinned cities and city statistics
  const [pinnedCities, setPinnedCities] = useState<string[]>([]);
  const [cityStats, setCityStats] = useState<CityStat[]>([]);

  // Listen for auth changes and fetch user profile data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserProfile(user.uid);
      } else {
        setError("User not authenticated.");
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch user profile from Firestore.
  // Assumes the document contains displayName, email, and pinnedCities.
  const fetchUserProfile = async (userId: string) => {
    try {
      const userDocRef = doc(firestore, "users", userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setName(userData.displayName || "No name found");
        setEmail(userData.email || "No email found");
        if (userData.pinnedCities && Array.isArray(userData.pinnedCities)) {
          setPinnedCities(userData.pinnedCities);
        }
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

  // Calculate city statistics based on visited locations and pinned cities.
  useEffect(() => {
    if (pinnedCities.length === 0) return;

    const calculateCityStats = async () => {
      try {
        const visitedRaw = localStorage.getItem("visitedLocations");
        const visitedLocations: {
          longitude: number;
          latitude: number;
          city: string;
          state: string;
          timestamp: string;
        }[] = visitedRaw ? JSON.parse(visitedRaw) : [];

        const unlockedCountByCity: { [key: string]: number } = {};
        visitedLocations.forEach((loc) => {
          const cityKey = `${loc.city}, ${loc.state}`;
          if (!unlockedCountByCity[cityKey]) {
            unlockedCountByCity[cityKey] = 0;
          }
          unlockedCountByCity[cityKey] += 1;
        });

        const stats: CityStat[] = [];
        for (const pinnedCity of pinnedCities) {
          const tileCount = unlockedCountByCity[pinnedCity] || 0;
          const unlockedArea = tileCount * TILE_AREA;
          // Debug: Log before calling fetchCityAreaOverpass
          console.log(`Debug: Calculating total area for ${pinnedCity} with ${tileCount} tiles (${unlockedArea} m² unlocked)`);
          const totalArea = await fetchCityAreaOverpass(pinnedCity);
          console.log(`Debug: Total area for ${pinnedCity} is ${totalArea} m²`);
          const percentage = totalArea ? (unlockedArea / totalArea) * 100 : 0;
          stats.push({
            city: pinnedCity,
            unlockedArea,
            totalArea,
            percentage,
          });
        }
        setCityStats(stats);
      } catch (err) {
        console.error("Error calculating city stats", err);
      }
    };

    calculateCityStats();
  }, [pinnedCities]);

  // Log pinned cities percentages to the console.
  useEffect(() => {
    if (cityStats.length > 0) {
      console.log("Pinned Cities Exploration Percentages:");
      cityStats.forEach((stat) => {
        console.log(`${stat.city}: ${stat.percentage.toFixed(2)}% explored`);
      });
    }
  }, [cityStats]);

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
            <img
              className="profpic"
              src={star}
              alt="Star"
              style={{ width: "80px" }}
            />
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
            {visitationStatuses.map((status, index) => (
              <IonRow key={index}>
                <IonCol size="12">
                  <p>{status}</p>
                </IonCol>
              </IonRow>
            ))}
          </IonCard>

          {/* New Card: Display City Exploration Statistics */}
          {cityStats.length > 0 && (
            <IonCard className="card3">
              <IonRow>
                <IonCol>
                  <strong>City</strong>
                </IonCol>
                <IonCol>
                  <strong>Unlocked Area (m²)</strong>
                </IonCol>
                <IonCol>
                  <strong>Total Area (m²)</strong>
                </IonCol>
                <IonCol>
                  <strong>Explored (%)</strong>
                </IonCol>
              </IonRow>
              {cityStats.map((stat, idx) => (
                <IonRow key={idx}>
                  <IonCol>{stat.city}</IonCol>
                  <IonCol>{stat.unlockedArea.toFixed(1)}</IonCol>
                  <IonCol>{stat.totalArea.toFixed(1)}</IonCol>
                  <IonCol>{stat.percentage.toFixed(2)}%</IonCol>
                </IonRow>
              ))}
            </IonCard>
          )}
        </div>
        <Toolbar />
      </IonContent>
    </IonPage>
  );
};

export default Profile;
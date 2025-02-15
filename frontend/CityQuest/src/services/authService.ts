// src/services/authService.ts
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, UserCredential } from "firebase/auth";
import { app } from '../firebase-config';  // adjust the path to your config file

const auth = getAuth(app);

export const login = async (email: string, password: string): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUp = async (email: string, password: string): Promise<UserCredential> => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const logout = async (): Promise<void> => {
  return signOut(auth);
};

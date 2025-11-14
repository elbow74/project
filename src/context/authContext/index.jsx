"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/firebase/firebase";

//empty container to hold all the auth related data and functions
const AuthContext = createContext();

//hook to access the auth context
export function useAuth() {
  return useContext(AuthContext);
}

//provider to wrap the app and provide the auth context to the children
export const AuthProvider = ({ children }) => {
  //state to hold the current user and if they are logged in
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  //effect to listen for changes in the user's authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setUserLoggedIn(true);
      } else {
        setCurrentUser(null);
        setUserLoggedIn(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  //value to be provided to the children
  const value = {
    currentUser,
    userLoggedIn,
    loading,
  };

  //return the provider with the value and the children
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

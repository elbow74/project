"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/firebase/firebase";

// Empty container to hold all the auth related data and functions
const AuthContext = createContext(null);

// Hook to access the auth context
export function useAuth() {
  return useContext(AuthContext);
}

// Provider to wrap the app and provide the auth context to the children
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Set up Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setUserLoggedIn(!!user);
      setLoading(false);
    });

    // Cleanup on unmount
    return () => unsubscribe();
  }, []);

  // Value to be provided to the children
  const value = {
    currentUser,
    userLoggedIn,
    loading,
  };

  // Only render children once we've resolved initial auth state
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

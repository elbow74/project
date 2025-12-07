import { auth, googleProvider } from "./firebase";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";

export const doCreateUserWithEmailAndPassword = async (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const doSignInWithEmailAndPassword = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const doSignInWithGoogle = async () => {
  try {
    // Try popup first (fast and returns credential)
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    return { user: result.user, accessToken };
  } catch (err) {
    // If popup is blocked or fails, fallback to redirect flow
    console.error("Popup sign-in failed, falling back to redirect:", err);
    try {
      await auth.signOut(); // ensure clean state
      // Use redirect as a robust fallback for browsers that block popups
      await auth.signInWithRedirect?.(googleProvider);
      return { user: null, accessToken: null, fallback: "redirect" };
    } catch (redirectErr) {
      console.error("Redirect sign-in also failed:", redirectErr);
      throw redirectErr;
    }
  }
};

export const doSignOut = async () => {
  await signOut(auth);
};

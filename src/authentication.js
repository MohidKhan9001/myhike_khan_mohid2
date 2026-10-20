import { auth, db } from "/src/firebaseConfig.js";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { doc, setDoc } from "firebase/firestore";

// Log in an existing user.
export async function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// Sign up a new user and save their profile to Firestore.
export async function signupUser(name, email, password) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;

  await updateProfile(user, { displayName: name });

  try {
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      country: "Canada",
      school: "BCIT"
    });

    console.log("Firestore user document created successfully!");
  } catch (error) {
    console.error("Error creating Firestore user document:", error);
    alert("Your account was created, but saving your profile failed: " + error.message);
  }

  return user;
}

// Log out the current user.
export async function logoutUser() {
  await signOut(auth);
  window.location.href = "index.html";
}

// Check the authentication state.
export function checkAuthState() {
  onAuthStateChanged(auth, (user) => {
    if (window.location.pathname.endsWith("main.html")) {
      if (user) {
        const displayName = user.displayName || user.email;
        $("#welcomeMessage").text(`Hello, ${displayName}!`);
      } else {
        window.location.href = "index.html";
      }
    }
  });
}

// Run a callback when Firebase resolves the authentication state.
export function onAuthReady(callback) {
  return onAuthStateChanged(auth, callback);
}

// Convert Firebase errors into readable messages.
export function authErrorMessage(error) {
  const code = (error?.code || "").toLowerCase();

  const map = {
    "auth/invalid-credential": "Wrong email or password.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "auth/email-already-in-use": "Email is already in use.",
    "auth/weak-password": "Password too weak (min 6 characters).",
    "auth/missing-password": "Password cannot be empty.",
    "auth/network-request-failed": "Network error. Try again.",
  };

  return map[code] || "Something went wrong. Please try again.";
}

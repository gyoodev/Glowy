
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBl6-VkACEuUwr0A9DvEBIZGZ59IiffK0M",
  authDomain: "glowy-gyoodev.firebaseapp.com",
  projectId: "glowy-gyoodev",
  storageBucket: "glowy-gyoodev.firebasestorage.app",
  messagingSenderId: "404029225537",
  appId: "1:404029225537:web:2f9144a90f82f82eff64c0",
  measurementId: "G-6Z1J5B647X"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

let analytics;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, analytics };

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { Storage } from "@google-cloud/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCZRsEpB-5bCrMs4IXggNM0RD_Gzs0NrCI",
  authDomain: "bog23-fe1b7.firebaseapp.com",
  projectId: "bog23-fe1b7",
  storageBucket: "bog23-fe1b7.appspot.com",
  messagingSenderId: "732288494572",
  appId: "1:732288494572:web:2be34b401cd80af5956ec9",
  measurementId: "G-MVDPPSEV2S",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

export const db = getFirestore();

const storage = new Storage({
  projectId: firebaseConfig.projectId
})

export const bucket = storage.bucket("bog23-fe1b7.appspot.com");
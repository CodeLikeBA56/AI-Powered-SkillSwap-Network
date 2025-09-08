import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: "AIzaSyBux3Sc56GPnbVV20u_2BZFJnAZUlqOud0",
  authDomain: "skillswap-d4e37.firebaseapp.com",
  databaseURL: "https://skillswap-d4e37-default-rtdb.firebaseio.com",
  projectId: "skillswap-d4e37",
  storageBucket: "skillswap-d4e37.firebasestorage.app",
  messagingSenderId: "58555726906",
  appId: "1:58555726906:web:4be7f25e16183a12bd4903",
  measurementId: "G-K7ZKMFN4XF"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
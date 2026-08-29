import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database"; // 🌟 Realtime Database 로드

// Firebase 설정 (API 키는 Firebase 웹 콘솔에서 확인 후 직접 넣어주세요!)
const firebaseConfig = {
  apiKey: "AIzaSyDZYF2mlCHjrM-WZ1Y41wlHVeaPn8kPFTw",
  authDomain: "datacenter-app-7a69a.firebaseapp.com",
  databaseURL: "https://datacenter-app-7a69a-default-rtdb.firebaseio.com",
  projectId: "datacenter-app-7a69a",
  storageBucket: "datacenter-app-7a69a.firebasestorage.app",
  messagingSenderId: "932148047053",
  appId: "1:932148047053:web:5c264f03bd6cefd1d28d84"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
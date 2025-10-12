// Configuração do Firebase
// IMPORTANTE: Substitua estas configurações pelas suas próprias do Firebase Console

const firebaseConfig = {
  // Cole aqui as configurações do seu projeto Firebase
  // Vá em Firebase Console > Project Settings > General > Your apps > Config
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Inicializar Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, orderBy, query, where, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Inicializar app Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Exportar para uso em outros arquivos
window.firebaseApp = app;
window.db = db;
window.firestoreFunctions = {
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  collection,
  orderBy,
  query,
  where,
  onSnapshot
};

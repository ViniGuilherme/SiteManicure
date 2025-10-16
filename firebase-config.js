// Firebase Configuration
// Substitua estas configurações pelas suas próprias do Firebase Console

const firebaseConfig = {
    // Cole aqui suas configurações do Firebase
    apiKey: "sua-api-key-aqui",
    authDomain: "seu-projeto.firebaseapp.com",
    projectId: "seu-projeto-id",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "123456789",
    appId: "seu-app-id"
};

// Inicializar Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, where } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Inicializar Firebase App
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
const db = getFirestore(app);

// Exportar para uso em outros arquivos
window.firebaseApp = app;
window.db = db;
window.firestore = {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    where
};
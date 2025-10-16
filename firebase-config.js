// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCUMiQv4A1Mo-BTdmhrPZDC5qs-iuaEqKs",
  authDomain: "studio-laura-souza.firebaseapp.com",
  projectId: "studio-laura-souza",
  storageBucket: "studio-laura-souza.firebasestorage.app",
  messagingSenderId: "594832278771",
  appId: "1:594832278771:web:08b48dba7dcfdef7252386"
};

// Aguardar Firebase carregar
function waitForFirebase() {
    return new Promise((resolve) => {
        if (window.firebase) {
            resolve();
        } else {
            setTimeout(() => waitForFirebase().then(resolve), 100);
        }
    });
}

// Inicializar Firebase quando carregar
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Aguardar Firebase estar disponível
        await waitForFirebase();
        
        // Inicializar Firebase App
        const app = firebase.initializeApp(firebaseConfig);
        
        // Inicializar Firestore
        const db = firebase.firestore();
        
        // Tornar disponível globalmente
        window.firebaseApp = app;
        window.db = db;
        window.firestore = {
            collection: (db, collectionName) => db.collection(collectionName),
            addDoc: (collectionRef, data) => collectionRef.add(data),
            getDocs: (collectionRef) => collectionRef.get(),
            updateDoc: (docRef, data) => docRef.update(data),
            deleteDoc: (docRef) => docRef.delete(),
            doc: (db, collectionName, docId) => db.collection(collectionName).doc(docId),
            getDoc: (docRef) => docRef.get(),
            setDoc: (docRef, data) => docRef.set(data),
            onSnapshot: (query, callback) => query.onSnapshot(callback),
            query: (collectionRef, ...queryConstraints) => {
                let q = collectionRef;
                queryConstraints.forEach(constraint => {
                    if (constraint.type === 'orderBy') {
                        q = q.orderBy(constraint.field, constraint.direction);
                    } else if (constraint.type === 'where') {
                        q = q.where(constraint.field, constraint.operator, constraint.value);
                    }
                });
                return q;
            },
            orderBy: (field, direction = 'asc') => ({ type: 'orderBy', field, direction }),
            where: (field, operator, value) => ({ type: 'where', field, operator, value })
        };
        
        console.log('✅ Firebase inicializado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase:', error);
    }
});
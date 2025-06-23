import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// --- Firebase Configuration ---
// Using the exact configuration you provided
const firebaseConfig = {
    apiKey: "AIzaSyDpP8k7q1IVwYTaBsfqe0ewONRd1UMUwj8",
    authDomain: "selalinkm.firebaseapp.com",
    projectId: "selalinkm",
    storageBucket: "selalinkm.appspot.com",
    messagingSenderId: "630184793476",
    appId: "1:630184793476:web:c245aff861f8204990c311",
    measurementId: "G-ZHTF5H94H3"
};

// Initialize Firebase
let app;
let auth;
let initializationError = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (e) {
  console.error("Firebase initialization failed:", e);
  initializationError = e;
}


export default function App() {
    const [status, setStatus] = useState('Initializing...');
    const [userId, setUserId] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (initializationError) {
          setStatus('Firebase Initialization Failed');
          setError(initializationError.message);
          return;
        }
      
        if (!auth) {
          setStatus('Firebase Auth is not available.');
          return;
        }

        console.log("Attempting anonymous sign-in...");
        setStatus('Attempting Sign-In...');
        signInAnonymously(auth)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log("Sign-in successful. UID:", user.uid);
                setStatus('Success!');
                setUserId(user.uid);
                setError(null);
            })
            .catch((err) => {
                console.error("Anonymous sign-in failed:", err);
                setStatus('Sign-In Failed!');
                setError(`Code: ${err.code}\nMessage: ${err.message}`);
            });
    }, []);

    return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center', direction: 'ltr' }}>
            <h1>Firebase Connection Test</h1>
            <div style={{ 
                marginTop: '20px', 
                padding: '20px', 
                borderRadius: '8px', 
                border: '1px solid #ccc',
                backgroundColor: error ? '#ffcccc' : '#ccffcc' 
            }}>
                <h2>Status: {status}</h2>
                {userId && <p><strong>User ID:</strong> {userId}</p>}
                {error && (
                    <div style={{ color: 'red', whiteSpace: 'pre-wrap', textAlign: 'left', backgroundColor: '#fff', padding: '10px', borderRadius: '4px' }}>
                        <p><strong>Error Details:</strong></p>
                        <code>{error}</code>
                    </div>
                )}
            </div>
        </div>
    );
}

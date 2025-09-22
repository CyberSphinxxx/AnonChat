import React, { useRef, useState } from "react";
import "./App.css";

import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";

// ✅ import bad-words filter
import { Filter } from "bad-words";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyCIpcR0M_h1axraNls6c0rj5CQZZvgb1nk",
  authDomain: "anonychat-1560d.firebaseapp.com",
  projectId: "anonychat-1560d",
  storageBucket: "anonychat-1560d.firebasestorage.app",
  messagingSenderId: "735096822279",
  appId: "1:735096822279:web:6952168cc6a1ad94e068a2",
  measurementId: "G-ZQPW7R4NF3",
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const analytics = getAnalytics(app);

function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <header>
        <h1>Anonymous Chat Room</h1>
        <SignOut />
      </header>

      <section>{user ? <ChatRoom /> : <SignIn />}</section>
    </div>
  );
}

// --- Sign In ---
function SignIn() {
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  return (
    <>
      <button className="sign-in" onClick={signInWithGoogle}>
        Sign in with Google
      </button>
      <p>
        Do not violate the community guidelines or you will be banned for life!
      </p>
    </>
  );
}

// --- Sign Out ---
function SignOut() {
  return (
    auth.currentUser && (
      <button className="sign-out" onClick={() => signOut(auth)}>
        Sign Out
      </button>
    )
  );
}

// --- Helper: Whole word censor only ---
function censorBadWords(text) {
  const filter = new Filter();
  return filter.clean(text);
}

// --- Chat Room ---
function ChatRoom() {
  const dummy = useRef();

  const messagesRef = collection(firestore, "messages");
  const messagesQuery = query(messagesRef, orderBy("createdAt"), limit(25));

  const [messages] = useCollectionData(messagesQuery, { idField: "id" });
  const [formValue, setFormValue] = useState("");

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!formValue.trim()) return;

    const { uid, photoURL } = auth.currentUser;

    // 🔥 Apply filter before sending
    const cleanedText = censorBadWords(formValue);

    await addDoc(messagesRef, {
      text: cleanedText,
      createdAt: serverTimestamp(),
      uid,
      photoURL,
    });

    setFormValue("");
    dummy.current.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <main>
        {messages &&
          messages.map((msg, index) => (
            <ChatMessage key={msg.id || index} message={msg} />
          ))}

        <span ref={dummy}></span>
      </main>

      <form onSubmit={sendMessage}>
        <input
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder="say something nice"
        />

        <button type="submit" disabled={!formValue}>
          🕊️
        </button>
      </form>
    </>
  );
}

// --- Chat Message ---
function ChatMessage(props) {
  const { text, uid, photoURL } = props.message;

  const messageClass = uid === auth.currentUser?.uid ? "sent" : "received";

  return (
    <div className={`message ${messageClass}`}>
      <img
        src={
          photoURL ||
          "https://api.dicebear.com/6.x/identicon/svg?seed=placeholder"
        }
        alt="avatar"
      />
      <p>{text}</p>
    </div>
  );
}

export default App;

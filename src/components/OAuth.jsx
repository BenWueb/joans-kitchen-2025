import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { setDoc, doc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "../firestore.config";
import google from "../assets/google-g-2015.svg";
import { usePathname } from "next/navigation";

function OAuth() {
  const pathname = usePathname();

  const onGoogle = async () => {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const docRef = doc(db, "Users", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await setDoc(docRef, {
          name: user.displayName,
          email: user.email,
          favorites: [],
          recipes: [],
          timestamp: serverTimestamp(),
        });
      }
      navigate("/profile");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <button onClick={onGoogle} className="btn submit-btn google-btn">
        <img src={google} alt="google" />
        Sign {{ pathname } === "/create-account" ? "up" : "in"} with google
      </button>
    </>
  );
}
export default OAuth;

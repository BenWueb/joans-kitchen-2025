import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { setDoc, doc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "../firestore.config";
import { usePathname, useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";

function OAuth() {
  const pathname = usePathname();
  const router = useRouter();

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
      router.push("/profile");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <button
        onClick={onGoogle}
        type="button"
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium text-gray-700"
      >
        <FcGoogle className="w-5 h-5" />
        Sign {pathname === "/create-account" ? "up" : "in"} with Google
      </button>
    </>
  );
}
export default OAuth;

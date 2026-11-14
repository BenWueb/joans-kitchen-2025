import { usePathname } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { authClient, googleAuthEnabled } from "@/lib/auth-client";

function OAuth() {
  const pathname = usePathname();

  const onGoogle = async () => {
    try {
      // Google sign-in leaves the page, so resolve the return URL up front
      const callbackURL = localStorage.getItem("returnUrl") || "/profile";
      localStorage.removeItem("returnUrl");
      await authClient.signIn.social({ provider: "google", callbackURL });
    } catch (error) {
      console.log(error);
    }
  };

  if (!googleAuthEnabled) return null;

  return (
    <>
      <button
        onClick={onGoogle}
        type="button"
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium text-gray-700"
      >
        <FcGoogle className="w-5 h-5" />
        Sign {pathname === "/create_account" ? "up" : "in"} with Google
      </button>
    </>
  );
}
export default OAuth;

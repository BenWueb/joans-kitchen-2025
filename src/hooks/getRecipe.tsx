import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "@/firestore.config";

const getRecipe = async (recipeName: string) => {
  try {
    const recipesRef = collection(db, "recipes");
    const q = query(recipesRef, where("title", "==", recipeName));

    const querySnapshot = await getDocs(q);
    return querySnapshot;
  } catch (error) {
    console.log(error);
  }
};

export default getRecipe;

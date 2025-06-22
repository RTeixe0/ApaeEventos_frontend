import firebaseAuth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";

export const getFirebaseAuth = () => firebaseAuth();
export const getFirebaseFirestore = () => firestore();
export const getFirebaseStorage = () => storage();

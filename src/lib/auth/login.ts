import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";

import { fetchPerfil } from "@/lib/auth/api";
import { saveSession, clearSession } from "@/lib/auth/session";
import { getFirebaseAuth } from "@/lib/firebase";
// Removed mock imports
import type { PerfilConPermisos } from "@/types/auth";

async function completeLogin(user: User): Promise<PerfilConPermisos> {
  const token = await user.getIdToken();
  const perfil = await fetchPerfil(token);
  saveSession(token, perfil);
  return perfil;
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<PerfilConPermisos> {


  const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  return completeLogin(cred.user);
}

export async function loginWithGoogle(): Promise<PerfilConPermisos> {


  const cred = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
  return completeLogin(cred.user);
}

export async function logout(): Promise<void> {
  clearSession();
  try {
    await signOut(getFirebaseAuth());
  } catch {
    /* sin sesión Firebase activa */
  }
}

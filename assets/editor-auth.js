import { sb } from "./sb-init.js";
export async function signIn(email, password){
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}
export async function signOut(){ await sb.auth.signOut(); }
export async function getUser(){ const { data } = await sb.auth.getUser(); return data?.user || null; }

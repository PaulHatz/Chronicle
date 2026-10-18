import {createContext,useContext,useEffect,useState,type ReactNode} from "react";
import {apiFetch} from "../api/client";
import {useAuth} from "../auth/AuthContext";
export type AccountRole="ADMIN"|"MANAGER"|"TEAM_LEADER";
type Session={role:AccountRole|null;loading:boolean};
const Context=createContext<Session>({role:null,loading:true});
export function RoleProvider({children}:{children:ReactNode}){
 const {isAuthenticated}=useAuth();
 const [session,setSession]=useState<Session>({role:null,loading:true});
 useEffect(()=>{
  if(!isAuthenticated){setSession({role:null,loading:false});return;}
  let live=true;setSession({role:null,loading:true});
  void apiFetch("/auth/me").then(async response=>{
   if(!response.ok)throw new Error("Unable to verify account permissions.");
   return response.json();
  }).then(user=>{if(live)setSession({role:["ADMIN","MANAGER","TEAM_LEADER"].includes(user.role)?user.role:null,loading:false});})
   .catch(()=>{if(live)setSession({role:null,loading:false});});
  return()=>{live=false;};
 },[isAuthenticated]);
 return <Context.Provider value={session}>{children}</Context.Provider>;
}
export const useRole=()=>useContext(Context);

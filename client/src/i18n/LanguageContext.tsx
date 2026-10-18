import {createContext,useCallback,useContext,useEffect,useState,type ReactNode} from "react";
import {apiFetch} from "../api/client";
import {useAuth} from "../auth/AuthContext";
import {translate,type Locale,type MessageKey} from "./messages";
type LanguageContextValue={locale:Locale;setLocale:(next:Locale)=>void;t:(key:MessageKey,params?:Record<string,string|number>)=>string};
const Context=createContext<LanguageContextValue|null>(null);
function getStored():Locale{
 const saved=localStorage.getItem("chronicle-language");
 return saved==="en-CA"?"en-CA":"fr-CA";
}
export function LanguageProvider({children}:{children:ReactNode}){
 const {isAuthenticated}=useAuth();
 const [locale,setCurrent]=useState<Locale>(getStored);
 const setLocale=useCallback((next:Locale)=>{
  setCurrent(next);localStorage.setItem("chronicle-language",next);document.documentElement.lang=next;
 },[]);
 useEffect(()=>{
  document.documentElement.lang=locale;
  if(!isAuthenticated)return;
  let active=true;
  void apiFetch("/auth/me").then(res=>res.ok?res.json():null).then(user=>{
   if(active&&(user?.language==="en-CA"||user?.language==="fr-CA"))setLocale(user.language);
  }).catch(()=>{});
  return()=>{active=false;};
 },[setLocale,isAuthenticated]);
 const t=useCallback((key:MessageKey,params?:Record<string,string|number>)=>translate(locale,key,params),[locale]);
 return <Context.Provider value={{locale,setLocale,t}}>{children}</Context.Provider>;
}
export function useLanguage(){const context=useContext(Context);if(!context)throw new Error("LanguageProvider is missing.");return context;}

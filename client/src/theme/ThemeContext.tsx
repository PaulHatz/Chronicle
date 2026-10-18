import {createContext,useCallback,useContext,useEffect,useState,type ReactNode} from "react";
import {apiFetch} from "../api/client";
import {useAuth} from "../auth/AuthContext";
type ThemeContextValue={darkMode:boolean;setDarkMode:(value:boolean)=>void};
const ThemeContext=createContext<ThemeContextValue|null>(null);
export function ThemeProvider({children}:{children:ReactNode}){
 const {isAuthenticated}=useAuth();
 const [darkMode,setValue]=useState(()=>localStorage.getItem("chronicle-dark-mode")==="true");
 const setDarkMode=useCallback((value:boolean)=>{setValue(value);localStorage.setItem("chronicle-dark-mode",String(value));document.documentElement.dataset.theme=value?"dark":"light";},[]);
 useEffect(()=>{document.documentElement.dataset.theme=darkMode?"dark":"light";},[darkMode]);
 useEffect(()=>{
  if(!isAuthenticated)return;
  let active=true;
  void apiFetch("/auth/me").then(res=>res.ok?res.json():null).then(user=>{if(active&&typeof user?.darkMode==="boolean")setDarkMode(user.darkMode);}).catch(()=>{});
  return()=>{active=false;};
 },[isAuthenticated,setDarkMode]);
 return <ThemeContext.Provider value={{darkMode,setDarkMode}}>{children}</ThemeContext.Provider>;
}
export function useTheme(){const value=useContext(ThemeContext);if(!value)throw new Error("ThemeProvider is missing");return value;}

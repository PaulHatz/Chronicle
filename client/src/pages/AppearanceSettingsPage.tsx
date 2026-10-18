import {useState} from "react";
import {apiFetch} from "../api/client";
import {useTheme} from "../theme/ThemeContext";
import {useLanguage} from "../i18n/LanguageContext";
import "./AppearanceSettingsPage.css";
export default function AppearanceSettingsPage(){
 const {darkMode,setDarkMode}=useTheme();
 const {t}=useLanguage();
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 async function toggle(value:boolean){
  setSaving(true);setError("");
  try{
   const res=await apiFetch("/preferences/theme",{method:"PATCH",body:JSON.stringify({darkMode:value})});
   if(!res.ok){const payload=await res.json().catch(()=>({}));throw new Error(payload.message||t("appearanceError"));}
   setDarkMode(value);
  }catch(e){setError(e instanceof Error?e.message:t("appearanceError"));}
  finally{setSaving(false);}
 }
 return <main className="appearance-page">
  <header><p className="appearance-eyebrow">{t("settings")} / {t("preferences")}</p><h1>{t("appearance")}</h1><p>{t("appearanceDescription")}</p></header>
  <section className="appearance-card">
   <div><h2>{t("darkMode")}</h2><p>{t("darkModeDescription")}</p></div>
   <label className="appearance-switch"><input type="checkbox" role="switch" checked={darkMode} disabled={saving} onChange={e=>void toggle(e.target.checked)} aria-label={t("darkMode")}/><span className="appearance-track"><span className="appearance-thumb"/></span></label>
  </section>
  {error&&<p className="appearance-error" role="alert">{error}</p>}
 </main>;
}

import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import "./LanguageSettingsPage.css";
type Locale="fr-CA"|"en-CA";
export default function LanguageSettingsPage(){
 const [language,setLanguage]=useState<Locale>("fr-CA");
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 useEffect(()=>{let active=true;void apiFetch("/auth/me").then(async res=>{if(!res.ok)throw new Error("Unable to load your preferences.");return res.json();}).then(data=>{if(active)setLanguage(data.language==="en-CA"?"en-CA":"fr-CA");}).catch(e=>{if(active)setError(e instanceof Error?e.message:"Unable to load preference.");}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
 async function save(){
  setSaving(true);setError("");setNotice("");
  try{
   const res=await apiFetch("/preferences/language",{method:"PATCH",body:JSON.stringify({language})});
   if(!res.ok){const body=await res.json().catch(()=>({}));throw new Error(body.message||"Unable to save language.");}
   document.documentElement.lang=language;localStorage.setItem("chronicle-language",language);
   setNotice(language==="fr-CA"?"Préférence linguistique enregistrée.":"Language preference saved.");
  }catch(e){setError(e instanceof Error?e.message:"Unable to save language.");}
  finally{setSaving(false);}
 }
 return <main className="language-page">
  <header><p className="language-eyebrow">Settings / Preferences</p><h1>Language / Langue</h1><p>Choose your preferred language for Chronicle. / Choisissez votre langue préférée.</p></header>
  <section className="language-card">
   <h2>Preferred language / Langue préférée</h2><p>Your selection is saved to your user account. / Ce choix est enregistré dans votre compte.</p>
   {loading?<p>Loading preferences…</p>:<div className="language-options">
    <label className={language==="fr-CA"?"selected":""}><input type="radio" name="locale" value="fr-CA" checked={language==="fr-CA"} onChange={()=>{setLanguage("fr-CA");setNotice("");}}/><span><strong>Français (Canada)</strong><small>Français canadien · Par défaut</small></span></label>
    <label className={language==="en-CA"?"selected":""}><input type="radio" name="locale" value="en-CA" checked={language==="en-CA"} onChange={()=>{setLanguage("en-CA");setNotice("");}}/><span><strong>English (Canada)</strong><small>Canadian English</small></span></label>
   </div>}
   {error&&<p role="alert" className="language-error">{error}</p>}
   {notice&&<p role="status" className="language-success">{notice}</p>}
   <button type="button" disabled={loading||saving} className="language-save" onClick={()=>void save()}>{saving?"Saving…":"Save preference / Enregistrer"}</button>
  </section>
 </main>;
}

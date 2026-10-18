import { useEffect, useState, type FormEvent } from "react";
import { addUser, editUser, listUsers, removeUser, type ManagedUser, type UserRole } from "../api/users";
import "./UsersPage.css";
import { useLanguage } from "../i18n/LanguageContext";

type Draft = {firstName:string;lastName:string;email:string;role:UserRole;password:string};
const blank:Draft={firstName:"",lastName:"",email:"",role:"MANAGER",password:""};
export default function UsersPage(){
 const {t}=useLanguage();
 const [users,setUsers]=useState<ManagedUser[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [editing,setEditing]=useState<number|"new"|null>(null);
 const [draft,setDraft]=useState<Draft>({...blank});
 const [search,setSearch]=useState("");
 useEffect(()=>{let active=true;void listUsers().then(data=>{if(active)setUsers(data);}).catch(e=>{if(active)setError(e instanceof Error?e.message:"Unable to load users.");}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
 function openCreate(){setEditing("new");setDraft({...blank});setError("");setNotice("");}
 function openEdit(user:ManagedUser){setEditing(user.id);setDraft({firstName:user.firstName,lastName:user.lastName,email:user.email,role:user.role,password:""});setError("");setNotice("");}
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(editing===null)return;
  if(!draft.firstName.trim()||!draft.lastName.trim()||!draft.email.trim()){setError(t("nameEmailRequired"));return;}
  if(editing==="new"&&draft.password.length<12){setError(t("passwordRequired"));return;}
  if(draft.password&&draft.password.length<12){setError(t("passwordRequired"));return;}
  const input={firstName:draft.firstName.trim(),lastName:draft.lastName.trim(),email:draft.email.trim(),role:draft.role,...(draft.password?{password:draft.password}:{})};
  setBusy(true);setError("");setNotice("");
  try{
   const user=editing==="new"?await addUser({...input,password:draft.password}):await editUser(editing,input);
   setUsers(previous=>[...previous.filter(x=>x.id!==user.id),user].sort((a,b)=>(a.lastName+a.firstName).localeCompare(b.lastName+b.firstName)));
   setNotice(editing==="new"?t("userCreated"):t("userUpdated"));setEditing(null);setDraft({...blank});
  }catch(e){setError(e instanceof Error?e.message:"Unable to save user.");}
  finally{setBusy(false);}
 }
 async function remove(user:ManagedUser){
  if(!window.confirm(t("deleteConfirm",{name:`${user.firstName} ${user.lastName}`})))return;
  setBusy(true);setError("");setNotice("");
  try{await removeUser(user.id);setUsers(previous=>previous.filter(x=>x.id!==user.id));if(editing===user.id)setEditing(null);setNotice(t("userDeleted"));}
  catch(e){setError(e instanceof Error?e.message:"Unable to delete user.");}
  finally{setBusy(false);}
 }
 const visible=users.filter(user=>`${user.firstName} ${user.lastName} ${user.email} ${t(user.role==="ADMIN"?"administrator":user.role==="MANAGER"?"manager":"teamLeader")}`.toLowerCase().includes(search.trim().toLowerCase()));
 return <main className="users-page">
  <header className="users-header"><div><p className="users-eyebrow">{t("settingsAccess")}</p><h1>{t("users")}</h1><p>{t("welcomeAccount")}</p></div></header>
  {error&&<p className="users-alert users-error" role="alert">{error}</p>}
  {notice&&<p className="users-alert users-success" role="status">{notice}</p>}
  {editing!==null&&<div className="users-modal-backdrop" onMouseDown={()=>{if(!busy)setEditing(null);}}><section className="users-modal" role="dialog" aria-modal="true" aria-labelledby="users-modal-title" onMouseDown={e=>e.stopPropagation()}><div className="users-modal-intro"><span className="users-modal-icon" aria-hidden="true">{editing==="new"?"＋":"✎"}</span><div><p className="users-modal-eyebrow">{t("accountManagement")}</p><h2 id="users-modal-title">{editing==="new"?t("addUser"):t("editUser")}</h2><p>{editing==="new"?t("accountCreateInfo"):t("accountEditInfo")}</p></div><button type="button" className="users-modal-close" aria-label={t("closeEditor")} disabled={busy} onClick={()=>setEditing(null)}>✕</button></div>
   <form onSubmit={save}>
    <div className="users-form-grid">
     <label>{t("firstName")}<input autoComplete="given-name" required maxLength={100} value={draft.firstName} onChange={e=>setDraft(d=>({...d,firstName:e.target.value}))}/></label>
     <label>{t("lastName")}<input autoComplete="family-name" required maxLength={100} value={draft.lastName} onChange={e=>setDraft(d=>({...d,lastName:e.target.value}))}/></label>
     <label>{t("emailAddress")}<input type="email" autoComplete="email" required maxLength={254} value={draft.email} onChange={e=>setDraft(d=>({...d,email:e.target.value}))}/></label>
     <label>{t("role")}<select value={draft.role} onChange={e=>setDraft(d=>({...d,role:e.target.value as UserRole}))}><option value="ADMIN">{t("administrator")}</option><option value="MANAGER">{t("manager")}</option><option value="TEAM_LEADER">{t("teamLeader")}</option></select></label>
     <label>{t("password")} {editing!=="new"&&<small>{t("passwordHint")}</small>}<input type="password" autoComplete="new-password" minLength={12} maxLength={256} required={editing==="new"} value={draft.password} onChange={e=>setDraft(d=>({...d,password:e.target.value}))}/></label>
    </div>
    {error&&<p className="users-modal-error" role="alert">{error}</p>}<div className="users-form-actions"><button type="button" onClick={()=>setEditing(null)} disabled={busy}>{t("cancel")}</button><button className="users-primary" type="submit" disabled={busy}>{busy?t("saving"):editing==="new"?t("createUser"):t("saveChanges")}</button></div>
   </form>
  </section></div>}
  <section className="users-card">
   <div className="users-list-header"><div><h2>{t("allUsers")}</h2><span>{users.length} {t("allAccounts")}</span></div><button type="button" className="users-add-icon" title={t("addUser")} aria-label={t("addUser")} disabled={busy||loading} onClick={openCreate}>+</button></div><div className="users-search-row"><input type="search" aria-label="Search users" placeholder={t("searchUsers")} value={search} onChange={e=>setSearch(e.target.value)}/></div>
   {loading?<p className="users-empty">{t("loadingUsers")}</p>:visible.length===0?<p className="users-empty">{users.length?t("noMatchingUsers"):t("noUsers")}</p>:<div className="users-list">{visible.map(user=><div className="users-row" key={user.id}>
    <span className="users-avatar">{user.firstName.charAt(0)}{user.lastName.charAt(0)}</span>
    <div className="users-identity"><strong>{user.firstName} {user.lastName}</strong><span>{user.email}</span></div>
    <span className="users-role">{roleLabels[user.role]}</span>
    <div className="users-row-actions"><button disabled={busy} type="button" onClick={()=>openEdit(user)}>{t("edit")}</button><button disabled={busy} type="button" className="users-delete" onClick={()=>void remove(user)}>{t("delete")}</button></div>
   </div>)}</div>}
  </section>
 </main>;
}

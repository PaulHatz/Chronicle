import { useEffect, useState, type FormEvent } from "react";
import { addUser, editUser, listUsers, removeUser, type ManagedUser, type UserRole } from "../api/users";
import "./UsersPage.css";

type Draft = {firstName:string;lastName:string;email:string;role:UserRole;password:string};
const blank:Draft={firstName:"",lastName:"",email:"",role:"MANAGER",password:""};
const roleLabels:Record<UserRole,string>={ADMIN:"Administrator",MANAGER:"Manager",TEAM_LEADER:"Team leader"};
export default function UsersPage(){
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
  if(!draft.firstName.trim()||!draft.lastName.trim()||!draft.email.trim()){setError("Name and email are required.");return;}
  if(editing==="new"&&draft.password.length<12){setError("Password must be at least 12 characters.");return;}
  if(draft.password&&draft.password.length<12){setError("Password must be at least 12 characters.");return;}
  const input={firstName:draft.firstName.trim(),lastName:draft.lastName.trim(),email:draft.email.trim(),role:draft.role,...(draft.password?{password:draft.password}:{})};
  setBusy(true);setError("");setNotice("");
  try{
   const user=editing==="new"?await addUser({...input,password:draft.password}):await editUser(editing,input);
   setUsers(previous=>[...previous.filter(x=>x.id!==user.id),user].sort((a,b)=>(a.lastName+a.firstName).localeCompare(b.lastName+b.firstName)));
   setNotice(editing==="new"?"User created.":"User updated.");setEditing(null);setDraft({...blank});
  }catch(e){setError(e instanceof Error?e.message:"Unable to save user.");}
  finally{setBusy(false);}
 }
 async function remove(user:ManagedUser){
  if(!window.confirm(`Delete ${user.firstName} ${user.lastName}? This cannot be undone.`))return;
  setBusy(true);setError("");setNotice("");
  try{await removeUser(user.id);setUsers(previous=>previous.filter(x=>x.id!==user.id));if(editing===user.id)setEditing(null);setNotice("User deleted.");}
  catch(e){setError(e instanceof Error?e.message:"Unable to delete user.");}
  finally{setBusy(false);}
 }
 const visible=users.filter(user=>`${user.firstName} ${user.lastName} ${user.email} ${roleLabels[user.role]}`.toLowerCase().includes(search.trim().toLowerCase()));
 return <main className="users-page">
  <header className="users-header"><div><p className="users-eyebrow">Settings / Access</p><h1>Users</h1><p>Manage team accounts, access roles and sign-in credentials.</p></div></header>
  {error&&<p className="users-alert users-error" role="alert">{error}</p>}
  {notice&&<p className="users-alert users-success" role="status">{notice}</p>}
  {editing!==null&&<div className="users-modal-backdrop" onMouseDown={()=>{if(!busy)setEditing(null);}}><section className="users-modal" role="dialog" aria-modal="true" aria-labelledby="users-modal-title" onMouseDown={e=>e.stopPropagation()}><div className="users-modal-intro"><span className="users-modal-icon" aria-hidden="true">{editing==="new"?"＋":"✎"}</span><div><p className="users-modal-eyebrow">Account management</p><h2 id="users-modal-title">{editing==="new"?"Add new user":"Edit user"}</h2><p>{editing==="new"?"Create an account and assign its access level.":"Update account details or reset the password."}</p></div><button type="button" className="users-modal-close" aria-label="Close editor" disabled={busy} onClick={()=>setEditing(null)}>✕</button></div>
   <form onSubmit={save}>
    <div className="users-form-grid">
     <label>First name<input autoComplete="given-name" required maxLength={100} value={draft.firstName} onChange={e=>setDraft(d=>({...d,firstName:e.target.value}))}/></label>
     <label>Last name<input autoComplete="family-name" required maxLength={100} value={draft.lastName} onChange={e=>setDraft(d=>({...d,lastName:e.target.value}))}/></label>
     <label>Email address<input type="email" autoComplete="email" required maxLength={254} value={draft.email} onChange={e=>setDraft(d=>({...d,email:e.target.value}))}/></label>
     <label>Role<select value={draft.role} onChange={e=>setDraft(d=>({...d,role:e.target.value as UserRole}))}><option value="ADMIN">Administrator</option><option value="MANAGER">Manager</option><option value="TEAM_LEADER">Team leader</option></select></label>
     <label>Password {editing!=="new"&&<small>(leave blank to keep current)</small>}<input type="password" autoComplete="new-password" minLength={12} maxLength={256} required={editing==="new"} value={draft.password} onChange={e=>setDraft(d=>({...d,password:e.target.value}))}/></label>
    </div>
    {error&&<p className="users-modal-error" role="alert">{error}</p>}<div className="users-form-actions"><button type="button" onClick={()=>setEditing(null)} disabled={busy}>Cancel</button><button className="users-primary" type="submit" disabled={busy}>{busy?"Saving…":editing==="new"?"Create user":"Save changes"}</button></div>
   </form>
  </section></div>}
  <section className="users-card">
   <div className="users-list-header"><div><h2>All users</h2><span>{users.length} total accounts</span></div><button type="button" className="users-add-icon" title="Add user" aria-label="Add user" disabled={busy||loading} onClick={openCreate}>+</button></div><div className="users-search-row"><input type="search" aria-label="Search users" placeholder="Search users by name, email or role…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
   {loading?<p className="users-empty">Loading users…</p>:visible.length===0?<p className="users-empty">{users.length?"No users match your search.":"No users found."}</p>:<div className="users-list">{visible.map(user=><div className="users-row" key={user.id}>
    <span className="users-avatar">{user.firstName.charAt(0)}{user.lastName.charAt(0)}</span>
    <div className="users-identity"><strong>{user.firstName} {user.lastName}</strong><span>{user.email}</span></div>
    <span className="users-role">{roleLabels[user.role]}</span>
    <div className="users-row-actions"><button disabled={busy} type="button" onClick={()=>openEdit(user)}>Edit</button><button disabled={busy} type="button" className="users-delete" onClick={()=>void remove(user)}>Delete</button></div>
   </div>)}</div>}
  </section>
 </main>;
}

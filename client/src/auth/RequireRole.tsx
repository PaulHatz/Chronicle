import {Navigate,Outlet} from "react-router-dom";
import {useRole} from "./RoleContext";
export default function RequireRole({allow}:{allow:Array<"ADMIN"|"MANAGER"|"TEAM_LEADER">}){
 const {role,loading}=useRole();
 if(loading)return <div style={{padding:32}}>Loading permissions…</div>;
 return role&&allow.includes(role)?<Outlet/>:<Navigate to="/settings/language" replace/>;
}

import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { IncomingMessage, ServerResponse } from "node:http";
import { Duplex } from "node:stream";
import express from "express";
import jwt from "jsonwebtoken";
import argon2 from "argon2";
import app from "../src/app";
import { prisma } from "../src/lib/prisma";
import { authenticate, requireRoles } from "../src/middleware/auth.middleware";

process.env.JWT_SECRET = "authorization-tests-only-not-a-production-secret";
let actor: any;
let lookups = 0;
let failLookup = false;
const firstSessionId = "11111111-1111-4111-8111-111111111111";
const secondSessionId = "22222222-2222-4222-8222-222222222222";
let sessions: Map<string, {id:string;userId:number;expiresAt:Date}>;
let failRevoke = false;
let failCreate = false;
prisma.user.findUnique = (async () => actor) as any;
prisma.session.findUnique = (async (args: any) => {
    lookups++;
    if (failLookup) throw new Error("Simulated database outage");
    const session = sessions.get(args.where.id);
    return session && actor ? {...session,user:actor} : null;
}) as any;
prisma.session.deleteMany = (async (args: any) => {
    if (failRevoke) throw new Error("Simulated revoke failure");
    const session = sessions.get(args.where.id);
    if (session?.userId !== args.where.userId) return {count:0};
    sessions.delete(args.where.id);
    return {count:1};
}) as any;
prisma.session.create = (async (args: any) => {
    if (failCreate) throw new Error("Simulated create failure");
    sessions.set(args.data.id,args.data);
    return args.data;
}) as any;
beforeEach(() => {
    actor = { id: 1, email: "test@example.com", role: "TEAM_LEADER" };
    lookups = 0; failLookup = false; failRevoke = false; failCreate = false;
    sessions = new Map([firstSessionId,secondSessionId].map(id=>[id,{id,userId:1,expiresAt:new Date(Date.now()+3600000)}]));
});
function token(claims: object = { id: 1, role: "ADMIN" }, options: jwt.SignOptions = {}) {
    return jwt.sign({jti:firstSessionId,...claims}, process.env.JWT_SECRET!, { expiresIn: "1h", ...options });
}
function dispatch(target: express.Express, path: string, method = "GET", bearer: string | null = token(), body?: object): Promise<{status:number;json:()=>Promise<any>}> {
    return new Promise((resolve,reject) => {
        const socket = new Duplex({read(){},write(_chunk,_encoding,done){done();}});
        const req = new IncomingMessage(socket as any);
        req.url = path;
        req.method = method;
        req.headers = bearer === null ? {} : {authorization:`Bearer ${bearer}`};
        (req as any).body = body;
        const res = new ServerResponse(req);
        res.end = ((chunk?: any) => {
            resolve({status:res.statusCode,json:async()=>JSON.parse(String(chunk))});
            return res;
        }) as any;
        target(req as any,res as any);
        res.on("error",reject);
    });
}
function request(path: string, method = "GET", bearer: string | null = token(), body?: object) {
    return dispatch(app,"/api"+path,method,bearer,body);
}
const protectedRoutes = ["/employees/getemployeelist", "/employees/1", "/activity/notes/1",
    "/activity/writeup/1", "/employees/1/goals", "/employees/1/evaluations",
    "/employees/1/evaluation-form", "/employees/1/evaluations/1", "/employees/evaluation-statistics/quarter",
    "/dashboard/recent-activity", "/departments/options", "/departments", "/evaluation-templates", "/users", "/auth/me"];
test("every data route rejects missing credentials and deleted accounts", async () => {
    for (const path of protectedRoutes) assert.equal((await request(path, "GET", null)).status, 401, path);
    actor = null;
    for (const path of protectedRoutes) assert.equal((await request(path)).status, 401, path);
    assert.equal((await request("/preferences/theme", "PATCH", token(), {darkMode:true})).status, 401);
});
test("invalid tokens and subjects are rejected before querying accounts", async () => {
    for (const bearer of ["invalid", token({id:"1"}), token({id:0}), token({id:-1}), token({}),
        token({id:1}, {expiresIn:-1}), token({id:1}, {algorithm:"HS384"}),
        jwt.sign({id:1}, "incorrect-secret"), token() + " extra"]) {
        assert.equal((await request("/users", "GET", bearer)).status, 401);
    }
    assert.equal(lookups, 0);
});
const adminRoutes: [string, string][] = [
    ["/departments", "GET"], ["/evaluation-templates", "GET"], ["/evaluation-templates/1", "GET"],
    ["/evaluation-templates/1/questions", "GET"], ["/evaluation-templates", "POST"],
    ["/evaluation-templates/1/questions", "POST"], ["/evaluation-questions/1", "PATCH"],
    ["/evaluation-questions/1", "DELETE"], ["/departments", "POST"],
    ["/departments/1", "PATCH"], ["/departments/1", "DELETE"],
];
test("managers and team leaders cannot read admin templates or change configuration", async () => {
    for (const role of ["MANAGER", "TEAM_LEADER"]) {
        actor.role = role;
        for (const [path, method] of adminRoutes) {
            const response = await request(path, method, token(), {});
            assert.equal(response.status, 403, `${role} ${method} ${path}`);
            assert.deepEqual(await response.json(), {message:"Access denied."});
        }
    }
});
test("fresh database role overrides stale token claims in both directions", async () => {
    actor.role = "ADMIN";
    // Invalid input reaches the controller only if authorization succeeds.
    assert.equal((await request("/evaluation-templates/invalid", "GET", token({id:1,role:"TEAM_LEADER"}))).status, 400);
    actor.role = "TEAM_LEADER";
    assert.equal((await request("/evaluation-templates/invalid")).status, 403);
    actor.role = "UNKNOWN";
    assert.equal((await request("/users")).status, 403);
});
test("team leaders cannot enumerate, create, edit or delete accounts", async () => {
    for (const [path, method] of [["/users","GET"],["/users","POST"],["/users/2","PATCH"],["/users/2","DELETE"]]) {
        assert.equal((await request(path, method, token(), {})).status, 403);
    }
});
test("managers only list team leaders; admins list all roles", async () => {
    let where: unknown;
    prisma.user.findMany = (async (args: any) => { where = args.where; return []; }) as any;
    actor.role = "MANAGER";
    assert.equal((await request("/users")).status, 200);
    assert.deepEqual(where, {role:"TEAM_LEADER"});
    actor.role = "ADMIN";
    assert.equal((await request("/users")).status, 200);
    assert.deepEqual(where, {});
});
test("managers cannot create privileged accounts, promote users, edit peers/admins or delete users", async () => {
    actor.role = "MANAGER";
    for (const role of ["ADMIN", "MANAGER"]) {
        assert.equal((await request("/users", "POST", token(), {
            firstName:"Test",lastName:"User",email:"test@example.com",password:"test-password-123",role,
        })).status, 403);
        assert.equal((await request("/users/2", "PATCH", token(), {role})).status, 403);
        prisma.$transaction = (async (fn: any) => fn({user:{
            findUnique: async () => ({id:2,role}),
            update: async () => { throw new Error("Unauthorized write reached database"); },
        }})) as any;
        assert.equal((await request("/users/2", "PATCH", token(), {firstName:"Changed"})).status, 403);
    }
    assert.equal((await request("/users/2", "DELETE")).status, 403);
});
test("database outages fail closed", async () => {
    failLookup = true;
    const original = console.error;
    console.error = () => {};
    try { assert.equal((await request("/users")).status, 503); }
    finally { console.error = original; }
});
test("role middleware denies missing identity and accepts every explicitly allowed role", async () => {
    const probe = express();
    probe.get("/unguarded", requireRoles("ADMIN"), (_req,res) => res.sendStatus(200));
    probe.get("/session", authenticate, requireRoles("ADMIN","MANAGER","TEAM_LEADER"), (req:any,res) => res.json(req.user));
    assert.equal((await dispatch(probe,"/unguarded")).status,401);
    for (const role of ["ADMIN","MANAGER","TEAM_LEADER"]) {
        actor.role = role;
        const response = await dispatch(probe,"/session");
        assert.equal(response.status,200);
        assert.deepEqual(await response.json(),actor);
    }
});

test("all roles can use department options without configuration fields", async () => {
    let selection: unknown;
    prisma.department.findMany = (async (args: any) => {
        selection = args.select;
        return [{id:3,name:"Service"}];
    }) as any;
    for (const role of ["ADMIN","MANAGER","TEAM_LEADER"]) {
        actor.role = role;
        const response = await request("/departments/options");
        assert.equal(response.status,200);
        assert.deepEqual(selection,{id:true,name:true});
        assert.deepEqual(await response.json(),[{id:3,name:"Service"}]);
    }
});

test("logout invalidates a copied token across all data routes and preserves another device", async () => {
    const copied = token();
    assert.equal((await request("/departments/options","GET",copied)).status,200);
    assert.equal((await request("/auth/logout","POST",copied)).status,204);
    for (const path of protectedRoutes) assert.equal((await request(path,"GET",copied)).status,401,path);
    assert.equal((await request("/auth/logout","POST",copied)).status,401);
    assert.equal((await request("/departments/options","GET",token({id:1,jti:secondSessionId}))).status,200);
});
test("legacy tokens, missing sessions, expired sessions and mismatched owners are rejected", async () => {
    const legacy = jwt.sign({id:1},process.env.JWT_SECRET!,{expiresIn:"1h"});
    assert.equal((await request("/departments/options","GET",legacy)).status,401);
    sessions.delete(firstSessionId);
    assert.equal((await request("/departments/options")).status,401);
    sessions.set(firstSessionId,{id:firstSessionId,userId:1,expiresAt:new Date(0)});
    assert.equal((await request("/departments/options")).status,401);
    sessions.set(firstSessionId,{id:firstSessionId,userId:2,expiresAt:new Date(Date.now()+3600000)});
    assert.equal((await request("/auth/logout","POST")).status,401);
    assert.ok(sessions.has(firstSessionId));
});
test("failed revocation reports failure and permits a retry", async () => {
    failRevoke = true;
    const original = console.error; console.error = () => {};
    try { assert.equal((await request("/auth/logout","POST")).status,503); }
    finally { console.error = original; }
    assert.ok(sessions.has(firstSessionId));
    failRevoke = false;
    assert.equal((await request("/auth/logout","POST")).status,204);
    assert.equal((await request("/departments/options")).status,401);
});
test("login persists distinct sessions and logout revokes the actual issued JWT", async () => {
    actor.passwordHash = await argon2.hash("test-password-123");
    const credentials = {email:actor.email,password:"test-password-123"};
    const loginA = await request("/auth/login","POST",null,credentials);
    const loginB = await request("/auth/login","POST",null,credentials);
    assert.equal(loginA.status,200); assert.equal(loginB.status,200);
    const a = await loginA.json(), b = await loginB.json();
    const claimsA = jwt.verify(a.token,process.env.JWT_SECRET!) as jwt.JwtPayload;
    const claimsB = jwt.verify(b.token,process.env.JWT_SECRET!) as jwt.JwtPayload;
    assert.notEqual(claimsA.jti,claimsB.jti);
    assert.equal(sessions.get(claimsA.jti!)?.expiresAt.getTime(),claimsA.exp! * 1000);
    assert.equal((await request("/auth/logout","POST",a.token)).status,204);
    assert.equal((await request("/departments/options","GET",a.token)).status,401);
    assert.equal((await request("/departments/options","GET",b.token)).status,200);
});
test("invalid credentials and failed session persistence never issue a usable login", async () => {
    actor.passwordHash = await argon2.hash("test-password-123");
    const count = sessions.size;
    assert.equal((await request("/auth/login","POST",null,{email:actor.email,password:"wrong"})).status,401);
    assert.equal(sessions.size,count);
    failCreate = true;
    const original = console.error; console.error = () => {};
    try {
        const response = await request("/auth/login","POST",null,{email:actor.email,password:"test-password-123"});
        assert.equal(response.status,500);
        assert.equal((await response.json()).token,undefined);
    } finally { console.error = original; }
    assert.equal(sessions.size,count);
});

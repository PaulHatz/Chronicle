import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { IncomingMessage, ServerResponse } from "node:http";
import { Duplex } from "node:stream";
import express from "express";
import jwt from "jsonwebtoken";
import app from "../src/app";
import { prisma } from "../src/lib/prisma";
import { authenticate, requireRoles } from "../src/middleware/auth.middleware";

process.env.JWT_SECRET = "authorization-tests-only-not-a-production-secret";
let actor: any;
let lookups = 0;
let failLookup = false;
prisma.user.findUnique = (async () => {
    lookups++;
    if (failLookup) throw new Error("Simulated database outage");
    return actor;
}) as any;
beforeEach(() => { actor = { id: 1, email: "test@example.com", role: "TEAM_LEADER" }; lookups = 0; failLookup = false; });
function token(claims: object = { id: 1, role: "ADMIN" }, options: jwt.SignOptions = {}) {
    return jwt.sign(claims, process.env.JWT_SECRET!, { expiresIn: "1h", ...options });
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

import { test } from "node:test";
import assert from "node:assert/strict";
import { IncomingMessage, ServerResponse } from "node:http";
import { Duplex } from "node:stream";
import jwt from "jsonwebtoken";
import express from "express";
import app from "../src/app";
import { prisma } from "../src/lib/prisma";
import { validateRequest } from "../src/middleware/validation.middleware";
import * as schemas from "../src/validation/schemas";

process.env.JWT_SECRET = "validation-tests-only";
const token = jwt.sign({id:1,jti:"11111111-1111-4111-8111-111111111111"},process.env.JWT_SECRET,{expiresIn:"1h"});
prisma.session.findUnique = (async () => ({userId:1,expiresAt:new Date(Date.now()+3600000),user:{id:1,email:"admin@example.com",role:"ADMIN"}})) as any;
function send(target: express.Express, path: string, method = "GET", body?: unknown, raw?: string, contentType = "application/json") {
    return new Promise<{status:number;data:any}>((resolve,reject) => {
        const socket = new Duplex({read(){},write(_c,_e,done){done();}});
        const req = new IncomingMessage(socket as any);
        req.url = path; req.method = method;
        req.headers = {authorization:`Bearer ${token}`,"content-type":contentType};
        if (raw !== undefined) {
            req.headers["content-length"] = String(Buffer.byteLength(raw));
            req.push(raw); req.push(null);
        } else (req as any).body = body;
        const res = new ServerResponse(req);
        res.end = ((chunk?:any) => {
            try { resolve({status:res.statusCode,data:chunk ? JSON.parse(String(chunk)) : undefined}); }
            catch(error){reject(error);}
            return res;
        }) as any;
        target(req as any,res as any);
    });
}
const employee = {firstName:"Paul",lastName:"Test",position:"Server",departmentId:1,status:"ACTIVE",hireDate:"2024-02-29",email:"",phone:""};
const validCases: [string,any,unknown][] = [
    ["login",schemas.loginBody,{email:"user@example.com",password:" existing password "}],
    ["employee",schemas.employeeBody,employee],
    ["department",schemas.departmentBody,{name:"Service",evaluationTemplateId:1,evaluationFrequencyDays:90}],
    ["department patch",schemas.departmentPatch,{name:"Kitchen"}],
    ["template",schemas.templateBody,{name:"Service",version:"1.0"}],
    ["numeric question",schemas.questionBody,{questionText:"Quality?",questionType:"NUMERIC",minScore:1,maxScore:5,rubric:{"1":"Poor","5":"Excellent"}}],
    ["text question",schemas.questionBody,{questionText:"Comments?",questionType:"TEXT"}],
    ["question patch",schemas.questionPatch,{questionText:"Updated?"}],
    ["note",schemas.noteBody,{title:"Good work",content:"Details"}],
    ["writeup",schemas.writeUpBody,{type:"VERBAL_WARNING",reason:"Details"}],
    ["goal",schemas.goalBody,{title:"Learn",description:"Details",duration:"2026-12-31"}],
    ["goal patch",schemas.goalPatch,{status:"COMPLETED"}],
    ["evaluation",schemas.evaluationBody,{answers:[{questionId:1,scoreAnswer:3,textAnswer:null}]}],
    ["user",schemas.userBody,{firstName:"Test",lastName:"User",email:"test@example.com",password:"long-password-123",role:"TEAM_LEADER"}],
    ["user patch",schemas.userPatch,{language:"en-CA"}],
    ["language",schemas.languageBody,{language:"fr-CA"}],
    ["theme",schemas.themeBody,{darkMode:true}],
];
test("all body schemas allow legitimate input and reject unknown fields and wrong shapes", () => {
    for (const [name,schema,value] of validCases) {
        assert.equal(schema.safeParse(value).success,true,name);
        for (const bad of [null,[],"text",42,{...value as object,unexpected:"injected"}]) {
            assert.equal(schema.safeParse(bad).success,false,name);
        }
    }
});
test("schemas enforce calendar dates, bounds, types, enums, patches and nested answers", () => {
    for (const hireDate of ["0000-01-01","2025-02-29","2026-04-31","2026-13-01","tomorrow","2026-01-01T00:00:00Z"])
        assert.equal(schemas.employeeBody.safeParse({...employee,hireDate}).success,false);
    for (const departmentId of [0,-1,1.5,"1",2147483648])
        assert.equal(schemas.employeeBody.safeParse({...employee,departmentId}).success,false);
    for (const change of [{firstName:" "},{firstName:"a".repeat(101)},{status:"DELETED"},{email:{value:"x@y.com"}},{phone:12}])
        assert.equal(schemas.employeeBody.safeParse({...employee,...change}).success,false);
    for (const schema of [schemas.userPatch,schemas.goalPatch,schemas.departmentPatch,schemas.questionPatch]) assert.equal(schema.safeParse({}).success,false);
    for (const answers of [[],[{questionId:1,scoreAnswer:1.5,textAnswer:null}],[{questionId:1,scoreAnswer:1,textAnswer:null,extra:true}],
        Array(2).fill({questionId:1,scoreAnswer:1,textAnswer:null}),[{questionId:1,scoreAnswer:null,textAnswer:"a".repeat(10001)}]])
        assert.equal(schemas.evaluationBody.safeParse({answers}).success,false);
    assert.equal(schemas.themeBody.safeParse({darkMode:"false"}).success,false);
    assert.equal(schemas.questionBody.safeParse({questionText:"Q",questionType:"NUMERIC",minScore:5,maxScore:1}).success,false);
});
test("validated normalization reaches the handler while invalid input never does", async () => {
    let calls = 0;
    const probe = express();
    probe.post("/",validateRequest(schemas.employeeBody),(req,res)=>{calls++;res.json(req.body);});
    const ok = await send(probe,"/","POST",{...employee,firstName:" Paul "});
    assert.equal(ok.status,200); assert.equal(ok.data.firstName,"Paul"); assert.equal(ok.data.email,null);
    assert.equal((await send(probe,"/","POST",{...employee,departmentId:"1"})).status,400);
    assert.equal(calls,1);
    assert.equal(schemas.loginBody.parse({email:" USER@EXAMPLE.COM ",password:" secret "}).password," secret ");
});
test("every write endpoint rejects malformed payloads before business handlers", async () => {
    const cases: [string,string,unknown][] = [
        ["POST","/auth/login",{email:{equals:"admin@example.com"},password:"secret"}],
        ["POST","/employees/add",{...employee,hireDate:"2026-02-30"}],
        ["PATCH","/employees/1",{...employee,role:"ADMIN"}],
        ["POST","/departments",{name:"Service",evaluationTemplateId:"1",evaluationFrequencyDays:90}],
        ["PATCH","/departments/1",{}],
        ["POST","/evaluation-templates",{name:"a".repeat(201),version:"1"}],
        ["POST","/evaluation-templates/1/questions",{questionText:"Q",questionType:"NUMERIC",minScore:10,maxScore:1}],
        ["PATCH","/evaluation-questions/1",{rubric:{"1":{nested:true}}}],
        ["POST","/activity/notes/1",{title:"Note",content:"Text",userId:2}],
        ["POST","/activity/writeup/1",{type:"BAD",reason:"Reason"}],
        ["PATCH","/activity/writeup/1/2/resolve",{resolvedAt:"yesterday"}],
        ["POST","/employees/1/goals",{title:"Goal",description:"Details",duration:"2026-02-30"}],
        ["PATCH","/employees/1/goals/2",{status:"BAD"}],
        ["POST","/employees/1/evaluations",{answers:[{questionId:1,scoreAnswer:"5",textAnswer:null}]}],
        ["POST","/users",{firstName:"Test",lastName:"User",email:"a@b.com",password:"long-password-123",role:"ADMIN",passwordHash:"injected"}],
        ["PATCH","/users/1",{password:"short"}],
        ["PATCH","/preferences/language",{language:"xx"}],
        ["PATCH","/preferences/theme",{darkMode:"true"}],
        ["POST","/auth/logout",{sessionId:"someone-else"}],
    ];
    for (const [method,path,body] of cases) {
        const response = await send(app,"/api"+path,method,body);
        assert.equal(response.status,400,method+" "+path);
        assert.equal(response.data.message,"Invalid request.");
        assert.ok(response.data.errors.length);
    }
});
test("all ID routes reject noncanonical and out-of-range IDs; unknown query keys are rejected", async () => {
    for (const path of ["/employees/1e2","/employees/0x10","/employees/-1","/employees/2147483648","/employees/01",
        "/activity/notes/nope","/activity/writeup/1/nope/resolve","/employees/1/goals/nope","/evaluation-templates/nope",
        "/evaluation-templates/nope/questions","/evaluation-questions/nope","/departments/nope","/users/nope",
        "/employees/1/evaluations/nope","/employees/nope/evaluation-form"]) {
        const method = path.endsWith("resolve") ? "PATCH" : /goals\/nope|evaluation-questions|departments\/nope|users\/nope/.test(path) ? "DELETE" : "GET";
        assert.equal((await send(app,"/api"+path,method)).status,400,path);
    }
    for (const path of ["/employees/getemployeelist","/dashboard/recent-activity","/departments/options","/users","/auth/me"])
        assert.equal((await send(app,"/api"+path+"?role=ADMIN&role=MANAGER")).status,400,path);
});
test("JSON parser rejects broken JSON, scalar JSON, oversized bodies and non-JSON transport", async () => {
    for (const raw of ['{"email":','null','42']) {
        const result = await send(app,"/api/auth/login","POST",undefined,raw);
        assert.equal(result.status,400); assert.equal(result.data.message,"Malformed JSON body.");
    }
    assert.equal((await send(app,"/api/auth/login","POST",undefined,JSON.stringify({email:"x".repeat(110000)}))).status,413);
    assert.equal((await send(app,"/api/auth/login","POST",undefined,"email=test","text/plain")).status,415);
    const validJson = await send(app,"/api/auth/login","POST",undefined,JSON.stringify({email:[],password:"secret"}));
    assert.equal(validJson.status,400); assert.equal(validJson.data.message,"Invalid request.");
});

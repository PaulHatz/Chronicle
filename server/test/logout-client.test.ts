import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { logout } from "../../client/src/api/auth";

const originalFetch = globalThis.fetch;
const originalStorage = Object.getOwnPropertyDescriptor(globalThis,"localStorage");
let saved: string | null;
let calls: number;
beforeEach(() => {
    saved = "current-token"; calls = 0;
    Object.defineProperty(globalThis,"localStorage",{configurable:true,value:{
        getItem: () => saved,
        removeItem: () => { saved = null; },
    }});
});
after(() => {
    globalThis.fetch = originalFetch;
    if (originalStorage) Object.defineProperty(globalThis,"localStorage",originalStorage);
    else delete (globalThis as any).localStorage;
});
test("client sends logout with the current token before clearing it", async () => {
    globalThis.fetch = (async (url:any,options:any) => {
        calls++;
        assert.equal(url,"http://localhost:3000/api/auth/logout");
        assert.equal(options.method,"POST");
        assert.equal(options.headers.get("Authorization"),"Bearer current-token");
        assert.equal(saved,"current-token");
        return new Response(null,{status:204});
    }) as any;
    assert.equal(await logout(),null); assert.equal(saved,null); assert.equal(calls,1);
});
test("server and network failures retain the credential for a logout retry", async () => {
    globalThis.fetch = async () => new Response(null,{status:503});
    await assert.rejects(logout()); assert.equal(saved,"current-token");
    globalThis.fetch = async () => { throw new Error("offline"); };
    await assert.rejects(logout()); assert.equal(saved,"current-token");
});
test("an already rejected token can be cleared locally", async () => {
    globalThis.fetch = async () => new Response(null,{status:401});
    assert.equal(await logout(),null);
});
test("logout does not clear another tab's newer login", async () => {
    globalThis.fetch = async () => { saved = "new-token"; return new Response(null,{status:204}); };
    assert.equal(await logout(),"new-token"); assert.equal(saved,"new-token");
});
test("no token means no server request is needed", async () => {
    saved = null;
    globalThis.fetch = async () => { throw new Error("Unexpected request"); };
    assert.equal(await logout(),null);
});

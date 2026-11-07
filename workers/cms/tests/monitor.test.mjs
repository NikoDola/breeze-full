import test from "node:test";
import assert from "node:assert/strict";
import { createWorker, migrate, token } from "./helpers.mjs";
const monitorToken = "read-only-monitor-" + "m".repeat(40);
test("monitor is opt-in and rejects writer credentials and browser-origin requests", async () => {
  const absent = await createWorker();
  try { assert.equal((await absent.dispatchFetch("https://worker.test/api/monitor/status")).status,404); } finally { await absent.dispose(); }
  const mf = await createWorker({ bindings: { CMS_MONITOR_TOKEN: monitorToken } });
  try {
    await migrate(await mf.getD1Database("DB"));
    assert.equal((await mf.dispatchFetch("https://worker.test/api/monitor/status",{headers:{Authorization:`Bearer ${token}`}})).status,401);
    assert.equal((await mf.dispatchFetch("https://worker.test/api/monitor/status",{headers:{Authorization:`Bearer ${monitorToken}`,Origin:"https://example.com"}})).status,403);
    const response=await mf.dispatchFetch("https://worker.test/api/monitor/status",{headers:{Authorization:`Bearer ${monitorToken}`}});
    assert.equal(response.status,200);
    const data=await response.json(); assert.equal(data.ready,true); assert.equal(data.siteId,"breeze"); assert.equal(data.version,1);
    assert.equal(data.pendingPublications,0); assert.ok(!JSON.stringify(data).includes("document_json"));
    assert.equal((await mf.dispatchFetch("https://worker.test/api/admin/health",{headers:{Authorization:`Bearer ${monitorToken}`}})).status,401);
    assert.equal((await mf.dispatchFetch("https://worker.test/api/admin/draft",{method:"POST",headers:{Authorization:`Bearer ${monitorToken}`,"Content-Type":"application/json"},body:"{}"})).status,401);
  } finally { await mf.dispose(); }
});
test("monitor credential cannot be configured to reuse the write token",async()=>{
  const mf=await createWorker({bindings:{CMS_MONITOR_TOKEN:token}});
  try { assert.equal((await mf.dispatchFetch("https://worker.test/api/monitor/status",{headers:{Authorization:`Bearer ${token}`}})).status,404); } finally { await mf.dispose(); }
});

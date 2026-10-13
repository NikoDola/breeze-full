// Test-only remote acceptance. No production resources or performance benchmark.
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { spawn } from "node:child_process";
import { runMediaWorkflow } from "./media-http-proof.mjs";
const local = new URL("../../../.local/",import.meta.url);
const config = parseEnv(await readFile(new URL("cms-preview.env",local),"utf8"));
const identity = parseEnv(await readFile(new URL("cms-media-oidc.env",local),"utf8"));
const origin = "https://breeze-full-git-cms-testing-nikodolas-projects.vercel.app", worker = "https://breeze-test-api.nikodola.workers.dev";
assert.equal(config.CMS_TEST_ORIGIN,origin); assert.equal(config.CMS_WORKER_URL,worker);
assert.ok(identity.VERCEL_OIDC_TOKEN?.length>32);
const editorHeaders = {authorization:`Basic ${Buffer.from(`${config.CMS_TEST_USERNAME}:${config.CMS_TEST_PASSWORD}`).toString("base64")}`,origin,"x-cms-request":"editor","content-type":"application/json"};
// Binary-safe curl transport; credentials travel on stdin and are never logged.
async function nextFetch(path, options={}) {
  assert.ok(path.startsWith("/") && !path.startsWith("//"));
  const headers = {...options.headers,"x-vercel-trusted-oidc-idp-token":identity.VERCEL_OIDC_TOKEN};
  const args=["silent","show-error","compressed","max-time = 65",`url = ${JSON.stringify(origin+path)}`];
  for (const [key,value] of Object.entries(headers)) args.push(`header = ${JSON.stringify(`${key}: ${value}`)}`);
  if (options.method) args.push(`request = ${JSON.stringify(options.method)}`);
  if (options.body) args.push(`data = ${JSON.stringify(options.body)}`);
  const marker="\n__MEDIA_HTTP_RESULT__";
  args.push(`write-out = ${JSON.stringify(marker+"%{http_code}|%header{content-type}|%header{cache-control}|%header{x-vercel-cache}|%header{x-nextjs-cache}|%header{x-vercel-mitigated}")}`);
  const child=spawn(process.platform==="win32"?"curl.exe":"curl",["--config","-"],{windowsHide:true,stdio:["pipe","pipe","pipe"]});
  const chunks=[]; child.stdout.on("data",data=>chunks.push(data)); child.stderr.on("data",()=>{});
  const done=new Promise((resolve,reject)=>{child.on("error",reject);child.on("close",resolve);});
  child.stdin.end(args.join("\n")+"\n"); assert.equal(await done,0,"Preview transfer failed; refresh status before retrying");
  const buffer=Buffer.concat(chunks), index=buffer.lastIndexOf(marker); assert.ok(index>=0);
  const [status,type,cacheControl,vercelCache,nextCache,mitigation]=buffer.subarray(index+Buffer.byteLength(marker)).toString().trim().split("|");
  if (mitigation) throw new Error(`Vercel security checkpoint: ${mitigation}. Protection remains unchanged.`);
  return new Response(buffer.subarray(0,index),{status:Number(status),headers:{"content-type":type,"cache-control":cacheControl,"x-vercel-cache":vercelCache,"x-nextjs-cache":nextCache}});
}
const report={at:new Date().toISOString(),checks:[]};
const check=message=>{report.checks.push(message);console.log(`PASS: ${message}`);};
try {
  const response=await nextFetch("/api/cms/editor",{method:"POST",headers:editorHeaders,body:JSON.stringify({action:"preflight",pageId:"cms-proof"})});
  assert.equal(response.status,200); const preflight=await response.json();
  assert.equal(preflight.branch,"cms-testing"); assert.equal(preflight.region,"iad1"); assert.equal(preflight.identity,"preview-oidc");
  check("Preview branch, iad1, OIDC and HMAC verified");
  if(process.argv.includes("--preflight")) {
    assert.equal(preflight.writesEnabled,false);
    const health=await nextFetch("/api/cms/media/health",{headers:editorHeaders}); assert.equal(health.status,200);
    const result=await health.json(); assert.ok(result.schemaReady&&result.storageReady); assert.equal(result.uploadOrigin,origin);
    check("R2/D1 media preflight passes with test writes disabled");
  } else {
    assert.ok(process.argv.includes("--publish"),"Choose --preflight or --publish"); assert.equal(preflight.writesEnabled,true);
    report.media=await runMediaWorkflow({origin,worker,nextFetch,editorHeaders,check,checkpoint: state=>writeFile(new URL("cms-media-restore.json",local),JSON.stringify(state,null,2))});
  }
  report.status="passed";
} catch(error) {report.status="failed";report.error=error.message;console.error(error.message);process.exitCode=1;}
await writeFile(new URL(process.argv.includes("--preflight")?"cms-media-preflight.json":"cms-media-preview-results.json",local),JSON.stringify(report,null,2));

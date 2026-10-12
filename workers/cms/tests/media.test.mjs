import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import sharp from "sharp";
import { pathToFileURL, fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";
import { admin, createWorker, legacy, migrate, token } from "./helpers.mjs";

const output = new URL("../../../.local/media-processor-test.mjs", import.meta.url);
await mkdir(new URL("../../../.local/", import.meta.url), { recursive:true });
await build({ entryPoints:[fileURLToPath(new URL("../../../src/lib/cms/process-image.ts", import.meta.url))], outfile:fileURLToPath(output), bundle:true, platform:"node", format:"esm", external:["sharp"] });
const { processImage } = await import(output.href);
const origin = "https://breeze-full-git-cms-testing-nikodolas-projects.vercel.app";
const pixel = () => sharp({ create:{ width:120, height:80, channels:4, background:{r:27,g:83,b:57,alpha:0.8} } });

test("decoder accepts four formats, removes metadata, rejects unsafe/truncated/oversized images", async () => {
  for (const [format,mime] of [["jpeg","image/jpeg"],["png","image/png"],["webp","image/webp"],["avif","image/avif"]]) {
    const source = await pixel().toFormat(format).toBuffer();
    const result = await processImage(source,mime), info = await sharp(result.master).metadata();
    assert.equal(info.format,"webp"); assert.equal(info.width,120); assert.equal(info.height,80); assert.equal(info.exif,undefined);
    assert.equal((await sharp(result.thumb).metadata()).format,"webp");
  }
  const tagged = await pixel().jpeg().withExif({ IFD0:{ Copyright:"private metadata" } }).toBuffer();
  assert.ok((await sharp(tagged).metadata()).exif);
  assert.equal((await sharp((await processImage(tagged,"image/jpeg")).master).metadata()).exif,undefined);
  for (const [bytes,mime] of [[Buffer.from('<svg onload="alert(1)"/>'),"image/png"],[Buffer.from([255,216,255,0]),"image/jpeg"],[await pixel().png().toBuffer(),"image/jpeg"],[Buffer.alloc(10485761),"image/png"],[await sharp({create:{width:9000,height:1,channels:3,background:"white"}}).png().toBuffer(),"image/png"],[await sharp({create:{width:5000,height:5000,channels:3,background:"white"}}).png().toBuffer(),"image/png"]]) await assert.rejects(() => processImage(bytes,mime),/safely/);
});

test("private R2 upload → validation → immutable publication; security, retry and retention", async t => {
  const mf = await createWorker(); t.after(() => mf.dispose());
  const db = await mf.getD1Database("DB"); await migrate(db);
  const bytes = await pixel().png().toBuffer();
  const grant = async (overrides={}) => admin(mf,"media/grant",{filename:"comfort.png",mime:"image/png",bytes:bytes.length,origin,...overrides});
  const upload = (g, overrides={}) => mf.dispatchFetch(`https://worker.test${g.uploadPath}`,{method:"PUT",headers:{origin,authorization:`Bearer ${g.token}`,"content-type":"image/png",...overrides},body:bytes});
  const put = (id,kind,lease,body) => mf.dispatchFetch(`https://worker.test/api/admin/media/${id}/${kind}`,{method:"PUT",headers:{authorization:`Bearer ${token}`,"x-media-lease":lease},body});
  await t.test("admin protection and single-use scoped upload capability", async () => {
    assert.equal((await mf.dispatchFetch("https://worker.test/api/admin/media")).status,401);
    assert.equal((await admin(mf,"media",undefined,{origin})).status,403);
    assert.equal((await grant({origin:"https://evil.example"})).status,403);
    assert.equal((await grant({bytes:10485761})).status,400);
    assert.equal((await grant({mime:"image/svg+xml"})).status,400);
  });
  const g = await (await grant()).json(); assert.ok(g.token);
  assert.equal((await upload(g,{origin:"https://evil.example"})).status,403);
  assert.equal((await upload(g,{authorization:`Bearer ${"a".repeat(64)}`})).status,401);
  const preflight = await mf.dispatchFetch(`https://worker.test${g.uploadPath}`,{method:"OPTIONS",headers:{origin,"access-control-request-method":"PUT"}});
  assert.equal(preflight.status,204); assert.equal(preflight.headers.get("access-control-allow-origin"),origin);
  assert.equal((await upload(g)).status,200); assert.equal((await upload(g)).status,401);
  const publicURL = `https://worker.test/media/${g.assetId}/master-v1.webp`;
  assert.equal((await mf.dispatchFetch(publicURL)).status,404);
  const ready = await processImage(bytes,"image/png");
  const claim = await (await admin(mf,`media/${g.assetId}/claim`,{})).json();
  assert.equal((await admin(mf,`media/${g.assetId}/claim`,{})).status,409);
  assert.equal((await put(g.assetId,"master","wrong",ready.master)).status,409);
  assert.equal((await put(g.assetId,"master",claim.lease,ready.master)).status,200);
  assert.equal((await put(g.assetId,"master",claim.lease,ready.master)).status,200);
  assert.equal((await put(g.assetId,"thumb",claim.lease,ready.thumb)).status,200);
  assert.equal((await put(g.assetId,"preview",claim.lease,ready.preview)).status,200);
  const completed = await admin(mf,`media/${g.assetId}/complete`,{width:ready.width,height:ready.height},{"x-media-lease":claim.lease});
  assert.equal(completed.status,200,await completed.text());
  assert.equal((await (await admin(mf,`media/${g.assetId}/claim`,{})).json()).ready,true);
  assert.equal((await mf.dispatchFetch(publicURL)).status,404);
  assert.equal((await admin(mf,`media/${g.assetId}/master`)).headers.get("cache-control"),"private, no-store");
  assert.equal((await mf.dispatchFetch(`https://worker.test/media/${g.assetId}/source`)).status,404);
  let state = await (await admin(mf,"import",{source:legacy})).json();
  const old = await (await admin(mf,"publish",{expectedVersion:1})).json();
  const oldJSON = await db.prepare("SELECT document_json FROM cms_revisions WHERE id = ?").bind(old.publication.revisionId).first();
  const document = structuredClone(state.draft.document); document.schemaVersion=3;
  document.section.images=["/images/hero-full.webp",{assetId:g.assetId,alt:"Comfortable home",decorative:false,width:120,height:80}];
  const invalid = structuredClone(document); invalid.section.images[1].width=121;
  assert.equal((await admin(mf,"draft",{expectedVersion:1,document:invalid})).status,400);
  state = await (await admin(mf,"draft",{expectedVersion:1,document})).json();
  assert.equal(state.draft.version,2); assert.equal((await mf.dispatchFetch(publicURL)).status,404);
  // A publication failure must also roll back the media visibility change.
  await db.prepare("CREATE TRIGGER fail_media_outbox BEFORE INSERT ON cms_publish_outbox BEGIN SELECT RAISE(ABORT, 'test'); END").run();
  assert.equal((await admin(mf,"publish",{expectedVersion:2})).status,500);
  assert.equal((await mf.dispatchFetch(publicURL)).status,404);
  await db.prepare("DROP TRIGGER fail_media_outbox").run();
  state = await (await admin(mf,"publish",{expectedVersion:2})).json();
  assert.equal(state.publication.document.schemaVersion,3); assert.equal(state.delivery.confirmed_at,null);
  assert.equal((await (await admin(mf,"publish",{expectedVersion:2})).json()).publication.revisionId,state.publication.revisionId);
  assert.equal((await db.prepare("SELECT COUNT(*) n FROM revision_assets").first()).n,1);
  const response = await mf.dispatchFetch(publicURL); assert.equal(response.status,200); assert.match(response.headers.get("cache-control"),/immutable/); await response.arrayBuffer();
  const hit = await mf.dispatchFetch(publicURL); assert.equal(hit.headers.get("x-media-cache"),"HIT"); await hit.arrayBuffer();
  const updated = structuredClone(document); updated.section.images=[];
  state = await (await admin(mf,"draft",{expectedVersion:2,document:updated})).json();
  await admin(mf,"publish",{expectedVersion:state.draft.version});
  assert.equal((await mf.dispatchFetch(publicURL)).status,200);
  assert.deepEqual(await db.prepare("SELECT document_json FROM cms_revisions WHERE id = ?").bind(old.publication.revisionId).first(),oldJSON);
  await assert.rejects(() => db.prepare("DELETE FROM media_assets WHERE id = ?").bind(g.assetId).run(),/FOREIGN KEY/);
  await assert.rejects(() => db.prepare("UPDATE media_assets SET width = 1 WHERE id = ?").bind(g.assetId).run(),/immutable/);
  await assert.rejects(() => db.prepare("DELETE FROM revision_assets").run(),/immutable/);
  const expired = await (await grant()).json();
  await db.prepare("UPDATE media_upload_sessions SET expires_at=0 WHERE asset_id=?").bind(expired.assetId).run();
  assert.equal((await upload(expired)).status,401);
  const rejected = await (await grant()).json();
  assert.equal((await mf.dispatchFetch(`https://worker.test${rejected.uploadPath}`,{method:"PUT",headers:{origin,authorization:`Bearer ${rejected.token}`},body:Buffer.alloc(bytes.length)})).status,400);
  assert.equal((await (await admin(mf,`media/${rejected.assetId}`)).json()).asset.status,"failed");
});

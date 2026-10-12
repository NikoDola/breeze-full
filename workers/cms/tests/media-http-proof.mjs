// Shared focused acceptance workflow. Mutates only cms-proof; restores its draft
// and publication independently. Callers pin local/test origins and credentials.
import assert from "node:assert/strict";
import sharp from "sharp";
import { randomBytes } from "node:crypto";

export async function runMediaWorkflow({ origin, worker, nextFetch, editorHeaders, check, checkpoint = async () => {} }) {
  const api = async (path, body) => {
    const response = await nextFetch(path,{method:body ? "POST":"GET",headers:editorHeaders,body:body ? JSON.stringify(body):undefined});
    const result = await response.json(); assert.equal(response.status,200,JSON.stringify(result)); return result;
  };
  const media = body => api("/api/cms/media",body);
  const editor = body => api("/api/cms/editor?pageId=cms-proof",body ? {...body,pageId:"cms-proof"}:undefined);
  const initial = await editor(), homepage = await api("/api/cms/editor?pageId=home");
  assert.ok(initial.draft && initial.publication, "Proof must be initialized and published before the media check.");
  assert.equal((await nextFetch("/api/cms/media")).status,401);
  assert.equal((await nextFetch("/api/cms/media",{method:"POST",headers:{...editorHeaders,origin:"https://evil.example"},body:'{"action":"grant"}'})).status,403);
  const health = await api("/api/cms/media/health"); assert.ok(health.storageReady && health.schemaReady);
  let first;
  for (const [format,mime] of [["jpeg","image/jpeg"],["png","image/png"],["webp","image/webp"],["avif","image/avif"]]) {
    const file = format === "png" ? await sharp(randomBytes(1600*1200*3),{raw:{width:1600,height:1200,channels:3}}).png().toBuffer()
      : await sharp({create:{width:960,height:640,channels:3,background:{r:32,g:96,b:71}}}).toFormat(format).toBuffer();
    if (format === "png") assert.ok(file.length > 4.5*1024*1024, "Exercise direct upload above the Vercel request-body limit");
    const grant = await media({action:"grant",filename:`CMS-media-check.${format}`,mime,bytes:file.length});
    assert.ok(grant.uploadUrl.startsWith(worker+"/api/media/upload/"));
    const uploaded = await fetch(grant.uploadUrl,{method:"PUT",headers:{origin,authorization:`Bearer ${grant.token}`,"content-type":mime},body:file});
    assert.equal(uploaded.status,200,await uploaded.text());
    const validated = await media({action:"validate",assetId:grant.assetId}); assert.equal(validated.asset.status,"ready");
    const preview = await nextFetch(`/api/cms/media/${grant.assetId}/thumb`,{headers:editorHeaders});
    assert.equal(preview.status,200); assert.match(preview.headers.get("cache-control"),/no-store/); assert.equal((await sharp(Buffer.from(await preview.arrayBuffer())).metadata()).format,"webp");
    assert.equal((await nextFetch(`/api/cms/media/${grant.assetId}/master`)).status,401);
    assert.equal((await fetch(`${worker}/media/${grant.assetId}/master-v1.webp`)).status,404);
    if (!first) first=validated.asset;
  }
  check("Four image formats uploaded, decoded and previewed privately; auth and CSRF enforced");
  // A convincing JPEG signature without decodable pixels must never become ready.
  const invalid = Buffer.from([255,216,255,0,0,0,0,0]);
  const invalidGrant = await media({action:"grant",filename:"invalid.jpg",mime:"image/jpeg",bytes:invalid.length});
  assert.equal((await fetch(invalidGrant.uploadUrl,{method:"PUT",headers:{origin,authorization:`Bearer ${invalidGrant.token}`},body:invalid})).status,200);
  const rejection = await nextFetch("/api/cms/media",{method:"POST",headers:editorHeaders,body:JSON.stringify({action:"validate",assetId:invalidGrant.assetId})});
  assert.equal(rejection.status,400); check("Invalid pixel data rejected by the server decoder");
  const document = structuredClone(initial.draft.document); document.schemaVersion=3;
  document.section.images=[{assetId:first.id,alt:"Breeze media verification",decorative:false,width:first.width,height:first.height}];
  await checkpoint({initial,document,assetId:first.id});
  let state;
  try {
    state = await editor({action:"draft",expectedVersion:initial.draft.version,document});
    const before = await nextFetch("/cms-proof"); assert.ok(!(await before.text()).includes(first.id));
    const started = performance.now();
    state = await editor({action:"publish",expectedVersion:state.draft.version});
    if (!state.delivery?.confirmed_at) state = await editor({action:"retry"});
    assert.ok(state.delivery?.confirmed_at,state.delivery?.last_error || "Publication delivery pending");
    const revision = state.publication.revisionId;
    const page = await nextFetch("/cms-proof"); const html = await page.text();
    assert.ok(html.includes(first.id)); assert.ok(html.includes(`data-cms-revision="${revision}"`));
    const publishMs = performance.now()-started;
    const imageURL = `${worker}/media/${first.id}/master-v1.webp`;
    const publicImage = await fetch(imageURL); assert.equal(publicImage.status,200); assert.match(publicImage.headers.get("cache-control"),/immutable/); await publicImage.arrayBuffer();
    const outputs=[];
    for (const [width,format,accept] of [[384,"avif","image/avif,image/webp,*/*"],[1080,"webp","image/webp,*/*"]]) {
      const path = `/_next/image?url=${encodeURIComponent(imageURL)}&w=${width}&q=75`;
      const cold = await nextFetch(path,{headers:{accept}}); assert.equal(cold.status,200);
      assert.equal(cold.headers.get("content-type"),`image/${format}`);
      const data = Buffer.from(await cold.arrayBuffer()), info = await sharp(data).metadata(); assert.ok(info.width<=width);
      const warm = await nextFetch(path,{headers:{accept}}); assert.equal(warm.status,200); assert.deepEqual(Buffer.from(await warm.arrayBuffer()),data);
      outputs.push({format,width:info.width,bytes:data.length,cache:warm.headers.get("x-vercel-cache") || warm.headers.get("x-nextjs-cache")});
    }
    assert.equal((await editor({action:"retry"})).publication.revisionId,revision);
    check("Image draft published with confirmed delivery; responsive AVIF/WebP and repeated cached responses verified");
    return {assetId:first.id,revisionId:revision,publishMs,outputs};
  } finally {
    // Restore a pre-existing unpublished draft separately from the published page.
    let current = await editor();
    assert.ok([document,initial.draft.document,initial.publication.document].some(doc=>JSON.stringify(doc)===JSON.stringify(current.draft.document)),"Proof edited independently; refusing to overwrite changes.");
    if (JSON.stringify(current.publication.document)!==JSON.stringify(initial.publication.document)) {
      current = await editor({action:"draft",expectedVersion:current.draft.version,document:initial.publication.document});
      current = await editor({action:"publish",expectedVersion:current.draft.version});
      if (!current.delivery?.confirmed_at) current=await editor({action:"retry"});
      assert.ok(current.delivery?.confirmed_at);
    }
    if (JSON.stringify(current.draft.document)!==JSON.stringify(initial.draft.document)) current=await editor({action:"draft",expectedVersion:current.draft.version,document:initial.draft.document});
    assert.deepEqual(current.draft.document,initial.draft.document); assert.deepEqual(current.publication.document,initial.publication.document);
    assert.equal((await api("/api/cms/editor?pageId=home")).publication?.revisionId,homepage.publication?.revisionId);
    assert.equal((await fetch(`${worker}/media/${first.id}/master-v1.webp`)).status,200);
    check("Previous proof publication/draft restored; homepage unchanged; historical image still available");
  }
}

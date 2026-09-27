import {verifyLaunch,requireRole,type Env} from "./auth";

const headers=(env:Env)=>({"content-type":"application/json; charset=utf-8","access-control-allow-origin":"*","access-control-allow-headers":"content-type, authorization","access-control-allow-methods":"GET,POST,PATCH,PUT,OPTIONS"});
const json=(data:unknown,status=200,env:Env)=>new Response(JSON.stringify(data),{status,headers:headers(env)});
const idFrom=(url:URL)=>url.pathname.split("/")[3]||"";

export default {async fetch(request:Request,env:Env):Promise<Response>{
  try{
    if(request.method==="OPTIONS")return new Response(null,{headers:headers(env)});
    const url=new URL(request.url);
    if(url.pathname==="/health")return json({ok:true,service:"save-the-future-api"},200,env);
    if(url.pathname==="/api/me"&&request.method==="GET"){const u=await verifyLaunch(request,env);return json(u?{id:u.id,vkUserId:u.vk_user_id,role:u.role,displayName:u.display_name}:{authenticated:false},200,env);}
    if(url.pathname==="/api/submissions"&&request.method==="GET"){
      const u=await verifyLaunch(request,env);
      const sql=u?.role==="organizer"?"SELECT * FROM submissions ORDER BY created_at DESC":"SELECT id,poster_no,title,idea,problem,interactive,interactive_url,image_key,status,audience_count,created_at FROM submissions WHERE status IN ('published','winner') ORDER BY created_at DESC";
      const r=await env.DB.prepare(sql).all();return json(r.results,200,env);
    }
    if(url.pathname==="/api/submissions"&&request.method==="POST"){
      const u=await requireRole(request,env,["participant","organizer"]);const b:any=await request.json();
      if(!b.title||!b.idea||!b.aiHow)return json({error:"title, idea and aiHow are required"},400,env);
      const id=crypto.randomUUID(),posterNo=Math.floor(100+Math.random()*900);
      await env.DB.prepare("INSERT INTO submissions(id,poster_no,title,idea,problem,author,group_name,contact,tools,ai_how,contribution,interactive,interactive_url,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,'moderation')")
        .bind(id,posterNo,b.title,b.idea,b.problem||"",b.author||u.display_name||"",b.group||"",b.contact||"",b.tools||"",b.aiHow,b.contribution||"",b.interactive?1:0,b.interactiveUrl||"").run();
      return json({id,posterNo,status:"moderation"},201,env);
    }
    if(url.pathname.startsWith("/api/submissions/")&&url.pathname.endsWith("/status")&&request.method==="PATCH"){
      await requireRole(request,env,["organizer"]);const id=idFrom(url);const b:any=await request.json();
      if(!["published","rework","rejected","winner"].includes(b.status))return json({error:"invalid_status"},400,env);
      await env.DB.prepare("UPDATE submissions SET status=? WHERE id=?").bind(b.status,id).run();return json({ok:true},200,env);
    }
    if(url.pathname.startsWith("/api/submissions/")&&url.pathname.endsWith("/score")&&request.method==="PUT"){
      const u=await requireRole(request,env,["jury","organizer"]);const id=idFrom(url);const b:any=await request.json();
      const vals=["idea","english","originality","design","digital"].map(k=>Number(b[k]));
      if(vals.some(v=>!Number.isInteger(v)||v<0||v>20))return json({error:"scores must be integers 0..20"},400,env);
      await env.DB.prepare("INSERT INTO scores(submission_id,jury_user_id,idea,english,originality,design,digital) VALUES(?,?,?,?,?,?,?) ON CONFLICT(submission_id,jury_user_id) DO UPDATE SET idea=excluded.idea,english=excluded.english,originality=excluded.originality,design=excluded.design,digital=excluded.digital").bind(id,String(u.id),...vals).run();
      return json({ok:true,total:vals.reduce((a,b)=>a+b,0)},200,env);
    }
    if(url.pathname.startsWith("/api/submissions/")&&url.pathname.endsWith("/reaction")&&request.method==="POST"){
      await requireRole(request,env,["participant","jury","organizer"]);const id=idFrom(url);await env.DB.prepare("UPDATE submissions SET audience_count=audience_count+1 WHERE id=?").bind(id).run();return json({ok:true},200,env);
    }
    if(url.pathname.startsWith("/api/upload/")&&request.method==="POST"){
      await requireRole(request,env,["participant","organizer"]);const id=url.pathname.split("/")[3];const s=await env.DB.prepare("SELECT id FROM submissions WHERE id=?").bind(id).first<{id:string}>();
      if(!s)return json({error:"not_found"},404,env);const file=await request.arrayBuffer();const type=request.headers.get("content-type")||"application/octet-stream";
      if(file.byteLength>10*1024*1024||!["image/png","image/jpeg","image/webp"].includes(type))return json({error:"poster must be PNG/JPEG/WEBP up to 10MB"},400,env);
      const key=`posters/${id}`;await env.POSTERS.put(key,file,{httpMetadata:{contentType:type}});await env.DB.prepare("UPDATE submissions SET image_key=? WHERE id=?").bind(key,id).run();return json({ok:true,key},200,env);
    }
    if(url.pathname.startsWith("/api/posters/")&&request.method==="GET"){const key=url.pathname.slice("/api/posters/".length);const obj=await env.POSTERS.get(key);if(!obj)return new Response("Not found",{status:404});return new Response(obj.body,{headers:{"content-type":obj.httpMetadata?.contentType||"application/octet-stream","cache-control":"public,max-age=3600"}});}
    return json({error:"not_found"},404,env);
  }catch(e){if(e instanceof Response)return e;return json({error:e instanceof Error?e.message:"server_error"},500,env);}
}};
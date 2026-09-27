export interface Env { DB:D1Database; POSTERS:R2Bucket; VK_APP_SECRET:string; }
export type User={id:number;vk_user_id:string;role:"participant"|"jury"|"organizer";display_name:string|null};

function b64url(bytes:ArrayBuffer){return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");}
function bytes(s:string){return new TextEncoder().encode(s);}
function equal(a:string,b:string){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}

export async function verifyLaunch(request:Request,env:Env):Promise<User|null>{
  const raw=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
  if(!raw)return null;
  const p=new URLSearchParams(raw);
  const sign=p.get("sign"); const app=p.get("vk_app_id"); const uid=p.get("vk_user_id");
  if(!sign||!app||!uid)return null;
  const pairs=[...p.entries()].filter(([k])=>k.startsWith("vk_")).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`);
  const data=pairs.join("&");
  const key=await crypto.subtle.importKey("raw",bytes(env.VK_APP_SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const digest=b64url(await crypto.subtle.sign("HMAC",key,bytes(data)));
  if(!equal(digest,sign))return null;
  const existing=await env.DB.prepare("SELECT id,vk_user_id,role,display_name FROM users WHERE vk_user_id=?").bind(uid).first<User>();
  if(existing)return existing;
  const name=p.get("vk_first_name")&&p.get("vk_last_name")? `${p.get("vk_first_name")} ${p.get("vk_last_name")}`:null;
  await env.DB.prepare("INSERT OR IGNORE INTO users(vk_user_id,role,display_name) VALUES(?, 'participant', ?)").bind(uid,name).run();
  return await env.DB.prepare("SELECT id,vk_user_id,role,display_name FROM users WHERE vk_user_id=?").bind(uid).first<User>()||null;
}
export async function requireRole(request:Request,env:Env,roles:string[]){const user=await verifyLaunch(request,env);if(!user)throw new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers:{"content-type":"application/json"}});if(!roles.includes(user.role))throw new Response(JSON.stringify({error:"forbidden"}),{status:403,headers:{"content-type":"application/json"}});return user;}
const allowed=new Set(['deezer.com','www.deezer.com','link.deezer.com','deezer.page.link']);
export function safeURL(value){const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port||!allowed.has(u.hostname)||u.href.length>2048)throw Error('url');return u}
export function reference(value){const u=safeURL(value);if(!['deezer.com','www.deezer.com'].includes(u.hostname))return null;const m=u.pathname.match(/\/(track|album|playlist)\/([1-9][0-9]{0,19})(?:\/|$)/);return m?{kind:m[1],id:m[2]}:null}
export async function resolve(value,fetcher=fetch){let u=safeURL(value);const signal=AbortSignal.timeout(8000);
for(let i=0;i<6;i++){const ref=reference(u.href);if(ref)return ref;
const r=await fetcher(u.href,{redirect:'manual',signal,headers:{Accept:'text/html'}});
if([301,302,303,307,308].includes(r.status)){const location=r.headers.get('location');await r.body?.cancel();if(!location)throw Error('redirect');u=safeURL(new URL(location,u).href);continue}
if(!r.ok){await r.body?.cancel();throw Error('upstream')}
const reader=r.body.getReader();let text='',size=0;const decoder=new TextDecoder();try{while(size<131072){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>131072)break;text+=decoder.decode(part.value,{stream:true});}}finally{await reader.cancel()}
const candidates=[...text.matchAll(/<(?:link|meta)\b[^>]*>/gi)].filter(m=>/\brel=["']canonical["']|\bproperty=["']og:url["']/i.test(m[0]));
for(const tag of candidates){const match=tag[0].match(/\b(?:href|content)=["']([^"']+)["']/i);if(match){const target=safeURL(new URL(match[1].replaceAll('&amp;','&'),u).href);const ref=reference(target.href);if(ref)return ref}}
throw Error('not found');}
throw Error('redirect limit');}
export function createResolver({url,key,fetcher=fetch}){return async req=>{const origin=req.headers.get('Origin');const headers={'Content-Type':'application/json','Cache-Control':'no-store',...(origin==='https://sophiekohl.github.io'?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{})};const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
if(req.method==='OPTIONS')return new Response(null,{status:origin==='https://sophiekohl.github.io'?204:403,headers:{...headers,'Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST'}});
if(req.method!=='POST'||(origin&&origin!=='https://sophiekohl.github.io'))return reply({error:'Nicht erlaubt.'},403);
const authorization=req.headers.get('Authorization');if(!authorization?.startsWith('Bearer '))return reply({error:'Bitte im Studio anmelden.'},401);
try{const auth=await fetcher(url+'/rest/v1/rpc/is_admin',{method:'POST',headers:{apikey:key,Authorization:authorization,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(5000)});if(!auth.ok||await auth.json()!==true)return reply({error:'Nur im Studio verfügbar.'},403);
if(Number(req.headers.get('content-length'))>4096)return reply({error:'Link zu lang.'},413);const raw=await req.text();if(raw.length>4096)return reply({error:'Link zu lang.'},413);const input=JSON.parse(raw);return reply(await resolve(input.url,fetcher));
}catch{return reply({error:'Deezer-Link konnte nicht aufgelöst werden. Bitte einen vollständigen Song-, Album- oder Playlist-Link verwenden.'},400)}}}

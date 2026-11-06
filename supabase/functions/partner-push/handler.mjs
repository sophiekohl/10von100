const ORIGIN='https://sophiekohl.github.io';
export function validSubscription(s){try{const u=new URL(s.endpoint);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&u.pathname.length>1&&u.href.length<2048&&(u.hostname==='push.apple.com'||u.hostname.endsWith('.push.apple.com')||u.hostname==='fcm.googleapis.com'||u.hostname==='updates.push.services.mozilla.com')&&/^[A-Za-z0-9_-]{87}$/.test(s.keys?.p256dh||'')&&/^[A-Za-z0-9_-]{22}$/.test(s.keys?.auth||'');}catch{return false}}
export function neutralPayload(itemId){return JSON.stringify({title:'10 / 100',body:'Etwas wartet auf dich. ♡',...(itemId?{itemId}:{test:true})})}
function sameSecret(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==64||b.length!==64)return false;let diff=0;for(let i=0;i<64;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0}
export function createPushHandler({url,key,webpush,fetcher=fetch}){
 const rpc=async(name,args,token=key)=>{const r=await fetcher(url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(args)});if(!r.ok)throw Error('rpc');return r.json()};
 const worker=(action,data={})=>rpc('push_worker',{p_action:action,p_data:data});
 const send=async(sub,keys,itemId)=>{if(!validSubscription(sub))return 'expired';const req=webpush.generateRequestDetails(sub,neutralPayload(itemId),{vapidDetails:{subject:ORIGIN+'/10von100/',publicKey:keys.publicKey,privateKey:keys.privateKey},TTL:3600,urgency:'normal',contentEncoding:'aes128gcm',...(itemId?{topic:itemId.replaceAll('-','')}:{})});const response=await fetcher(req.endpoint,{method:'POST',headers:req.headers,body:req.body,redirect:'error',signal:AbortSignal.timeout(10000)});return response.ok?'sent':[404,410].includes(response.status)?'expired':'retry'};
 return async request=>{
 const origin=request.headers.get('Origin'),cors=origin===ORIGIN?{'Access-Control-Allow-Origin':ORIGIN,'Vary':'Origin'}:{};
 const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(request.method==='OPTIONS')return new Response(null,{status:origin===ORIGIN?204:403,headers:{...cors,'Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST'}});
 if(request.method!=='POST'||(origin&&origin!==ORIGIN))return reply({error:'Nicht erlaubt.'},403);
 if(Number(request.headers.get('content-length'))>5000)return reply({error:'Anfrage zu groß.'},413);
 try{
 const raw=await request.text();if(raw.length>5000)return reply({error:'Anfrage zu groß.'},413);const data=JSON.parse(raw);
 if(data.action==='dispatch'){
 const supplied=request.headers.get('x-push-cron');if(!/^[a-f0-9]{64}$/.test(supplied||''))return reply({error:'Nicht erlaubt.'},403);
 let keys=await worker('keys');if(!sameSecret(supplied,keys.cronKey))return reply({error:'Nicht erlaubt.'},403);
 if(!keys.publicKey){await worker('init',webpush.generateVAPIDKeys());keys=await worker('keys');const probe=webpush.generateVAPIDKeys();webpush.generateRequestDetails({endpoint:'https://web.push.apple.com/runtime-validation',keys:{p256dh:probe.publicKey,auth:btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16)))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')}},neutralPayload(),{vapidDetails:{subject:ORIGIN+'/10von100/',publicKey:keys.publicKey,privateKey:keys.privateKey},contentEncoding:'aes128gcm'});}
 const claimed=await worker('claim');let accepted=0;
 await Promise.all(claimed.map(async job=>{let result='retry';try{result=await send(job,keys,job.itemId)}catch{}await worker('finish',{...job,endpoint:undefined,keys:undefined,result});if(result==='sent')accepted++;}));
 return reply({accepted});
 }
 const token=request.headers.get('Authorization')?.replace(/^Bearer /,'');if(!token)return reply({error:'Bitte erneut anmelden.'},401);
 // Verify identity AND current registered partner session using the caller's JWT.
 if(!await rpc('is_couple_member',{},token))return reply({error:'Bitte erneut anmelden.'},403);
 if(data.action==='config'){
 let cfg=await rpc('push_manage',{p_action:'config'},token);
 if(!cfg.publicKey){await worker('init',webpush.generateVAPIDKeys());cfg=await rpc('push_manage',{p_action:'config'},token)}
 return reply(cfg);
 }
 if(data.action==='subscribe'){
 if(!validSubscription(data.subscription))return reply({error:'Dieses Gerät konnte nicht registriert werden.'},400);
 await rpc('push_manage',{p_action:'subscribe',p_subscription:data.subscription},token);return reply({ok:true});
 }
 if(data.action==='remove'){await rpc('push_manage',{p_action:'remove',p_endpoint:data.endpoint},token);return reply({ok:true})}
 if(data.action==='test'){
 const sub=await rpc('push_manage',{p_action:'test',p_endpoint:data.endpoint},token);const keys=await worker('keys');
 const result=await send(sub,keys);return result==='sent'?reply({ok:true}):reply({error:'Testnachricht konnte nicht zugestellt werden. Bitte Mitteilungen neu aktivieren.'},502);
 }
 return reply({error:'Unbekannte Anfrage.'},400);
 }catch{return reply({error:'Die Anfrage konnte nicht abgeschlossen werden. Bitte Anmeldung und Verbindung prüfen; Testnachrichten höchstens einmal pro Minute.'},400)}
 };
}

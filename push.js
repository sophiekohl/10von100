/* Optional push settings. No content or subscription is stored in localStorage. */
window.PartnerPush=(()=>{
 let session,verified=false,ready=false,pendingEnrollment=false,enrolling=null;
 const consentKey='10von100_push_pending_consent';
 try{pendingEnrollment=localStorage.getItem(consentKey)==='1'}catch{}
 function setPending(value){pendingEnrollment=value;try{if(value)localStorage.setItem(consentKey,'1');else localStorage.removeItem(consentKey)}catch{}}
 const host=document.createElement('section');host.id='pushSettings';host.hidden=true;host.style.cssText='border-top:1px solid #d9c8bf;margin-top:24px;padding:18px 0 8px;font-family:-apple-system,BlinkMacSystemFont,sans-serif';
 const title=document.createElement('h3');title.textContent='Ein kleiner Hinweis für dich';title.style.cssText='font:24px/1.3 Georgia,serif;color:#681d2b;margin:0 0 8px';
 const msg=document.createElement('p');msg.id='pushStatus';msg.setAttribute('role','status');msg.style.cssText='font:15px/1.5 -apple-system,BlinkMacSystemFont,sans-serif;color:#675653';
 const enable=document.createElement('button'),test=document.createElement('button'),disable=document.createElement('button');
 enable.textContent='Mitteilungen aktivieren';test.textContent='Testnachricht senden';disable.textContent='Mitteilungen ausschalten';
 for(const button of [enable,test,disable]){button.type='button';button.className='calbtn';button.style.cssText='margin:8px 0;width:100%;min-height:44px;font-size:15px'}
 host.append(title,msg,enable,test,disable);
 const supported=()=>!location.pathname.includes('/preview/')&&'serviceWorker'in navigator&&'PushManager'in window&&'Notification'in window;
 const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const installed=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 const api=(data)=>session.request('/functions/v1/partner-push',{method:'POST',body:JSON.stringify(data)});
 const registration=()=>navigator.serviceWorker.ready;
 const subscription=async()=>(await registration()).pushManager.getSubscription();
 const bytes=value=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
 async function refresh(){enable.hidden=true;test.hidden=true;disable.hidden=true;
 if(supported()&&Notification.permission!=='granted'&&pendingEnrollment)setPending(false);
 if(!supported()){msg.textContent=location.pathname.includes('/preview/')?'Mitteilungen sind in der installierten Haupt-App verfügbar.':'Dieser Browser unterstützt Mitteilungen noch nicht.';return}
 if(isIOS()&&!installed()){msg.textContent='Öffne die App über ihr Symbol auf deinem Home-Bildschirm, um Mitteilungen zu aktivieren.';return}
 if(Notification.permission==='denied'){msg.textContent='Mitteilungen sind auf diesem Gerät blockiert. Du kannst sie in den iPhone-Einstellungen für diese App erlauben.';disable.hidden=!verified;return}
 if(!verified){enable.hidden=pendingEnrollment;msg.textContent=pendingEnrollment?'Mitteilungen sind erlaubt. Nach deiner PIN-Anmeldung wird dieses Gerät dafür aktiviert.':'Ein kleiner Hinweis, sobald etwas für dich bereit ist. Freiwillig – du kannst auch ohne fortfahren.';return}
 try{const sub=await subscription();if(!verified)return;const active=!!sub&&Notification.permission==='granted';if(active)await api({action:'subscribe',subscription:sub.toJSON()});if(!verified)return;enable.hidden=active;test.hidden=disable.hidden=!active;msg.textContent=active?'Mitteilungen sind auf diesem Gerät aktiv. Auf dem Sperrbildschirm steht nur: „Etwas wartet auf dich. ♡“':'Wenn eine Überraschung bereit ist, bekommst du einen kleinen Hinweis. Titel und Fotos bleiben in der App.';}catch{msg.textContent='Mitteilungen sind gerade nicht verfügbar. Bitte die App mit Internetverbindung erneut öffnen.'}}
 const busy=value=>{for(const b of [enable,test,disable])b.disabled=value};
 async function enroll(){
 if(enrolling)return enrolling;
 enrolling=(async()=>{const config=await api({action:'config'});if(!verified)return;
 const reg=await registration();if(!verified)return;let sub=await reg.pushManager.getSubscription();if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes(config.publicKey)});
 if(!verified){await sub.unsubscribe();return}
 try{await api({action:'subscribe',subscription:sub.toJSON()});setPending(false)}catch(e){await sub.unsubscribe();throw e}
 })().finally(()=>{enrolling=null});return enrolling;
 }
 enable.onclick=async()=>{busy(true);try{
 // iOS requires the permission request directly in the user's tap, including before PIN login.
 const permission=await Notification.requestPermission();if(permission!=='granted'){setPending(false);await refresh();return}
 setPending(true);
 if(verified)await enroll();await refresh();
 }catch{msg.textContent='Aktivierung fehlgeschlagen. Bitte Verbindung und Anmeldung prüfen und erneut versuchen.';enable.hidden=false}finally{busy(false)}};
 test.onclick=async()=>{busy(true);try{const sub=await subscription();if(!sub)throw Error();await api({action:'test',endpoint:sub.endpoint});msg.textContent='Test an den Push-Dienst übergeben. Bitte prüfe deine Mitteilungen; Fokus-Einstellungen können den Hinweis stummschalten.'}catch{msg.textContent='Test nicht gesendet. Bitte Verbindung prüfen und eine Minute vor dem nächsten Versuch warten.'}finally{busy(false)}};
 async function remove(){setPending(false);if(!supported())return;const reg=await navigator.serviceWorker.getRegistration();const sub=await reg?.pushManager?.getSubscription();if(sub){try{await api({action:'remove',endpoint:sub.endpoint})}finally{await sub.unsubscribe()}}}
 disable.onclick=async()=>{busy(true);try{await remove();await refresh();msg.textContent='Mitteilungen sind auf diesem Gerät ausgeschaltet.'}catch{msg.textContent='Bitte mit Internetverbindung erneut ausschalten.'}finally{busy(false)}};
 return {init(s){session=s;document.querySelector('.pinContent').append(host);ready=true},update(value){verified=value;if(!ready)return;const parent=document.querySelector(value?'#intro .intro':'.pinContent');if(host.parentElement!==parent)parent.append(host);host.hidden=false;
 if(value&&pendingEnrollment&&supported()&&(!isIOS()||installed())&&Notification.permission==='granted'){busy(true);enroll().then(refresh).catch(()=>{msg.textContent='Mitteilungen sind erlaubt. Die Aktivierung bitte hier erneut versuchen.';enable.hidden=false}).finally(()=>busy(false))}else refresh();},remove};
})();

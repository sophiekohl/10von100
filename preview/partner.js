function memoryAction(button,label,path){button.setAttribute('aria-label',label);button.title=label;button.style.cssText='display:inline-flex;align-items:center;justify-content:center;flex:0 0 44px;width:44px;min-height:44px;margin:0;padding:10px;border:0;background:transparent;color:#641d2b;border-radius:12px;font-size:0;cursor:pointer';const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('width','20');svg.setAttribute('height','20');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.7');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');const shape=document.createElementNS('http://www.w3.org/2000/svg','path');shape.setAttribute('d',path);svg.append(shape);button.append(svg);}
const {API,KEY,Session,berlinDate}=AppCore;
const partner=new Session(localStorage,'10von100_partner_session');
let gifts=[],calendarRanges=[],loadVersion=0,gateVerified=false;
const ids=['giftcards','detail','detailTitle','detailtext','detailMedia','authBox','authSignedIn','authMsg','authPin','authLogin','authLogout','intro','info','close','begin','closeDetail','addMoment','upload','daycount','monthtitle','grid','openCal','closeCal','prev','nextm','calendar','momentList','momentMsg','saveMoment','momentCaption','momentDate','momentFiles'];
const ui=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
function clearPrivate(){gateVerified=false;loadVersion++;detailVersion++;momentVersion++;if('mediaSession'in navigator)navigator.mediaSession.metadata=null;gifts=gifts.map(g=>({...g,state:'locked',title:'Da wartet etwas auf dich.',body:'',media:[]}));
  ui.detail.classList.remove('show');ui.detailTitle.textContent='Da wartet etwas auf dich.';ui.detailtext.textContent='';ui.detailMedia.replaceChildren();ui.momentList.replaceChildren();ui.upload.classList.remove('show');ui.momentCaption.value='';ui.momentFiles.value='';renderGifts();authUI();}
partner.onclear=clearPrivate;
// Remove the legacy session; a separate PIN session must never inherit admin credentials.
localStorage.removeItem('10von100_access_token');localStorage.removeItem('10von100_refresh_token');
function authUI(){const yes=!!partner.read()&&gateVerified;ui.authBox.hidden=false;ui.authSignedIn.hidden=true;ui.addMoment.disabled=!yes;document.getElementById('privateApp').hidden=!yes;document.getElementById('privateNav').hidden=!yes;ui.close.hidden=!yes;if(yes){document.getElementById('pinGate').hidden=true;ui.intro.classList.remove('show')}else if(document.getElementById('pinGate').hidden){ui.intro.classList.add('show')}}
async function publicRPC(name){const r=await fetch(API+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:'{}',cache:'no-store'});if(!r.ok)throw Error('Kalender nicht verfügbar');return r.json();}
async function loadSurprises(){const version=++loadVersion;
  try{const [schedule,ranges]=await Promise.all([publicRPC('public_surprise_schedule'),publicRPC('public_calendar_ranges')]);
    let unlocked=[],media=[];
    if(partner.read()){
      try{[unlocked,media]=await Promise.all(['public_unlocked_surprises','unlocked_couple_media'].map(name=>partner.request('/rest/v1/rpc/'+name,{method:'POST',body:'{}'})));
        // A revoked or expired partner session cannot return member data.
        if(!await partner.request('/rest/v1/rpc/is_couple_member',{method:'POST',body:'{}'})){partner.clear();return loadSurprises();}gateVerified=true;authUI();
      }catch(e){if(version!==loadVersion)return;clearPrivate();ui.authMsg.textContent=e.message;return;}
    }
    if(version!==loadVersion)return;
    calendarRanges=ranges;const visible=new Map(schedule.map(x=>[x.id,x]));for(const u of unlocked)visible.set(u.id,{...u,is_unlocked:true});
    const opened=new Map(unlocked.map(x=>[x.id,x]));gifts=[...visible.values()].map(x=>{const u=opened.get(x.id);return{id:x.id,calendarVisible:schedule.some(item=>item.id===x.id),date:berlinDate(new Date(x.unlock_at)),unlock_at:x.unlock_at,state:u?'open':'locked',title:u?.title||'Da wartet etwas auf dich.',body:u?.body||'',media:media.filter(m=>m.content_item_id===x.id)}}).sort((a,b)=>a.unlock_at.localeCompare(b.unlock_at));
    renderGifts();cal();const future=gifts.find(x=>new Date(x.unlock_at)>new Date());document.querySelector('#next small').textContent=future?fmt(future.date):'Bald wartet hier etwas auf dich.';
  }catch{if(version!==loadVersion)return;clearPrivate();ui.giftcards.textContent='Die Überraschungen sind gerade nicht erreichbar. Bitte mit Internetverbindung erneut versuchen.';}}
ui.authLogin.onclick=async()=>{ui.authLogin.disabled=true;ui.authMsg.textContent='Anmeldung läuft …';const pin=ui.authPin.value;ui.authPin.value='';try{
  if(!/^[0-9]{4}$/.test(pin))throw Error('Bitte vier Ziffern eingeben.');
  const r=await fetch(API+'/functions/v1/partner-pin',{method:'POST',cache:'no-store',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({action:'login',pin})});const data=await r.json();if(!r.ok)throw Error(data.error||'Anmeldung nicht möglich.');partner.save(data);authUI();await Promise.all([loadSurprises(),loadMoments()]);ui.authMsg.textContent='';
}catch(e){ui.authMsg.textContent=e.message}finally{ui.authLogin.disabled=false}};
ui.authPin.onkeydown=e=>{if(e.key==='Enter')ui.authLogin.click()};
ui.authLogout.onclick=async()=>{try{await partner.logout()}catch(e){ui.authMsg.textContent=e.message}await loadSurprises()};
const fmt=d=>new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'long',year:'numeric'}).format(new Date(d+'T12:00:00'));
function renderGifts(){const f=document.querySelector('.filters .active')?.dataset.filter||'all';ui.giftcards.replaceChildren();const items=gifts.filter(g=>f==='all'||g.state===f);if(!items.length){ui.giftcards.textContent='Hier wird bald etwas für dich warten. ♡';return;}
  for(const g of items){const card=document.createElement('button');card.type='button';card.className='card '+(g.state==='open'?'opened':'');const tag=document.createElement('span');tag.className='tag';tag.textContent=g.state==='open'?'GEÖFFNET ♡':'NOCH VERSCHLOSSEN';const title=document.createElement('h3');title.textContent=g.title;const date=document.createElement('p');date.textContent=fmt(g.date);card.append(tag,title,date);card.onclick=()=>showGift(g);ui.giftcards.append(card);}}
document.querySelectorAll('.filters button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.filters button').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderGifts()});
async function signedMedia(bucket,path){const data=await partner.request('/storage/v1/object/sign/'+bucket+'/'+path.split('/').map(encodeURIComponent).join('/'),{method:'POST',body:JSON.stringify({expiresIn:120})});return AppCore.storageURL(data.signedURL);}
let detailVersion=0;
async function showGift(g){const version=++detailVersion;ui.detailMedia.replaceChildren();ui.detailTitle.textContent=g.state==='open'?g.title:'Da wartet etwas auf dich.';ui.detailtext.textContent=g.state==='open'?g.body:'Diese Karte ist noch verschlossen. Wenn ihre Zeit gekommen ist, öffnet sie sich hier wie ein kleiner digitaler Brief.';ui.detail.classList.add('show');if(g.state!=='open')return;
  for(const m of g.media.slice().sort((a,b)=>a.sort_order-b.sort_order)){let node;try{
    if(['image','video','audio'].includes(m.media_type)&&m.storage_path){const src=await signedMedia('content',m.storage_path);if(version!==detailVersion||!partner.read())return;node=document.createElement(m.media_type==='image'?'img':m.media_type);node.src=src;if(m.media_type==='image')node.alt=m.caption||'Erinnerung';else{node.controls=true;node.preload='metadata';node.playsInline=true;node.onplay=()=>{document.querySelectorAll('#detail audio,#detail video').forEach(other=>{if(other!==node)other.pause()});if('mediaSession'in navigator&&'MediaMetadata'in window){navigator.mediaSession.metadata=new MediaMetadata({title:g.title,artist:'10 / 100'});navigator.mediaSession.setActionHandler('play',()=>node.play());navigator.mediaSession.setActionHandler('pause',()=>node.pause())}};if(m.media_type==='video'){const key='10von100-video-'+m.id;node.onloadedmetadata=()=>{const position=Number(localStorage.getItem(key));if(position>0&&position<node.duration-2)node.currentTime=position};node.ontimeupdate=()=>localStorage.setItem(key,String(node.currentTime));node.onended=()=>localStorage.removeItem(key);}}}
    else if(m.media_type==='youtube'&&/^[\w-]{11}$/.test(m.youtube_video_id||'')){node=document.createElement('iframe');node.src='https://www.youtube-nocookie.com/embed/'+m.youtube_video_id;node.title='YouTube-Video';node.allowFullscreen=true;}
    else if(m.media_type==='deezer'&&['track','album','playlist'].includes(m.deezer_kind)&&/^\d+$/.test(m.deezer_id||'')){node=document.createElement('iframe');node.className='deezer';node.src='https://widget.deezer.com/widget/dark/'+m.deezer_kind+'/'+m.deezer_id;node.title='Deezer';}
    if(version!==detailVersion)return;if(node){const wrap=document.createElement('div');wrap.className='mediaBlock';wrap.append(node);ui.detailMedia.append(wrap);}
  }catch{if(version!==detailVersion)return;const p=document.createElement('p');p.textContent='Dieses Medium konnte nicht geladen werden. Bitte den Brief erneut öffnen.';ui.detailMedia.append(p);}}
}
ui.closeDetail.onclick=()=>{detailVersion++;if('mediaSession'in navigator)navigator.mediaSession.metadata=null;ui.detail.classList.remove('show');ui.detailMedia.replaceChildren()};
const pages=[...document.querySelectorAll('.page')],nav=[...document.querySelectorAll('.nav button')];nav.forEach(b=>b.onclick=()=>{pages.forEach(p=>p.classList.toggle('on',p.id===b.dataset.p));nav.forEach(n=>n.classList.toggle('sel',n===b));if(b.dataset.p==='year'){loadMoments()};scrollTo(0,0)});
ui.info.onclick=()=>ui.intro.classList.add('show');ui.close.onclick=()=>{if(gateVerified)ui.intro.classList.remove('show')};ui.begin.onclick=()=>{ui.intro.classList.remove('show');if(!gateVerified)document.getElementById('pinGate').hidden=false;localStorage.introSeen='1'};
// 10% refers to ten of one hundred years, not to elapsed app-year progress.
ui.daycount.textContent='10 Jahre am 18. Januar 2027';
let view=new Date();view=new Date(view.getFullYear(),view.getMonth(),1);
function cal(){ui.monthtitle.textContent=new Intl.DateTimeFormat('de-DE',{month:'long',year:'numeric'}).format(view);ui.grid.replaceChildren();for(const text of ['Mo','Di','Mi','Do','Fr','Sa','So']){const d=document.createElement('div');d.className='dow';d.textContent=text;ui.grid.append(d)}
  for(let i=0;i<(view.getDay()+6)%7;i++)ui.grid.append(document.createElement('div'));
  for(let day=1;day<=new Date(view.getFullYear(),view.getMonth()+1,0).getDate();day++){const iso=[view.getFullYear(),String(view.getMonth()+1).padStart(2,'0'),String(day).padStart(2,'0')].join('-');const d=document.createElement('div');d.className='d';d.textContent=day;if(gifts.some(g=>g.calendarVisible&&g.date===iso)||calendarRanges.some(r=>r.start_date<=iso&&iso<=r.end_date))d.classList.add('event');if(iso===berlinDate(new Date()))d.classList.add('today');ui.grid.append(d);}}
ui.openCal.onclick=()=>{cal();ui.calendar.classList.add('show')};ui.closeCal.onclick=()=>ui.calendar.classList.remove('show');ui.prev.onclick=()=>{view.setMonth(view.getMonth()-1);cal()};ui.nextm.onclick=()=>{view.setMonth(view.getMonth()+1);cal()};
ui.next=document.getElementById('next');ui.next.onclick=()=>ui.openCal.click();
let momentVersion=0;
async function loadMoments(){const version=++momentVersion;if(!partner.read()){ui.momentList.textContent='Melde dich hier mit deiner PIN an, um eure Erinnerungen zu sehen.';return;}
 try{const rows=await partner.request('/rest/v1/year_moments?select=id,caption,moment_date,created_by,moment_photos(id,storage_path)&order=moment_date.desc');if(version!==momentVersion||!partner.read())return;ui.momentList.replaceChildren();if(!rows.length)ui.momentList.textContent='Euer erster Moment wartet darauf, festgehalten zu werden. ♡';for(const row of rows){const article=document.createElement('article');article.className='card';const date=document.createElement('p');date.textContent=fmt(row.moment_date);const caption=document.createElement('p');caption.textContent=row.caption||'';article.append(date,caption);ui.momentList.append(article);
  for(const photo of row.moment_photos){try{const src=await signedMedia('moments',photo.storage_path);if(version!==momentVersion||!partner.read())return;const img=document.createElement('img');img.src=src;img.alt=row.caption||'Unser Moment';img.loading='lazy';article.append(img)}catch{const p=document.createElement('p');p.textContent='Foto gerade nicht verfügbar.';article.append(p)}}
  if(row.created_by===partner.read()?.user?.id){const edit=document.createElement('button');edit.textContent='Text bearbeiten';edit.onclick=async()=>{const text=prompt('Deine Erinnerung',row.caption||'');if(text===null)return;try{await partner.request('/rest/v1/year_moments?id=eq.'+row.id,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({caption:text.slice(0,5000)})});await loadMoments()}catch(e){ui.momentMsg.textContent=e.message}};const remove=document.createElement('button');remove.textContent='Entfernen';remove.onclick=async()=>{if(!confirm('Diesen Moment und seine Fotos entfernen?'))return;try{for(const p of row.moment_photos)await partner.request('/storage/v1/object/moments',{method:'DELETE',body:JSON.stringify({prefixes:[p.storage_path]})});await partner.request('/rest/v1/year_moments?id=eq.'+row.id,{method:'DELETE',headers:{Prefer:'return=minimal'}});await loadMoments()}catch(e){ui.momentMsg.textContent=e.message}};memoryAction(edit,'Text bearbeiten','M15 5l4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z');memoryAction(remove,'Entfernen','M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7');const textRow=document.createElement('div');textRow.style.cssText='display:flex;align-items:flex-start;gap:8px';caption.style.cssText='flex:1;min-width:0;overflow-wrap:anywhere';article.insertBefore(textRow,caption);textRow.append(caption,edit);const footer=document.createElement('div');footer.style.cssText='display:flex;justify-content:flex-end;margin-top:12px';footer.append(remove);article.append(footer);}
 }}catch(e){if(version===momentVersion){ui.momentList.replaceChildren();ui.momentMsg.textContent=e.message}}}
ui.addMoment.onclick=()=>{ui.upload.classList.toggle('show');ui.momentDate.value=berlinDate(new Date())};
ui.saveMoment.onclick=async()=>{ui.saveMoment.disabled=true;ui.momentMsg.textContent='Wird gespeichert …';let id,paths=[];try{const files=[...ui.momentFiles.files],caption=ui.momentCaption.value.trim(),date=ui.momentDate.value;if(!date||(!caption&&!files.length))throw Error('Bitte Datum und Text oder ein Foto auswählen.');if(files.length>10||files.some(f=>!f.type.startsWith('image/')||f.size>20*1024*1024))throw Error('Bis zu zehn Fotos mit jeweils höchstens 20 MB sind möglich.');
 const user=await partner.request('/auth/v1/user');const rows=await partner.request('/rest/v1/year_moments',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({caption:caption.slice(0,5000),moment_date:date,created_by:user.id})});id=rows[0].id;
 for(let i=0;i<files.length;i++){const file=files[i],path=user.id+'/'+id+'/'+crypto.randomUUID()+'-'+file.name.replace(/[^a-zA-Z0-9._-]/g,'_');await partner.request('/storage/v1/object/moments/'+path,{method:'POST',headers:{'Content-Type':file.type},body:file});paths.push(path);await partner.request('/rest/v1/moment_photos',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({moment_id:id,storage_path:path,sort_order:i})});}
 ui.momentCaption.value='';ui.momentFiles.value='';ui.upload.classList.remove('show');ui.momentMsg.textContent='Erinnerung gespeichert. ♡';await loadMoments();
 }catch(e){let clean=true;if(id){try{for(const path of paths)await partner.request('/storage/v1/object/moments',{method:'DELETE',body:JSON.stringify({prefixes:[path]})});await partner.request('/rest/v1/year_moments?id=eq.'+id,{method:'DELETE',headers:{Prefer:'return=minimal'}})}catch{clean=false}}
 ui.momentMsg.textContent=e.message+(clean?'':' Ein unvollständiger Moment ist gespeichert; bitte nach Wiederherstellung der Verbindung entfernen.');}finally{ui.saveMoment.disabled=false}};
addEventListener('storage',e=>{if(e.key===partner.name&&!e.newValue){momentVersion++;clearPrivate();loadSurprises()}});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){loadSurprises();loadMoments()}});
authUI();cal();loadSurprises();loadMoments();
// Browser-only acceptance preview; no Service Worker is installed here.

function updateYearCounter(){
 const start=Date.UTC(2026,11,9),end=Date.UTC(2027,11,31),today=Date.parse(berlinDate(new Date())+'T00:00:00Z'),day=86400000,total=Math.round((end-start)/day)+1;
 ui.daycount.textContent=today<start?'Noch '+Math.ceil((start-today)/day)+' Tage bis zu deinem Geschenk':today>end?'Unser App-Jahr · '+total+' gemeinsame Tage':'Tag '+(Math.round((today-start)/day)+1)+' von '+total;
}
updateYearCounter();document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')updateYearCounter()});
const collageButton=document.createElement('button');collageButton.className='add';collageButton.textContent='Unsere Bildcollage ansehen';ui.momentList.before(collageButton);
let collageVersion=0;
function closeCollage(){collageVersion++;document.getElementById('memoryCollage')?.remove();}
const previousClear=partner.onclear;partner.onclear=()=>{closeCollage();previousClear()};
collageButton.onclick=async()=>{
 closeCollage();if(!partner.read()){ui.momentMsg.textContent='Bitte hier mit deiner PIN anmelden.';return}
 const version=collageVersion;collageButton.disabled=true;
 const panel=document.createElement('section');panel.id='memoryCollage';panel.className='card';panel.setAttribute('aria-label','Unsere Bildcollage');
 const heading=document.createElement('h2');heading.textContent='Unser Jahr in Bildern ♡';
 const close=document.createElement('button');close.textContent='Collage schließen';close.onclick=closeCollage;
 const status=document.createElement('p');status.setAttribute('role','status');status.textContent='Eure Bilder werden geladen …';
 const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px';
 panel.append(heading,close,status,grid);collageButton.after(panel);
 try{
 const rows=await partner.request('/rest/v1/year_moments?select=id,moment_date,moment_photos(id,storage_path)&order=moment_date.asc');
 if(version!==collageVersion||!partner.read())return;
 const photos=rows.flatMap(r=>r.moment_photos||[]);let unavailable=0;
 if(photos.length){const hint=document.createElement('p');hint.textContent='Hochwertiges JPG · 3200 × 4000 Pixel · vollständige Fotos ohne Beschnitt'+(photos.length>48?' · mehrere Seiten mit je bis zu 48 Bildern.':'.');panel.insertBefore(hint,grid);
 for(let page=0;page<Math.ceil(photos.length/48);page++){const make=document.createElement('button');make.textContent=photos.length>48?'JPG-Seite '+(page+1)+' erstellen':'Bildcollage als JPG erstellen';make.onclick=async()=>{make.disabled=true;try{
 const file=await exportMemoryJpg(photos,page,status,version);if(version!==collageVersion||!partner.read())return;
 const save=document.createElement('button');save.textContent='JPG speichern / teilen';let fileURL;
 save.onclick=async()=>{try{if(navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:'Unser Jahr in Bildern'});else{if(!fileURL)fileURL=URL.createObjectURL(file);const a=document.createElement('a');a.href=fileURL;a.download=file.name;a.click()}}catch(e){if(e.name!=='AbortError')status.textContent='Speichern fehlgeschlagen. Bitte erneut versuchen.'}};
 const observer=new MutationObserver(()=>{if(!panel.isConnected){if(fileURL)URL.revokeObjectURL(fileURL);observer.disconnect()}});observer.observe(document.body,{childList:true,subtree:true});make.replaceWith(save);status.textContent='Deine JPG-Collage ist bereit.';
 }catch(e){if(version===collageVersion)status.textContent=e.message}finally{make.disabled=false}};panel.insertBefore(make,grid)}}

 for(const photo of photos){
  if(version!==collageVersion||!partner.read())return;
  try{const src=await signedMedia('moments',photo.storage_path);if(version!==collageVersion||!partner.read())return;
   const img=document.createElement('img');img.src=src;img.alt='Ein Bild aus euren Erinnerungen';img.style.cssText='display:block;width:100%;height:auto;align-self:center;border-radius:8px';img.onerror=()=>{img.alt='Bild gerade nicht verfügbar – Collage bitte erneut öffnen.'};grid.append(img);
  }catch{unavailable++}
 }
 status.textContent=photos.length?photos.length+' Erinnerungsbilder'+(unavailable?' · '+unavailable+' gerade nicht verfügbar.':''):'Mit eurem ersten Erinnerungsfoto beginnt hier eure Collage.';
 }catch{if(version===collageVersion)status.textContent='Die Collage konnte nicht geladen werden. Bitte erneut versuchen.'}
 finally{collageButton.disabled=false}
};

function collageLayout(count,width=3200,height=4000){
 const margin=120,gap=24,top=240,bottom=120,columns=Math.max(1,Math.ceil(Math.sqrt(count*(width-2*margin)/(height-top-bottom)))),rows=Math.ceil(count/columns);
 const cellW=(width-2*margin-(columns-1)*gap)/columns,cellH=(height-top-bottom-(rows-1)*gap)/rows;
 return Array.from({length:count},(_,i)=>{const row=Math.floor(i/columns),inRow=Math.min(columns,count-row*columns);return{x:(width-(inRow*cellW+(inRow-1)*gap))/2+(i%columns)*(cellW+gap),y:top+row*(cellH+gap),w:cellW,h:cellH}});
}
async function exportMemoryJpg(photos,page,status,version){
 const selected=photos.slice(page*48,(page+1)*48),canvas=document.createElement('canvas');canvas.width=3200;canvas.height=4000;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('JPG-Erstellung wird auf diesem Gerät nicht unterstützt.');
 ctx.fillStyle='#f5eee4';ctx.fillRect(0,0,3200,4000);ctx.fillStyle='#641d2b';ctx.font='80px Georgia';ctx.textAlign='center';ctx.fillText('Unser Jahr in Bildern',1600,132);
 const cells=collageLayout(selected.length);
 for(let i=0;i<selected.length;i++){
  if(version!==collageVersion||!partner.read())throw Error('Collage geschlossen.');
  status.textContent='JPG wird erstellt · Bild '+(i+1)+' von '+selected.length;
  const url=await signedMedia('moments',selected[i].storage_path);
  const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw Error('Ein Bild ist nicht erreichbar. Bitte erneut versuchen.');
  const objectURL=URL.createObjectURL(await response.blob());const image=new Image();
  try{await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Ein Bildformat kann nicht verarbeitet werden. Bitte JPEG oder PNG verwenden.'));image.src=objectURL});
   const cell=cells[i],scale=Math.min(cell.w/image.naturalWidth,cell.h/image.naturalHeight),w=image.naturalWidth*scale,h=image.naturalHeight*scale;ctx.drawImage(image,cell.x+(cell.w-w)/2,cell.y+(cell.h-h)/2,w,h);
  }finally{URL.revokeObjectURL(objectURL);image.src=''}
 }
 if(version!==collageVersion||!partner.read())throw Error('Collage geschlossen.');
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.95));canvas.width=canvas.height=1;if(!blob)throw Error('JPG konnte nicht erstellt werden.');
 return new File([blob],'Unser-Jahr'+(photos.length>48?'-'+(page+1):'')+'.jpg',{type:'image/jpeg'});
}

document.getElementById('gateForm').append(ui.authBox);
document.getElementById('backWelcome').onclick=()=>{document.getElementById('pinGate').hidden=true;ui.authPin.value='';ui.intro.classList.add('show')};
const keys=document.createElement('div');keys.className='pinKeys';keys.setAttribute('aria-label','PIN-Ziffern');
for(const digit of ['1','2','3','4','5','6','7','8','9','Zurück','0','Löschen']){const b=document.createElement('button');b.type='button';b.textContent=digit==='Löschen'?'⌫':digit==='Zurück'?'←':digit;b.setAttribute('aria-label',digit);b.onclick=()=>{if(digit==='Zurück')document.getElementById('backWelcome').click();else if(digit==='Löschen')ui.authPin.value=ui.authPin.value.slice(0,-1);else if(ui.authPin.value.length<4)ui.authPin.value+=digit};keys.append(b)}
ui.authPin.readOnly=true;ui.authPin.after(keys);ui.authPin.setAttribute('aria-label','Vierstellige PIN');
const logout=document.createElement('button');logout.textContent='Auf diesem Gerät abmelden';logout.className='calbtn';logout.onclick=()=>ui.authLogout.click();document.querySelector('#intro .intro').append(logout);logout.hidden=!partner.read();ui.info.addEventListener('click',()=>{logout.hidden=!gateVerified});
authUI();

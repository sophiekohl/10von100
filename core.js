/* Shared session and date helpers. No PIN or private content is persisted. */
window.AppCore = (() => {
  const API='https://estgcmkrlcrwwcrphvsy.supabase.co';
  const KEY='sb_publishable_y7izNMEGlLbUyExk0K2RWA_RYvHTyhR';
  class Session {
    constructor(storage, name) { this.storage=storage;this.name=name;this.pending=null;this.generation=0;this.onclear=()=>{}; }
    read(){try{return JSON.parse(this.storage.getItem(this.name)||'null')}catch{return null}}
    save(data){const session={access_token:data.access_token,refresh_token:data.refresh_token,
      expires_at:data.expires_at||Math.floor(Date.now()/1000)+data.expires_in,user:data.user};
      if(!session.access_token||!session.refresh_token||!Number.isFinite(session.expires_at))throw Error('Ungültige Sitzung');
      this.storage.setItem(this.name,JSON.stringify(session));return session;}
    clear(){this.generation++;this.storage.removeItem(this.name);this.onclear();}
    async token(){let current=this.read();if(!current)return null;
      if(current.expires_at>Date.now()/1000+60)return current.access_token;
      if(!this.pending){const generation=this.generation;this.pending=(async()=>{
        const r=await fetch(API+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify({refresh_token:current.refresh_token})});
        if(!r.ok){if([400,401,403].includes(r.status))this.clear();throw Error('Bitte erneut anmelden.');}
        const renewed=await r.json();if(generation!==this.generation)throw Error('Sitzung beendet');return this.save(renewed).access_token;
      })().finally(()=>{this.pending=null})}return this.pending;
    }
    async request(path,options={}){const token=await this.token();if(!token)throw Error('Bitte zuerst anmelden.');
      const r=await fetch(API+path,{...options,cache:'no-store',headers:{apikey:KEY,Authorization:'Bearer '+token,'Content-Type':'application/json',...options.headers}});
      if(!r.ok){if(r.status===401)this.clear();throw Error(r.status===401?'Bitte erneut anmelden.':'Die Anfrage ist fehlgeschlagen ('+r.status+').');}
      if(r.status===204||r.headers.get('content-length')==='0')return null;
      const text=await r.text();return text?JSON.parse(text):null;
    }
    async logout(){const token=this.read()?.access_token;this.clear();if(token){const r=await fetch(API+'/auth/v1/logout?scope=local',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+token}});if(!r.ok&&r.status!==401)throw Error('Lokal abgemeldet. Server-Abmeldung bitte mit Verbindung wiederholen.');}}
  }
  const berlinDate=d=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
  // Interpret Studio wall-clock input in Berlin, independent of device timezone.
  function berlinInstant(date,time){const target=Date.parse(date+'T'+time+':00Z');if(!Number.isFinite(target))throw Error('Ungültiger Termin');let instant=target;
    for(let i=0;i<3;i++){const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(instant)).map(p=>[p.type,p.value]));
      const actual=Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);const delta=target-actual;if(!delta)return new Date(instant).toISOString();instant+=delta;}
    throw Error('Diese Uhrzeit existiert wegen der Zeitumstellung nicht. Bitte eine andere Uhrzeit wählen.');
  }
  function storageURL(value){if(typeof value!=='string')throw Error('Medienlink fehlt');
    const url=new URL(value.startsWith('/object/')?'/storage/v1'+value:value,API+'/storage/v1/');
    if(url.origin!==API||!url.pathname.startsWith('/storage/v1/object/sign/'))throw Error('Ungültiger Medienlink');
    return url.href;
  }
  return {API,KEY,Session,berlinDate,berlinInstant,storageURL};
})();

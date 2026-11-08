/* Admin-only content export. No credentials, signed URLs or caches in the archive. */
window.AppBackup = (() => {
  const encoder = new TextEncoder();
  const tables = {
    content_items:'id,title,kind,body,unlock_at,teaser_mode,teaser_image_path,calendar_visible,push_enabled,created_at,updated_at,published',
    content_media:'id,content_item_id,media_type,storage_path,caption,sort_order,created_at,youtube_video_id,deezer_kind,deezer_id',
    year_moments:'id,caption,moment_date,include_in_recap,created_by,created_at',
    moment_photos:'id,moment_id,storage_path,sort_order,created_at,caption',
    calendar_ranges:'id,start_date,end_date,created_at'
  };
  function safePath(path) {
    if(typeof path!=='string'||path.length>1024||path.split('/').some(p=>!p||p==='.'||p==='..'||/[\\\x00-\x1f\x7f:]/.test(p)))throw Error('Ungültiger Dateipfad. Sicherung abgebrochen.');
    return path;
  }
  function references(data) {
    const refs=new Map();
    const add=(bucket,path)=>{if(path){safePath(path);refs.set(bucket+'/'+path,{bucket,path});}};
    for(const row of data.content_items)add('teasers',row.teaser_image_path);
    for(const row of data.content_media)add('content',row.storage_path);
    for(const row of data.moment_photos)add('moments',row.storage_path);
    return [...refs.values()].sort((a,b)=>(a.bucket+'/'+a.path).localeCompare(b.bucket+'/'+b.path));
  }
  function validate(data) {
    for(const name of Object.keys(tables)) {
      const ids=new Set();
      for(const row of data[name]){if(!row.id||ids.has(row.id))throw Error('Daten wurden während der Sicherung geändert. Bitte erneut versuchen.');ids.add(row.id);}
    }
    const items=new Set(data.content_items.map(r=>r.id)), moments=new Set(data.year_moments.map(r=>r.id));
    if(data.content_media.some(r=>!items.has(r.content_item_id))||data.moment_photos.some(r=>!moments.has(r.moment_id)))throw Error('Zuordnung der Dateien unvollständig. Bitte erneut versuchen.');
  }
  const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
  const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  async function digest(bytes){return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)));}
  const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
  function crc32(bytes){let n=0xffffffff;for(const b of bytes)n=crcTable[(n^b)&255]^(n>>>8);return(n^0xffffffff)>>>0;}
  function header(size){const bytes=new Uint8Array(size);return {bytes,view:new DataView(bytes.buffer)};}
  // Standard ZIP, STORE method. Originals remain byte-for-byte unchanged.
  function zip(entries){
    if(entries.length>60000)throw Error('Zu viele Dateien für eine Sicherung.');
    const parts=[],central=[];let offset=0,centralSize=0;
    for(const entry of entries){
      const name=encoder.encode(safePath(entry.name)),data=entry.bytes,crc=crc32(data);
      if(name.length>65535||data.length>0xffffffff)throw Error('Datei zu groß.');
      const local=header(30);const v=local.view;
      v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(12,33,true);
      v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);
      parts.push(local.bytes,name,data);
      const c=header(46),w=c.view;w.setUint32(0,0x02014b50,true);w.setUint16(4,20,true);w.setUint16(6,20,true);w.setUint16(8,0x800,true);w.setUint16(14,33,true);
      w.setUint32(16,crc,true);w.setUint32(20,data.length,true);w.setUint32(24,data.length,true);w.setUint16(28,name.length,true);w.setUint32(42,offset,true);
      central.push(c.bytes,name);centralSize+=46+name.length;offset+=30+name.length+data.length;
    }
    const end=header(22),v=end.view;v.setUint32(0,0x06054b50,true);v.setUint16(8,entries.length,true);v.setUint16(10,entries.length,true);v.setUint32(12,centralSize,true);v.setUint32(16,offset,true);
    return new Blob([...parts,...central,end.bytes],{type:'application/zip'});
  }
  async function build({request,download,check=()=>{},progress=()=>{},maxBytes=150*1024*1024}) {
    const startedAt=new Date().toISOString();let total=0;const entries=[],files=[];
    const guard=()=>{check();};
    async function assertAdmin(){guard();const user=await request('/auth/v1/user');guard();const rows=await request('/rest/v1/admin_users?select=user_id&user_id=eq.'+encodeURIComponent(user.id));guard();if(!Array.isArray(rows)||!rows.some(r=>r.user_id===user.id))throw Error('Diese Sicherung ist nur für deinen Adminzugang verfügbar.');}
    async function snapshot(){const data={};for(const [name,columns] of Object.entries(tables)){
      const rows=[];let last='';
      // Keyset pagination also works when a server caps pages below our requested size.
      for(;;){guard();const batch=await request('/rest/v1/'+name+'?select='+columns+'&order=id.asc&limit=200'+(last?'&id=gt.'+encodeURIComponent(last):''));guard();if(!Array.isArray(batch))throw Error('Daten konnten nicht vollständig geladen werden.');if(!batch.length)break;
        if(batch.some(r=>typeof r.id!=='string'||r.id<=last))throw Error('Ungültige Datenseite.');rows.push(...batch);last=batch.at(-1).id;if(rows.length>50000)throw Error('Zu viele Einträge für den mobilen Export.');
      }data[name]=rows;
    }validate(data);return data;}
    async function add(name,bytes){guard();total+=bytes.length;if(total>maxBytes)throw Error('Die mobile Sicherung ist auf 150 MB begrenzt. Es wurde kein unvollständiges Archiv erstellt.');const sha256=await digest(bytes);guard();entries.push({name,bytes});files.push({name,bytes:bytes.length,sha256});}
    await assertAdmin();progress('Texte und Termine werden geladen …');const data=await snapshot();
    const refs=references(data);
    for(let i=0;i<refs.length;i++){guard();progress('Originaldatei '+(i+1)+' von '+refs.length+' wird geladen …');const {bucket,path}=refs[i];const bytes=await download(bucket,path,maxBytes-total);guard();await add('media/'+bucket+'/'+path,bytes);}
    progress('Vollständigkeit wird geprüft …');const after=await snapshot();if(stable(after)!==stable(data))throw Error('Inhalte wurden während der Sicherung geändert. Bitte ohne gleichzeitige Bearbeitung erneut versuchen.');await assertAdmin();
    await add('data.json',encoder.encode(JSON.stringify(data,null,2)));
    await add('BITTE-LESEN.txt',encoder.encode('10 / 100 · Private Inhaltssicherung\n\nEnthält auch unveröffentlichte Überraschungen und private Originaldateien. Diese ZIP-Datei ist NICHT verschlüsselt. Nur privat aufbewahren und nicht weitergeben.\n\ndata.json: Texte, Termine und Dateizuordnungen. media/: Originaldateien. manifest.json: Umfang und SHA-256-Prüfsummen.\n\nNicht enthalten: Konten, Passwörter, PIN, Sitzungen, Push-Abos/Schlüssel, Datenbankschema, unzugeordnete Storage-Dateien oder Inhalte externer YouTube-/Deezer-Angebote.\n\nKein vollständiges Projekt-Backup, kein automatischer Import. Für eine Wiederherstellung müssen die App-Struktur und Konten separat eingerichtet werden. Verknüpfungen zu externen Diensten sind in data.json gespeichert. Während des Exports bitte keine Inhalte verändern.\n'));
    const manifest={format:'10von100-content',version:1,started_at:startedAt,completed_at:new Date().toISOString(),counts:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,v.length])),media_count:refs.length,files};
    entries.push({name:'manifest.json',bytes:encoder.encode(JSON.stringify(manifest,null,2))});guard();return {blob:zip(entries),manifest};
  }
  return {build,safePath,references};
})();

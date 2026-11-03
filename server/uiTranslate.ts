import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

// This allowlist contains repository-authored interface copy only. User records,
// clinical notes, uploaded documents and free-form input are never sent to Gemini.
const supported = new Set(['hi','ml','ta','te','mr','bn','kn','gu','pa','ur','es','fr','de','pt','ar','zh','ja']);
const names: Record<string,string> = {hi:'Hindi',ml:'Malayalam',ta:'Tamil',te:'Telugu',mr:'Marathi',bn:'Bengali',kn:'Kannada',gu:'Gujarati',pa:'Punjabi',ur:'Urdu',es:'Spanish',fr:'French',de:'German',pt:'Portuguese',ar:'Arabic',zh:'Simplified Chinese',ja:'Japanese'};
const norm=(s:string)=>s.replace(/\s+/g,' ').trim();
const strings=new Set<string>();
function add(raw:string){
  const value=norm(raw.replace(/&amp;/g,'&').replace(/&nbsp;/g,' '));
  if(value.length<2||value.length>1200||!/[a-zA-Z]/.test(value)||/[{}$]/.test(value)||/^https?:|^\/|^#[a-f\d]{3,8}$/i.test(value))return;
  strings.add(value);
}
function scanSourceTree(dir:string){
  if(!fs.existsSync(dir))return;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const file=path.join(dir,entry.name);
    if(entry.isDirectory()){scanSourceTree(file);continue;}
    if(!/\.(tsx|ts)$/.test(entry.name)||entry.name.includes('.test.')||entry.name==='LanguageContext.tsx'||entry.name==='UiTranslationOverlay.tsx'||entry.name==='uiTranslate.ts')continue;
    const source=fs.readFileSync(file,'utf8');
    // Literal JSX text, accessible names, placeholders, button labels and title attributes.
    for(const m of source.matchAll(/>([^<>{}]+)</g))add(m[1]);
    for(const m of source.matchAll(/\b(?:placeholder|title|aria-label|alt|label)\s*=\s*["']([^"'<>]{2,1200})["']/g))add(m[1]);
    // Harvest natural-language string literals regardless of capitalization.
    for(const m of source.matchAll(/['"]([^'"\\\n]{2,1200})['"]/g)){
      const value=m[1].trim();
      if(value.includes(' ')&&/[a-zA-Z]/.test(value)&&!/[{}$]/.test(value)&&
        !/^(?:https?|src|assets|rgba|linear|bg-|text-|hover:|border-|select|data-)/i.test(value)&&
        !/^(?:flex|grid|block|inline|absolute|relative|fixed|hidden|visible|none|true|false)\s/i.test(value))add(value);
    }
    for(const m of source.matchAll(/(?:showAlert\(|window\.confirm\(|window\.alert\()\s*['"`]([^'"`\\]{2,1200})['"`]/g))add(m[1]);
  }
}
scanSourceTree(path.resolve(process.cwd(),'src'));
scanSourceTree(path.resolve(process.cwd(),'server'));
const indexed=[...strings].sort();
const byId=new Map(indexed.map((value,id)=>[id,value]));
const cache=new Map<string,string>();
const inFlight=new Map<string,Promise<void>>();
const MAX_CACHE=50000,MAX_BATCH=24,MAX_CONCURRENT=4;
let ai:GoogleGenAI|null=null,activeCalls=0;
let globalMinute={start:Date.now(),count:0};
const ipMinute=new Map<string,{start:number,count:number}>(),ipDay=new Map<string,{start:number,count:number}>();
function model(){if(!process.env.GEMINI_API_KEY)return null;return ai??(ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY}));}
function allow(ip:string,now:number){
  if(now-globalMinute.start>=60000)globalMinute={start:now,count:0};
  if(++globalMinute.count>1200)return false;
  const oldMinute=ipMinute.get(ip),minute=oldMinute&&now-oldMinute.start<60000?oldMinute:{start:now,count:0};
  if(++minute.count>12)return false;ipMinute.set(ip,minute);
  const oldDay=ipDay.get(ip),day=oldDay&&now-oldDay.start<86400000?oldDay:{start:now,count:0};
  if(++day.count>300)return false;ipDay.set(ip,day);
  if(ipMinute.size>10000)for(const [key,value] of ipMinute)if(now-value.start>=60000)ipMinute.delete(key);
  if(ipDay.size>10000)for(const [key,value] of ipDay)if(now-value.start>=86400000)ipDay.delete(key);
  return true;
}
function cacheSet(key:string,value:string){
  cache.delete(key);cache.set(key,value);
  if(cache.size>MAX_CACHE){const oldest=cache.keys().next().value;if(oldest)cache.delete(oldest);}
}
export function registerUiTranslationRoutes(app:any){
  app.get('/api/i18n/ui-strings',(_req:any,res:any)=>{
    res.setHeader('Cache-Control','public, max-age=300');
    res.json({strings:indexed,available:!!process.env.GEMINI_API_KEY});
  });
  app.post('/api/i18n/translate',async(req:any,res:any)=>{
    const {language,ids}=req.body||{};
    if(!supported.has(language)||!Array.isArray(ids)||ids.length<1||ids.length>MAX_BATCH||
      ids.some((id:any)=>!Number.isInteger(id)||!byId.has(id))){
      res.status(400).json({error:'Unsupported language or UI string IDs.'});return;
    }
    const origin=String(req.headers?.origin||''),host=String(req.headers?.host||'');
    if(origin&&host){try{if(new URL(origin).host!==host){res.status(403).json({error:'Cross-origin translation requests are not allowed.'});return;}}catch{res.status(403).json({error:'Invalid request origin.'});return;}}
    if(!allow(String(req.ip||'unknown'),Date.now())){res.setHeader('Retry-After','60');res.status(429).json({error:'Translation usage limit reached. Please wait before trying again.'});return;}
    const client=model();if(!client){res.status(503).json({error:'UI translation requires a configured GEMINI_API_KEY.'});return;}
    const unique=[...new Set(ids)] as number[];
    const missing=unique.filter(id=>!cache.has(language+':'+id));
    const key=language+':'+missing.slice().sort((a,b)=>a-b).join(',');
    try{
      if(missing.length){
        let work=inFlight.get(key);
        if(!work){
          if(activeCalls>=MAX_CONCURRENT){res.setHeader('Retry-After','10');res.status(429).json({error:'Translation service is busy. Please retry shortly.'});return;}
          activeCalls++;
          work=(async()=>{
            const items=Object.fromEntries(missing.map(id=>[String(id),byId.get(id)]));
            const response=await client.models.generateContent({
              model:'gemini-3.8-flash',
              contents:'Translate every supplied fixed software interface phrase into '+names[language]+'. Return only a JSON object mapping every numeric ID to a complete, natural translation. Do not omit entries. Preserve meaning, digits, placeholders, product names and punctuation. Never translate user data. Do not explain.\n'+JSON.stringify(items),
              config:{responseMimeType:'application/json',temperature:0},
            });
            const result=JSON.parse(response.text||'{}');
            for(const id of missing){const value=result[String(id)];if(typeof value==='string'&&value.trim()&&value.length<1000)cacheSet(language+':'+id,value.trim());}
          })().finally(()=>{activeCalls--;inFlight.delete(key);});
          inFlight.set(key,work);
        }
        await work;
      }
      res.json({translations:Object.fromEntries(unique.map(id=>[id,cache.get(language+':'+id)||byId.get(id)]))});
    }catch(error){console.error('UI translation service failed:',error);res.status(503).json({error:'UI translation service temporarily unavailable.'});}
  });
}

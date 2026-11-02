import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

// Only repository-authored UI wording is eligible. Never translate case records,
// clinical notes, filenames, user-entered text or arbitrary request strings.
const SRC = path.resolve(process.cwd(), 'src');
const supported = new Set(['hi','ml','ta','te','mr','bn','kn','gu','pa','ur','es','fr','de','pt','ar','zh','ja']);
const names: Record<string,string> = {
  hi:'Hindi',ml:'Malayalam',ta:'Tamil',te:'Telugu',mr:'Marathi',bn:'Bengali',
  kn:'Kannada',gu:'Gujarati',pa:'Punjabi',ur:'Urdu',es:'Spanish',
  fr:'French',de:'German',pt:'Portuguese',ar:'Arabic',zh:'Simplified Chinese',ja:'Japanese',
};
const norm = (s:string) => s.replace(/\s+/g,' ').trim();
const strings = new Set<string>();
function readSourceFiles(dir: string): void {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir,entry.name);
    if (entry.isDirectory()) { readSourceFiles(file); continue; }
    if (!/\.(tsx|ts)$/.test(entry.name) || entry.name.includes('.test.') || entry.name.includes('LanguageContext')) continue;
    const src = fs.readFileSync(file,'utf8');
    // JSX text and fixed accessible labels / placeholders / titles.
    for (const match of src.matchAll(/>([^<>{}]+)</g)) add(match[1]);
    for (const match of src.matchAll(/\b(?:placeholder|title|aria-label|alt|label)\s*=\s*["']([^"'<>]{2,240})["']/g)) add(match[1]);
    // Text-only literal labels in navigation definitions, forms and status messages.
    // Reject code tokens, URLs, CSS classes and identifiers; only fixed source content qualifies.
    for (const match of src.matchAll(/['"]([^'"\\\\\n]{2,160})['"]/g)) {
      const val=match[1].trim();
      if (/^[A-Z][a-zA-Z]+(?:[\\s&:,.!?'()\\-/]+[a-zA-Z0-9%]+)+[.!?]?$/.test(val) &&
          !/^(?:https?|src|assets|rgba|linear|bg-|text-|hover:|border-|select|data-)/i.test(val)) add(val);
    }
    // Literal UI feedback, section titles, button copy and toast messages.
    for (const match of src.matchAll(/(?:showAlert\(|window\.confirm\(|window\.alert\()\s*['"`]([^`'"\\]{2,240})['"`]/g)) add(match[1]);
  }
}
function add(raw:string) {
  const val=norm(raw.replace(/&amp;/g,'&').replace(/&nbsp;/g,' '));
  if(val.length<2 || val.length>240 || !/[a-zA-Z]/.test(val)) return;
  if(/[{}$`]/.test(val) || /^https?:|^\/|^#[a-f\d]{3,8}$/i.test(val)) return;
  strings.add(val);
}
readSourceFiles(path.join(SRC,'components'));
readSourceFiles(path.join(SRC,'data'));
const indexed = [...strings].sort();
const byId = new Map(indexed.map((s,i)=>[i,s]));
const cache = new Map<string,string>();
let ai:GoogleGenAI|null = null;
const ipRequests = new Map<string,{start:number,count:number}>();
function model(){if (!process.env.GEMINI_API_KEY) return null; return ai ?? (ai = new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY}));}

export function registerUiTranslationRoutes(app:any) {
  app.get('/api/i18n/ui-strings', (_req:any,res:any)=>{
    res.setHeader('Cache-Control','public, max-age=300');
    res.json({strings:indexed,available:!!process.env.GEMINI_API_KEY});
  });
  app.post('/api/i18n/translate',async(req:any,res:any)=>{
    const {language,ids} = req.body||{};
    if(!supported.has(language)||!Array.isArray(ids)||ids.length>32||ids.length<1||
       ids.some((id:any)=>!Number.isInteger(id)||!byId.has(id))){
      res.status(400).json({error:'Unsupported language or UI string IDs.'});return;
    }
    const client=model();
    if(!client){res.status(503).json({error:'UI translation requires a configured GEMINI_API_KEY.'});return;}
    const ip=String(req.ip||'unknown'),now=Date.now(),record=ipRequests.get(ip);
    const quota=record&&now-record.start<60000?record:{start:now,count:0};
    quota.count++;
    ipRequests.set(ip,quota);
    if(quota.count>40){res.status(429).json({error:'Translation request limit reached.'});return;}
    const unique=[...new Set(ids)] as number[];
    const missing=unique.filter(id=>!cache.has(language+':'+id));
    try{
      if(missing.length){
        const items=Object.fromEntries(missing.map(id=>[String(id),byId.get(id)]));
        const response=await client.models.generateContent({
          model:'gemini-3.8-flash',
          contents:'Translate these FIXED SOFTWARE INTERFACE strings into '+names[language]+
            '. Return ONLY a JSON object mapping each supplied numeric ID to its translation. '+
            'Accurately translate every entry, retaining digits, placeholders, acronyms (e.g. RehabPath360), '+
            'and punctuation. These are interface labels, not user data. Do not add explanations.\n'+JSON.stringify(items),
          config:{responseMimeType:'application/json',temperature:0},
        });
        const result=JSON.parse(response.text||'{}');
        for(const id of missing){
          const value=result[String(id)];
          if(typeof value==='string'&&value.trim().length>0&&value.length<1000)
            cache.set(language+':'+id,value.trim());
        }
      }
      res.json({translations:Object.fromEntries(unique.map(id=>[id,cache.get(language+':'+id)||byId.get(id)]))});
    }catch(err){
      console.error('UI translation service failed:',err);
      res.status(503).json({error:'UI translation service temporarily unavailable.'});
    }
  });
}

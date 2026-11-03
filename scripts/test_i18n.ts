import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { LANGUAGES } from '../src/context/LanguageContext';
import { registerUiTranslationRoutes } from '../server/uiTranslate';

type Handler = (req:any, res:any) => void | Promise<void>;
const routes = new Map<string,Handler>();
const app = {
  get: (route:string, handler:Handler) => routes.set('GET '+route,handler),
  post: (route:string, handler:Handler) => routes.set('POST '+route,handler),
};
registerUiTranslationRoutes(app);
function response() {
  const result:{status:number;body:any;headers:Record<string,string>}={status:200,body:null,headers:{}};
  const res:any={
    setHeader:(key:string,val:string)=>{result.headers[key]=val;return res;},
    status:(status:number)=>{result.status=status;return res;},
    json:(body:any)=>{result.body=body;return res;},
  };
  return {res,result};
}
async function request(method:string,route:string,body:any={}) {
  const handler=routes.get(method+' '+route);
  assert.ok(handler,'Expected route '+method+' '+route);
  const {res,result}=response();
  await handler({body,ip:'127.0.0.1'},res);
  return result;
}
async function test(){
  assert.equal(LANGUAGES.length,18,'Expected 18 selectable languages');
  assert.equal(new Set(LANGUAGES.map(l=>l.code)).size,18,'Language codes must be unique');
  const {status,body,headers}=await request('GET','/api/i18n/ui-strings');
  assert.equal(status,200);
  assert.ok(Array.isArray(body.strings),'UI phrase manifest should be an array');
  assert.ok(body.strings.length>100,'Should discover fixed UI copy across the full application');
  assert.equal(new Set(body.strings).size,body.strings.length,'Duplicate UI strings');
  assert.ok(body.strings.includes('Save My Colours'),'Personal appearance controls must remain');
  assert.ok(body.strings.includes('Personal Appearance'),'Personal appearance heading must remain');
  // Every static JSX text node and natural-language string literal harvested from
  // application source must be present in the translation manifest.
  const sourceRoots=[path.resolve('src'),path.resolve('server')];
  const sourceFiles:string[]=[];
  const walk=(dir:string)=>{if(!fs.existsSync(dir))return;for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else if(/\.(tsx|ts)$/.test(entry.name)&&!entry.name.includes('.test.')&&entry.name!=='LanguageContext.tsx'&&entry.name!=='UiTranslationOverlay.tsx'&&entry.name!=='uiTranslate.ts')sourceFiles.push(file);}};
  sourceRoots.forEach(walk);
  const normalize=(value:string)=>value.replace(/\s+/g,' ').trim().replace(/&amp;/g,'&').replace(/&nbsp;/g,' ');
  const uncovered:string[]=[];
  for(const file of sourceFiles){
    if(!fs.existsSync(file))continue;
    const source=fs.readFileSync(file,'utf8');
    const candidates:string[]=[];
    for(const match of source.matchAll(/>([^<>{}]+)</g))candidates.push(match[1]);
    for(const match of source.matchAll(/\b(?:placeholder|title|aria-label|alt|label)\s*=\s*["']([^"'<>]{2,1200})["']/g))candidates.push(match[1]);
    for(const match of source.matchAll(/['"]([^'"\\\n]{2,1200})['"]/g)){
      const value=match[1].trim();
      if(value.includes(' ')&&/[a-zA-Z]/.test(value)&&!/[{}$]/.test(value)&&
        !/^(?:https?|src|assets|rgba|linear|bg-|text-|hover:|border-|select|data-)/i.test(value)&&
        !/^(?:flex|grid|block|inline|absolute|relative|fixed|hidden|visible|none|true|false)\s/i.test(value))candidates.push(value);
    }
    for(const candidate of candidates){const value=normalize(candidate);if(value.length>=2&&/[a-zA-Z]/.test(value)&&!body.strings.includes(value))uncovered.push(file+': '+value);}
  }
  assert.deepEqual(uncovered,[],'Every harvested static UI phrase must be in the translation manifest');
  const expectedPhrases=['Clinical Notes','Document Intake','Save Institutional Configuration','Upload Microsoft Word (.docx), Excel spreadsheets (.xlsx, .csv), or PDF reports. AI extracts candidate values and highlights discrepancies for human verification.','Needs Attention'];
  for(const phrase of expectedPhrases)assert.ok(body.strings.includes(phrase),'Missing page phrase: '+phrase);
  assert.ok(!body.strings.includes('Primary Brand Accent Color'),'Institution colour editor must remain removed');
  assert.ok(headers['Cache-Control']);
  const invalidLanguage=await request('POST','/api/i18n/translate',{language:'xx',ids:[0]});
  assert.equal(invalidLanguage.status,400,'Reject unknown language');
  const invalidID=await request('POST','/api/i18n/translate',{language:'hi',ids:[999999],text:'Sensitive case note'});
  assert.equal(invalidID.status,400,'Reject non-allowlisted ID');
  const hugeBatch=await request('POST','/api/i18n/translate',{language:'hi',ids:Array.from({length:33},()=>0)});
  assert.equal(hugeBatch.status,400,'Reject oversized batches');
  const css=fs.readFileSync(path.resolve('src/index.css'),'utf8');
  assert.match(css,/html\[dir="rtl"\]\s+\.lg\\:pl-72\s*\{/,'RTL desktop content selector must target Tailwind lg:pl-72 with CSS escaping');
  assert.match(css,/html\[dir="rtl"\][\s\S]*?padding-left:\s*0;[\s\S]*?padding-right:\s*18rem;/,'RTL desktop content must swap left padding to the right');
  const personal=fs.readFileSync(path.resolve('src/components/SettingsView.tsx'),'utf8');
  assert.ok(personal.includes('savePersonalTheme')&&personal.includes('resetPersonalTheme'));
  assert.ok(!personal.includes('themePrimary')&&!personal.includes('themeTeal'));
  console.log(`UI localization checks passed: ${LANGUAGES.length} locales, ${body.strings.length} source phrases, validated routes, personal themes, RTL layout.`);
}
test().catch(err=>{console.error(err);process.exitCode=1;});

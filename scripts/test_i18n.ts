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
  assert.ok(body.strings.length>50,'Should discover substantive fixed UI copy');
  assert.equal(new Set(body.strings).size,body.strings.length,'Duplicate UI strings');
  assert.ok(body.strings.includes('Save My Colours'),'Personal appearance controls must remain');
  assert.ok(body.strings.includes('Personal Appearance'),'Personal appearance heading must remain');
  assert.ok(!body.strings.includes('Primary Brand Accent Color'),'Institution colour editor must remain removed');
  assert.ok(headers['Cache-Control']);
  const invalidLanguage=await request('POST','/api/i18n/translate',{language:'xx',ids:[0]});
  assert.equal(invalidLanguage.status,400,'Reject unknown language');
  const invalidID=await request('POST','/api/i18n/translate',{language:'hi',ids:[999999],text:'Sensitive case note'});
  assert.equal(invalidID.status,400,'Reject non-allowlisted ID');
  const hugeBatch=await request('POST','/api/i18n/translate',{language:'hi',ids:Array.from({length:33},()=>0)});
  assert.equal(hugeBatch.status,400,'Reject oversized batches');
  const css=fs.readFileSync(path.resolve('src/index.css'),'utf8');
  assert.ok(css.includes('html[dir="rtl"] .lg\\:pl-72 {'),'RTL CSS must use correct Tailwind class escaping');
  const personal=fs.readFileSync(path.resolve('src/components/SettingsView.tsx'),'utf8');
  assert.ok(personal.includes('savePersonalTheme')&&personal.includes('resetPersonalTheme'));
  assert.ok(!personal.includes('themePrimary')&&!personal.includes('themeTeal'));
  console.log(`UI localization checks passed: ${LANGUAGES.length} locales, ${body.strings.length} source phrases, validated routes, personal themes, RTL layout.`);
}
test().catch(err=>{console.error(err);process.exitCode=1;});

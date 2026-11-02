import { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

// Translates ONLY fixed developer-authored UI wording in a server-validated
// allowlist. Personal/clinical/case content never enters translation requests.
const normalize=(s:string)=>s.replace(/\s+/g,' ').trim();
const attrNames=['placeholder','title','aria-label','alt'] as const;
let manifestPromise:Promise<{strings:string[];available:boolean}>|null=null;
function manifest(){
  return manifestPromise ?? (manifestPromise=fetch('/api/i18n/ui-strings')
    .then(r=>{if(!r.ok)throw new Error('UI manifest unavailable');return r.json();})
    .catch(e=>{manifestPromise=null;throw e;}));
}
const translationCache=new Map<string,string>();
const originals=new WeakMap<Text,string>();
const originalAttributes=new WeakMap<Element,Map<string,string>>();
const hiddenNodes='SCRIPT,STYLE,NOSCRIPT,INPUT,TEXTAREA,CODE,PRE,[contenteditable="true"],[data-no-translate]';
const blacklist=/^(?:RP-\d+|[\d\s.,:;/%+-]+)$/;

export function UiTranslationOverlay(){
  const {language}=useLanguage();
  useEffect(()=>{
    let cancelled=false;
    let observer:MutationObserver|null=null;
    let timer:number|undefined;
    const touchedTexts=new Set<Text>();
    const touchedElements=new Set<Element>();
    const restore=()=>{
      observer?.disconnect();
      for(const node of touchedTexts){
        const original=originals.get(node);
        if(original!==undefined && node.isConnected) node.nodeValue=original;
      }
      for(const el of touchedElements){
        const attrs=originalAttributes.get(el);
        if(attrs&&el.isConnected)for(const [attr,value] of attrs)el.setAttribute(attr,value);
      }
    };
    if(language==='en'){
      // Restore any text translated by the previous language effect.
      return;
    }

    void manifest().then(({strings,available})=>{
      if(cancelled||!available)return;
      const ids=new Map(strings.map((s,id)=>[normalize(s),id]));
      const pending=new Set<number>();
      const matched=new Map<number,Set<Text>>();
      const attrsMatched=new Map<number,Array<{el:Element,name:string}>>();
      let busy=false;

      const scan=()=>{
        if(cancelled)return;
        const root=document.getElementById('root')||document.body;
        const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
          acceptNode(node){
            const el=node.parentElement;
            if(!el||el.closest(hiddenNodes))return NodeFilter.FILTER_REJECT;
            const txt=normalize(node.nodeValue||'');
            return txt.length>=2 && !blacklist.test(txt) && ids.has(txt)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
          }
        });
        let node:Node|null;
        while((node=walker.nextNode())){
          const text=node as Text,original=text.nodeValue||'';
          const id=ids.get(normalize(original));
          if(id===undefined)continue;
          if(!originals.has(text))originals.set(text,original);
          touchedTexts.add(text);
          const cached=translationCache.get(language+':'+id);
          if(cached){
            // Retain whitespace added for layout around the UI phrase.
            text.nodeValue=original.replace(normalize(original),cached);
          }else{
            const set=matched.get(id)||new Set<Text>();set.add(text);matched.set(id,set);pending.add(id);
          }
        }
        const elements=root.querySelectorAll('[placeholder],[title],[aria-label],[alt]');
        elements.forEach(el=>{
          if(el.closest('[data-no-translate]'))return;
          for(const name of attrNames){
            const original=el.getAttribute(name);
            if(!original)continue;
            const id=ids.get(normalize(original));
            if(id===undefined)continue;
            if(!originalAttributes.has(el))originalAttributes.set(el,new Map());
            const prior=originalAttributes.get(el)!;
            if(!prior.has(name))prior.set(name,original);
            touchedElements.add(el);
            const cached=translationCache.get(language+':'+id);
            if(cached)el.setAttribute(name,cached);
            else {const group=attrsMatched.get(id)||[];group.push({el,name});attrsMatched.set(id,group);pending.add(id);}
          }
        });
        if(pending.size&&!busy)void send();
      };
      const send=async()=>{
        if(busy||cancelled||pending.size===0)return;
        busy=true;
        const batch=[...pending].slice(0,32);
        batch.forEach(id=>pending.delete(id));
        try{
          const response=await fetch('/api/i18n/translate',{
            method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({language,ids:batch})
          });
          if(!response.ok)throw new Error('Translation temporarily unavailable');
          const data=await response.json();
          if(cancelled)return;
          for(const id of batch){
            const translated=data.translations?.[String(id)];
            if(typeof translated!=='string'||!translated.trim())continue;
            translationCache.set(language+':'+id,translated);
            for(const node of matched.get(id)||[]){
              if(node.isConnected) {
                const original=originals.get(node)||'';
                node.nodeValue=original.replace(normalize(original),translated);
              }
            }
            for(const {el,name} of attrsMatched.get(id)||[]){
              if(el.isConnected)el.setAttribute(name,translated);
            }
            matched.delete(id);attrsMatched.delete(id);
          }
        }catch(error){
          // Keep English text when the translator is offline; do not fabricate translations.
          console.warn('UI translation skipped:',error);
        }finally{
          busy=false;
          if(pending.size&&!cancelled)timer=window.setTimeout(()=>void send(),150);
        }
      };
      observer=new MutationObserver(()=>{window.clearTimeout(timer);timer=window.setTimeout(scan,150);});
      scan();
      observer.observe(document.getElementById('root')||document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:[...attrNames]});
    }).catch(error=>console.warn('UI translation manifest unavailable:',error));
    return ()=>{cancelled=true;window.clearTimeout(timer);restore();};
  },[language]);
  return null;
}

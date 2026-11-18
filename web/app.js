'use strict';
const $=id=>document.getElementById(id);
const LIMIT=48000;
function parseBlocks(text){
 const blocks=[...text.matchAll(/```(html?|css|javascript|js)\s*\n([\s\S]*?)```/gi)];
 if(!blocks.some(b=>/^html?$/i.test(b[1])))return null;
 return {html:blocks.filter(b=>/^html?$/i.test(b[1])).map(b=>b[2]).join('\n'),css:blocks.filter(b=>/^css$/i.test(b[1])).map(b=>b[2]).join('\n'),javascript:blocks.filter(b=>/^(js|javascript)$/i.test(b[1])).map(b=>b[2]).join('\n')};
}
function buildDocument(html,css,javascript,scripts){
 if(html.length+css.length+javascript.length>LIMIT)throw Error('源码超过 48,000 字符上限');
 const doc=new DOMParser().parseFromString(html,'text/html');
 doc.querySelectorAll('base,meta,iframe,frame,frameset,object,embed,link').forEach(n=>n.remove());
 for(const node of doc.querySelectorAll('*'))for(const attr of [...node.attributes]){
  const name=attr.name.toLowerCase();
  if(['src','srcset','href','action','formaction','poster','xlink:href','ping'].includes(name)&&!(/^data:image\/(png|jpeg|webp|gif);base64,/i.test(attr.value)&&name==='src'&&node.tagName==='IMG'))node.removeAttribute(attr.name);
  if(!scripts&&name.startsWith('on'))node.removeAttribute(attr.name);
 }
 if(!scripts)doc.querySelectorAll('script').forEach(n=>n.remove());
 const policy=doc.createElement('meta');policy.httpEquiv='Content-Security-Policy';
 policy.content="default-src 'none'; script-src "+(scripts?"'unsafe-inline'":"'none'")+"; style-src 'unsafe-inline'; img-src data:; font-src 'none'; connect-src 'none'; frame-src 'none'; worker-src 'none'; form-action 'none'; base-uri 'none'; navigate-to 'none'";
 doc.head.prepend(policy);
 const viewport=doc.createElement('meta');viewport.name='viewport';viewport.content='width=device-width,initial-scale=1';doc.head.append(viewport);
 const style=doc.createElement('style');style.textContent=css;doc.head.append(style);
 if(scripts&&javascript){const script=doc.createElement('script');script.textContent=javascript;doc.body.append(script);}
 return '<!doctype html>\n'+doc.documentElement.outerHTML;
}
function stop(){const old=$('preview');const frame=document.createElement('iframe');frame.id='preview';frame.title='网页预览';frame.setAttribute('sandbox','');frame.referrerPolicy='no-referrer';old.replaceWith(frame);return frame;}
$('run').onclick=()=>{
 try{const parsed=parseBlocks($('html').value);if(parsed){$('html').value=parsed.html;$('css').value=parsed.css;$('js').value=parsed.javascript;}
 const scripts=$('scripts').checked;const source=buildDocument($('html').value,$('css').value,$('js').value,scripts);
 const frame=stop();frame.style.width=$('width').value;frame.setAttribute('sandbox',scripts?'allow-scripts':'');frame.srcdoc=source;
 $('status').textContent='预览文档已提交给 WebView'+(scripts?'（网页脚本已开启）':'（网页脚本关闭）')+'；实际兼容性由宿主 CSP 与 WebView 决定。';
 }catch(error){$('status').textContent=error.message;}
};
$('stop').onclick=()=>{stop();$('status').textContent='已移除预览页面';};
$('clear').onclick=()=>{stop();for(const id of ['html','css','js'])$(id).value='';$('scripts').checked=false;$('status').textContent='工作台已清空；捕获文件可在原生状态页清除。';};
$('load').onclick=async()=>{
 const bridge=globalThis.gk;
 if(!bridge||!bridge.fs||typeof bridge.fs.read!=='function'){$('status').textContent='当前 WebView 未注入公开 gk.fs 桥接，请复制源码粘贴预览。';return;}
 try{const raw=await bridge.fs.read('latest.json');if(raw.length>350000)throw Error('捕获文件过大');const data=JSON.parse(raw);if(!data||typeof data.html!=='string')throw Error('暂无捕获的 HTML');
 const css=typeof data.css==='string'?data.css:'';const js=typeof data.javascript==='string'?data.javascript:'';
 if(data.html.length+css.length+js.length>LIMIT)throw Error('源码超过上限');$('html').value=data.html;$('css').value=css;$('js').value=js;$('scripts').checked=false;
 $('status').textContent='已读取捕获，点击渲染。网页脚本仍保持关闭。';
 }catch(error){$('status').textContent='读取失败：'+error.message;}
};

import json, pathlib, hashlib, struct, zlib
root=pathlib.Path(__file__).parent
w=h=128
raw=b''.join(b'\0'+b''.join(bytes((33,110,170,255)) if 20<x<108 and 20<y<108 else bytes((16,20,29,255)) for x in range(w)) for y in range(h))
def chunk(t,d): return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
(root/'assets/icon.png').write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(raw))+chunk(b'IEND',b''))
pkg='releases/0.1.0/plugin-0.1.0.tar.gz'
manifest={'schemaVersion':1,'id':'gopk.webui','name':'GK WebUI','description':'HTML/CSS/JavaScript WebView 预览工作台（预览版，非聊天气泡内嵌）。','icon':'assets/icon.png','screenshots':[],'readme':'README.md','openSource':True,'license':'AGPL-3.0-only','sourcePath':'src','versions':[{'version':'0.1.0','minAgentVersion':'5.86.0','package':pkg,'sha256':hashlib.sha256((root/pkg).read_bytes()).hexdigest(),'changelog':'WebView 工作台、代码块捕获；真机及跨执行域桥接待验收，非聊天气泡内嵌。','permissions':['code','app','ui','storage']}]}
(root/'gk-plugin.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(manifest,ensure_ascii=False))

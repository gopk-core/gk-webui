#!/usr/bin/env python3
"""Deterministic USTAR executable-plugin packager, no flattening or links."""
import gzip,hashlib,io,json,os,stat,sys,tarfile,tempfile
from pathlib import Path

def package(source,dest):
    source=Path(source);dest=Path(dest)
    if source.is_symlink() or not source.is_dir():raise ValueError('源必须为真实目录')
    entries=[];total=0
    for base,dirs,files in os.walk(source,followlinks=False):
        base=Path(base)
        for name in dirs+files:
            p=base/name;r=p.relative_to(source).as_posix()
            if r.split('/')[0] not in ('plugin.json','code','web','assets'):continue
            if any(s.startswith('.') for s in r.split('/')):raise ValueError('禁止隐藏路径')
            st=p.lstat()
            if stat.S_ISLNK(st.st_mode) or not (stat.S_ISREG(st.st_mode) or stat.S_ISDIR(st.st_mode)):raise ValueError('禁止链接或特殊文件')
            if len(r)>180 or not all(c.isascii() and (c.isalnum() or c in '_-./') for c in r):raise ValueError('路径无效')
            if stat.S_ISDIR(st.st_mode):continue
            if r!='plugin.json' and '/' not in r:raise ValueError('非法根文件')
            if st.st_size>4194304:raise ValueError('单文件超限')
            total+=st.st_size+1024
            if total>25165824 or len(entries)>=128:raise ValueError('总大小或条目数超限')
            entries.append((r,p,st.st_size))
    if not any(n=='plugin.json' for n,_,_ in entries):raise ValueError('缺少 plugin.json')
    def unique(pairs):
        d={}
        for k,v in pairs:
            if k in d:raise ValueError('重复JSON字段')
            d[k]=v
        return d
    manifest=json.loads((source/'plugin.json').read_text(),object_pairs_hook=unique)
    if manifest.get('schemaVersion')!=2:raise ValueError('仅支持 schemaVersion 2')
    dest.parent.mkdir(parents=True,exist_ok=True)
    fd,name=tempfile.mkstemp(prefix='.plugin-v2-',dir=dest.parent)
    try:
        with os.fdopen(fd,'wb') as raw:
            with gzip.GzipFile(fileobj=raw,mode='wb',filename='',mtime=0) as gz:
                with tarfile.open(fileobj=gz,mode='w',format=tarfile.USTAR_FORMAT) as tar:
                    for n,p,size in sorted(entries):
                        info=tarfile.TarInfo(n);info.size=size;info.mode=0o644;info.uid=info.gid=info.mtime=0;info.uname=info.gname=''
                        with p.open('rb') as stream:tar.addfile(info,stream)
            raw.flush();os.fsync(raw.fileno())
        if Path(name).stat().st_size>8388608:raise ValueError('压缩包超限')
        digest=hashlib.sha256(Path(name).read_bytes()).hexdigest();os.replace(name,dest);return digest
    finally:
        if os.path.exists(name):os.unlink(name)
if __name__=='__main__':print(package(*sys.argv[1:]))

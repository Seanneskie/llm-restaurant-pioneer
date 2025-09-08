const fs=require('fs');
const path=require('path');
const results=[];
function walk(dir){
  for(const f of fs.readdirSync(dir)){
    const p=path.join(dir,f);
    if(['node_modules','.git','dist'].includes(f)) continue;
    const st=fs.statSync(p);
    if(st.isDirectory()) walk(p);
    else if(st.isFile() && p.endsWith('.ts')) results.push(p);
  }
}
function scan(file){
  const src=fs.readFileSync(file,'utf8');
  const lines=src.split(/\r?\n/);
  for(let i=0;i<lines.length;i++){
    const l=lines[i];
    const m=l.match(/import\s+(?:type\s+)?[^'\"]*from\s+['\"](\.\.?(?:\/[\w.-]+)+)['\"]/);
    if(m){
      const spec=m[1];
      const isType=/import\s+type/.test(l);
      if(!spec.endsWith('.js') && !isType){
        console.log(file+':'+(i+1)+' -> '+spec);
      }
    } else if (/^import\s+['\"](\.\.?(?:\/[\w.-]+)+)['\"];?/.test(l)) {
      const spec = l.match(/^import\s+['\"](\.\.?(?:\/[\w.-]+)+)['\"];?/)[1];
      if(!spec.endsWith('.js')){
        console.log(file+':'+(i+1)+' -> '+spec);
      }
    }
  }
}
walk('.');
results.forEach(scan);

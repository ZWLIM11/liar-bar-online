import {mkdir,copyFile,cp} from 'node:fs/promises';
await mkdir('public',{recursive:true});
for(const file of ['index.html','game.js','online.js','ai.js','scene.js','scene-events.js','styles.css','experience.css','experience.js','_headers'])await copyFile(file,'public/'+file);
await cp('assets','public/assets',{recursive:true});

await cp('vendor','public/vendor',{recursive:true});

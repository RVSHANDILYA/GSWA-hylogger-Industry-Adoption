import { mkdir, rename, writeFile } from "node:fs/promises";
import { validateSnapshot } from "../src/data/snapshot.js";

const base=(process.env.API_BASE_URL||process.env.VITE_API_BASE_URL||"http://localhost:8000").replace(/\/$/,"");
async function get(path) {
 const response=await fetch(base+path,{signal:AbortSignal.timeout(15000)});
 if(!response.ok) throw new Error(path+" returned HTTP "+response.status);
 return response.json();
}
try {
 const holes=await get("/holes");
 if(!holes.holes?.length) throw new Error("The real API returned no holes.");
 const details={},intervals={};
 // Fetch every endpoint once. Do not replace a failed request with an invented record.
 for(const hole of holes.holes) {
   const path="/holes/"+encodeURIComponent(hole.hole_id);
   details[hole.hole_id]=await get(path);
   if(hole.intervals_classified===0) {
     intervals[hole.hole_id]={hole_id:hole.hole_id,count:0,intervals:[]};
   } else intervals[hole.hole_id]=await get(path+"/intervals");
 }
 const archive=validateSnapshot({version:1,generatedAt:new Date().toISOString(),source:base,holes,details,intervals});
 const directory=new URL("../public/",import.meta.url);
 const target=new URL("snapshot.json",directory);
 const temporary=new URL("snapshot.json.tmp",directory);
 await mkdir(directory,{recursive:true});
 await writeFile(temporary,JSON.stringify(archive,null,2)+"\n","utf8");
 await rename(temporary,target);
 const count=Object.values(intervals).reduce((total,record)=>total+record.count,0);
 console.log("Saved real API snapshot: "+holes.count+" holes, "+count+" intervals.");
 console.log("Generated at "+archive.generatedAt);
 console.log("Written to web/public/snapshot.json");
} catch(error) {
 console.error("Snapshot creation failed: "+error.message);
 process.exitCode=1;
}

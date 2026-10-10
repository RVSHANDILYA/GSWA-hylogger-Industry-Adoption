import axios from "axios";
import { validateSnapshot } from "../data/snapshot.js";

const api=axios.create({
 baseURL:import.meta.env.VITE_API_BASE_URL||"http://localhost:8000",
 timeout:6000,
 headers:{"Content-Type":"application/json"},
});
const snapshotMode=import.meta.env.VITE_DATA_MODE==="snapshot";
const initialSource={mode:snapshotMode?"snapshot":"live",generatedAt:null};
let source=initialSource;
let snapshotPromise;
const snapshotFiles=new Map();
const listeners=new Set();
export const getDataSource=()=>source;
export const getInitialDataSource=()=>initialSource;
export function subscribeDataSource(listener) {
 listeners.add(listener);
 return ()=>listeners.delete(listener);
}
function loadSnapshotFile(path) {
 if(!snapshotFiles.has(path)) {
   const promise=fetch(import.meta.env.BASE_URL+"snapshot/"+path,{cache:"no-cache"})
     .then(response=>{
       if(!response.ok) throw new Error("Snapshot file "+path+" returned HTTP "+response.status);
       return response.json();
     })
     .catch(error=>{snapshotFiles.delete(path);throw error;});
   snapshotFiles.set(path,promise);
 }
 return snapshotFiles.get(path);
}
async function loadSnapshotIndex() {
 const index=await loadSnapshotFile("holes.json");
 if(!Array.isArray(index.holes)||index.count!==index.holes.length||!Number.isFinite(Date.parse(index.generatedAt))) {
   throw new Error("The snapshot hole index or generation date is invalid.");
 }
 if(source.generatedAt!==index.generatedAt) {
   source={mode:"snapshot",generatedAt:index.generatedAt};
   listeners.forEach(listener=>listener());
 }
 return index;
}
async function loadHoleFile(directory,holeId,detail) {
 const index=await loadSnapshotIndex();
 if(!index.holes.some(hole=>hole.hole_id===holeId)) throw notFound(detail);
 return loadSnapshotFile(directory+"/"+encodeURIComponent(holeId)+".json");
}
function filteredIntervals(record,holeId,minConfidence) {
 if(!record) throw notFound("No intervals found for "+holeId);
 // The API's min_confidence is an inclusive Error ceiling, not a confidence floor.
 const intervals=minConfidence==null?record.intervals:record.intervals.filter(row=>row.confidence_error!=null&&row.confidence_error<=minConfidence);
 if(!intervals.length) throw notFound("No intervals found for "+holeId);
 return {...record,count:intervals.length,intervals};
}
function loadSnapshot() {
 if(!snapshotPromise) {
   snapshotPromise=fetch(import.meta.env.BASE_URL+"snapshot.json",{cache:"no-cache"})
     .then(response=>{if(!response.ok) throw new Error("Saved archive unavailable");return response.json();})
     .then(validateSnapshot)
     .catch(error=>{snapshotPromise=undefined;throw error;});
 }
 return snapshotPromise;
}
async function activateSnapshot() {
 const archive=await loadSnapshot();
 if(source.mode!=="snapshot") {
   source={mode:"snapshot",generatedAt:archive.generatedAt};
   listeners.forEach(listener=>listener());
 }
 return archive;
}
async function request(path,saved,{params}={}) {
 if(source.mode==="snapshot") return saved(await loadSnapshot());
 try {
   const response=await api.get(path,{params});
   // A parallel request may have established that the API is unreachable.
   // Once that happens, each view reads one consistent saved archive.
   return source.mode==="snapshot"?saved(await loadSnapshot()):response.data;
 } catch(error) {
   // A real HTTP error is an API response, so never conceal it with saved data.
   if(error.response||error.code==="ERR_CANCELED") throw error;
   let archive;
   try {archive=await activateSnapshot();}
   catch {throw new Error("The live API is unreachable and a readable saved archive is unavailable.",{cause:error});}
   return saved(archive);
 }
}
function notFound(detail) {
 const error=new Error(detail);
 error.response={status:404,data:{detail}};
 return error;
}
export function fetchHoles() {
 if(snapshotMode) return loadSnapshotIndex().then(({count,holes})=>({count,holes}));
 return request("/holes",archive=>archive.holes);
}
export function fetchHole(holeId) {
 if(snapshotMode) return loadHoleFile("holes",holeId,"Hole "+holeId+" not found");
 return request("/holes/"+encodeURIComponent(holeId),archive=>{
   const detail=archive.details[holeId];
   if(!detail) throw notFound("Hole "+holeId+" not found");
   return detail;
 });
}
export function fetchIntervals(holeId,{minConfidence}={}) {
 if(snapshotMode) return loadHoleFile("intervals",holeId,"No intervals found for "+holeId)
   .then(record=>filteredIntervals(record,holeId,minConfidence));
 return request("/holes/"+encodeURIComponent(holeId)+"/intervals",
   archive=>filteredIntervals(archive.intervals[holeId],holeId,minConfidence),
   {params:minConfidence==null?undefined:{min_confidence:minConfidence}});
}

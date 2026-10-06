import { useId, useMemo, useState } from "react";
import Icon from "../ui/Icon.jsx";
import styles from "./WAMap.module.css";

// Schematic coastline drawn for context. Hole positions use their actual coordinates.
const COAST = [
 [129,-14.9],[128.1,-14.8],[127.7,-14.1],[126.9,-13.75],[126.3,-14.1],[125.9,-14],
 [125.6,-14.55],[125.1,-14.9],[124.6,-15],[124.6,-15.6],[123.95,-16],[123.65,-16.4],
 [123.8,-16.7],[123.4,-17.1],[122.8,-17],[122.25,-17.8],[122.15,-18.2],[121.75,-18.5],
 [121.5,-19.3],[120.7,-19.7],[119.4,-20],[118.7,-20.25],[117.2,-20.6],[116.1,-20.65],
 [114.8,-21.6],[113.8,-22.05],[113.8,-23.1],[113.7,-24.15],[113.15,-25.45],
 [113.75,-26.4],[113,-26.15],[113.3,-26.7],[113.95,-26.85],[114.17,-28],[114.65,-28.7],
 [115,-30],[115.5,-31.5],[115.7,-32.15],[115.65,-33.1],[115,-33.55],[115.05,-34.3],
 [116,-34.75],[116.9,-35.05],[117.8,-35.12],[119,-34.55],[120,-33.8],[121,-33.65],
 [122,-33.9],[123,-33.9],[124,-33],[125,-32.3],[126.5,-32.2],[129,-31.65],[129,-14.9],
];
const mercator = lat => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
const project = (lon,lat) => ({
 x: 80 + (lon - 112) / 17 * 430,
 y: 70 + (mercator(-13) - mercator(lat)) / (mercator(-13) - mercator(-36)) * 550,
});
const OVERVIEW = {x: 40, y: 40, width: 520, height: 610};
const path = COAST.map(([lon,lat],index) => {const p=project(lon,lat); return `${index ? "L" : "M"}${p.x},${p.y}`;}).join(" ")+"Z";

export default function WAMap({ holes = [], selectedHoleId, onSelect }) {
 const [view,setView]=useState({bounds: OVERVIEW, selection: selectedHoleId});
 const [hovered,setHovered]=useState(null);
 const tooltipId=useId();
 // A selection made in the list resets a previous local zoom.
 const bounds=view.selection===selectedHoleId?view.bounds:OVERVIEW;
 const scale=bounds.width/OVERVIEW.width;
 const points=useMemo(()=>holes.filter(hole=>Number.isFinite(hole.latitude)&&Number.isFinite(hole.longitude))
   .map(hole=>({...hole,...project(hole.longitude,hole.latitude)})),[holes]);
 const groups=useMemo(()=>{
   const cells=new Map();
   points.filter(p=>p.x>=bounds.x&&p.x<=bounds.x+bounds.width&&p.y>=bounds.y&&p.y<=bounds.y+bounds.height).forEach(point=>{
     const key=`${Math.floor(point.x/(18*scale))}-${Math.floor(point.y/(18*scale))}`;
     const members=cells.get(key)??[]; members.push(point); cells.set(key,members);
   });
   return [...cells.values()].map(members=>({members,x:members.reduce((sum,p)=>sum+p.x,0)/members.length,
     y:members.reduce((sum,p)=>sum+p.y,0)/members.length}));
 },[points,bounds,scale]);
 const activate=group=>{
   if(group.members.length>1) {
     const xs=group.members.map(p=>p.x),ys=group.members.map(p=>p.y);
     const width=Math.max(.8,Math.max(...xs)-Math.min(...xs), (Math.max(...ys)-Math.min(...ys))*520/610)*3;
     setView({selection:group.members[0].hole_id,bounds:{x:group.x-width/2,y:group.y-width*610/520/2,width,height:width*610/520}});
   } else {
     setView({selection:group.members[0].hole_id,bounds});
   }
   onSelect?.(group.members[0]);
   setHovered(null);
 };
 const reset=()=>{setView({bounds:OVERVIEW,selection:selectedHoleId});setHovered(null);};
 return <div className={styles.map}>
   <div className={styles.mapTop}><span className="eyebrow">{bounds===OVERVIEW?"Western Australia":"Local hole group"}</span>
     <button type="button" onClick={reset} className={styles.overview}><Icon name="crosshair" size={14}/> State overview</button></div>
   <svg viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`}
     className={styles.svg} role="group" aria-label="Western Australia drill hole map">
     <path d={path} className={styles.land} vectorEffect="non-scaling-stroke"/>
     {[115,120,125].map(lon=>{const p=project(lon,-13);return <g key={lon} className={styles.grid} aria-hidden="true">
       <path d={`M${p.x},60V650`} vectorEffect="non-scaling-stroke"/><text x={p.x+3} y="650">{lon}°E</text></g>;})}
     {[-15,-20,-25,-30,-35].map(lat=>{const p=project(112,lat);return <g key={lat} className={styles.grid} aria-hidden="true">
       <path d={`M50,${p.y}H540`} vectorEffect="non-scaling-stroke"/><text x="52" y={p.y-5}>{Math.abs(lat)}°S</text></g>;})}
     {groups.map(group=>{
       const selected=group.members.some(p=>p.hole_id===selectedHoleId);
       const pointScale=scale;
       const description=group.members.length>1?`${group.members.length} holes: ${group.members.map(p=>p.hole_id).join(", ")}. Activate to zoom.`:
         `${group.members[0].hole_id}, ${group.members[0].region}. Select hole.`;
       return <g key={group.members.map(p=>p.hole_id).join("-")} className={`${styles.pin} ${selected?styles.selected:""}`}
         role="button" tabIndex={0} aria-label={description} aria-pressed={selected} aria-describedby={hovered===group?tooltipId:undefined}
         onClick={()=>activate(group)} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();activate(group);}}}
         onMouseEnter={()=>setHovered(group)} onMouseLeave={()=>setHovered(null)} onFocus={()=>setHovered(group)} onBlur={()=>setHovered(null)}>
         <circle cx={group.x} cy={group.y} r={(group.members.length>1?12:6)*pointScale} strokeWidth={1.5*pointScale}/>
         <circle cx={group.x} cy={group.y} r={(group.members.length>1?17:11)*pointScale} className={styles.selectionRing} strokeWidth={pointScale}/>
         {group.members.length>1&&<text x={group.x} y={group.y+3.5*pointScale} style={{fontSize:10*pointScale}}>{group.members.length}</text>}
       </g>;
     })}
   </svg>
   <div className={styles.north} aria-hidden="true"><span>↑</span>N</div>
   {hovered&&<div className={styles.tooltip} id={tooltipId} role="status">
     <strong>{hovered.members.length>1?`${hovered.members.length} nearby holes`:hovered.members[0].hole_id}</strong>
     <span>{hovered.members.length>1?hovered.members.slice(0,3).map(p=>p.hole_id).join(" / "):hovered.members[0].region}</span>
     <span>{hovered.members.length>1?"Select the group to zoom in.":`${hovered.members[0].latitude.toFixed(5)}, ${hovered.members[0].longitude.toFixed(5)}`}</span>
   </div>}
   <div className={styles.mapBottom}><span>{points.length} located holes <span className={styles.dot}/></span><span>Recorded coordinates / Schematic boundary</span></div>
   {points.length<holes.length&&<p className={styles.unlocated}>{holes.length-points.length} holes have no usable coordinates and remain in the list.</p>}
 </div>;
}

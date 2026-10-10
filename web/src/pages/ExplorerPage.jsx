import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import PageTransition from "../components/layout/PageTransition.jsx";
import { Container } from "../components/layout/Layout.jsx";
import HoleCard from "../components/holes/HoleCard.jsx";
import WAMap from "../components/holes/WAMap.jsx";
import CoreColumn from "../components/charts/CoreColumn.jsx";
import MineralLegend from "../components/charts/MineralLegend.jsx";
import { Badge, Button, Card, Icon, Loading, Notice, PageHeader, SearchField, Skeleton, StateMessage } from "../components/ui/index.js";
import { fetchHole, fetchHoles, fetchIntervals } from "../api/client.js";
import useAsyncData from "../hooks/useAsyncData.js";
import useMotionPreference from "../hooks/useMotionPreference.js";
import { easeOut } from "../styles/theme.js";
import { depthRange, summariseIntervals } from "../data/analysis.js";
import styles from "./ExplorerPage.module.css";

export default function ExplorerPage() {
 const [params,setParams]=useSearchParams();
 const [query,setQuery]=useState("");
 const [sort,setSort]=useState("id");
 const [view,setView]=useState("map");
 const reduced=useMotionPreference();
 const holesRequest=useAsyncData(fetchHoles,[]);
 const holes=useMemo(()=>holesRequest.data?.holes??[],[holesRequest.data]);
 const selected=holes.find(hole=>hole.hole_id===params.get("hole"))??holes[0]??null;
 const holeId=selected?.hole_id??null;
 const select=useCallback(hole=>setParams({hole:hole.hole_id},{replace:true}),[setParams]);
 const loadHole=useCallback(()=>fetchHole(holeId),[holeId]);
 const loadIntervals=useCallback(()=>fetchIntervals(holeId),[holeId]);
 const detailRequest=useAsyncData(loadHole,[holeId],{skip:!holeId});
 const intervalsRequest=useAsyncData(loadIntervals,[holeId],{skip:!holeId});
 const detail=detailRequest.data??selected;
 const intervals=intervalsRequest.data?.intervals??[];
 const range=depthRange(intervals);
 const summary=summariseIntervals(intervals);
 const visible=useMemo(()=>{
   const needle=query.trim().toLowerCase();
   return holes.filter(hole=>!needle||`${hole.hole_id} ${hole.region??""}`.toLowerCase().includes(needle))
     .sort((a,b)=>sort==="depth"?Number(b.total_depth_m??0)-Number(a.total_depth_m??0):
       sort==="intervals"?Number(b.intervals_classified??0)-Number(a.intervals_classified??0):a.hole_id.localeCompare(b.hole_id));
 },[holes,query,sort]);
 const coordinate=value=>Number.isFinite(value)?value.toFixed(5):"Not recorded";
 return <PageTransition><Container>
   <PageHeader eyebrow="01 / Hole Explorer" title="Find your place in the rock."
     lede="Locate a drill hole, connect its regional context, and follow its logged intervals. The map and list read the same real archive."/>
   <div className={styles.toolbar}>
     <SearchField id="explorer-search" value={query} onChange={setQuery} label="Search holes by ID or region" placeholder="Search hole ID or region"/>
     <span className={styles.count} aria-live="polite">{holesRequest.loading?"Reading archive...":`${visible.length} of ${holes.length} holes`}</span>
     <label className={styles.sort}>Sort by <select value={sort} onChange={event=>setSort(event.target.value)}>
       <option value="id">Hole ID</option><option value="depth">Deepest first</option><option value="intervals">Most intervals</option></select></label>
     <div className={styles.viewToggle} role="group" aria-label="Hole view">
       <button type="button" aria-pressed={view==="map"} onClick={()=>setView("map")}><Icon name="map" size={15}/> Map + list</button>
       <button type="button" aria-pressed={view==="table"} onClick={()=>setView("table")}><Icon name="table" size={15}/> Table</button></div>
   </div>
   {holesRequest.error?<Card><StateMessage tone="problem" icon="plug" title="The archive could not be reached"
     action={<Button onClick={holesRequest.retry} variant="secondary">Try again</Button>}>{holesRequest.error}</StateMessage></Card>:
   holesRequest.loading?<div className={styles.workspace}><Skeleton height="590px"/><Skeleton height="590px"/><Skeleton height="590px"/></div>:
   <motion.div key={view} initial={reduced?false:{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:reduced?0:.24,ease:easeOut}}
     className={`${styles.workspace} ${view==="table"?styles.tableLayout:""}`}>
     {view==="map"?<>
       <div className={styles.holeList}><p className={styles.panelLabel}>Hole index <span>{visible.length}</span></p>
         {visible.length?<ul>{visible.map(hole=><li key={hole.hole_id}><HoleCard hole={hole} variant="compact" selected={hole.hole_id===holeId} onSelect={select}/></li>)}</ul>:
           <StateMessage icon="search" title="No matching holes">Try another hole ID or region.</StateMessage>}
       </div>
       <div className={styles.mapPanel}><WAMap holes={visible} selectedHoleId={holeId} onSelect={select}/>
         <p className={styles.mapHint}><Icon name="info" size={14}/> Drag to explore. Select a group to zoom or a pin to inspect. Use Ctrl + scroll to zoom; on touch screens, use two fingers.</p></div>
     </>:<div className={styles.tableWrap}>
       <table className={styles.holesTable}><caption className="visually-hidden">Drill holes sorted by {sort}</caption>
         <thead><tr><th scope="col">Hole ID</th><th scope="col">Region</th><th scope="col">Depth</th><th scope="col">Intervals</th></tr></thead>
         <tbody>{visible.map(hole=><tr key={hole.hole_id} className={hole.hole_id===holeId?styles.selectedRow:""}>
           <th scope="row"><button type="button" onClick={()=>select(hole)} aria-pressed={hole.hole_id===holeId}>{hole.hole_id}<Icon name="arrowUpRight" size={14}/></button></th>
           <td data-label="Region">{hole.region||"Not recorded"}</td><td data-label="Depth">{hole.total_depth_m??"n/a"} m</td><td data-label="Intervals">{hole.intervals_classified}</td>
         </tr>)}</tbody></table>
       {!visible.length&&<StateMessage title="No matching holes">Clear the search to see all holes.</StateMessage>}
     </div>}
     <motion.aside key={holeId} initial={reduced?false:{opacity:0}} animate={{opacity:1}} transition={{duration:reduced?0:.24,ease:easeOut}} className={styles.detail} aria-label="Selected hole details">
       {!detail?<StateMessage icon="core" title="No hole selected">Select a hole to inspect its record.</StateMessage>:<>
         <div className={styles.detailHead}><p className="eyebrow">Selected core</p><h2>{detail.hole_id}</h2><p>{detail.region||"Region not recorded"}</p></div>
         <dl className={styles.facts}><div><dt>Recorded total depth</dt><dd>{detail.total_depth_m??"n/a"} m</dd></div>
           <div><dt>Returned intervals</dt><dd>{intervalsRequest.loading?"...":intervals.length}</dd></div>
           <div><dt>Latitude</dt><dd>{coordinate(detail.latitude)}</dd></div><div><dt>Longitude</dt><dd>{coordinate(detail.longitude)}</dd></div></dl>
         {detailRequest.error&&<p className={styles.partial} role="status">Using hole index metadata. The detail endpoint could not refresh.</p>}
         {intervalsRequest.loading?<Loading>Reading the depth profile</Loading>:intervalsRequest.error?
           <StateMessage tone="problem" title="Intervals could not load" action={<Button size="sm" variant="secondary" onClick={intervalsRequest.retry}>Retry intervals</Button>}>{intervalsRequest.error}</StateMessage>:
           <><div className={styles.preview}><div className={styles.previewHead}><span className="eyebrow">Logged interval range</span><span className="tabular">{range?`${range.from} to ${range.to} m`:"No intervals"}</span></div>
             <div className={styles.previewColumn}><CoreColumn intervals={intervals} height={245}/></div><MineralLegend compact/></div>
             <div className={styles.readingSummary}><span><strong>{summary.unclassifiedShare.toFixed(1)}%</strong> Unclassified</span><Badge tone={summary.flagged?"caution":"neutral"} icon={summary.flagged?"alert":"check"}>{summary.flagged} flagged</Badge></div>
             {range&&Number.isFinite(detail.total_depth_m)&&range.to>detail.total_depth_m&&
               <div className={styles.detailNotice}><Notice title="Metadata needs review">Intervals reach {range.to} m, beyond the recorded total depth of {detail.total_depth_m} m. Both values are shown as returned.</Notice></div>}</>}
         <Button className={styles.openClassification} to={`/results?hole=${encodeURIComponent(detail.hole_id)}`} trailingIcon="arrowRight">Open in Classification</Button>
       </>}
     </motion.aside>
   </motion.div>}
   <div className={styles.bottomNote}><Badge tone="neutral" icon="info">Confidence judged on Error, not Wt1</Badge>
     <span>Coordinates and metadata come directly from the API. Classifier thresholds are provisional.</span></div>
 </Container></PageTransition>;
}

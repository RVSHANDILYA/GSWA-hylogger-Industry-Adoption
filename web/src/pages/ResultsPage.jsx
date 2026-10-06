import { lazy, Suspense, useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageTransition from "../components/layout/PageTransition.jsx";
import { Container } from "../components/layout/Layout.jsx";
import CoreColumn from "../components/charts/CoreColumn.jsx";
import MineralLegend from "../components/charts/MineralLegend.jsx";
import IntervalRecord, { ErrorBadge, RecordDetails } from "../components/results/IntervalRecord.jsx";
import { Badge, Button, Card, Icon, Loading, Notice, Skeleton, StateMessage } from "../components/ui/index.js";
import { fetchHole, fetchHoles, fetchIntervals } from "../api/client.js";
import useAsyncData from "../hooks/useAsyncData.js";
import useMotionPreference from "../hooks/useMotionPreference.js";
import { LABELS, RULES, ruleShort } from "../data/classification.js";
import { depthRange, intervalKey, matchesInterval, summariseIntervals } from "../data/analysis.js";
import exportIntervals from "../data/exportCsv.js";
import styles from "./ResultsPage.module.css";

const MineralBreakdownChart=lazy(()=>import("../components/charts/MineralBreakdownChart.jsx"));
const DepthMineralTimeline=lazy(()=>import("../components/charts/DepthMineralTimeline.jsx"));
const toggle=(values,value)=>values.includes(value)?values.filter(item=>item!==value):[...values,value];
const midpoint=row=>(row.depth_from_m+row.depth_to_m)/2;

export default function ResultsPage() {
 const [params,setParams]=useSearchParams();
 const [labels,setLabels]=useState(()=>Object.keys(LABELS).includes(params.get("label"))?[params.get("label")]:[]);
 const [rules,setRules]=useState([]);
 const [quality,setQuality]=useState(()=>["good","caution","problem"].includes(params.get("quality"))?params.get("quality"):"all");
 const [view,setView]=useState("cards");
 const [sort,setSort]=useState({key:"depth",descending:false});
 const [selection,setSelection]=useState(null);
 const [hovered,setHovered]=useState(null);
 const [announcement,setAnnouncement]=useState("");
 const recordRefs=useRef({});
 const reduced=useMotionPreference();
 const holesRequest=useAsyncData(fetchHoles,[]);
 const holes=holesRequest.data?.holes??[];
 const selected=holes.find(hole=>hole.hole_id===params.get("hole"))??holes[0]??null;
 const holeId=selected?.hole_id;
 const loadHole=useCallback(()=>fetchHole(holeId),[holeId]);
 const loadIntervals=useCallback(()=>fetchIntervals(holeId),[holeId]);
 const holeRequest=useAsyncData(loadHole,[holeId],{skip:!holeId});
 const intervalsRequest=useAsyncData(loadIntervals,[holeId],{skip:!holeId});
 const intervals=useMemo(()=>intervalsRequest.data?.intervals??[],[intervalsRequest.data]);
 const detail=holeRequest.data??selected;
 const summary=summariseIntervals(intervals);
 const range=depthRange(intervals);
 const filters={labels,rules,quality};
 const filtered=intervals.filter(row=>matchesInterval(row,filters));
 const activeKeys=new Set(filtered.map(intervalKey));
 const sorted=filtered.slice().sort((a,b)=>{
   let difference=sort.key==="label"?a.label.localeCompare(b.label):sort.key==="rule"?String(a.rule_fired).localeCompare(String(b.rule_fired)):
     sort.key==="error"?(a.confidence_error??Infinity)-(b.confidence_error??Infinity):a.depth_from_m-b.depth_from_m;
   if(Number.isNaN(difference)) difference=0;
   return (sort.descending?-difference:difference)||a.depth_from_m-b.depth_from_m;
 });
 const activeDepth=hovered&&hovered.hole===holeId?hovered.depth:selection&&selection.hole===holeId?selection.depth:null;
 const highlighted=intervals.find(row=>activeDepth>=row.depth_from_m&&activeDepth<row.depth_to_m&&activeDepth!=null);
 const activeKey=highlighted?intervalKey(highlighted):null;
 const hasFilters=labels.length>0||rules.length>0||quality!=="all";
 const clearFilters=()=>{setLabels([]);setRules([]);setQuality("all");};
 const selectDepth=depth=>{
   const match=intervals.find(row=>depth>=row.depth_from_m&&depth<row.depth_to_m);
   if(!match) return;
   setSelection({hole:holeId,depth:midpoint(match)});
   setHovered(null);
   if(!activeKeys.has(intervalKey(match))) {
     clearFilters();
     setAnnouncement("Filters cleared to show the selected interval, "+match.depth_from_m+" to "+match.depth_to_m+" m.");
   } else setAnnouncement("Selected "+match.depth_from_m+" to "+match.depth_to_m+" m.");
   // Wait for a filtered record to return before moving focus to it.
   requestAnimationFrame(()=>requestAnimationFrame(()=>{
     const node=recordRefs.current[intervalKey(match)];
     node?.scrollIntoView({behavior:reduced?"auto":"smooth",block:"nearest"});
     node?.focus({preventScroll:true});
   }));
 };
 const hoverDepth=depth=>setHovered(depth==null?null:{hole:holeId,depth});
 const sortBy=key=>setSort(current=>({key,descending:current.key===key?!current.descending:false}));
 const chooseHole=event=>{setParams({hole:event.target.value},{replace:true});setSelection(null);setHovered(null);setAnnouncement("");};
 const excluded=intervals.filter(row=>row.final_mask===false).length;
 const unknown=intervals.filter(row=>row.confidence_error==null).length;
 const exportCsv=()=>{exportIntervals(holeId,sorted);setAnnouncement("Exported "+sorted.length+" intervals for "+holeId+".");};

 return <PageTransition><Container>
   <header className={styles.pageHeading}><p className="eyebrow">02 / Classification workspace</p><h1>Follow the evidence.</h1>
     <p>Read a core, trace a rule, and inspect the record behind it. A provisional label is the beginning of a review.</p></header>
   <div className={styles.holeBar}>
     <label>Drill hole<select aria-label="Selected drill hole" value={holeId??""} onChange={chooseHole} disabled={holesRequest.loading||!holes.length}>
       {!holes.length&&<option>{holesRequest.loading?"Loading holes...":"No holes available"}</option>}
       {holes.map(hole=><option key={hole.hole_id} value={hole.hole_id}>{hole.hole_id} / {hole.region||"Region unavailable"}</option>)}</select></label>
     <div className={styles.holeMeta}><span>{detail?.region}</span>{detail&&<span className="tabular">Recorded depth {detail.total_depth_m??"n/a"} m</span>}</div>
     {holeId&&<Button to={"/explorer?hole="+encodeURIComponent(holeId)} variant="ghost" size="sm" trailingIcon="arrowUpRight">Locate this hole</Button>}
   </div>
   <div className={styles.truthNote}><Icon name="info" size={16}/><span><strong>Confidence judged on Error, not Wt1.</strong> Thresholds are provisional and require client validation. These results are not an assay or a resource estimate.</span></div>
   {holesRequest.error?<Card><StateMessage title="The hole archive could not load" tone="problem" icon="plug" action={<Button onClick={holesRequest.retry}>Try again</Button>}>{holesRequest.error}</StateMessage></Card>:
     holesRequest.loading||intervalsRequest.loading?<div className={styles.workspace}><Skeleton height="700px"/><Skeleton height="700px"/></div>:
     intervalsRequest.error?<Card><StateMessage title="Intervals could not load" tone="problem" action={<Button onClick={intervalsRequest.retry}>Retry intervals</Button>}>{intervalsRequest.error}</StateMessage></Card>:
     !intervals.length?<Card><StateMessage title="No classified intervals returned">The selected hole has no interval records to display.</StateMessage></Card>:<>
   <section className={styles.summary} aria-label="Whole hole classification summary">
     {Object.entries(LABELS).map(([label])=><div key={label} className={label==="Unclassified"?styles.unclassified:""}>
       <span className={styles.summaryNumber}>{summary.labels[label]}</span><span>{label}</span>
       {label==="Unclassified"&&<strong>{summary.unclassifiedShare.toFixed(1)}% of this hole</strong>}</div>)}
     <div className={styles.summaryContext}><Icon name="core" size={19}/><strong>{intervals.length} intervals</strong><span>{summary.flagged} flagged readings<br/>{excluded} mask excluded / {unknown} Error unavailable</span></div>
   </section>
   {holeRequest.error&&<Notice title="Using the hole index metadata">The individual metadata endpoint did not refresh. Interval records are still shown from their own API response.</Notice>}
   <div className={styles.workspace}>
     <aside className={styles.corePanel} aria-label="Interactive drill core">
       <div className={styles.coreHead}><p className="eyebrow">Core / {holeId}</p><h2>The depth story.</h2><span className="tabular">{range?.from} to {range?.to} m</span></div>
       <div className={styles.coreStage}><CoreColumn intervals={intervals} height={640} highlightDepth={activeDepth} activeIntervalKeys={activeKeys}
         onSelectDepth={selectDepth} onHoverDepth={hoverDepth}/></div>
       <div className={styles.coreStatus} aria-live="polite">{highlighted?<><strong>{highlighted.depth_from_m} to {highlighted.depth_to_m} m</strong><span>{highlighted.label} / {ruleShort(highlighted.rule_fired)}</span></>:
         <><strong>Select a band to inspect its record.</strong><span>Hover a record to trace it back to the core.</span></>}</div>
       <MineralLegend compact/>
       <div className={styles.coreKey}><span className={styles.hatchSample}/><span>Hatching means excluded by Final Mask. Dimmed bands fall outside your filters. Empty spaces represent gaps in recorded intervals.</span></div>
       {range&&Number.isFinite(detail?.total_depth_m)&&range.to>detail.total_depth_m&&<Notice title="Metadata needs review">
         Logged intervals reach {range.to} m. Recorded total depth is {detail.total_depth_m} m. Both values are shown as returned.</Notice>}
     </aside>
     <section className={styles.evidence} aria-label="Interval evidence">
       <div className={styles.evidenceHead}><div><p className="eyebrow">Interval evidence</p><h2>See what led here.</h2></div>
         <Button size="sm" variant="secondary" leadingIcon="download" disabled={!sorted.length} onClick={exportCsv}>Export CSV</Button></div>
       <div className={styles.filters}>
         <fieldset><legend>Classifier label</legend><div className={styles.chips}>{Object.keys(LABELS).map(label=><button key={label} type="button" aria-pressed={labels.includes(label)} onClick={()=>setLabels(toggle(labels,label))}>{label}</button>)}</div></fieldset>
         <fieldset><legend>Rule fired</legend><div className={styles.chips}>{Object.entries(RULES).map(([key,rule])=><button key={key} type="button" title={rule.name} aria-label={rule.short+": "+rule.name} aria-pressed={rules.includes(key)} onClick={()=>setRules(toggle(rules,key))}>{rule.short}<span>{intervals.filter(row=>row.rule_fired===key).length}</span></button>)}</div></fieldset>
         <div className={styles.qualityRow}><label>Reading quality <select value={quality} onChange={event=>setQuality(event.target.value)}><option value="all">All readings</option><option value="good">Within gate</option><option value="caution">Marginal</option><option value="problem">Outside / unavailable</option></select></label>
           {hasFilters&&<button type="button" onClick={clearFilters}>Clear filters</button>}</div>
         <p className={styles.filterHelp}>Within: Error 0 to 184.2. Marginal: above 184.2 to 307. Outside: above 307, Error unavailable, or mask excluded.</p>
       </div>
       <div className={styles.listToolbar}><span aria-live="polite"><strong>{filtered.length}</strong> of {intervals.length} intervals{hasFilters?" match":" shown"}</span>
         <div className={styles.viewToggle} role="group" aria-label="Interval view"><button type="button" aria-pressed={view==="cards"} onClick={()=>setView("cards")}><Icon name="list" size={15}/> Cards</button>
           <button type="button" aria-pressed={view==="table"} onClick={()=>setView("table")}><Icon name="table" size={15}/> Table</button></div></div>
       {view==="cards"&&<label className={styles.cardSort}>Sort by <select value={sort.key+(sort.descending?"-desc":"")} onChange={event=>setSort({key:event.target.value.replace("-desc",""),descending:event.target.value.endsWith("-desc")})}>
         <option value="depth">Shallowest first</option><option value="depth-desc">Deepest first</option><option value="error">Lowest Error</option><option value="error-desc">Highest Error</option><option value="label">Classifier label</option><option value="rule">Rule fired</option></select></label>}
       <div className={styles.records}>
         {!sorted.length?<StateMessage title="No intervals match these filters" icon="search" action={<Button variant="secondary" onClick={clearFilters}>Show all intervals</Button>}>The whole core remains visible so you keep the depth context.</StateMessage>:
           view==="cards"?<ul className={styles.cardList}>{sorted.map(row=><li key={intervalKey(row)} data-interval={intervalKey(row)} tabIndex={-1}
             ref={node=>{recordRefs.current[intervalKey(row)]=node;}} className={intervalKey(row)===activeKey?styles.highlightedRecord:""}
             onMouseEnter={()=>hoverDepth(midpoint(row))} onMouseLeave={()=>hoverDepth(null)} onFocus={()=>hoverDepth(midpoint(row))} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget)) hoverDepth(null);}}>
             <IntervalRecord interval={row} selected={intervalKey(row)===activeKey} onSelect={()=>selectDepth(midpoint(row))}/></li>)}</ul>:
           <table className={styles.intervalTable}><caption className="visually-hidden">Filtered intervals for {holeId}. Select a column header to sort.</caption><thead><tr>
             {[["depth","Depth / m"],["label","Label"],["rule","Rule"],["error","Error"]].map(([key,text])=><th key={key} scope="col" aria-sort={sort.key===key?(sort.descending?"descending":"ascending"):"none"}><button type="button" onClick={()=>sortBy(key)}>{text}<span aria-hidden="true">{sort.key===key?(sort.descending?"↓":"↑"):"↕"}</span></button></th>)}</tr></thead>
             <tbody>{sorted.map(row=><tr key={intervalKey(row)} data-interval={intervalKey(row)} tabIndex={-1} className={intervalKey(row)===activeKey?styles.highlightedRecord:""}
               ref={node=>{recordRefs.current[intervalKey(row)]=node;}} onMouseEnter={()=>hoverDepth(midpoint(row))} onMouseLeave={()=>hoverDepth(null)} onFocus={()=>hoverDepth(midpoint(row))} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget)) hoverDepth(null);}}>
               <th scope="row"><button type="button" onClick={()=>selectDepth(midpoint(row))}>{row.depth_from_m} to {row.depth_to_m}</button><RecordDetails interval={row}/></th>
               <td data-label="Label">{row.label}</td><td data-label="Rule">{ruleShort(row.rule_fired)}</td><td data-label="Error"><span className="tabular">{row.confidence_error==null?"Unavailable":Number(row.confidence_error).toFixed(1)}</span><ErrorBadge interval={row}/></td></tr>)}</tbody></table>}
       </div>
       <p className={styles.liveMessage} role="status">{announcement||"CSV includes the full API record and raw mineral percentages for the filtered intervals."}</p>
     </section>
   </div>
   <section className={styles.chartsSection} aria-label="Whole hole mineral charts"><div className={styles.sectionHeading}><div><p className="eyebrow">Two views of the same evidence</p><h2>Composition, in context.</h2></div><p>These charts keep every interval in the selected hole. Filters above change the review list and export.</p></div>
     <div className={styles.charts}><Card><Suspense fallback={<Loading>Drawing the depth profile</Loading>}><DepthMineralTimeline intervals={intervals} title="Mineral composition by depth" subtitle="Hover to trace. Select to inspect." onHoverDepth={hoverDepth} onSelectDepth={selectDepth}/></Suspense></Card>
       <Card><Suspense fallback={<Loading>Drawing the mineral breakdown</Loading>}><MineralBreakdownChart intervals={intervals} title="Every interval, every mineral" subtitle="Returned SWIR mineral percentages"/></Suspense></Card></div></section>
   </>}
 </Container></PageTransition>;
}

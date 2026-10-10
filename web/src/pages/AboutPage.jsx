import { useCallback } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import PageTransition from "../components/layout/PageTransition.jsx";
import Reveal from "../components/ui/Reveal.jsx";
import { Container } from "../components/layout/Layout.jsx";
import CoreColumn from "../components/charts/CoreColumn.jsx";
import { Badge, Button, Icon, Loading, Notice, PageHeader } from "../components/ui/index.js";
import { fetchHole } from "../api/client.js";
import useAsyncData from "../hooks/useAsyncData.js";
import useSurvey from "../hooks/useSurvey.js";
import { EXPECTED_MAX_ERROR, labelTone, ruleShort } from "../data/classification.js";
import { summariseIntervals } from "../data/analysis.js";
import { ErrorBadge } from "../components/results/IntervalRecord.jsx";
import styles from "./AboutPage.module.css";

const TEAM=[
 ["Raja Venkata Shandilya Puram","Classifier"],["Zhenghao Cui","Database, API"],["Likhita Chowdary Moparthi","Validation"],
 ["Simrat Sandhu","Web app, design"],["Sahaj Jayeshbhai Patel","Web, API link"],["Dulya Murage","API, classification results view"],
];
const STACK=["React","Vite","React Router","Framer Motion","Recharts","Axios","FastAPI","PostgreSQL","Docker Compose","pandas","nvcl-kit"];
const RULES=[
 {id:"R1",title:"Phyllic alteration",label:"Altered zone",threshold:"White mica ≥ 40% AND chlorite ≥ 25%.",note:"An alteration pattern in the SWIR mineral percentages. It does not establish ore."},
 {id:"R2",title:"Provisional ore indication",label:"Possible ore zone",threshold:"Carbonate ≥ 15% AND chlorite ≥ 15%.",note:"A chlorite/carbonate proxy. Oxide-based detection is outside the current SWIR scope."},
 {id:"R3",title:"Mica rich waste proxy",label:"Waste rock",threshold:"Dark mica ≥ 55%, white mica < 15%, carbonate < 15%.",note:"A provisional composition rule, not an economic waste determination."},
 {id:"R4",title:"Too few scan points",label:"Unclassified",threshold:"Fewer than 20 scan points, or a non-finite scan count.",note:"Evaluated first. The interval has too little usable data to apply the composition rules."},
 {id:"R5",title:"No supported match",label:"Unclassified",threshold:"No composition rule matches, or Error is missing, non-finite, below 0, or above "+EXPECTED_MAX_ERROR+".",note:"An explicit abstention. Failed Error checks are evaluated before R1, R2 and R3."},
];
const STEPS=[
 ["01","Open archive","Read HyLogger observations from the National Virtual Core Library."],
 ["02","Final Mask","Keep eligible observations before classification. Excluded records, if returned, remain visibly hatched in the core."],
 ["03","SWIR composition","Group readings into depth intervals and convert mineral counts to percentages."],
 ["04","Readable rules","Apply the data sufficiency and Error checks, then the ordered composition rules."],
 ["05","Human review","Return the label, rule, reason and quality information with the minerals."],
];
export default function AboutPage() {
 const location=useLocation();
 const sectionLink=hash=>({search:location.search,hash});
 const [params,setParams]=useSearchParams();
 const survey=useSurvey();
 const holes=survey.data?.holes??[];
 const selected=holes.find(hole=>hole.hole_id===params.get("hole"))??holes[0];
 const holeId=selected?.hole_id;
 const loadHole=useCallback(()=>fetchHole(holeId),[holeId]);
 const detail=useAsyncData(loadHole,[holeId],{skip:!holeId});
 const intervals=survey.data?.intervalsByHole[holeId]??[];
 const sample=intervals[0];
 const summary=summariseIntervals(survey.data?.intervals??[]);
 const coverage=summary.total?summary.unclassifiedShare.toFixed(1):null;
 return <PageTransition><Container>
   <PageHeader eyebrow="03 / Methodology" title="Open data. Open to question."
     lede="A transparent route from hyperspectral drill-core readings to a conversation a geologist can check. Built with the Geological Survey of Western Australia."/>
   <div className={styles.layout}>
     <aside className={styles.contents} aria-label="On this page"><p className="eyebrow">On this page</p>
       <Link to={sectionLink("#purpose")}>The purpose <span>01</span></Link><Link to={sectionLink("#pipeline")}>The pipeline <span>02</span></Link><Link to={sectionLink("#rules")}>The five rules <span>03</span></Link>
       <Link to={sectionLink("#limitations")}>What remains open <span>04</span></Link><Link to={sectionLink("#people")}>Data & people <span>05</span></Link>
       <div className={styles.projectStamp}><Icon name="core" size={26}/><p>GSWA HyLogger<br/>Industry Adoption</p><span>Group 6 / CITS5553 / UWA</span></div>
     </aside>
     <div className={styles.body}>
       <Reveal id="purpose" className={styles.section}><p className="eyebrow">01 / The purpose</p><h2>Make the archive easier to work with.</h2>
         <p>HyLogger scans record mineral information down a drill hole. A long collection of readings becomes more useful when you can see its depth context, understand how an interpretation was made, and return to the original evidence.</p>
         <p>This project connects an open archive, a reproducible processing pipeline, a PostgreSQL database, a FastAPI service, and a review workspace. The classifier uses five readable rules. Every result keeps its rule and plain English reason.</p>
         <div className={styles.coverage}><div><span className={styles.coverageNumber}>{coverage??"..."}</span><span>% Unclassified</span></div>
           <p>{coverage?<><strong>{summary.unclassified} of {summary.total} returned intervals</strong> have no supported classifier label. That is the main finding, not a result to hide. Coverage is not accuracy.</>:"Reading the current archive coverage..."}</p></div>
         {survey.error&&<Notice title="Current coverage unavailable">{survey.error} The methodology below describes the classifier, independently of the API connection.</Notice>}
         {!!survey.data?.missingHoles.length&&<Notice title="Partial coverage">The statistics include only successfully loaded holes. {survey.data.missingHoles.length} holes could not be read.</Notice>}
       </Reveal>
       <Reveal id="pipeline" className={styles.section}><p className="eyebrow">02 / The pipeline</p><h2>From observation to a reviewable record.</h2>
         <ol className={styles.pipeline}>{STEPS.map(([number,title,description])=><li key={number}><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div><Icon name="arrowDown" size={18}/></li>)}</ol>
         <div className={styles.liveExample}><div className={styles.exampleHeading}><div><p className="eyebrow">A record from the archive</p><h3>Read the evidence yourself.</h3></div>
           {holes.length>0&&<label className={styles.sampleSelect}>Example hole<select value={holeId??""} onChange={event=>setParams({hole:event.target.value},{replace:true})}>{holes.map(hole=><option key={hole.hole_id}>{hole.hole_id}</option>)}</select></label>}</div>
           {survey.loading?<Loading>Reading interval records</Loading>:sample?<div className={styles.sample}>
             <div className={styles.sampleCore}><CoreColumn intervals={intervals} height={185} highlightDepth={(sample.depth_from_m+sample.depth_to_m)/2}/></div>
             <div><p className={styles.sampleId}>{holeId} / {detail.data?.region??selected.region}</p><h4>{sample.depth_from_m} to {sample.depth_to_m} m</h4>
               <div className={styles.sampleBadges}><Badge tone="neutral" mono>{ruleShort(sample.rule_fired)}</Badge><Badge tone={labelTone(sample.label)}>{sample.label}</Badge><ErrorBadge interval={sample}/></div>
               <p>{sample.reason}</p><Button to={"/results?hole="+encodeURIComponent(holeId)} variant="ghost" size="sm" trailingIcon="arrowRight">Inspect the complete hole</Button></div>
           </div>:<p>No live example is available. Open Classification when the API is reachable.</p>}
         </div>
       </Reveal>
       <Reveal id="rules" className={styles.section}><p className="eyebrow">03 / The five rules</p><h2>Every threshold is visible.</h2>
         <p>The first matching rule wins. All mineral cutoffs below are team-defined placeholders pending client validation. They are not validated geological or economic boundaries.</p>
         <div className={styles.evaluation}><Icon name="info" size={18}/><div><strong>Actual evaluation order</strong><p>Final Mask filter → R4 data check → Error gate → R1 → R2 → R3 → R5 if nothing matches.</p></div></div>
         <div className={styles.rules}>{RULES.map(rule=><article key={rule.id} className={styles.rule}><span className={styles.ruleId}>{rule.id}</span><div><div className={styles.ruleHead}><h3>{rule.title}</h3><Badge tone="neutral">{rule.label}</Badge></div><p className={styles.threshold}>{rule.threshold}</p><p>{rule.note}</p></div></article>)}</div>
         <div className={styles.errorGate}><div><span className="eyebrow">Error ceiling</span><strong>{EXPECTED_MAX_ERROR}</strong><span>Provisional, not validated</span></div>
           <div><h3>Confidence judged on Error, not Wt1.</h3><p>The ceiling is the rounded 75th percentile of the observed Error distribution, 306.619297 across the baseline's 276 interval means. It controls coverage and needs validation. It is not a spectroscopy standard.</p>
             <p>Wt1 is a dominance weight, not a quality score. The UI separately marks readings above 60% of the ceiling, 184.2, as marginal. That caution marker does not change the backend classification.</p></div></div>
       </Reveal>
       <Reveal id="limitations" className={styles.section}><p className="eyebrow">04 / What remains open</p><h2>Useful context. Clear limits.</h2>
         <div className={styles.limitations}>
           <article><Icon name="eye" size={22}/><h3>The SWIR blind spot</h3><p>SWIR cannot detect hematite or goethite. Oxide-based ore and waste detection requires thermal infrared data, which this pipeline does not implement.</p></article>
           <article><Icon name="sliders" size={22}/><h3>Thresholds need validation</h3><p>The mineral cutoffs and Error ceiling are provisional. Expert-labelled holes and client-confirmed thresholds are needed before accuracy can be assessed.</p></article>
           <article><Icon name="alert" size={22}/><h3>An indication is not an assay</h3><p>“Possible ore zone” is a composition proxy. It cannot establish grade, tonnage, economic viability, or a resource estimate.</p></article>
           <article><Icon name="core" size={22}/><h3>Absence stays visible</h3><p>Unclassified means the rules abstained. A gap in the core means no returned interval covers that depth. Missing Error keeps normal mineral shading and is described as unavailable. Only mask exclusion produces hatching.</p></article>
         </div>
       </Reveal>
       <Reveal id="people" className={styles.section}><p className="eyebrow">05 / Data & people</p><h2>Built on open science.</h2>
         <p>Data credit: the National Virtual Core Library and the Geological Survey of Western Australia. The core colours summarise five mineral families, with every other returned mineral grouped into Other. Full records and CSV exports retain the original mineral names and percentages.</p>
         <div className={styles.credits}><a href="https://www.auscope.org.au/nvcl" target="_blank" rel="noreferrer">National Virtual Core Library <Icon name="arrowUpRight" size={17}/></a>
           <a href="https://www.dmpe.wa.gov.au" target="_blank" rel="noreferrer">Geological Survey of Western Australia <Icon name="arrowUpRight" size={17}/></a></div>
         <div className={styles.teamHeading}><h3>Group 6 / Data Wranglers</h3><p>CITS5553 / The University of Western Australia</p></div>
         <ul className={styles.team}>{TEAM.map(([name,role])=><li key={name}><strong>{name}</strong><span>{role}</span></li>)}</ul>
         <div className={styles.stack}><p className="eyebrow">The project stack</p><div>{STACK.map(name=><span key={name}>{name}</span>)}</div></div>
       </Reveal>
     </div>
   </div>
 </Container></PageTransition>;
}

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageTransition from "../components/layout/PageTransition.jsx";
import { Badge, Button, Icon, Skeleton, Stat } from "../components/ui/index.js";
import CountUp from "../components/ui/CountUp.jsx";
import Reveal from "../components/ui/Reveal.jsx";
import CoreColumn from "../components/charts/CoreColumn.jsx";
import MineralLegend from "../components/charts/MineralLegend.jsx";
import CorePoster from "../components/home/CorePoster.jsx";
import useSurvey from "../hooks/useSurvey.js";
import useDataSource from "../hooks/useDataSource.js";
import useMotionPreference from "../hooks/useMotionPreference.js";
import { easeOut } from "../styles/theme.js";
import { summariseIntervals, depthRange } from "../data/analysis.js";
import styles from "./LandingPage.module.css";

const PIPELINE = [
  {name: "Open core data", note: "HyLogger scans from the National Virtual Core Library.", icon: "core"},
  {name: "Final Mask", note: "Retain readings that pass the survey's scan filter.", icon: "filter"},
  {name: "Mineral percentages", note: "Translate SWIR detections into interval composition.", icon: "layers"},
  {name: "Readable rules", note: "Apply five provisional rules and record the reason.", icon: "list"},
  {name: "Your interpretation", note: "Trace a finding, check its limits, decide what to review.", icon: "crosshair"},
];
const HERO_HOLES = ["05GJD001", "05KCD001", "07THD002"];
const MotionLink = motion.create(Link);

export default function LandingPage() {
  const request = useSurvey();
  const source = useDataSource();
  const reduced = useMotionPreference();
  const survey = request.data;
  const summary = summariseIntervals(survey?.intervals);
  const featured = HERO_HOLES.map(id => survey?.holes.find(hole => hole.hole_id === id))
    .filter(hole => hole && survey.intervalsByHole[hole.hole_id]?.length);
  const showLiveCores = !request.loading && !request.error && source.mode === "live" && featured.length === HERO_HOLES.length;
  return <PageTransition>
    <div className={styles.hero}>
      <div className={styles.heroInner}>
        <Reveal className={styles.heroCopy}>
          <p className="eyebrow"><span className={styles.kickerRule} /> GSWA HyLogger / Industry adoption</p>
          <h1>See what the drill core is telling you.</h1>
          <p className={styles.intro}>Read the minerals, follow the rules, and see where a geologist's interpretation is still needed.</p>
          <div className={styles.actions}><Button to="/explorer" trailingIcon="arrowUpRight" size="lg">Explore drill holes</Button>
            <Button to="/about#rules" variant="secondary" size="lg">How the rules work</Button></div>
          <p className={styles.heroFoot}>Public NVCL data. Every label shows the rule behind it.</p>
        </Reveal>
        <Reveal className={styles.dataStage} delay={.04} aria-label="Mineral columns from three real drill holes">
          <div className={styles.stageTop}><span>Three holes. Real intervals.</span>
            <Badge tone={showLiveCores ? "good" : "neutral"} icon={showLiveCores ? "check" : "clock"}>
              {showLiveCores ? "Live API" : source.mode === "snapshot" ? "Saved archive" : request.error ? "Archive unavailable" : "Reading the archive"}</Badge></div>
          {showLiveCores ? <div className={styles.coreGallery}>
            {featured.map((hole, index) => {
                const range = depthRange(survey.intervalsByHole[hole.hole_id]);
                return <MotionLink to={`/results?hole=${encodeURIComponent(hole.hole_id)}`} className={styles.coreSpecimen} key={hole.hole_id}
                  aria-label={`Inspect ${hole.hole_id}, measured intervals from ${range.from} to ${range.to} metres`}
                  initial={reduced ? false : {opacity:0,y:12}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
                  transition={{duration:reduced ? 0 : .35,delay:reduced ? 0 : index * .06,ease:easeOut}}>
                  <span className={styles.specimenIndex}>0{index + 1}</span>
                  <div className={styles.specimenCore}><CoreColumn intervals={survey.intervalsByHole[hole.hole_id]} height={275} showRuler={false} showScan={false} /></div>
                  <strong>{hole.hole_id}</strong><span>{range.from} to {range.to} m</span></MotionLink>;
              })}
          </div> : <div className={styles.heroFallback}><CorePoster />
            {request.error && <Button onClick={request.retry} variant="secondary" size="sm">Try the archive again</Button>}</div>}
          <div className={styles.stageBottom}><span>Colour shows minerals. Length shows depth.</span><Icon name="arrowUpRight" size={18} /></div>
          <MineralLegend compact />
        </Reveal>
      </div>
    </div>

    <section className={styles.statsBand} aria-label="Live archive statistics"><div className={styles.statsInner}>
      <div className={styles.statsIntro}><p className="eyebrow">{source.mode === "snapshot" ? "A saved view of the archive" : "A live view of the archive"}</p><p>Evidence before certainty.</p></div>
      {request.loading ? [0,1,2,3].map(index => <Skeleton key={index} height="72px" />) :
        survey ? <>
          <Stat value={<CountUp value={survey.holes.length} />} label="Drill holes" />
          <Stat value={<CountUp value={summary.total} />} label="Intervals reviewed by rules" />
          <Stat value={<CountUp value={summary.unclassifiedShare} decimals={1} suffix="%" />} label="Remain Unclassified" />
          <Stat value={<CountUp value={summary.flaggedShare} decimals={1} suffix="%" />} label="Flagged readings" />
        </> : <p className={styles.statsUnavailable}>Statistics need a reachable API. No estimated figures are shown.</p>}
    </div></section>

    <div className={styles.content}>
      {survey?.missingHoles.length > 0 && <p className={styles.partial} role="status">Partial coverage: {survey.missingHoles.length} holes could not load their intervals. Percentages describe the readings that loaded.</p>}
      <Reveal className={styles.truth}>
        <div><p className="eyebrow">A useful result includes its uncertainty</p><h2>Unclassified<br />is a result, too.</h2></div>
        <div><p>{survey ? <><strong>{summary.unclassifiedShare.toFixed(1)}% of the loaded intervals remain Unclassified.</strong> That is {summary.unclassified} of {summary.total} intervals where the baseline does not assign a geological label.</> : "Unclassified intervals stay visible. The baseline leaves much of the archive open for expert interpretation."}</p>
          <p>Use these rules to organise a review, not to confirm a deposit. Mineral thresholds are provisional, and confidence is judged on Error, not Wt1.</p>
          <Link to="/results?label=Unclassified" className={styles.textLink}>See the intervals that need interpretation <Icon name="arrowUpRight" size={16} /></Link></div>
      </Reveal>

      <Reveal className={styles.section}>
        <div className={styles.sectionHead}><div><p className="eyebrow">From scan to understanding</p><h2>Follow the evidence.</h2></div>
          <p>Five connected steps. Every displayed label keeps the rule and reason that produced it.</p></div>
        <ol className={styles.pipeline}>{PIPELINE.map((step, index) => <li key={step.name}>
          <div className={styles.stepTop}><span>0{index + 1}</span><Icon name={step.icon} size={20} /></div>
          <h3>{step.name}</h3><p>{step.note}</p>{index < 4 && <Icon name="arrowRight" className={styles.stepArrow} size={16} />}
        </li>)}</ol>
      </Reveal>

      <Reveal className={styles.section}>
        <div className={styles.sectionHead}><div><p className="eyebrow">A workspace for your next question</p><h2>Start with a purpose.</h2></div></div>
        <div className={styles.tasks}>
          <Link to="/explorer"><span className={styles.taskIndex}>01 / Locate</span><h3>Where is this hole?</h3><p>Connect real coordinates, regional context and a depth profile in one workspace.</p><span className={styles.textLink}>Open the explorer <Icon name="arrowUpRight" size={18} /></span></Link>
          <Link to="/results?quality=problem"><span className={styles.taskIndex}>02 / Review</span><h3>What needs a closer look?</h3><p>Isolate readings outside the error gate, trace their intervals, and export the evidence.</p><span className={styles.textLink}>Review flagged readings <Icon name="arrowUpRight" size={18} /></span></Link>
          <Link to="/about"><span className={styles.taskIndex}>03 / Understand</span><h3>Why did that rule fire?</h3><p>Read the exact thresholds, the order of the rules and the limits of SWIR.</p><span className={styles.textLink}>Read the methodology <Icon name="arrowUpRight" size={18} /></span></Link>
        </div>
      </Reveal>

      <Reveal className={styles.limitations}>
        <Icon name="info" size={26} /><div><p className="eyebrow">Know what the instrument cannot see</p>
          <h2>Mineral patterns are not an ore assay.</h2><p>This pipeline uses SWIR mineral outputs. Hematite and goethite are not detected here. An oxide-based interpretation requires other spectral data and expert validation.</p></div>
        <Button to="/about#limitations" variant="secondary" trailingIcon="arrowRight">Explore the limitations</Button>
      </Reveal>
    </div>
  </PageTransition>;
}

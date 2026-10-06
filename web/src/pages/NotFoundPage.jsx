import PageTransition from "../components/layout/PageTransition.jsx";
import { Container } from "../components/layout/Layout.jsx";
import { Button, Icon } from "../components/ui/index.js";
import styles from "./NotFoundPage.module.css";
export default function NotFoundPage() {
 return <PageTransition><Container><div className={styles.wrap}>
   <div><p className="eyebrow">404 / Beyond the logged range</p><h1>Nothing logged<br/>at this depth.</h1>
     <p>This address has no record here. Return to the archive and start with a real drill hole.</p>
     <div className={styles.actions}><Button to="/explorer" trailingIcon="arrowRight">Open the Hole Explorer</Button><Button to="/" variant="ghost">Back to Home</Button></div></div>
   <div className={styles.diagram} aria-hidden="true"><span>NO RECORD</span><div className={styles.emptyCore}/><Icon name="compass" size={30}/><span>RETURN TO THE ARCHIVE</span></div>
 </div></Container></PageTransition>;
}

import { Button, Icon } from "../ui/index.js";
import useDataSource from "../../hooks/useDataSource.js";
import styles from "./DataSourceBanner.module.css";
export default function DataSourceBanner() {
 const source=useDataSource();
 if(source.mode!=="snapshot") return null;
 const date=new Intl.DateTimeFormat("en-AU",{timeZone:"Australia/Perth",dateStyle:"long",timeStyle:"short"}).format(new Date(source.generatedAt));
 return <div className={styles.banner} role="status"><div className={styles.inner}><Icon name="clock" size={18}/>
   <p>Showing a saved snapshot of the classified data from <strong>{date} AWST</strong>.</p>
   <Button variant="ghost" size="sm" onClick={()=>window.location.reload()}>Try live data</Button></div></div>;
}

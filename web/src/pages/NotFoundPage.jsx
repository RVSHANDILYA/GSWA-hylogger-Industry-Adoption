import PageTransition from "../components/layout/PageTransition.jsx";
import { Container } from "../components/layout/Layout.jsx";
import { Button } from "../components/ui/index.js";
import styles from "./NotFoundPage.module.css";

export default function NotFoundPage() {
  return (
    <PageTransition>
      <Container>
        <div className={styles.wrap}>
          <div>
            <p className={styles.code}>404</p>
            <h1 className={styles.title}>Nothing logged at this depth</h1>
            <p className={styles.lede}>
              That address is not one of the four pages on this site. The Hole
              Explorer is the usual place to start.
            </p>
            <Button to="/explorer" trailingIcon="arrowRight">
              Open the Hole Explorer
            </Button>
          </div>
        </div>
      </Container>
    </PageTransition>
  );
}

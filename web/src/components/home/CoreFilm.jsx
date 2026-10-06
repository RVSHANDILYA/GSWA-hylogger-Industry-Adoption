import { useEffect, useRef, useState } from "react";
import useMotionPreference from "../../hooks/useMotionPreference.js";
import CorePoster from "./CorePoster.jsx";
import styles from "./CoreFilm.module.css";

export default function CoreFilm() {
  const videoRef = useRef(null);
  const reduced = useMotionPreference();
  const [failed, setFailed] = useState(false);
  const [visitorPaused, setVisitorPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const showVideo = import.meta.env.VITE_HAS_HERO_VIDEO && !reduced && !failed;

  useEffect(() => {
    const video = videoRef.current;
    if (!showVideo || !video) return undefined;
    let inView = false;
    let active = true;
    const update = () => {
      if (inView && !document.hidden && !visitorPaused) {
        video.play().catch(error => {
          // Scrolling away can abort a pending play without a media failure.
          if (active && error.name !== "AbortError") setFailed(true);
        });
      } else video.pause();
    };
    const observer = new IntersectionObserver(entries => {
      inView = entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= .25);
      update();
    }, {threshold:[0,.25]});
    observer.observe(video);
    document.addEventListener("visibilitychange", update);
    return () => {
      active = false;
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      video.pause();
    };
  }, [showVideo, visitorPaused]);

  return <figure className={styles.film} aria-label="05GJD001 drill core walkthrough">
    <div className={styles.media}>
      {showVideo ? <video ref={videoRef} muted loop playsInline preload="metadata"
        src={import.meta.env.BASE_URL + "hero-05GJD001.mp4"}
        poster={import.meta.env.VITE_HAS_HERO_POSTER ? import.meta.env.BASE_URL + "hero-poster.png" : undefined}
        aria-label="Silent drill core walkthrough for 05GJD001"
        onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setFailed(true)} /> :
        // TODO: Add the supplied film and poster in public/, then restart Vite or rebuild.
        <CorePoster className={styles.poster} />}
    </div>
    <figcaption><span>05GJD001 / Core walkthrough</span>
      {showVideo && <button type="button" onClick={() => setVisitorPaused(playing)}
        aria-label={playing ? "Pause core walkthrough" : "Play core walkthrough"}>{playing ? "Pause film" : "Play film"}</button>}
    </figcaption>
  </figure>;
}

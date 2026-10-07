import { useEffect, useMemo, useRef, useState } from "react";
import maplibreUrl from "maplibre-gl/dist/maplibre-gl.mjs?url";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import "maplibre-gl/dist/maplibre-gl.css";
import Icon from "../ui/Icon.jsx";
import useMotionPreference from "../../hooks/useMotionPreference.js";
import { BASEMAPS, HOLE_SOURCE, STATE_BOUNDS, holeBounds, holeFeatures, locatedHoles, offlineStyle } from "../../data/mapGeometry.js";
import styles from "./WAMap.module.css";

// The map engine and worker are self-hosted assets, loaded only by Explorer.
let enginePromise;
function loadEngine() {
  enginePromise ??= import(/* @vite-ignore */ maplibreUrl).catch(error => {
    enginePromise = undefined;
    throw error;
  });
  return enginePromise;
}

function popupContent(hole) {
  const content = document.createElement("div");
  content.className = styles.popup;
  for (const [tag, text] of [
    ["strong", hole.hole_id], ["span", hole.region || "Region not recorded"],
    ["span", `${hole.intervals_classified} classified intervals`],
    ["span", `${hole.latitude.toFixed(5)}, ${hole.longitude.toFixed(5)}`],
  ]) {
    const node = document.createElement(tag);
    node.textContent = text;
    content.append(node);
  }
  return content;
}

export default function WAMap({ holes = [], selectedHoleId, onSelect }) {
  const rootRef = useRef(null);
  const containerRef = useRef(null);
  const runtimeRef = useRef(null);
  const reduced = useMotionPreference();
  const points = useMemo(() => locatedHoles(holes), [holes]);
  const currentRef = useRef({ points, selectedHoleId, onSelect, reduced });
  const [ready, setReady] = useState(false);
  const [basemap, setBasemap] = useState("streets");
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [viewport, setViewport] = useState(null);
  const selected = points.find(hole => hole.hole_id === selectedHoleId);

  useEffect(() => {
    currentRef.current = { points, selectedHoleId, onSelect, reduced };
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.map.getSource(HOLE_SOURCE)?.setData(holeFeatures(points, selectedHoleId));
    if (runtime.previousSelection !== selectedHoleId) {
      runtime.popup?.remove();
      const hole = points.find(point => point.hole_id === selectedHoleId);
      // Selecting a map pin preserves the camera. A distant list choice pans into view.
      if (hole && runtime.pickedHole !== selectedHoleId && !runtime.map.getBounds().contains([hole.longitude, hole.latitude])) {
        runtime.map.easeTo({ center: [hole.longitude, hole.latitude], duration: reduced ? 0 : 420 });
      }
      if (hole && runtime.pickedHole === selectedHoleId) {
        runtime.popup = new runtime.gl.Popup({ offset: 18, closeOnClick: false, focusAfterOpen: false, maxWidth: "240px" })
          .setLngLat([hole.longitude, hole.latitude]).setDOMContent(popupContent(hole)).addTo(runtime.map);
      }
      runtime.previousSelection = selectedHoleId;
      runtime.pickedHole = null;
    }
    runtime.updateMarkers();
  }, [points, selectedHoleId, onSelect, reduced]);

  useEffect(() => {
    let active = true;
    let runtime;
    loadEngine().then(gl => {
      if (!active) return;
      gl.setWorkerUrl(workerUrl);
      const map = new gl.Map({
        container: containerRef.current,
        style: offlineStyle(),
        bounds: STATE_BOUNDS,
        fitBoundsOptions: { padding: { top: 80, right: 50, bottom: 120, left: 40 }, retainPadding: false, duration: 0 },
        minZoom: 2.5, maxZoom: 19,
        renderWorldCopies: false,
        cooperativeGestures: true,
        attributionControl: false,
      });
      runtime = { map, gl, markers: new Map(), popup: null, previousSelection: currentRef.current.selectedHoleId, pickedHole: null };
      runtimeRef.current = runtime;
      map.getCanvas().setAttribute("aria-label", "Drill hole map. Drag to pan, use arrow keys to move, or use zoom controls. Hole pins and groups are keyboard accessible.");
      map.addControl(new gl.NavigationControl(), "top-right");
      map.addControl(new gl.FullscreenControl({ container: rootRef.current }), "top-right");
      map.addControl(new gl.ScaleControl({ maxWidth: 100, unit: "metric" }), "bottom-left");
      map.addControl(new gl.AttributionControl({ compact: true }), "bottom-right");

      const clearMarkers = () => {
        for (const entry of runtime.markers.values()) entry.marker.remove();
        runtime.markers.clear();
      };
      const updateMarkers = () => {
        if (!active || !map.getSource(HOLE_SOURCE) || !map.isSourceLoaded(HOLE_SOURCE)) return;
        const shown = new Set();
        // Query drawn tiles so cached parent clusters cannot survive a zoom.
        for (const feature of map.queryRenderedFeatures(undefined, { layers: ["hole-marker-source"] })) {
          const properties = feature.properties;
          const cluster = Boolean(properties.cluster);
          const key = cluster ? `cluster-${properties.cluster_id}` : properties.hole_id;
          const position = map.project(feature.geometry.coordinates);
          if (shown.has(key) || position.x < -44 || position.y < -44
            || position.x > containerRef.current.clientWidth + 44 || position.y > containerRef.current.clientHeight + 44) continue;
          shown.add(key);
          let entry = runtime.markers.get(key);
          if (!entry) {
            const element = document.createElement("button");
            element.type = "button";
            element.className = cluster ? styles.cluster : styles.pin;
            const dot = document.createElement("span");
            dot.className = styles.pinDot;
            const label = document.createElement("span");
            label.className = styles.pinLabel;
            element.append(dot, label);
            entry = { element, dot, label, feature, marker: new gl.Marker({ element }).setLngLat(feature.geometry.coordinates).addTo(map) };
            element.addEventListener("keydown", event => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                element.click();
              }
            });
            element.addEventListener("click", async event => {
              event.stopPropagation();
              const clicked = entry.feature;
              if (clicked.properties.cluster) {
                try {
                  const zoom = await map.getSource(HOLE_SOURCE).getClusterExpansionZoom(clicked.properties.cluster_id);
                  if (active) map.easeTo({ center: clicked.geometry.coordinates, zoom: Math.min(zoom + .5, 19), duration: currentRef.current.reduced ? 0 : 420 });
                } catch {
                  if (active) setMessage("This group changed. Use the zoom controls to explore its holes.");
                }
                return;
              }
              const hole = currentRef.current.points.find(point => point.hole_id === clicked.properties.hole_id);
              if (!hole) return;
              runtime.pickedHole = hole.hole_id;
              currentRef.current.onSelect?.(hole);
              if (hole.hole_id === currentRef.current.selectedHoleId) {
                runtime.popup?.remove();
                runtime.popup = new gl.Popup({ offset: 18, closeOnClick: false, focusAfterOpen: false, maxWidth: "240px" })
                  .setLngLat(clicked.geometry.coordinates).setDOMContent(popupContent(hole)).addTo(map);
              }
            });
            runtime.markers.set(key, entry);
          }
          const previousCoordinates = entry.feature.geometry.coordinates;
          const coordinates = feature.geometry.coordinates;
          entry.feature = feature;
          if (previousCoordinates[0] !== coordinates[0] || previousCoordinates[1] !== coordinates[1]) entry.marker.setLngLat(coordinates);
          const isSelected = cluster ? Boolean(properties.selected) : properties.hole_id === currentRef.current.selectedHoleId;
          entry.element.classList.toggle(styles.selected, isSelected);
          entry.element.setAttribute("aria-label", cluster ? `Zoom to ${properties.point_count} nearby drill holes` : `Select ${properties.hole_id}`);
          entry.element.setAttribute("aria-pressed", String(isSelected));
          const dotText = cluster ? String(properties.point_count) : "";
          const labelText = cluster ? `${properties.point_count} nearby holes` : properties.hole_id;
          if (entry.dot.textContent !== dotText) entry.dot.textContent = dotText;
          if (entry.label.textContent !== labelText) entry.label.textContent = labelText;
        }
        for (const [key, entry] of runtime.markers) {
          if (!shown.has(key)) { entry.marker.remove(); runtime.markers.delete(key); }
        }
      };
      runtime.updateMarkers = updateMarkers;
      map.on("style.load", () => {
        clearMarkers();
        const current = currentRef.current;
        map.addSource(HOLE_SOURCE, {
          type: "geojson", data: holeFeatures(current.points, current.selectedHoleId),
          cluster: true, clusterRadius: 42, clusterMaxZoom: 17,
          clusterProperties: { selected: ["max", ["get", "selected"]] },
        });
        // A layer keeps the source tiled; accessible HTML markers draw the pins.
        map.addLayer({ id: "hole-marker-source", type: "circle", source: HOLE_SOURCE, paint: { "circle-radius": 1, "circle-opacity": 0 } });
      });
      map.on("move", updateMarkers);
      map.on("render", updateMarkers);
      map.on("sourcedata", event => { if (event.sourceId === HOLE_SOURCE && event.isSourceLoaded) updateMarkers(); });
      const updateViewport = () => {
        const center = map.getCenter();
        if (active) setViewport({ longitude: center.lng, latitude: center.lat, zoom: map.getZoom() });
      };
      map.on("moveend", () => { updateMarkers(); updateViewport(); });
      updateViewport();
      map.on("error", event => {
        if (!active || event.sourceId === HOLE_SOURCE || event.error?.name === "AbortError") return;
        if (map.getSource("openmaptiles")) map.setStyle(offlineStyle(), { diff: false });
        setStatus("offline");
      });
      setReady(true);
    }).catch(() => { if (active) setStatus("unavailable"); });
    return () => {
      active = false;
      runtime?.popup?.remove();
      runtime?.map.remove();
      runtimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!ready || !runtime) return undefined;
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 10000);
    const loaded = () => { if (active && runtime.map.getSource("openmaptiles")) setStatus("online"); };
    fetch(BASEMAPS[basemap].url, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error("Basemap unavailable"); return response.json(); })
      .then(style => {
        if (!active) return;
        runtime.map.setStyle(style, { diff: false });
        runtime.map.once("idle", loaded);
      })
      .catch(() => { if (active) { runtime.map.setStyle(offlineStyle(), { diff: false }); setStatus("offline"); } });
    return () => { active = false; clearTimeout(timeout); runtime.map.off("idle", loaded); controller.abort(); };
  }, [basemap, attempt, ready]);

  const cameraOptions = { padding: { top: 80, right: 50, bottom: 120, left: 40 }, retainPadding: false, duration: reduced ? 0 : 420, maxZoom: 13 };
  const overview = () => runtimeRef.current?.map.fitBounds(STATE_BOUNDS, cameraOptions);
  const fitHoles = () => { const bounds = holeBounds(points); if (bounds) runtimeRef.current?.map.fitBounds(bounds, cameraOptions); };
  const focus = () => {
    if (selected) runtimeRef.current?.map.easeTo({ center: [selected.longitude, selected.latitude],
      zoom: Math.max(runtimeRef.current.map.getZoom(), 14), duration: reduced ? 0 : 420 });
  };

  return <div className={styles.map} ref={rootRef} data-basemap-status={status}>
    <div className={styles.viewport}>
      <div ref={containerRef} className={styles.canvas} role="region" aria-label="Interactive drill hole map" />
      <div className={styles.mapTop}>
        <span className={styles.mapTitle}>Western Australia</span>
        <div className={styles.basemaps} role="group" aria-label="Basemap style">
          {Object.entries(BASEMAPS).map(([key, value]) => <button type="button" key={key}
            aria-pressed={basemap === key} onClick={() => { if (basemap !== key) { setBasemap(key); setStatus("loading"); } }}>{value.label}</button>)}
        </div>
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={overview} disabled={!ready}><Icon name="map" size={14} /> State overview</button>
        <button type="button" onClick={fitHoles} disabled={!ready || !points.length}><Icon name="layers" size={14} /> Fit holes</button>
        <button type="button" onClick={focus} disabled={!ready || !selected}><Icon name="crosshair" size={14} /> Focus hole</button>
      </div>
      {(status !== "online" || message) && <div className={styles.notice} role="status">
        {status === "unavailable" ? "This browser could not start the interactive map. Select holes from the list." :
          status === "offline" ? "Basemap unavailable. Showing a coarse coastline; hole locations remain available." : message || "Loading the basemap..."}
        {status === "offline" && <button type="button" onClick={() => { setStatus("loading"); setAttempt(value => value + 1); }}>Retry basemap</button>}
      </div>}
    </div>
    <div className={styles.mapBottom}>
      <span><span className={styles.dot} /> {points.length} located holes</span>
      {viewport && <span className={styles.coordinates}>{viewport.latitude.toFixed(3)}, {viewport.longitude.toFixed(3)} / zoom {viewport.zoom.toFixed(1)}</span>}
    </div>
    {points.length < holes.length && <p className={styles.unlocated}>{holes.length - points.length} holes have no usable coordinates and remain in the list.</p>}
  </div>;
}

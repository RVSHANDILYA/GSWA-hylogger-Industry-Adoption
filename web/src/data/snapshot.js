// The saved archive retains the three API response shapes without inventing records.
export function validateSnapshot(snapshot) {
 if (snapshot?.version!==1 || !Number.isFinite(Date.parse(snapshot.generatedAt))) throw new Error("The saved archive has no valid date or schema version.");
 const holes=snapshot.holes?.holes;
 if(!Array.isArray(holes)||snapshot.holes.count!==holes.length||!holes.length) throw new Error("The saved hole index is incomplete.");
 const ids=new Set();
 for(const hole of holes) {
   if(typeof hole.hole_id!=="string"||!hole.hole_id||ids.has(hole.hole_id)) throw new Error("The saved hole index contains invalid IDs.");
   ids.add(hole.hole_id);
   const detail=snapshot.details?.[hole.hole_id];
   const record=snapshot.intervals?.[hole.hole_id];
   if(detail?.hole_id!==hole.hole_id||record?.hole_id!==hole.hole_id||!Array.isArray(record.intervals)||
     record.count!==record.intervals.length||record.count!==hole.intervals_classified) throw new Error("The saved record for "+hole.hole_id+" is incomplete.");
   for(const interval of record.intervals) {
     if(!Number.isFinite(interval.depth_from_m)||!Number.isFinite(interval.depth_to_m)||
       typeof interval.label!=="string"||typeof interval.rule_fired!=="string"||!Array.isArray(interval.minerals)) throw new Error("The saved interval record is invalid.");
   }
 }
 return snapshot;
}

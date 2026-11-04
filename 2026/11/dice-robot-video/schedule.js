/* schedule.js - script.json + timing.json -> 장면/오디오 시작 시각. (render.js, mux 가 공유)
   규칙: 엔트리 슬롯 길이 = timing[id] (= 음성 길이 + 0.6초 여유). 음성은 슬롯 시작 + LEAD(0.3초)에 재생.
   엔트리 at(장면 내 고정 오프셋, 초)이 있으면 그 시각에 시작(앞 엔트리가 더 길면 그 뒤로 밀림).
   장면 길이 = max(마지막 슬롯 끝, min_dur). */
(function(root){
function build(script,timing){
  const LEAD=0.3, scenes=[]; let t=0;
  const nums=[...new Set(script.map(e=>e.scene))].sort((a,b)=>a-b);
  for(const n of nums){
    const es=script.filter(e=>e.scene===n); let cursor=0, minDur=0; const items=[];
    for(const e of es){
      const slot=timing[e.id]; if(typeof slot!=="number")throw new Error("timing missing "+e.id);
      const s=Math.max(cursor, e.at!=null?e.at:cursor);
      items.push({id:e.id,start:+(t+s).toFixed(3),slot,audio_start:+(t+s+LEAD).toFixed(3),rel:s});
      cursor=s+slot; if(e.min_dur)minDur=Math.max(minDur,e.min_dur);
    }
    const dur=+Math.max(cursor,minDur).toFixed(3);
    scenes.push({n,start:+t.toFixed(3),dur,items}); t+=dur;
  }
  return {scenes,total:+t.toFixed(3),lead:LEAD};
}
if(typeof module!=="undefined"&&module.exports)module.exports={build};else root.SCHED={build};
})(typeof window!=="undefined"?window:globalThis);

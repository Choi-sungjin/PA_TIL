/* plan.js - 맵/벽/좌표/경로 탐색. ref/dice_robot_reference.html 의 좌표·로직을 그대로 가져와 UMD 로 묶음.
   (같은 프로젝트 자산 재사용. 수치 변경 없음) */
(function(root){
"use strict";
const MAP={W:4464,H:6364};
const START={x:734,y:950};
const LIGHT={x:80,y:950};
const BARCODE={x:80,y:650};
const BOXES=[[1468,950],[3670,3152],[2936,5354],[734,5354],[2202,5354],[3670,3886]].map(([x,y],i)=>({i,x,y}));
const LOCS=[{k:"L1",tag:12,x:3670,y:950,face:[1,0]},{k:"L2",tag:13,x:2202,y:3700,face:[0,-1]},{k:"L3",tag:14,x:3670,y:5354,face:[0,1]}];
const PLATFORM={x0:1792,y0:3090,x1:2612,y1:3910};
const ZONE={x0:430,y0:652,x1:1031,y1:1252};
const WALLS=[
  [1096,4983,1096,5718],[1832,4983,2569,4983],[2569,4983,2569,5718],[3305,4983,3305,5718],
  [359,4249,1096,4249],[1096,3520,1096,4249],
  [3305,4249,4041,4249],[3305,3520,4041,3520],[3305,2051,3305,3520],
  [1096,2051,1096,2786],[1096,2051,1832,2051],[1832,1316,1832,2051],[1096,1316,1832,1316],[1096,670,1096,1316],
  [2569,2051,3305,2051],[2569,1316,4041,1316]
];
const FACES={1:[[0,0]],2:[[-60,60],[60,-60]],3:[[-60,60],[0,0],[60,-60]],4:[[-60,60],[60,60],[-60,-60],[60,-60]],
  5:[[-60,60],[60,60],[0,0],[-60,-60],[60,-60]],6:[[-60,60],[-60,0],[-60,-60],[60,60],[60,0],[60,-60]]};
const BARCODES={"P2-01":"asc","P2-02":"desc","P2-03":"asc","P2-04":"desc"};
const CN={R:"빨강",Y:"노랑",G:"초록","?":"불명"};
const SN={cyl:"원기둥",cube:"직육면체"};

/* ---------- robot (base_link at axle centre, +x forward; from the CAD drawing) ---------- */
const FOOT={xb:-250,xf:204,hw:153};
const SHOULDER={x:151,y:20};
const CAR={x:-28,y:0,r:122.5,pr:100};
const POCKET_FRONT={x:CAR.x+CAR.pr,y:0};
const CAM={x:-116,h:598,pitch:30,hfov:69,vfov:42};
const V=120, OMEGA=0.6, ROT_R=293, CLR=175, GAP=55;

/* ---------- utils ---------- */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,u)=>a+(b-a)*u;
const ease=u=>u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
const angN=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a};
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shuffle(arr,r){for(let i=arr.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}
const fmt=t=>{const m=Math.floor(t/60),s=t-m*60;return m+":"+(s<10?"0":"")+s.toFixed(1)};
const fmt0=t=>{const m=Math.floor(t/60),s=Math.round(t-m*60);return m+":"+(s<10?"0":"")+s};
const toMap=(p,q)=>({x:p.x+q.x*Math.cos(p.h)-q.y*Math.sin(p.h),y:p.y+q.x*Math.sin(p.h)+q.y*Math.cos(p.h)});
const toRobot=(p,q)=>{const dx=q.x-p.x,dy=q.y-p.y;return{x:dx*Math.cos(p.h)+dy*Math.sin(p.h),y:-dx*Math.sin(p.h)+dy*Math.cos(p.h)}};

/* ---------- clearance grid + planner ---------- */
const RES=50, GW=Math.ceil(MAP.W/RES), GH=Math.ceil(MAP.H/RES);
function segDist(px,py,x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1,L=dx*dx+dy*dy;let u=L?((px-x1)*dx+(py-y1)*dy)/L:0;u=clamp(u,0,1);return Math.hypot(px-x1-u*dx,py-y1-u*dy)}
const rectDist=(px,py,o)=>Math.hypot(Math.max(o.x0-px,0,px-o.x1),Math.max(o.y0-py,0,py-o.y1));
const OBST=[...BOXES.map(b=>({x0:b.x-102.5,y0:b.y-102.5,x1:b.x+102.5,y1:b.y+102.5})),
  ...LOCS.filter(l=>l.k!=="L2").map(l=>({x0:l.x-102.5,y0:l.y-102.5,x1:l.x+102.5,y1:l.y+102.5})),PLATFORM,
  {x0:20,y0:880,x1:140,y1:1020},{x0:20,y0:600,x1:140,y1:700}];
function clearAt(x,y){
  let d=Math.min(x,y,MAP.W-x,MAP.H-y);
  for(const w of WALLS)d=Math.min(d,segDist(x,y,...w)-15);
  for(const o of OBST)d=Math.min(d,rectDist(x,y,o));
  return d;
}
const clear=new Float32Array(GW*GH),occ=new Uint8Array(GW*GH);
for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const c=clearAt((i+.5)*RES,(j+.5)*RES);clear[j*GW+i]=c;occ[j*GW+i]=c<CLR?1:0}
const cellOf=(x,y)=>clamp(Math.floor(y/RES),0,GH-1)*GW+clamp(Math.floor(x/RES),0,GW-1);
const cellPt=c=>({x:(c%GW+.5)*RES,y:(Math.floor(c/GW)+.5)*RES});
const freeAt=(x,y)=>x>0&&y>0&&x<MAP.W&&y<MAP.H&&!occ[cellOf(x,y)];
function dijkstra(src){
  const N=GW*GH,dist=new Float64Array(N).fill(Infinity),prev=new Int32Array(N).fill(-1);
  const hk=[],hv=[];
  const push=(k,v)=>{hk.push(k);hv.push(v);let i=hk.length-1;while(i>0){const p=(i-1)>>1;if(hk[p]<=hk[i])break;[hk[p],hk[i]]=[hk[i],hk[p]];[hv[p],hv[i]]=[hv[i],hv[p]];i=p}};
  const pop=()=>{const v=hv[0],k=hk[0],lk=hk.pop(),lv=hv.pop();if(hk.length){hk[0]=lk;hv[0]=lv;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<hk.length&&hk[l]<hk[m])m=l;if(r<hk.length&&hk[r]<hk[m])m=r;if(m===i)break;[hk[m],hk[i]]=[hk[i],hk[m]];[hv[m],hv[i]]=[hv[i],hv[m]];i=m}}return[k,v]};
  dist[src]=0;push(0,src);
  const D8=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,Math.SQRT2],[1,-1,Math.SQRT2],[-1,1,Math.SQRT2],[-1,-1,Math.SQRT2]];
  while(hk.length){
    const[d,c]=pop();if(d>dist[c])continue;
    const ci=c%GW,cj=(c-ci)/GW;
    for(const[di,dj,w]of D8){
      const ni=ci+di,nj=cj+dj;if(ni<0||nj<0||ni>=GW||nj>=GH)continue;
      const n=nj*GW+ni;if(occ[n])continue;
      if(di&&dj&&(occ[cj*GW+ni]||occ[nj*GW+ci]))continue;
      const pen=1+1.5*Math.max(0,(ROT_R+60-clear[n])/(ROT_R+60));
      const nd=d+w*RES*pen;if(nd<dist[n]){dist[n]=nd;prev[n]=c;push(nd,n)}
    }
  }
  return{dist,prev};
}
function los(a,b){const L=Math.hypot(b.x-a.x,b.y-a.y),n=Math.max(1,Math.ceil(L/20));for(let k=1;k<n;k++){if(!freeAt(a.x+(b.x-a.x)*k/n,a.y+(b.y-a.y)*k/n))return false}return true}

const KEYS={};
const fromStart=dijkstra(cellOf(START.x,START.y));
KEYS.S={cell:cellOf(START.x,START.y),pt:{...START},h:Math.PI};
function approach(c,half,dirs){
  let best=null;
  for(const[ux,uy]of dirs){
    const d=FOOT.xf+GAP+half,p={x:c.x-ux*d,y:c.y-uy*d},cl=clearAt(p.x,p.y);
    if(cl<CLR)continue;const cell=cellOf(p.x,p.y);if(occ[cell]||!isFinite(fromStart.dist[cell]))continue;
    const cost=fromStart.dist[cell];if(!best||cost<best.cost)best={cost,cell,pt:p,h:Math.atan2(uy,ux)};
  }
  return best;
}
const ALL4=[[1,0],[-1,0],[0,1],[0,-1]];
BOXES.forEach(b=>{KEYS["B"+b.i]=approach(b,102.5,ALL4)});
LOCS.forEach((l,i)=>{KEYS["L"+i]=approach(l,l.k==="L2"?PLATFORM.y1-l.y:102.5,[l.face])});
const TREES={};
const tree=k=>TREES[k]||(TREES[k]=k==="S"?fromStart:dijkstra(KEYS[k].cell));
const D=(a,b)=>tree(a).dist[KEYS[b].cell];
/* one loading tour + one delivery tour: brute force over 6! box orders × 3! location orders */
function perms(a){if(a.length<2)return[a];return a.flatMap((x,i)=>perms([...a.slice(0,i),...a.slice(i+1)]).map(p=>[x,...p]))}
let ROUTE=null;
function bestRoute(){
  if(ROUTE)return ROUTE;
  const locP=perms([0,1,2]);let best=null;
  for(const bp of perms([0,1,2,3,4,5])){
    let d=D("S","B"+bp[0]);for(let i=1;i<6;i++)d+=D("B"+bp[i-1],"B"+bp[i]);
    if(best&&d>=best.d)continue;
    for(const lp of locP){const e=d+D("B"+bp[5],"L"+lp[0])+D("L"+lp[0],"L"+lp[1])+D("L"+lp[1],"L"+lp[2]);if(!best||e<best.d)best={d:e,boxes:bp,locs:lp}}
  }
  return ROUTE=best;
}
const PATHS={};
function pathBetween(a,b){
  const id=a+">"+b;if(PATHS[id])return PATHS[id];
  const{prev}=tree(a);const cells=[];let c=KEYS[b].cell;
  while(c!==-1){cells.push(c);if(c===KEYS[a].cell)break;c=prev[c]}
  cells.reverse();
  const raw=cells.map(cellPt);raw[0]={...KEYS[a].pt};raw[raw.length-1]={...KEYS[b].pt};
  const out=[raw[0]];let i=0;
  while(i<raw.length-1){let j=raw.length-1;while(j>i+1&&!los(raw[i],raw[j]))j--;out.push(raw[j]);i=j}
  return PATHS[id]=out;
}

const API={MAP,START,LIGHT,BARCODE,BOXES,LOCS,PLATFORM,ZONE,WALLS,FACES,FOOT,SHOULDER,CAR,POCKET_FRONT,CAM,
  clamp,lerp,ease,angN,toMap,toRobot,KEYS,D,pathBetween,bestRoute,clearAt,perms,dijkstra,fromStart,occ,GW,GH,RES,tree};
if(typeof module!=="undefined"&&module.exports)module.exports=API;else root.PLAN=API;
})(typeof window!=="undefined"?window:globalThis);

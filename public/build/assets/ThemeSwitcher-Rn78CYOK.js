import{r as d,j as o,$ as y,b,a as v}from"./app-woOK0Q71.js";import{c as f,B as j}from"./button-bjwtLhRq.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),x=(...e)=>e.filter((t,r,s)=>!!t&&t.trim()!==""&&s.indexOf(t)===r).join(" ").trim();/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var N={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $=d.forwardRef(({color:e="currentColor",size:t=24,strokeWidth:r=2,absoluteStrokeWidth:s,className:a="",children:n,iconNode:c,...l},m)=>d.createElement("svg",{ref:m,...N,width:t,height:t,stroke:e,strokeWidth:s?Number(r)*24/Number(t):r,className:x("lucide",a),...l},[...c.map(([p,i])=>d.createElement(p,i)),...Array.isArray(n)?n:[n]]));/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=(e,t)=>{const r=d.forwardRef(({className:s,...a},n)=>d.createElement($,{ref:n,iconNode:t,className:x(`lucide-${M(e)}`,s),...a}));return r.displayName=`${e}`,r};/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=[["path",{d:"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",key:"a7tn18"}]],S=w("Moon",L);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T=[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]],E=w("Sun",T);function P({url:e="/",size:t="size-10",isTitle:r=!0,className:s}){return o.jsxs(y,{href:e,className:f("group flex items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-destructive",s),children:[o.jsx("img",{src:"/icon.png",alt:"SISUPIT",className:f("rounded-lg object-contain transition-transform",t)}),r&&o.jsxs("div",{className:"flex flex-col justify-center",children:[o.jsx("span",{className:"text-xl font-bold leading-none tracking-tight text-foreground",children:"SISUPIT"}),o.jsx("span",{className:"mt-1 text-[11px] font-bold uppercase tracking-wide text-destructive",children:"Sistem Untuk Pelaporan Dini Terintegrasi"})]})]})}const A=500;function B(){const{theme:e,setTheme:t}=b(),r=e==="dark"||e==="system"&&typeof window<"u"&&window.matchMedia("(prefers-color-scheme: dark)").matches,s=a=>{const n=document.documentElement,c=n.classList.contains("dark")?"light":"dark",l=()=>{v.flushSync(()=>t(c)),n.classList.remove("light","dark"),n.classList.add(c),localStorage.setItem("theme",c)};n.classList.add("theme-switching");const m=()=>n.classList.remove("theme-switching"),p=window.matchMedia("(prefers-reduced-motion: reduce)").matches;if(!document.startViewTransition||p){l(),requestAnimationFrame(()=>requestAnimationFrame(m));return}const i=a.currentTarget.getBoundingClientRect(),h=i.left+i.width/2,u=i.top+i.height/2,k=Math.hypot(Math.max(h,window.innerWidth-h),Math.max(u,window.innerHeight-u)),g=document.startViewTransition(l);g.ready.then(()=>{n.animate({clipPath:[`circle(0px at ${h}px ${u}px)`,`circle(${k}px at ${h}px ${u}px)`]},{duration:A,easing:"cubic-bezier(0.2, 0, 0, 1)",pseudoElement:"::view-transition-new(root)"})}).catch(()=>{}),g.finished.finally(m)};return o.jsx(j,{variant:"outline",size:"icon",onClick:s,"aria-label":"Ganti tema",className:"h-10 w-10 shrink-0 rounded-full border-border bg-card text-muted-foreground shadow-sm outline-none transition-all hover:bg-warning/10 hover:text-warning focus-visible:ring-2 focus-visible:ring-warning",children:r?o.jsx(E,{className:"h-5 w-5 transition-transform"}):o.jsx(S,{className:"h-5 w-5 transition-transform"})})}export{P as A,B as T,w as c};

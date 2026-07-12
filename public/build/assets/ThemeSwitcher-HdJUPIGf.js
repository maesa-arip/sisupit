import{r as a,j as n,$ as f,u as x}from"./app-CBAmMq4y.js";import{a as c,B as k}from"./button-i0SuoWzN.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=t=>t.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),l=(...t)=>t.filter((e,r,o)=>!!e&&e.trim()!==""&&o.indexOf(e)===r).join(" ").trim();/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var w={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=a.forwardRef(({color:t="currentColor",size:e=24,strokeWidth:r=2,absoluteStrokeWidth:o,className:i="",children:s,iconNode:m,...u},h)=>a.createElement("svg",{ref:h,...w,width:e,height:e,stroke:t,strokeWidth:o?Number(r)*24/Number(e):r,className:l("lucide",i),...u},[...m.map(([g,p])=>a.createElement(g,p)),...Array.isArray(s)?s:[s]]));/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=(t,e)=>{const r=a.forwardRef(({className:o,...i},s)=>a.createElement(b,{ref:s,iconNode:e,className:l(`lucide-${v(t)}`,o),...i}));return r.displayName=`${t}`,r};/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=[["path",{d:"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",key:"a7tn18"}]],y=d("Moon",j);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]],S=d("Sun",N);function C({url:t="/",size:e="size-10",isTitle:r=!0,className:o}){return n.jsxs(f,{href:t,className:c("group flex items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-destructive",o),children:[n.jsx("img",{src:"/icon.png",alt:"SISUPIT",className:c("rounded-lg object-contain transition-transform group-hover:scale-105",e)}),r&&n.jsxs("div",{className:"flex flex-col justify-center",children:[n.jsx("span",{className:"text-xl font-bold leading-none tracking-tight text-foreground",children:"SISUPIT"}),n.jsx("span",{className:"mt-1 text-[10px] font-bold uppercase tracking-widest text-destructive",children:"Sistem Untuk Pelaporan Dini Terintegrasi"})]})]})}function E(){const{theme:t,setTheme:e}=x(),r=()=>{t==="dark"?(e("light"),document.documentElement.classList.remove("dark"),localStorage.setItem("theme","light")):(e("dark"),document.documentElement.classList.add("dark"),localStorage.setItem("theme","dark"))};return n.jsx(k,{variant:"outline",size:"icon",onClick:r,"aria-label":"Toggle Theme",className:"h-10 w-10 shrink-0 rounded-full border-border bg-card text-muted-foreground shadow-sm outline-none transition-all hover:bg-warning/10 hover:text-warning focus-visible:ring-2 focus-visible:ring-warning",children:t==="dark"?n.jsx(S,{className:"h-5 w-5 transition-transform hover:rotate-90"}):n.jsx(y,{className:"h-5 w-5 transition-transform hover:-rotate-12"})})}export{C as A,E as T,d as c};

import{r as s,j as o,$ as f,u as k}from"./app-DEiNme5G.js";import{a as c,B as x}from"./button-Gj_2UF8V.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=t=>t.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),l=(...t)=>t.filter((e,r,n)=>!!e&&e.trim()!==""&&n.indexOf(e)===r).join(" ").trim();/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var v={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=s.forwardRef(({color:t="currentColor",size:e=24,strokeWidth:r=2,absoluteStrokeWidth:n,className:i="",children:a,iconNode:m,...u},h)=>s.createElement("svg",{ref:h,...v,width:e,height:e,stroke:t,strokeWidth:n?Number(r)*24/Number(e):r,className:l("lucide",i),...u},[...m.map(([g,p])=>s.createElement(g,p)),...Array.isArray(a)?a:[a]]));/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=(t,e)=>{const r=s.forwardRef(({className:n,...i},a)=>s.createElement(w,{ref:a,iconNode:e,className:l(`lucide-${b(t)}`,n),...i}));return r.displayName=`${t}`,r};/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=[["path",{d:"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",key:"a7tn18"}]],y=d("Moon",j);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]],S=d("Sun",N);function C({url:t="/",size:e="size-10",isTitle:r=!0,className:n}){return o.jsxs(f,{href:t,className:c("flex items-center gap-3 outline-none group focus-visible:ring-2 focus-visible:ring-red-700 rounded-md",n),children:[o.jsx("img",{src:"/icon.png",alt:"SISUPIT",className:c("rounded-lg object-contain transition-transform group-hover:scale-105",e)}),r&&o.jsxs("div",{className:"flex flex-col justify-center",children:[o.jsx("span",{className:"text-xl font-bold leading-none tracking-tight text-foreground",children:"SISUPIT"}),o.jsx("span",{className:"text-[10px] font-bold text-destructive uppercase tracking-widest mt-1",children:"Sistem Untuk Pelaporan Dini Terintegrasi"})]})]})}function E(){const{theme:t,setTheme:e}=k(),r=()=>{t==="dark"?(e("light"),document.documentElement.classList.remove("dark"),localStorage.setItem("theme","light")):(e("dark"),document.documentElement.classList.add("dark"),localStorage.setItem("theme","dark"))};return o.jsx(x,{variant:"outline",size:"icon",onClick:r,"aria-label":"Toggle Theme",className:"w-10 h-10 text-muted-foreground transition-all bg-card border-border rounded-full shadow-sm outline-none hover:text-amber-500 dark:hover:text-warning hover:bg-amber-50 dark:hover:bg-warning/10 focus-visible:ring-2 focus-visible:ring-amber-500 dark:focus-visible:ring-warning shrink-0",children:t==="dark"?o.jsx(S,{className:"w-5 h-5 transition-transform hover:rotate-90"}):o.jsx(y,{className:"w-5 h-5 transition-transform hover:-rotate-12"})})}export{C as A,E as T,d as c};

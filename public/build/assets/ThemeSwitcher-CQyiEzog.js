import{r as s,j as o,$ as f,u as k}from"./app-BPFPJ80B.js";import{a as c,B as x}from"./button-sjdO2JzR.js";import{c as v}from"./createReactComponent-DWjzNqnQ.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=t=>t.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),l=(...t)=>t.filter((e,r,n)=>!!e&&e.trim()!==""&&n.indexOf(e)===r).join(" ").trim();/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var w={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=s.forwardRef(({color:t="currentColor",size:e=24,strokeWidth:r=2,absoluteStrokeWidth:n,className:i="",children:a,iconNode:m,...h},u)=>s.createElement("svg",{ref:u,...w,width:e,height:e,stroke:t,strokeWidth:n?Number(r)*24/Number(e):r,className:l("lucide",i),...h},[...m.map(([g,p])=>s.createElement(g,p)),...Array.isArray(a)?a:[a]]));/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=(t,e)=>{const r=s.forwardRef(({className:n,...i},a)=>s.createElement(y,{ref:a,iconNode:e,className:l(`lucide-${b(t)}`,n),...i}));return r.displayName=`${t}`,r};/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=[["path",{d:"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",key:"a7tn18"}]],N=d("Moon",j);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const I=[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]],S=d("Sun",I);/**
 * @license @tabler/icons-react v3.30.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var M=v("outline","inner-shadow-bottom-right","IconInnerShadowBottomRight",[["path",{d:"M12 21a9 9 0 1 1 0 -18a9 9 0 0 1 0 18z",key:"svg-0"}],["path",{d:"M18 12a6 6 0 0 1 -6 6",key:"svg-1"}]]);function L({url:t="/",size:e="size-7",isTitle:r=!0,className:n}){return o.jsxs(f,{href:t,className:c("flex items-center gap-3 outline-none group focus-visible:ring-2 focus-visible:ring-red-700 rounded-md",n),children:[o.jsx("div",{className:"flex items-center justify-center p-2 transition-colors rounded-lg bg-red-700 group-hover:bg-red-800",children:o.jsx(M,{className:c("text-white",e),stroke:2})}),r&&o.jsxs("div",{className:"flex flex-col justify-center",children:[o.jsx("span",{className:"text-xl font-bold leading-none tracking-tight text-foreground",children:"SISUPIT"}),o.jsx("span",{className:"text-[10px] font-bold text-destructive uppercase tracking-widest mt-1",children:"Sistem Untuk Pelaporan Dini Terintegrasi"})]})]})}function $(){const{theme:t,setTheme:e}=k(),r=()=>{t==="dark"?(e("light"),document.documentElement.classList.remove("dark"),localStorage.setItem("theme","light")):(e("dark"),document.documentElement.classList.add("dark"),localStorage.setItem("theme","dark"))};return o.jsx(x,{variant:"outline",size:"icon",onClick:r,"aria-label":"Toggle Theme",className:"w-10 h-10 text-muted-foreground transition-all bg-card border-border rounded-full shadow-sm outline-none hover:text-amber-500 dark:hover:text-warning hover:bg-amber-50 dark:hover:bg-warning/10 focus-visible:ring-2 focus-visible:ring-amber-500 dark:focus-visible:ring-warning shrink-0",children:t==="dark"?o.jsx(S,{className:"w-5 h-5 transition-transform hover:rotate-90"}):o.jsx(N,{className:"w-5 h-5 transition-transform hover:-rotate-12"})})}export{L as A,$ as T,d as c};

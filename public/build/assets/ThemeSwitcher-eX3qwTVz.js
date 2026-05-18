import{r as n,j as a,$ as k,u as x}from"./app-DkYKBZ1Y.js";import{a as c,B as f}from"./button-C9CWTpl5.js";import{c as b}from"./createReactComponent-CyIWxXB-.js";/**
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
 */const y=n.forwardRef(({color:t="currentColor",size:e=24,strokeWidth:r=2,absoluteStrokeWidth:o,className:i="",children:s,iconNode:m,...h},u)=>n.createElement("svg",{ref:u,...w,width:e,height:e,stroke:t,strokeWidth:o?Number(r)*24/Number(e):r,className:l("lucide",i),...h},[...m.map(([g,p])=>n.createElement(g,p)),...Array.isArray(s)?s:[s]]));/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=(t,e)=>{const r=n.forwardRef(({className:o,...i},s)=>n.createElement(y,{ref:s,iconNode:e,className:l(`lucide-${v(t)}`,o),...i}));return r.displayName=`${t}`,r};/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=[["path",{d:"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",key:"a7tn18"}]],N=d("Moon",j);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M=[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]],S=d("Sun",M);/**
 * @license @tabler/icons-react v3.30.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var C=b("outline","inner-shadow-bottom-right","IconInnerShadowBottomRight",[["path",{d:"M12 21a9 9 0 1 1 0 -18a9 9 0 0 1 0 18z",key:"svg-0"}],["path",{d:"M18 12a6 6 0 0 1 -6 6",key:"svg-1"}]]);function T({url:t="/",size:e="size-7",isTitle:r=!0,className:o}){return a.jsxs(k,{href:t,className:c("flex items-center gap-3 outline-none group focus-visible:ring-2 focus-visible:ring-[#b42826] rounded-md",o),children:[a.jsx("div",{className:"flex items-center justify-center p-2 transition-colors rounded-lg bg-[#b42826] group-hover:bg-[#9a2220]",children:a.jsx(C,{className:c("text-white",e),stroke:2})}),r&&a.jsxs("div",{className:"flex flex-col justify-center",children:[a.jsx("span",{className:"text-xl font-bold leading-none tracking-tight text-gray-900 dark:text-gray-100",children:"Sisupit"}),a.jsx("span",{className:"text-[10px] font-bold text-[#b42826] dark:text-[#e54845] uppercase tracking-widest mt-1",children:"Pahlawan Sekitar"})]})]})}function $(){const{theme:t,setTheme:e}=x(),r=()=>{t==="dark"?(e("light"),document.documentElement.classList.remove("dark"),localStorage.setItem("theme","light")):(e("dark"),document.documentElement.classList.add("dark"),localStorage.setItem("theme","dark"))};return a.jsx(f,{variant:"outline",size:"icon",onClick:r,"aria-label":"Toggle Theme",className:"w-10 h-10 text-gray-500 transition-all bg-white border-gray-200 rounded-full shadow-sm outline-none dark:border-slate-700 dark:bg-slate-800 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-amber-500 shrink-0",children:t==="dark"?a.jsx(S,{className:"w-5 h-5 transition-transform hover:rotate-90"}):a.jsx(N,{className:"w-5 h-5 transition-transform hover:-rotate-12"})})}export{T as A,$ as T,d as c};

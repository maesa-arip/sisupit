import{c as v}from"./createReactComponent-B_B_vhcf.js";import{r as d,j as a,$ as y,b,a as j}from"./app-DOXPJy-o.js";import{c as f,B as M}from"./button-BbGc_WPu.js";/**
 * @license @tabler/icons-react v3.30.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var B=v("outline","loader-2","IconLoader2",[["path",{d:"M12 3a9 9 0 1 0 9 9",key:"svg-0"}]]);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),x=(...e)=>e.filter((t,o,r)=>!!t&&t.trim()!==""&&r.indexOf(t)===o).join(" ").trim();/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var N={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $=d.forwardRef(({color:e="currentColor",size:t=24,strokeWidth:o=2,absoluteStrokeWidth:r,className:i="",children:n,iconNode:c,...l},m)=>d.createElement("svg",{ref:m,...N,width:t,height:t,stroke:e,strokeWidth:r?Number(o)*24/Number(t):o,className:x("lucide",i),...l},[...c.map(([p,s])=>d.createElement(p,s)),...Array.isArray(n)?n:[n]]));/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=(e,t)=>{const o=d.forwardRef(({className:r,...i},n)=>d.createElement($,{ref:n,iconNode:t,className:x(`lucide-${L(e)}`,r),...i}));return o.displayName=`${e}`,o};/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const I=[["path",{d:"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",key:"a7tn18"}]],S=w("Moon",I);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T=[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]],C=w("Sun",T);function _({url:e="/",size:t="size-10",isTitle:o=!0,className:r}){return a.jsxs(y,{href:e,className:f("group flex items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-destructive",r),children:[a.jsx("img",{src:"/icon.png",alt:"SISUPIT",className:f("rounded-lg object-contain transition-transform group-hover:scale-105",t)}),o&&a.jsxs("div",{className:"flex flex-col justify-center",children:[a.jsx("span",{className:"text-xl font-bold leading-none tracking-tight text-foreground",children:"SISUPIT"}),a.jsx("span",{className:"mt-1 text-[11px] font-bold uppercase tracking-wide text-destructive",children:"Sistem Untuk Pelaporan Dini Terintegrasi"})]})]})}const E=500;function z(){const{theme:e,setTheme:t}=b(),o=e==="dark"||e==="system"&&typeof window<"u"&&window.matchMedia("(prefers-color-scheme: dark)").matches,r=i=>{const n=document.documentElement,c=n.classList.contains("dark")?"light":"dark",l=()=>{j.flushSync(()=>t(c)),n.classList.remove("light","dark"),n.classList.add(c),localStorage.setItem("theme",c)};n.classList.add("theme-switching");const m=()=>n.classList.remove("theme-switching"),p=window.matchMedia("(prefers-reduced-motion: reduce)").matches;if(!document.startViewTransition||p){l(),requestAnimationFrame(()=>requestAnimationFrame(m));return}const s=i.currentTarget.getBoundingClientRect(),h=s.left+s.width/2,u=s.top+s.height/2,k=Math.hypot(Math.max(h,window.innerWidth-h),Math.max(u,window.innerHeight-u)),g=document.startViewTransition(l);g.ready.then(()=>{n.animate({clipPath:[`circle(0px at ${h}px ${u}px)`,`circle(${k}px at ${h}px ${u}px)`]},{duration:E,easing:"cubic-bezier(0.2, 0, 0, 1)",pseudoElement:"::view-transition-new(root)"})}).catch(()=>{}),g.finished.finally(m)};return a.jsx(M,{variant:"outline",size:"icon",onClick:r,"aria-label":"Ganti tema",className:"h-10 w-10 shrink-0 rounded-full border-border bg-card text-muted-foreground shadow-sm outline-none transition-all hover:bg-warning/10 hover:text-warning focus-visible:ring-2 focus-visible:ring-warning",children:o?a.jsx(C,{className:"h-5 w-5 transition-transform hover:rotate-90"}):a.jsx(S,{className:"h-5 w-5 transition-transform hover:-rotate-12"})})}export{_ as A,B as I,z as T,w as c};

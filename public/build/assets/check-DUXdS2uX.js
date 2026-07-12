import{r as d}from"./app-Ch3pf-05.js";import{c as n}from"./ThemeSwitcher-B2CtFEGu.js";var u=globalThis!=null&&globalThis.document?d.useLayoutEffect:()=>{};function S(r){const[h,e]=d.useState(void 0);return u(()=>{if(r){e({width:r.offsetWidth,height:r.offsetHeight});const c=new ResizeObserver(o=>{if(!Array.isArray(o)||!o.length)return;const f=o[0];let t,i;if("borderBoxSize"in f){const s=f.borderBoxSize,a=Array.isArray(s)?s[0]:s;t=a.inlineSize,i=a.blockSize}else t=r.offsetWidth,i=r.offsetHeight;e({width:t,height:i})});return c.observe(r,{box:"border-box"}),()=>c.unobserve(r)}else e(void 0)},[r]),h}/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]],g=n("Check",b);export{g as C,S as u};

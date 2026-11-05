import{c as u}from"./createReactComponent-BvyqDszj.js";import{r as h}from"./app-DsX5oGII.js";/**
 * @license @tabler/icons-react v3.30.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var v=u("outline","check","IconCheck",[["path",{d:"M5 12l5 5l10 -10",key:"svg-0"}]]),b=globalThis!=null&&globalThis.document?h.useLayoutEffect:()=>{};function y(r){const[n,e]=h.useState(void 0);return b(()=>{if(r){e({width:r.offsetWidth,height:r.offsetHeight});const c=new ResizeObserver(o=>{if(!Array.isArray(o)||!o.length)return;const f=o[0];let t,i;if("borderBoxSize"in f){const s=f.borderBoxSize,a=Array.isArray(s)?s[0]:s;t=a.inlineSize,i=a.blockSize}else t=r.offsetWidth,i=r.offsetHeight;e({width:t,height:i})});return c.observe(r,{box:"border-box"}),()=>c.unobserve(r)}else e(void 0)},[r]),n}export{v as I,y as u};

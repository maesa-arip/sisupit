import{j as a}from"./app-BaMEIBdu.js";import{c as l}from"./button-BxHknzN4.js";import{c as m}from"./createReactComponent-5LtBv0o2.js";/**
 * @license @tabler/icons-react v3.30.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var s=m("outline","star","IconStar",[["path",{d:"M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z",key:"svg-0"}]]);/**
 * @license @tabler/icons-react v3.30.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var c=m("filled","star-filled","IconStarFilled",[["path",{d:"M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z",key:"svg-0"}]]);const d=["Sangat buruk","Buruk","Cukup","Bagus","Sangat membantu"],f=t=>d[t-1]??"";function b({value:t=0,onChange:r,size:o="md",className:i}){const u=typeof r=="function",n=o==="lg"?"h-9 w-9":o==="sm"?"h-4 w-4":"h-6 w-6";return u?a.jsx("div",{role:"radiogroup","aria-label":"Jumlah bintang",className:l("flex items-center gap-1",i),children:[1,2,3,4,5].map(e=>a.jsx("button",{type:"button",role:"radio","aria-checked":t===e,"aria-label":`${e} bintang - ${f(e)}`,onClick:()=>r(e),className:"flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-90 motion-reduce:active:scale-100",children:e<=t?a.jsx(c,{className:l(n,"text-foreground")}):a.jsx(s,{className:l(n,"text-muted-foreground/50"),stroke:1.5})},e))}):a.jsx("span",{className:l("inline-flex items-center gap-0.5",i),"aria-label":`${t} dari 5 bintang`,children:[1,2,3,4,5].map(e=>e<=t?a.jsx(c,{className:l(n,"text-foreground")},e):a.jsx(s,{className:l(n,"text-muted-foreground/40"),stroke:1.5},e))})}export{b as S};

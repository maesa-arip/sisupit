import{j as e}from"./app-BZ86thDx.js";import{c as l}from"./button-DkdxHSqx.js";import{c as m}from"./createReactComponent-DPVfSh3e.js";/**
 * @license @tabler/icons-react v3.30.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var s=m("outline","star","IconStar",[["path",{d:"M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z",key:"svg-0"}]]);/**
 * @license @tabler/icons-react v3.30.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var c=m("filled","star-filled","IconStarFilled",[["path",{d:"M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z",key:"svg-0"}]]);const d=["Sangat buruk","Buruk","Cukup","Bagus","Sangat membantu"],f=t=>d[t-1]??"";function b({value:t=0,onChange:r,size:i="md",className:o}){const u=typeof r=="function",n=i==="lg"?"h-9 w-9":i==="sm"?"h-4 w-4":"h-6 w-6";return u?e.jsx("div",{role:"radiogroup","aria-label":"Jumlah bintang",className:l("flex items-center gap-1",o),children:[1,2,3,4,5].map(a=>e.jsx("button",{type:"button",role:"radio","aria-checked":t===a,"aria-label":`${a} bintang - ${f(a)}`,onClick:()=>r(a),className:"flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-90 motion-reduce:active:scale-100",children:a<=t?e.jsx(c,{className:l(n,"text-warning")}):e.jsx(s,{className:l(n,"text-muted-foreground/50"),stroke:1.5})},a))}):e.jsx("span",{className:l("inline-flex items-center gap-0.5",o),"aria-label":`${t} dari 5 bintang`,children:[1,2,3,4,5].map(a=>a<=t?e.jsx(c,{className:l(n,"text-warning")},a):e.jsx(s,{className:l(n,"text-muted-foreground/40"),stroke:1.5},a))})}export{b as S};

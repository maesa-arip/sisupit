import{r as u,j as v}from"./app-COKEQNPH.js";function R(e,t){const o=u.createContext(t),r=s=>{const{children:c,...i}=s,a=u.useMemo(()=>i,Object.values(i));return v.jsx(o.Provider,{value:a,children:c})};r.displayName=e+"Provider";function n(s){const c=u.useContext(o);if(c)return c;if(t!==void 0)return t;throw new Error(`\`${s}\` must be used within \`${e}\``)}return[r,n]}function B(e,t=[]){let o=[];function r(s,c){const i=u.createContext(c),a=o.length;o=[...o,c];const f=d=>{var S;const{scope:l,children:C,...x}=d,b=((S=l==null?void 0:l[e])==null?void 0:S[a])||i,p=u.useMemo(()=>x,Object.values(x));return v.jsx(b.Provider,{value:p,children:C})};f.displayName=s+"Provider";function h(d,l){var b;const C=((b=l==null?void 0:l[e])==null?void 0:b[a])||i,x=u.useContext(C);if(x)return x;if(c!==void 0)return c;throw new Error(`\`${d}\` must be used within \`${s}\``)}return[f,h]}const n=()=>{const s=o.map(c=>u.createContext(c));return function(i){const a=(i==null?void 0:i[e])||s;return u.useMemo(()=>({[`__scope${e}`]:{...i,[e]:a}}),[i,a])}};return n.scopeName=e,[r,y(n,...t)]}function y(...e){const t=e[0];if(e.length===1)return t;const o=()=>{const r=e.map(n=>({useScope:n(),scopeName:n.scopeName}));return function(s){const c=r.reduce((i,{useScope:a,scopeName:f})=>{const d=a(s)[`__scope${f}`];return{...i,...d}},{});return u.useMemo(()=>({[`__scope${t.scopeName}`]:c}),[c])}};return o.scopeName=t.scopeName,o}function E(e,t,{checkForDefaultPrevented:o=!0}={}){return function(n){if(e==null||e(n),o===!1||!n.defaultPrevented)return t==null?void 0:t(n)}}function m(e){const t=u.useRef(e);return u.useEffect(()=>{t.current=e}),u.useMemo(()=>(...o)=>{var r;return(r=t.current)==null?void 0:r.call(t,...o)},[])}function L({prop:e,defaultProp:t,onChange:o=()=>{}}){const[r,n]=g({defaultProp:t,onChange:o}),s=e!==void 0,c=s?e:r,i=m(o),a=u.useCallback(f=>{if(s){const d=typeof f=="function"?f(e):f;d!==e&&i(d)}else n(f)},[s,e,n,i]);return[c,a]}function g({defaultProp:e,onChange:t}){const o=u.useState(e),[r]=o,n=u.useRef(r),s=m(t);return u.useEffect(()=>{n.current!==r&&(s(r),n.current=r)},[r,n,s]),o}var P=globalThis!=null&&globalThis.document?u.useLayoutEffect:()=>{};function M(e){const[t,o]=u.useState(void 0);return P(()=>{if(e){o({width:e.offsetWidth,height:e.offsetHeight});const r=new ResizeObserver(n=>{if(!Array.isArray(n)||!n.length)return;const s=n[0];let c,i;if("borderBoxSize"in s){const a=s.borderBoxSize,f=Array.isArray(a)?a[0]:a;c=f.inlineSize,i=f.blockSize}else c=e.offsetWidth,i=e.offsetHeight;o({width:c,height:i})});return r.observe(e,{box:"border-box"}),()=>r.unobserve(e)}else o(void 0)},[e]),t}/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),w=(...e)=>e.filter((t,o,r)=>!!t&&t.trim()!==""&&r.indexOf(t)===o).join(" ").trim();/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var k={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=u.forwardRef(({color:e="currentColor",size:t=24,strokeWidth:o=2,absoluteStrokeWidth:r,className:n="",children:s,iconNode:c,...i},a)=>u.createElement("svg",{ref:a,...k,width:t,height:t,stroke:e,strokeWidth:r?Number(o)*24/Number(t):o,className:w("lucide",n),...i},[...c.map(([f,h])=>u.createElement(f,h)),...Array.isArray(s)?s:[s]]));/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=(e,t)=>{const o=u.forwardRef(({className:r,...n},s)=>u.createElement(z,{ref:s,iconNode:t,className:w(`lucide-${$(e)}`,r),...n}));return o.displayName=`${e}`,o};/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A=[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]],O=j("Check",A);export{O as C,B as a,E as b,j as c,M as d,P as e,m as f,R as g,L as u};

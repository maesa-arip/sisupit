import{r as h,j as e}from"./app-DzDqAb70.js";import{B as x,c as u}from"./button-DZgsSWLQ.js";import{P as j,a as C,b as v,C as f,c as g,d as b,e as k,f as y,g as w}from"./popover-DXlQpmHw.js";import{c as r}from"./createReactComponent-DZksHZox.js";/**
 * @license @tabler/icons-react v3.30.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var I=r("outline","check","IconCheck",[["path",{d:"M5 12l5 5l10 -10",key:"svg-0"}]]);/**
 * @license @tabler/icons-react v3.30.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var P=r("outline","selector","IconSelector",[["path",{d:"M8 9l4 -4l4 4",key:"svg-0"}],["path",{d:"M16 15l-4 4l-4 -4",key:"svg-1"}]]);function M({items:o,selectedItem:s,onSelect:c,placeholder:i="Pilih item..."}){var n;const[t,l]=h.useState(!1),m=a=>{c(a),l(!1)};return e.jsxs(j,{open:t,onOpenChange:l,children:[e.jsx(C,{asChild:!0,children:e.jsxs(x,{variant:"outline",role:"combobox","aria-expanded":t,className:"justify-between w-full",children:[((n=o.find(a=>a.label==s))==null?void 0:n.label)??"Pilih item",e.jsx(P,{className:"w-4 h-4 ml-2 opacity-50 shrink-0"})]})}),e.jsx(v,{className:"max-h-[--radix-popover-content-available-height] w-[--radix-popover-trigger-width] p-0",align:"start",children:e.jsxs(f,{children:[e.jsx(g,{placeholder:i,className:"my-2 h-9"}),e.jsxs(b,{children:[e.jsx(k,{children:"Item tidak ditemukan"}),e.jsx(y,{children:o.map((a,p)=>e.jsxs(w,{value:a.value,onSelect:d=>m(d),children:[a.label,e.jsx(I,{className:u("ml-auto h-4 w-4",s===a.label?"opacity-100":"opacity-0")})]},p))})]})]})})]})}export{M as C};

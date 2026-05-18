import{c as s}from"./createReactComponent-CyIWxXB-.js";import{r as v,j as a}from"./app-DkYKBZ1Y.js";import{B as g,a as p}from"./button-C9CWTpl5.js";import{P as y,a as x,b as k,C as u,c as C,d as f,e as M,f as j,g as w}from"./popover-BwO4NLZG.js";import{C as b}from"./chevron-down-DbC6fxTt.js";import{C as I}from"./check-BciC06jg.js";/**
 * @license @tabler/icons-react v3.30.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var B=s("outline","arrows-move","IconArrowsMove",[["path",{d:"M18 9l3 3l-3 3",key:"svg-0"}],["path",{d:"M15 12h6",key:"svg-1"}],["path",{d:"M6 9l-3 3l3 3",key:"svg-2"}],["path",{d:"M3 12h6",key:"svg-3"}],["path",{d:"M9 18l3 3l3 -3",key:"svg-4"}],["path",{d:"M12 15v6",key:"svg-5"}],["path",{d:"M15 6l-3 -3l-3 3",key:"svg-6"}],["path",{d:"M12 3v6",key:"svg-7"}]]);/**
 * @license @tabler/icons-react v3.30.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var F=s("outline","current-location","IconCurrentLocation",[["path",{d:"M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0",key:"svg-0"}],["path",{d:"M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0 -16 0",key:"svg-1"}],["path",{d:"M12 2l0 2",key:"svg-2"}],["path",{d:"M12 20l0 2",key:"svg-3"}],["path",{d:"M20 12l2 0",key:"svg-4"}],["path",{d:"M2 12l2 0",key:"svg-5"}]]);/**
 * @license @tabler/icons-react v3.30.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var O=s("outline","device-floppy","IconDeviceFloppy",[["path",{d:"M6 4h10l4 4v10a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2",key:"svg-0"}],["path",{d:"M12 14m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0",key:"svg-1"}],["path",{d:"M14 4l0 4l-6 0l0 -4",key:"svg-2"}]]);function R({items:n=[],value:o,onChange:l,placeholder:c="Pilih opsi...",emptyText:i="Data tidak ditemukan.",disabled:h=!1,className:m}){var d;const[r,t]=v.useState(!1);return a.jsxs(y,{open:r,onOpenChange:t,children:[a.jsx(x,{asChild:!0,children:a.jsxs(g,{variant:"outline",role:"combobox","aria-expanded":r,disabled:h,className:p("w-full justify-between h-9 px-3 shadow-none font-normal focus-visible:ring-teal-500",!o&&"text-muted-foreground",m),children:[a.jsx("span",{className:"truncate",children:o?(d=n.find(e=>e.code===o))==null?void 0:d.name:c}),a.jsx(b,{className:"w-4 h-4 ml-2 opacity-50 shrink-0"})]})}),a.jsx(k,{className:"w-[var(--radix-popover-trigger-width)] p-0",align:"start",children:a.jsxs(u,{children:[a.jsx(C,{placeholder:"Cari...",className:"border-none shadow-none focus:ring-0"}),a.jsxs(f,{children:[a.jsx(M,{children:i}),a.jsx(j,{children:n.map(e=>a.jsxs(w,{value:e.name,onSelect:()=>{l(e.code===o?"":e.code),t(!1)},children:[a.jsx(I,{className:p("mr-2 h-4 w-4",o===e.code?"opacity-100":"opacity-0")}),e.name]},e.code))})]})]})})]})}export{R as C,F as I,O as a,B as b};

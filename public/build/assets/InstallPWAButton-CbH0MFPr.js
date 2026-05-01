import{c as l}from"./createLucideIcon-u9jKa28V.js";import{c as i}from"./createReactComponent-7XHybqDg.js";import{r as n,j as c}from"./app-BmstFSLW.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]],m=l("ArrowLeft",p);/**
 * @license @tabler/icons-react v3.30.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var v=i("outline","bell","IconBell",[["path",{d:"M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6",key:"svg-0"}],["path",{d:"M9 17v1a3 3 0 0 0 6 0v-1",key:"svg-1"}]]);function g(){const[t,s]=n.useState(null),[o,a]=n.useState(!1);n.useEffect(()=>{window.addEventListener("beforeinstallprompt",e=>{e.preventDefault(),s(e),a(!0)})},[]);const r=async()=>{if(t){t.prompt();const{outcome:e}=await t.userChoice;console.log(e==="accepted"?"User accepted install":"User dismissed install"),s(null)}};return o&&c.jsx("button",{onClick:r,className:"w-full inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-white bg-gradient-to-r from-orange-500 via-orange-500 to-orange-500 h-12 rounded-xl px-8",children:"Install Aplikasi"})}export{m as A,v as I,g as a};

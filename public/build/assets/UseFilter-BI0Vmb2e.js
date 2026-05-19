import{c as u}from"./createReactComponent-Bilw-ydo.js";import{r as e,S as f}from"./app-Cri4zXJ4.js";import{p as d}from"./lodash-Ca4EYiia.js";/**
 * @license @tabler/icons-react v3.30.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var w=u("outline","arrows-down-up","IconArrowsDownUp",[["path",{d:"M17 3l0 18",key:"svg-0"}],["path",{d:"M10 18l-3 3l-3 -3",key:"svg-1"}],["path",{d:"M7 21l0 -18",key:"svg-2"}],["path",{d:"M20 6l-3 -3l-3 3",key:"svg-3"}]]);function y({route:o,values:r,only:t,wait:s=300}){const{debounce:n,pickBy:a,isEqual:l}=d,p=e.useRef(r),c=e.useCallback(n(i=>{f.get(o,a(i),{only:t,preserveScroll:!0,preserveState:!0})},s),[o,t,s]);return e.useEffect(()=>{l(p.current,r)||(p.current=r,c(r))},[r,c]),{values:r}}export{w as I,y as U};

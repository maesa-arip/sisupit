const e={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function r(t){return t==null?"":String(t).replace(/[&<>"']/g,n=>e[n])}export{r as e};

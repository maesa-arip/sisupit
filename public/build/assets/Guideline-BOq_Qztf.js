import{r as x,j as e,L as p}from"./app-DROmqx3e.js";const m=`
.gl {
  --background: 0 0% 98%;
  --foreground: 224 71.4% 4.1%;
  --card: 0 0% 100%;
  --muted: 220 14.3% 95.9%;
  --muted-foreground: 220 8.9% 46.1%;
  --border: 0 0% 90%;
  --input: 0 0% 90%;
  --destructive: 3 79% 49%;   --destructive-foreground: 210 20% 98%;
  --success: 160 84% 39%;      --success-foreground: 210 20% 98%;
  --info: 199 89% 48%;         --info-foreground: 210 20% 98%;
  --warning: 38 92% 50%;       --warning-foreground: 220.9 39.3% 11%;
  --teal: 175 84% 32%;         --teal-foreground: 210 20% 98%;
  --volunteer: 271 76% 53%;    --volunteer-foreground: 0 0% 100%;
  --radius: 0.5rem;
  min-height: 100vh;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.55;
}
.dark .gl {
  --background: 0 0% 6%;
  --foreground: 210 20% 98%;
  --card: 0 0% 8%;
  --muted: 0 0% 12%;
  --muted-foreground: 217.9 10.6% 64.9%;
  --border: 0 0% 15%;
  --input: 0 0% 15%;
  --destructive: 4 74% 56%;   --destructive-foreground: 210 20% 98%;
  --success: 160 72% 45%;      --success-foreground: 210 20% 98%;
  --info: 199 89% 40%;         --info-foreground: 210 20% 98%;
  --warning: 38 92% 40%;       --warning-foreground: 210 20% 98%;
  --teal: 173 66% 50%;         --teal-foreground: 210 20% 98%;
  --volunteer: 271 76% 66%;    --volunteer-foreground: 224 71% 4%;
}
.gl * { box-sizing: border-box; }
.gl .mono { font-family: ui-monospace, 'Cascadia Mono', 'Segoe UI Mono', Menlo, Consolas, monospace; font-variant-numeric: tabular-nums; }

.gl .bar { position: sticky; top: 0; z-index: 30; background: hsl(var(--background) / 0.85); backdrop-filter: blur(10px); border-bottom: 1px solid hsl(var(--border)); }
.gl .bar-in { max-width: 1000px; margin: 0 auto; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.gl .brandmark { display: flex; align-items: center; gap: 12px; }
.gl .logo { width: 34px; height: 34px; border-radius: 9px; background: hsl(var(--destructive)); display: grid; place-items: center; flex-shrink: 0; }
.gl .logo svg { width: 19px; height: 19px; fill: #fff; }
.gl .brandmark b { font-size: 15px; letter-spacing: -0.01em; display: block; }
.gl .brandmark span { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: hsl(var(--muted-foreground)); }
.gl .toggle { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 999px; border: 1px solid hsl(var(--border)); background: hsl(var(--card)); color: hsl(var(--foreground)); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
.gl .toggle:hover { border-color: hsl(var(--foreground) / 0.35); }
.gl .toc { max-width: 1000px; margin: 0 auto; padding: 0 24px 12px; display: flex; flex-wrap: wrap; gap: 6px 14px; }
.gl .toc a { font-size: 12.5px; font-weight: 600; color: hsl(var(--muted-foreground)); text-decoration: none; }
.gl .toc a:hover { color: hsl(var(--destructive)); }

.gl .wrap { max-width: 1000px; margin: 0 auto; padding: 0 24px 120px; }
.gl .hero { padding: 52px 0 12px; }
.gl .hero h1 { font-size: clamp(30px, 5vw, 46px); line-height: 1.05; letter-spacing: -0.03em; margin: 0 0 14px; font-weight: 800; text-wrap: balance; }
.gl .hero h1 em { font-style: normal; color: hsl(var(--destructive)); }
.gl .hero p { max-width: 62ch; font-size: 17px; color: hsl(var(--muted-foreground)); margin: 0; }

.gl section { margin-top: 64px; scroll-margin-top: 108px; }
.gl .eyebrow { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
.gl .eyebrow .n { font-family: ui-monospace, monospace; font-size: 12px; font-weight: 700; color: hsl(var(--destructive)); }
.gl .eyebrow .t { font-size: 12px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: hsl(var(--muted-foreground)); white-space: nowrap; }
.gl .eyebrow::after { content: ""; height: 1px; flex: 1; background: hsl(var(--border)); }
.gl h2.sec { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 6px; }
.gl .lead { color: hsl(var(--muted-foreground)); max-width: 70ch; margin: 0 0 24px; font-size: 15px; }
.gl h3.sub { font-size: 15px; font-weight: 700; margin: 30px 0 14px; }

.gl .callout { border: 1px solid hsl(var(--c, var(--info)) / 0.3); background: hsl(var(--c, var(--info)) / 0.08); border-radius: 12px; padding: 16px 18px; display: flex; gap: 14px; }
.gl .callout .ic { flex-shrink: 0; width: 22px; height: 22px; color: hsl(var(--c, var(--info))); }
.gl .callout p { margin: 0; font-size: 14px; }
.gl .callout b { color: hsl(var(--c, var(--info))); }

.gl .grid { display: grid; gap: 16px; }
.gl .g2 { grid-template-columns: repeat(2, 1fr); }
.gl .g3 { grid-template-columns: repeat(3, 1fr); }
.gl .g4 { grid-template-columns: repeat(4, 1fr); }

.gl .swatch { border: 1px solid hsl(var(--border)); border-radius: var(--radius); overflow: hidden; background: hsl(var(--card)); }
.gl .swatch .band { height: 72px; background: hsl(var(--c)); }
.gl .swatch .body { padding: 13px 15px 15px; }
.gl .swatch h4 { margin: 0 0 3px; font-size: 14px; display: flex; align-items: center; gap: 8px; }
.gl .swatch h4 i { width: 10px; height: 10px; border-radius: 3px; background: hsl(var(--c)); }
.gl .swatch .new { font-size: 10px; color: hsl(var(--muted-foreground)); font-weight: 600; }
.gl .swatch .role { margin: 0 0 11px; font-size: 12.5px; color: hsl(var(--muted-foreground)); }
.gl .swatch dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 3px 10px; font-size: 11.5px; }
.gl .swatch dt { color: hsl(var(--muted-foreground)); }
.gl .swatch dd { margin: 0; text-align: right; }

.gl .neutral-tile { border: 1px solid hsl(var(--border)); border-radius: 10px; overflow: hidden; }
.gl .neutral-tile .b { height: 52px; }
.gl .neutral-tile .l { padding: 8px 10px; font-size: 11px; }
.gl .neutral-tile .l b { display: block; font-size: 12px; }
.gl .neutral-tile .l span { color: hsl(var(--muted-foreground)); }

.gl .btn { font: inherit; height: 40px; padding: 0 18px; border-radius: var(--radius); font-size: 13px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid transparent; transition: background .15s, border-color .15s, opacity .15s; }
.gl .btn-solid { background: hsl(var(--c)); color: hsl(var(--c-fg)); }
.gl .btn-solid:hover { background: hsl(var(--c) / 0.9); }
.gl .btn-outline { background: transparent; border-color: hsl(var(--c)); color: hsl(var(--c)); }
.gl .btn-outline:hover { background: hsl(var(--c) / 0.1); }
.gl .btn-soft { background: hsl(var(--c) / 0.1); color: hsl(var(--c)); }
.gl .btn-soft:hover { background: hsl(var(--c) / 0.18); }
.gl .btn-ghost { background: transparent; color: hsl(var(--c)); }
.gl .btn-ghost:hover { background: hsl(var(--c) / 0.1); }
.gl .btn[disabled] { opacity: .5; pointer-events: none; }
.gl .btn-sm { height: 32px; padding: 0 12px; font-size: 12px; }
.gl .btn-lg { height: 48px; padding: 0 24px; font-size: 14px; }

.gl .samples { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.gl .btnrow { display: grid; grid-template-columns: 130px 1fr; gap: 16px; align-items: center; padding: 15px 0; border-bottom: 1px solid hsl(var(--border)); }
.gl .btnrow:last-child { border-bottom: 0; }
.gl .btnrow .lab b { font-size: 13.5px; display: flex; align-items: center; gap: 9px; }
.gl .btnrow .lab b i { width: 12px; height: 12px; border-radius: 4px; background: hsl(var(--c)); }

.gl .badge { display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 10px; border-radius: 999px; font-size: 12px; font-weight: 700; background: hsl(var(--c) / 0.1); color: hsl(var(--c)); border: 1px solid hsl(var(--c) / 0.2); }
.gl .badge i { width: 6px; height: 6px; border-radius: 999px; background: hsl(var(--c)); }

.gl .flow { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.gl .flow .arrow { color: hsl(var(--muted-foreground)); font-size: 13px; }

.gl .card { border: 1px solid hsl(var(--border)); border-radius: 16px; background: hsl(var(--card)); padding: 20px; }
.gl .card h4 { margin: 0 0 4px; font-size: 15px; }
.gl .card p.s { margin: 0; font-size: 13px; color: hsl(var(--muted-foreground)); }

.gl .radii { display: flex; flex-wrap: wrap; gap: 20px; }
.gl .radii figure { margin: 0; text-align: center; }
.gl .radii .box { width: 88px; height: 64px; background: hsl(var(--destructive) / 0.12); border: 1.5px solid hsl(var(--destructive) / 0.5); }
.gl .radii figcaption { margin-top: 8px; font-size: 12px; }
.gl .radii figcaption b { display: block; }
.gl .radii figcaption span { display: block; color: hsl(var(--muted-foreground)); }

.gl .type .row { display: grid; grid-template-columns: 120px 1fr; gap: 18px; align-items: baseline; padding: 12px 0; border-bottom: 1px solid hsl(var(--border)); }
.gl .type .row:last-child { border-bottom: 0; }
.gl .type .meta { font-size: 12px; color: hsl(var(--muted-foreground)); }
.gl .type .meta b { display: block; color: hsl(var(--foreground)); font-size: 12.5px; }

.gl .space-row { display: flex; align-items: center; gap: 14px; padding: 6px 0; }
.gl .space-row .bar { height: 16px; background: hsl(var(--info) / 0.5); border-radius: 3px; }
.gl .space-row .lab { font-size: 12.5px; color: hsl(var(--muted-foreground)); }
.gl .space-row .lab b { color: hsl(var(--foreground)); }

.gl .elev { display: grid; place-items: center; text-align: center; height: 76px; border: 1px solid hsl(var(--border)); border-radius: 12px; background: hsl(var(--card)); font-size: 12.5px; font-weight: 600; }
.gl .elev span { font-weight: 400; color: hsl(var(--muted-foreground)); }
.gl .s-none { box-shadow: none; }
.gl .s-sm { box-shadow: 0 1px 2px hsl(0 0% 0% / 0.06); }
.gl .s-md { box-shadow: 0 4px 12px hsl(0 0% 0% / 0.10); }
.gl .s-lg { box-shadow: 0 12px 30px hsl(0 0% 0% / 0.16); }

.gl .field { display: flex; flex-direction: column; gap: 6px; }
.gl .field label { font-size: 13px; font-weight: 600; }
.gl .field .inp { height: 40px; padding: 0 12px; border-radius: calc(var(--radius) - 2px); border: 1px solid hsl(var(--input)); background: hsl(var(--card)); color: hsl(var(--foreground)); font: inherit; font-size: 14px; }
.gl .field .inp:focus { outline: 2px solid hsl(var(--info)); outline-offset: 1px; border-color: transparent; }
.gl .field .inp.err { border-color: hsl(var(--destructive)); }
.gl .field .err-msg { font-size: 12.5px; color: hsl(var(--destructive)); font-weight: 500; }
.gl .field .hint { font-size: 12px; color: hsl(var(--muted-foreground)); }

.gl .dd { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.gl .dd .box { border: 1px solid hsl(var(--border)); border-radius: 12px; padding: 16px 18px; }
.gl .dd .box.do { border-color: hsl(var(--success) / 0.4); background: hsl(var(--success) / 0.06); }
.gl .dd .box.no { border-color: hsl(var(--destructive) / 0.4); background: hsl(var(--destructive) / 0.06); }
.gl .dd .tag { font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
.gl .dd .do .tag { color: hsl(var(--success)); }
.gl .dd .no .tag { color: hsl(var(--destructive)); }
.gl .dd ul { margin: 10px 0 0; padding-left: 18px; }
.gl .dd li { font-size: 13px; margin: 6px 0; }
.gl .dd code { font-family: ui-monospace, monospace; font-size: 12px; background: hsl(var(--muted)); padding: 1px 5px; border-radius: 4px; }

.gl footer { margin-top: 84px; padding-top: 22px; border-top: 1px solid hsl(var(--border)); font-size: 12.5px; color: hsl(var(--muted-foreground)); }
.gl footer code { font-family: ui-monospace, monospace; }

@media (max-width: 820px) { .gl .g4, .gl .g3 { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) {
  .gl .g4, .gl .g3, .gl .g2, .gl .dd { grid-template-columns: 1fr; }
  .gl .btnrow, .gl .type .row { grid-template-columns: 1fr; gap: 10px; }
}
@media (prefers-reduced-motion: reduce) { .gl * { transition: none !important; } }
`,d=s=>({"--c":`var(--${s})`,"--c-fg":`var(--${s}-foreground)`});function i({c:s,name:l,role:c,light:r,dark:n,hex:t,isNew:h}){return e.jsxs("div",{className:"swatch",style:{"--c":`var(--${s})`},children:[e.jsx("div",{className:"band"}),e.jsxs("div",{className:"body",children:[e.jsxs("h4",{children:[e.jsx("i",{}),l," ",h&&e.jsx("span",{className:"new",children:"(baru)"})]}),e.jsx("p",{className:"role",children:c}),e.jsxs("dl",{children:[e.jsx("dt",{children:"Light"}),e.jsx("dd",{className:"mono",children:r}),e.jsx("dt",{children:"Dark"}),e.jsx("dd",{className:"mono",children:n}),e.jsx("dt",{children:"Hex"}),e.jsx("dd",{className:"mono",children:t})]})]})]})}function o({c:s,label:l}){return e.jsxs("div",{className:"btnrow",style:d(s),children:[e.jsx("div",{className:"lab",children:e.jsxs("b",{children:[e.jsx("i",{}),l]})}),e.jsxs("div",{className:"samples",children:[e.jsx("button",{className:"btn btn-solid",children:"Solid"}),e.jsx("button",{className:"btn btn-outline",children:"Outline"}),e.jsx("button",{className:"btn btn-soft",children:"Soft"}),e.jsx("button",{className:"btn btn-ghost",children:"Ghost"})]})]})}function a({c:s,children:l}){return e.jsxs("span",{className:"badge",style:{"--c":`var(--${s})`},children:[e.jsx("i",{}),l]})}function u(){const[s,l]=x.useState(!1);x.useEffect(()=>{l(document.documentElement.classList.contains("dark"))},[]);const c=()=>{const r=document.documentElement,n=!r.classList.contains("dark");r.classList.toggle("dark",n);try{localStorage.setItem("theme",n?"dark":"light")}catch{}l(n)};return e.jsxs(e.Fragment,{children:[e.jsx(p,{title:"Panduan Desain — Sisupit"}),e.jsx("style",{children:m}),e.jsxs("div",{className:"gl",children:[e.jsxs("div",{className:"bar",children:[e.jsxs("div",{className:"bar-in",children:[e.jsxs("div",{className:"brandmark",children:[e.jsx("span",{className:"logo","aria-hidden":"true",children:e.jsx("svg",{viewBox:"0 0 24 24",children:e.jsx("path",{d:"M13 2 4 14h6l-1 8 9-12h-6z"})})}),e.jsxs("div",{children:[e.jsx("b",{children:"SISUPIT"}),e.jsx("span",{children:"Panduan Desain"})]})]}),e.jsx("button",{className:"toggle",type:"button",onClick:c,"aria-label":"Ganti tema",children:s?"Mode terang":"Mode gelap"})]}),e.jsxs("nav",{className:"toc",children:[e.jsx("a",{href:"#prinsip",children:"Prinsip"}),e.jsx("a",{href:"#warna",children:"Warna"}),e.jsx("a",{href:"#status",children:"Status Laporan"}),e.jsx("a",{href:"#tipografi",children:"Tipografi"}),e.jsx("a",{href:"#rounded",children:"Rounded"}),e.jsx("a",{href:"#spasi",children:"Spasi"}),e.jsx("a",{href:"#elevasi",children:"Elevasi"}),e.jsx("a",{href:"#tombol",children:"Tombol"}),e.jsx("a",{href:"#badge",children:"Badge"}),e.jsx("a",{href:"#kartu",children:"Kartu & Form"}),e.jsx("a",{href:"#penekanan",children:"Penekanan"}),e.jsx("a",{href:"#dodont",children:"Do & Don't"})]})]}),e.jsxs("div",{className:"wrap",children:[e.jsxs("header",{className:"hero",children:[e.jsxs("h1",{children:["Panduan desain untuk keadaan ",e.jsx("em",{children:"darurat"}),"."]}),e.jsxs("p",{children:["Satu sistem yang menyatukan warna, tipografi, sudut, dan jarak Sisupit — di mode terang maupun gelap. Semua nilai memetakan token nyata di ",e.jsx("span",{className:"mono",children:"app.css"})," ","& ",e.jsx("span",{className:"mono",children:"tailwind.config.js"}),". Aturan tunggal: gunakan token, jangan warna mentah."]})]}),e.jsxs("section",{id:"prinsip",children:[e.jsxs("div",{className:"eyebrow",children:[e.jsx("span",{className:"n",children:"01"}),e.jsx("span",{className:"t",children:"Prinsip Inti"})]}),e.jsx("h2",{className:"sec",children:"Token dulu, selalu."}),e.jsxs("p",{className:"lead",children:["Audit menemukan pola lama: warna ditulis mentah untuk mode terang (",e.jsx("span",{className:"mono",children:"bg-red-600"}),") lalu token untuk gelap (",e.jsx("span",{className:"mono",children:"dark:bg-destructive"}),"). Akibatnya satu merah bisa tampil tiga nuansa berbeda. Sistem ini menghapus itu."]}),e.jsxs("div",{className:"grid g2",children:[e.jsxs("div",{className:"callout",style:{"--c":"var(--success)"},children:[e.jsx("svg",{className:"ic",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:e.jsx("path",{d:"M20 6 9 17l-5-5"})}),e.jsxs("p",{children:[e.jsx("b",{children:"Pakai token semantik."})," ",e.jsx("span",{className:"mono",children:"bg-destructive"}),","," ",e.jsx("span",{className:"mono",children:"text-success"}),", ",e.jsx("span",{className:"mono",children:"border-info"}),". Otomatis benar di light & dark, seragam dengan logo."]})]}),e.jsxs("div",{className:"callout",style:{"--c":"var(--destructive)"},children:[e.jsx("svg",{className:"ic",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:e.jsx("path",{d:"M18 6 6 18M6 6l12 12"})}),e.jsxs("p",{children:[e.jsx("b",{children:"Jangan warna mentah."})," ",e.jsx("span",{className:"mono",children:"bg-red-600"}),","," ",e.jsx("span",{className:"mono",children:"text-blue-500"}),", hex baru. Memecah brand & merusak dark mode."]})]})]}),e.jsxs("p",{className:"lead",style:{marginTop:20},children:["Pengecualian sah: nilai warna pada ",e.jsx("b",{children:"marker peta Leaflet"})," dan ",e.jsx("b",{children:"chart"})," — ambil dari token via JS bila memungkinkan."]})]}),e.jsxs("section",{id:"warna",children:[e.jsxs("div",{className:"eyebrow",children:[e.jsx("span",{className:"n",children:"02"}),e.jsx("span",{className:"t",children:"Sistem Warna"})]}),e.jsx("h2",{className:"sec",children:"Merah brand + lima warna semantik."}),e.jsxs("p",{className:"lead",children:["Merah menanggung identitas (api/damkar) dan bahaya sekaligus. Dipilih ",e.jsx("b",{children:"#E0241B"})," — cerah, mendesak, identik logo & ikon Android. Teks putih di atasnya = kontras 4.74:1 (lulus WCAG AA)."]}),e.jsxs("div",{className:"grid g3",children:[e.jsx(i,{c:"destructive",name:"Destructive / Brand",role:"SOS, laporan aktif/darurat, bahaya, hapus, error.",light:"3 79% 49%",dark:"4 74% 56%",hex:"#E0241B"}),e.jsx(i,{c:"success",name:"Success (Emerald)",role:"Penanganan berjalan, relawan aktif, konfirmasi.",light:"160 84% 39%",dark:"160 72% 45%",hex:"#10B981"}),e.jsx(i,{c:"info",name:"Info (Biru / Air)",role:"Laporan selesai (air memadamkan api), aksi responder, CTA sekunder.",light:"199 89% 48%",dark:"199 89% 40%",hex:"#0EA5E9"}),e.jsx(i,{c:"warning",name:"Warning (Amber)",role:"Menunggu validasi, standby, peringatan.",light:"38 92% 50%",dark:"38 92% 40%",hex:"#F59E0B"}),e.jsx(i,{c:"teal",name:"Teal",role:"Hidran & fasilitas air — peran khusus, beda dari emerald.",light:"175 84% 32%",dark:"173 66% 50%",hex:"#0D9488"}),e.jsx(i,{c:"volunteer",name:"Volunteer",isNew:!0,role:"Kategori relawan di peta & daftar.",light:"271 76% 53%",dark:"271 76% 66%",hex:"#9333EA"})]}),e.jsx("h3",{className:"sub",children:"Netral"}),e.jsx("p",{className:"lead",children:"Netral dingin yang sengaja dipilih, sama dengan aplikasi."}),e.jsxs("div",{className:"grid g4",children:[e.jsxs("div",{className:"neutral-tile",children:[e.jsx("div",{className:"b",style:{background:"hsl(var(--background))"}}),e.jsxs("div",{className:"l",children:[e.jsx("b",{children:"background"}),e.jsx("span",{className:"mono",children:"0 0% 98% / 6%"})]})]}),e.jsxs("div",{className:"neutral-tile",children:[e.jsx("div",{className:"b",style:{background:"hsl(var(--card))",borderBottom:"1px solid hsl(var(--border))"}}),e.jsxs("div",{className:"l",children:[e.jsx("b",{children:"card"}),e.jsx("span",{className:"mono",children:"0 0% 100% / 8%"})]})]}),e.jsxs("div",{className:"neutral-tile",children:[e.jsx("div",{className:"b",style:{background:"hsl(var(--muted))"}}),e.jsxs("div",{className:"l",children:[e.jsx("b",{children:"muted"}),e.jsx("span",{className:"mono",children:"220 14% 96% / …12%"})]})]}),e.jsxs("div",{className:"neutral-tile",children:[e.jsx("div",{className:"b",style:{background:"hsl(var(--foreground))"}}),e.jsxs("div",{className:"l",children:[e.jsx("b",{children:"foreground"}),e.jsx("span",{className:"mono",children:"224 71% 4% / …98%"})]})]})]})]}),e.jsxs("section",{id:"status",children:[e.jsxs("div",{className:"eyebrow",children:[e.jsx("span",{className:"n",children:"03"}),e.jsx("span",{className:"t",children:"Status Laporan"})]}),e.jsx("h2",{className:"sec",children:"Merah menyala → biru memadamkan."}),e.jsxs("p",{className:"lead",children:["Lifecycle: ",e.jsx("b",{children:"Masuk → Terverifikasi → Penanganan → Selesai"})," (plus Ditolak). Warna menyandikan progres, dengan satu keputusan domain penting di ujungnya."]}),e.jsx("div",{className:"card",style:{marginBottom:16},children:e.jsxs("div",{className:"flow",style:{fontSize:13,fontWeight:700},children:[e.jsx(a,{c:"destructive",children:"Masuk"}),e.jsx("span",{className:"arrow",children:"→"}),e.jsx(a,{c:"warning",children:"Terverifikasi"}),e.jsx("span",{className:"arrow",children:"→"}),e.jsx(a,{c:"success",children:"Penanganan"}),e.jsx("span",{className:"arrow",children:"→"}),e.jsx(a,{c:"info",children:"Selesai"}),e.jsx("span",{className:"arrow",children:"·"}),e.jsx(a,{c:"muted-foreground",children:"Ditolak"})]})}),e.jsxs("div",{className:"callout",style:{"--c":"var(--info)"},children:[e.jsx("svg",{className:"ic",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M12 2s6 7 6 11a6 6 0 1 1-12 0c0-4 6-11 6-11z"})}),e.jsxs("p",{children:[e.jsx("b",{children:"Selesai = biru, bukan hijau."})," Ini aplikasi pemadam kebakaran — biru identik dengan"," ",e.jsx("b",{children:"air yang memadamkan api"}),". Merah (darurat) di awal, biru (padam/aman) di akhir. Emerald untuk fase ",e.jsx("b",{children:"Penanganan"})," yang aktif berjalan; Ditolak memudar jadi netral."]})]})]}),e.jsxs("section",{id:"tipografi",children:[e.jsxs("div",{className:"eyebrow",children:[e.jsx("span",{className:"n",children:"04"}),e.jsx("span",{className:"t",children:"Tipografi"})]}),e.jsx("h2",{className:"sec",children:"Inter, satu skala disiplin."}),e.jsxs("p",{className:"lead",children:["Satu keluarga — ",e.jsx("b",{children:"Inter"})," (",e.jsx("span",{className:"mono",children:"tailwind.config.js"})," · fontFamily.sans). Judul rapat (",e.jsx("span",{className:"mono",children:"tracking-tight"}),"), label huruf-besar diberi jarak, teks bodi ~65 karakter/baris."]}),e.jsxs("div",{className:"type",children:[e.jsxs("div",{className:"row",children:[e.jsxs("div",{className:"meta",children:[e.jsx("b",{children:"Display"}),"800 · -0.03em"]}),e.jsx("div",{style:{fontSize:40,fontWeight:800,letterSpacing:"-0.03em",lineHeight:1.05},children:"Lapor Darurat"})]}),e.jsxs("div",{className:"row",children:[e.jsxs("div",{className:"meta",children:[e.jsx("b",{children:"Judul Section"}),"800 · -0.02em"]}),e.jsx("div",{style:{fontSize:24,fontWeight:800,letterSpacing:"-0.02em"},children:"Peta Pemantauan"})]}),e.jsxs("div",{className:"row",children:[e.jsxs("div",{className:"meta",children:[e.jsx("b",{children:"Sub-judul"}),"700"]}),e.jsx("div",{style:{fontSize:16,fontWeight:700},children:"Panel Tindakan"})]}),e.jsxs("div",{className:"row",children:[e.jsxs("div",{className:"meta",children:[e.jsx("b",{children:"Body"}),"400 · 1.6"]}),e.jsx("div",{style:{fontSize:15,maxWidth:"62ch"},children:"Warga melapor, Pusat Komando memvalidasi, lalu petugas dan relawan merespons dengan pelacakan lokasi langsung sampai insiden ditutup."})]}),e.jsxs("div",{className:"row",children:[e.jsxs("div",{className:"meta",children:[e.jsx("b",{children:"Kecil / hint"}),"500"]}),e.jsx("div",{style:{fontSize:13,color:"hsl(var(--muted-foreground))"},children:"Terakhir diperbarui 2 menit lalu"})]}),e.jsxs("div",{className:"row",children:[e.jsxs("div",{className:"meta",children:[e.jsx("b",{children:"Label"}),"800 · 0.16em · UPPER"]}),e.jsx("div",{style:{fontSize:11,fontWeight:800,letterSpacing:"0.16em",textTransform:"uppercase",color:"hsl(var(--muted-foreground))"},children:"Sistem Untuk Pelaporan Dini"})]})]})]}),e.jsxs("section",{id:"rounded",children:[e.jsxs("div",{className:"eyebrow",children:[e.jsx("span",{className:"n",children:"05"}),e.jsx("span",{className:"t",children:"Sudut / Rounded"})]}),e.jsx("h2",{className:"sec",children:"Skala jari-jari dari satu sumber."}),e.jsxs("p",{className:"lead",children:["Basis ",e.jsx("span",{className:"mono",children:"--radius: 0.5rem"})," (8px). Tailwind menurunkan"," ",e.jsx("span",{className:"mono",children:"sm/md/lg"})," darinya; ",e.jsx("span",{className:"mono",children:"xl"})," ke atas nilai tetap. Makin besar & penting elemennya, makin besar sudutnya."]}),e.jsx("div",{className:"radii",children:[["rounded-sm","4px","chip kecil, checkbox",4],["rounded-md","6px","input, select, tombol kecil",6],["rounded-lg","8px · --radius","tombol default, dropdown, tile ikon",8],["rounded-xl","12px","tombol menonjol (SOS/Lapor)",12],["rounded-2xl","16px","kartu, panel, modal",16],["rounded-full","9999px","badge/pill, avatar, FAB",999]].map(([r,n,t,h])=>e.jsxs("figure",{children:[e.jsx("div",{className:"box",style:{borderRadius:h}}),e.jsxs("figcaption",{children:[e.jsx("b",{children:r}),e.jsx("span",{className:"mono",children:n}),e.jsx("span",{children:t})]})]},r))})]}),e.jsxs("section",{id:"spasi",children:[e.jsxs("div",{className:"eyebrow",children:[e.jsx("span",{className:"n",children:"06"}),e.jsx("span",{className:"t",children:"Spasi & Layout"})]}),e.jsx("h2",{className:"sec",children:"Kelipatan 4px, jarak lewat gap."}),e.jsxs("p",{className:"lead",children:["Skala spasi Tailwind (basis 4px). Atur jarak antar-elemen dengan"," ",e.jsx("span",{className:"mono",children:"flex/grid + gap"}),", bukan margin per-elemen yang mudah dobel/kolaps."]}),e.jsx("div",{children:[[8,"2 · 8px — jarak ikon↔teks, gap chip"],[12,"3 · 12px — padding tombol, gap kecil"],[16,"4 · 16px — gap kartu di grid"],[24,"6 · 24px — padding kartu/panel"],[48,"12 · 48px — jarak antar-blok"],[68,"16–18 · 64–72px — jarak antar-section"]].map(([r,n])=>e.jsxs("div",{className:"space-row",children:[e.jsx("div",{className:"bar",style:{width:r}}),e.jsx("div",{className:"lab",children:n})]},r))}),e.jsxs("p",{className:"lead",style:{marginTop:20},children:["Lebar konten maksimum: ",e.jsx("span",{className:"mono",children:"max-w-1000/1080px"}),", dipusatkan (",e.jsx("span",{className:"mono",children:"mx-auto"}),") dengan padding tepi 24px."]})]}),e.jsxs("section",{id:"elevasi",children:[e.jsxs("div",{className:"eyebrow",children:[e.jsx("span",{className:"n",children:"07"}),e.jsx("span",{className:"t",children:"Elevasi / Bayangan"})]}),e.jsx("h2",{className:"sec",children:"Datar sebagai default."}),e.jsxs("p",{className:"lead",children:["Aplikasi condong flat — banyak tombol pakai ",e.jsx("span",{className:"mono",children:"shadow-none"}),". Naikkan elevasi hanya saat elemen benar-benar mengambang."]}),e.jsxs("div",{className:"grid g4",children:[e.jsxs("div",{className:"elev s-none",children:["shadow-none",e.jsx("span",{children:"tombol datar"})]}),e.jsxs("div",{className:"elev s-sm",children:["shadow-sm",e.jsx("span",{children:"kartu, input"})]}),e.jsxs("div",{className:"elev s-md",children:["shadow-md",e.jsx("span",{children:"dropdown"})]}),e.jsxs("div",{className:"elev s-lg",children:["shadow-lg",e.jsx("span",{children:"popover, modal, FAB"})]})]})]}),e.jsxs("section",{id:"tombol",children:[e.jsxs("div",{className:"eyebrow",children:[e.jsx("span",{className:"n",children:"08"}),e.jsx("span",{className:"t",children:"Tombol"})]}),e.jsx("h2",{className:"sec",children:"Empat bentuk × tiga ukuran."}),e.jsx("p",{className:"lead",children:"Setiap warna semantik punya empat bentuk. Bentuklah yang menentukan penekanan, bukan hue baru."}),e.jsx(o,{c:"destructive",label:"Destructive"}),e.jsx(o,{c:"success",label:"Success"}),e.jsx(o,{c:"info",label:"Info"}),e.jsx(o,{c:"warning",label:"Warning"}),e.jsx(o,{c:"teal",label:"Teal"}),e.jsx("h3",{className:"sub",children:"Ukuran"}),e.jsxs("div",{className:"samples",style:d("destructive"),children:[e.jsx("button",{className:"btn btn-solid btn-sm",children:"Small · h-32"}),e.jsx("button",{className:"btn btn-solid",children:"Default · h-40"}),e.jsx("button",{className:"btn btn-solid btn-lg",children:"Large · h-48"}),e.jsx("button",{className:"btn btn-solid",disabled:!0,children:"Disabled"})]})]}),e.jsxs("section",{id:"badge",children:[e.jsxs("div",{className:"eyebrow",children:[e.jsx("span",{className:"n",children:"09"}),e.jsx("span",{className:"t",children:"Badge & Chip"})]}),e.jsx("h2",{className:"sec",children:"Label pasif, volume terendah."}),e.jsxs("p",{className:"lead",children:["Selalu bentuk ",e.jsx("b",{children:"soft"})," (",e.jsx("span",{className:"mono",children:"bg /10 · text · border /20"}),"),"," ",e.jsx("span",{className:"mono",children:"rounded-full"}),". Untuk status & kategori yang tidak menuntut aksi."]}),e.jsxs("div",{className:"samples",children:[e.jsx(a,{c:"destructive",children:"Darurat"}),e.jsx(a,{c:"warning",children:"Menunggu"}),e.jsx(a,{c:"success",children:"Ditangani"}),e.jsx(a,{c:"info",children:"Selesai"}),e.jsx(a,{c:"teal",children:"Hidran"}),e.jsx(a,{c:"volunteer",children:"Relawan"}),e.jsx(a,{c:"muted-foreground",children:"Nonaktif"})]})]}),e.jsxs("section",{id:"kartu",children:[e.jsxs("div",{className:"eyebrow",children:[e.jsx("span",{className:"n",children:"10"}),e.jsx("span",{className:"t",children:"Kartu & Form"})]}),e.jsx("h2",{className:"sec",children:"Permukaan & masukan."}),e.jsxs("div",{className:"grid g2",children:[e.jsxs("div",{className:"card s-sm",children:[e.jsx("h4",{children:"Kartu / Panel"}),e.jsxs("p",{className:"s",children:["Latar ",e.jsx("span",{className:"mono",children:"card"}),", garis ",e.jsx("span",{className:"mono",children:"border"}),", sudut ",e.jsx("span",{className:"mono",children:"rounded-2xl"})," (16px), padding 20–24px,"," ",e.jsx("span",{className:"mono",children:"shadow-sm"}),"."]}),e.jsxs("div",{className:"samples",style:{marginTop:16,...d("info")},children:[e.jsx("button",{className:"btn btn-solid btn-sm",children:"Aksi utama"}),e.jsx("button",{className:"btn btn-ghost btn-sm",style:{"--c":"var(--muted-foreground)"},children:"Batal"})]})]}),e.jsxs("div",{className:"card s-sm",children:[e.jsxs("div",{className:"field",children:[e.jsx("label",{htmlFor:"d1",children:"Nama lokasi"}),e.jsx("input",{className:"inp",id:"d1",placeholder:"mis. Jl. Gajah Mada No. 12"}),e.jsxs("span",{className:"hint",children:["Input: ",e.jsx("span",{className:"mono",children:"rounded-md"}),", border"," ",e.jsx("span",{className:"mono",children:"input"}),", fokus ring ",e.jsx("span",{className:"mono",children:"info"}),"."]})]}),e.jsxs("div",{className:"field",style:{marginTop:16},children:[e.jsx("label",{htmlFor:"d2",children:"Nomor telepon"}),e.jsx("input",{className:"inp err",id:"d2",defaultValue:"08"}),e.jsx("span",{className:"err-msg",children:"Nomor telepon minimal 10 digit."})]})]})]}),e.jsxs("p",{className:"lead",style:{marginTop:16},children:["Error form ikuti pola repo: ",e.jsx("span",{className:"mono",children:"<InputError message=…/>"})," membaca"," ",e.jsx("span",{className:"mono",children:"useForm().errors"}),". Sukses submit selalu picu toast"," ",e.jsx("span",{className:"mono",children:"sonner"})," lewat ",e.jsx("span",{className:"mono",children:"flashMessage()"}),"."]})]}),e.jsxs("section",{id:"penekanan",children:[e.jsxs("div",{className:"eyebrow",children:[e.jsx("span",{className:"n",children:"11"}),e.jsx("span",{className:"t",children:"Aturan Penekanan"})]}),e.jsx("h2",{className:"sec",children:"Satu warna, tiga volume."}),e.jsxs("p",{className:"lead",children:["Ini yang menjaga tampilan “menyatu” sekaligus memberi hierarki di situasi darurat. Bedakan urgensi lewat ",e.jsx("b",{children:"treatment"}),", bukan menambah warna."]}),e.jsxs("div",{className:"grid g3",children:[e.jsxs("div",{className:"card",style:d("destructive"),children:[e.jsx("div",{className:"tag",style:{fontSize:11,fontWeight:800,letterSpacing:".1em",textTransform:"uppercase",color:"hsl(var(--destructive))"},children:"Volume tertinggi"}),e.jsx("h4",{style:{marginTop:10},children:"Solid"}),e.jsx("p",{className:"s",children:"Aksi darurat / berisiko: SOS, tandai selesai, hapus permanen."}),e.jsx("div",{style:{marginTop:14},children:e.jsx("button",{className:"btn btn-solid",children:"Lapor Darurat"})})]}),e.jsxs("div",{className:"card",style:d("destructive"),children:[e.jsx("div",{className:"tag",style:{fontSize:11,fontWeight:800,letterSpacing:".1em",textTransform:"uppercase",color:"hsl(var(--muted-foreground))"},children:"Volume sedang"}),e.jsx("h4",{style:{marginTop:10},children:"Outline"}),e.jsx("p",{className:"s",children:"Aksi sekunder / rutin: hapus item admin, batal, filter."}),e.jsx("div",{style:{marginTop:14},children:e.jsx("button",{className:"btn btn-outline",children:"Hapus"})})]}),e.jsxs("div",{className:"card",style:d("destructive"),children:[e.jsx("div",{className:"tag",style:{fontSize:11,fontWeight:800,letterSpacing:".1em",textTransform:"uppercase",color:"hsl(var(--muted-foreground))"},children:"Volume terendah"}),e.jsx("h4",{style:{marginTop:10},children:"Soft"}),e.jsx("p",{className:"s",children:"Status pasif / label: badge status, chip kategori."}),e.jsx("div",{style:{marginTop:14},children:e.jsx(a,{c:"destructive",children:"Darurat"})})]})]})]}),e.jsxs("section",{id:"dodont",children:[e.jsxs("div",{className:"eyebrow",children:[e.jsx("span",{className:"n",children:"12"}),e.jsx("span",{className:"t",children:"Do & Don't"})]}),e.jsx("h2",{className:"sec",children:"Ringkasan aturan."}),e.jsxs("div",{className:"dd",children:[e.jsxs("div",{className:"box do",children:[e.jsx("div",{className:"tag",children:"Lakukan"}),e.jsxs("ul",{children:[e.jsxs("li",{children:["Pakai token: ",e.jsx("code",{children:"bg-destructive"}),", ",e.jsx("code",{children:"text-success"}),","," ",e.jsx("code",{children:"border-info"}),"."]}),e.jsx("li",{children:"Bedakan penekanan lewat solid / outline / soft."}),e.jsxs("li",{children:["Selesai = ",e.jsx("code",{children:"info"})," (biru/air), Penanganan = ",e.jsx("code",{children:"success"}),"."]}),e.jsxs("li",{children:["Hidran = ",e.jsx("code",{children:"teal"}),", relawan = ",e.jsx("code",{children:"volunteer"}),"."]}),e.jsxs("li",{children:["Rounded naik sesuai bobot; jarak lewat ",e.jsx("code",{children:"gap"}),"."]}),e.jsx("li",{children:"Uji tiap layar di mode terang dan gelap."})]})]}),e.jsxs("div",{className:"box no",children:[e.jsx("div",{className:"tag",children:"Hindari"}),e.jsxs("ul",{children:[e.jsxs("li",{children:["Warna mentah baru: ",e.jsx("code",{children:"bg-red-600"}),", ",e.jsx("code",{children:"text-blue-500"}),", hex."]}),e.jsxs("li",{children:["Pola ",e.jsx("code",{children:"light-mentah / dark:token"})," — sumber tiga-nuansa-merah."]}),e.jsx("li",{children:"Dua merah mirip untuk brand vs bahaya."}),e.jsxs("li",{children:["Hijau ",e.jsx("code",{children:"142"})," murahan untuk “aktif”."]}),e.jsx("li",{children:"Bayangan berat di elemen datar."}),e.jsx("li",{children:"Mencampur dua icon library dalam satu komponen."})]})]})]})]}),e.jsxs("footer",{children:["Sumber token: ",e.jsx("code",{children:"resources/css/app.css"})," · ",e.jsx("code",{children:"tailwind.config.js"})," · konvensi"," ",e.jsx("code",{children:".claude/skills/sisupit-ui/SKILL.md"}),". Keputusan final: brand ",e.jsx("code",{children:"#E0241B"}),", success emerald, selesai biru (air). Halaman referensi — belum mengubah token global aplikasi."]})]})]})]})}export{u as default};

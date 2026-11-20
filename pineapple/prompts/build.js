// Builds shots.html (shareable page) and SHOT_PROMPTS.md from shots.js.
const fs = require('fs');
const path = require('path');
const { LOCKS, FINISHES, SHOTS, WORKFLOW, EXPORT } = require('./shots.js');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad = n => String(n).padStart(2, '0');
const folder = s => s.id === 0 ? 'frames/shot-00/' : `frames/shot-${pad(s.id)}/`;
function shotText(s, fin = FINISHES[0], view = s.views ? s.views[0] : null) {
  let t = s.prompt.replace('{FINISH}', fin[1]).replace('{FINISH_DESC}', fin[2]);
  if (view) t = t.replace('{VIEW}', view[1]);
  return t;
}
function full(s, fin, view) {
  return [LOCKS.style.text, LOCKS[s.device].text, shotText(s, fin, view), 'Avoid: ' + s.avoid].join('\n\n');
}

/* ---------- Markdown ---------- */
let md = `# PINEAPPLE — Shot prompts (shots 0–10)\n\nPrompts for the AI-generated frame sequences in the build plan (§13). Each full prompt is: **style lock + device lock + shot prompt + avoid line**. All names and specs are placeholders.\n\n## Workflow\n\n${WORKFLOW.map((w, i) => `${i + 1}. ${w}`).join('\n')}\n\n## Locks (paste into every prompt)\n\n`;
for (const k of ['style', 'crown', 'slate']) md += `### ${LOCKS[k].title} — ${LOCKS[k].use}\n\n> ${LOCKS[k].text}\n\n`;
md += `### Finishes\n\n| Finish | Description to paste |\n| --- | --- |\n${FINISHES.map(f => `| ${f[1]} | ${f[2]} |`).join('\n')}\n\n## Shots\n\n`;
for (const s of SHOTS) {
  md += `### Shot ${pad(s.id)} · ${s.title}\n\n| | |\n| --- | --- |\n| Used in | ${s.used} |\n| Frames | ${s.frames} |\n| Clip | ${s.clip} |\n| Camera | ${s.camera} |\n| Start frame | ${s.id===0?'Single images':s.start} |\n| End frame | ${s.id===0?'—':s.end} |\n| Device lock | ${LOCKS[s.device].title} |\n| Save to | \`${folder(s)}\` |\n\n`;
  if (s.views) {
    md += `**Prompt** (swap in each finish and view):\n\n> ${s.prompt.replace('{FINISH_DESC}', '{finish description}')}\n\nViews:\n${s.views.map(v => `- **${v[0]}:** ${v[1]}`).join('\n')}\n\n`;
  } else md += `**Prompt:**\n\n> ${s.prompt}\n\n`;
  md += `**Avoid:** ${s.avoid}\n\n`;
  if (s.notes.length) md += s.notes.map(n => `- ${n}`).join('\n') + '\n\n';
}
md += `## Export to frames\n\n\`\`\`bash\n${EXPORT}\n\`\`\`\n\nFor AVIF, export PNG frames the same way and convert them with \`avifenc\`. The prototype loads \`.webp\`; change the extension in its \`Seq.path()\` if you switch.\n`;
fs.writeFileSync(path.join(__dirname, '..', 'SHOT_PROMPTS.md'), md);

/* ---------- HTML ---------- */
const data = { LOCKS, FINISHES, SHOTS: SHOTS.map(s => ({ id: s.id, device: s.device, prompt: s.prompt, avoid: s.avoid, views: s.views || null })) };
const card = s => `
<article class="shot" id="shot-${pad(s.id)}">
  <header><span class="num">${pad(s.id)}</span><h3>${esc(s.title)}</h3><span class="used">${esc(s.used)}</span></header>
  <dl>
    <div><dt>Frames</dt><dd>${esc(s.frames)}</dd></div>
    <div><dt>Clip</dt><dd>${esc(s.clip)}</dd></div>
    <div><dt>Camera</dt><dd>${esc(s.camera)}</dd></div>
    <div class="wide"><dt>Start → end</dt><dd>${s.id===0?'Single images, no start or end frame':esc(s.start)+' → '+esc(s.end)}</dd></div>
    <div class="wide"><dt>Save to</dt><dd><code>${folder(s)}</code></dd></div>
  </dl>
  ${s.views ? `<div class="pickers"><label>Finish <select data-fin="${s.id}">${FINISHES.map((f, i) => `<option value="${i}">${f[1]}</option>`).join('')}</select></label><label>View <select data-view="${s.id}">${s.views.map((v, i) => `<option value="${i}">${esc(v[0])}</option>`).join('')}</select></label></div>` : ''}
  <div class="prompt"><p data-text="${s.id}">${esc(shotText(s))}</p></div>
  <div class="row"><button class="copy" data-copy="${s.id}" type="button">Copy full prompt</button><span class="hint">Includes the style lock, the ${esc(LOCKS[s.device].title)} and the avoid line.</span></div>
  <p class="avoid"><b>Avoid</b> ${esc(s.avoid)}</p>
  ${s.notes.length ? `<ul class="notes">${s.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
</article>`;

const html = `<title>PINEAPPLE Shot Prompts</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&family=JetBrains+Mono:wght@400;600&display=swap">
<style>
/* Layout: a production sheet. One narrow reading column; each shot is a card with its numbers up top and the prompt in a quiet block below. */
:root{
  --bg:#f3f4ee; --surface:#ffffff; --sunk:#eceee6; --fg:#16170f; --mute:#5c5f52; --line:#d9dccf;
  --a1:#5f9a37; --a2:#d99a1e; --code:#24261d;
  --sans:"Inter",ui-sans-serif,system-ui,"Segoe UI",Roboto,Arial,sans-serif; --mono:"JetBrains Mono",ui-monospace,Menlo,Consolas,monospace;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0d0e0a;--surface:#15170f;--sunk:#1b1d15;--fg:#efeee2;--mute:#9c9d8d;--line:#2a2d22;--a1:#86c25a;--a2:#f0b53a;--code:#e9e7da;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#0d0e0a;--surface:#15170f;--sunk:#1b1d15;--fg:#efeee2;--mute:#9c9d8d;--line:#2a2d22;--a1:#86c25a;--a2:#f0b53a;--code:#e9e7da;color-scheme:dark}
*{box-sizing:border-box}
.wrap>*,.shots>*,.locks>*{min-width:0}
body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--sans);font-size:15px;line-height:1.6;-webkit-font-smoothing:antialiased}
.wrap{max-width:860px;margin:0 auto;padding-block:56px 96px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));display:grid;gap:56px}
.label{font-family:var(--mono);font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--mute)}
h1{font-size:clamp(2.2rem,6vw,3.4rem);line-height:1.04;letter-spacing:-.035em;margin:10px 0 14px;text-wrap:balance}
h1 span{background:linear-gradient(92deg,var(--a1),var(--a2));-webkit-background-clip:text;background-clip:text;color:transparent}
h2{font-size:1.35rem;letter-spacing:-.02em;margin:0 0 16px}
.lede{color:var(--mute);max-width:62ch;margin:0}
ol.flow{margin:0;padding-left:1.3em;display:grid;gap:8px;max-width:68ch}
ol.flow li::marker{font-family:var(--mono);color:var(--mute);font-size:.8em}
.locks{display:grid;gap:14px}
.lock{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:16px 18px;display:grid;gap:8px}
.lock .top{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}
.lock h3{margin:0;font-size:1rem}
.lock p{margin:0;font-size:.92rem;color:var(--fg)}
table{width:100%;border-collapse:collapse;font-size:.9rem}
th,td{text-align:left;padding:9px 10px 9px 0;border-bottom:1px solid var(--line);vertical-align:top}
th{font-weight:600;white-space:nowrap}
.shots{display:grid;gap:22px}
.shot{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:20px;display:grid;gap:14px;min-width:0}
.shot header{display:grid;grid-template-columns:auto 1fr;gap:2px 14px;align-items:baseline}
.shot .num{grid-row:span 2;font-family:var(--mono);font-size:1.6rem;font-weight:600;color:var(--a2);font-variant-numeric:tabular-nums}
.shot h3{margin:0;font-size:1.2rem;letter-spacing:-.015em}
.shot .used{color:var(--mute);font-size:.85rem}
dl{margin:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px 18px}
dl .wide{grid-column:1/-1}
dt{font-family:var(--mono);font-size:.66rem;letter-spacing:.12em;text-transform:uppercase;color:var(--mute)}
dd{margin:2px 0 0;font-size:.9rem}
code{font-family:var(--mono);font-size:.84em;background:var(--sunk);padding:1px 6px;border-radius:4px}
.prompt{background:var(--sunk);border-radius:10px;padding:14px 16px}
.prompt p{margin:0;font-size:.95rem;line-height:1.65}
.row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.copy{font:inherit;font-size:.85rem;font-weight:600;border:0;border-radius:999px;padding:7px 14px;background:var(--fg);color:var(--bg);cursor:pointer}
.copy.done{background:var(--a1)}
.hint{color:var(--mute);font-size:.8rem}
.avoid{margin:0;font-size:.88rem;color:var(--mute)}
.avoid b{color:var(--fg);font-weight:600;margin-right:6px}
.notes{margin:0;padding-left:1.1em;display:grid;gap:6px;font-size:.88rem}
.pickers{display:flex;flex-wrap:wrap;gap:14px;font-size:.85rem;color:var(--mute)}
select{font:inherit;color:var(--fg);background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:4px 8px;margin-left:6px}
pre{margin:0;background:var(--sunk);border-radius:10px;padding:14px 16px;overflow-x:auto;font-family:var(--mono);font-size:.8rem;line-height:1.6;color:var(--code)}
:focus-visible{outline:2px solid var(--a2);outline-offset:2px}
@media (max-width:600px){dl{grid-template-columns:1fr 1fr}.shot{padding:16px}}
</style>
<main class="wrap">
  <header>
    <p class="label">PINEAPPLE · Build plan §13</p>
    <h1>Shot prompts, <span>0 to 10</span></h1>
    <p class="lede">Prompts for every AI-generated frame sequence on the site. A full prompt is the style lock, the device lock, the shot prompt and its avoid line; the copy buttons put all four together. All product names and specs are placeholders.</p>
  </header>
  <section><h2>Workflow</h2><ol class="flow">${WORKFLOW.map(w => `<li>${esc(w)}</li>`).join('')}</ol></section>
  <section><h2>Locks</h2><div class="locks">
    ${['style', 'crown', 'slate'].map(k => `<div class="lock"><div class="top"><h3>${LOCKS[k].title}</h3><span class="label">${LOCKS[k].use}</span></div><p>${esc(LOCKS[k].text)}</p><div class="row"><button class="copy" data-lock="${k}" type="button">Copy</button></div></div>`).join('')}
    <div class="lock"><div class="top"><h3>Finishes</h3><span class="label">Shot 0</span></div>
      <div style="overflow-x:auto"><table><tbody>${FINISHES.map(f => `<tr><th>${f[1]}</th><td>${esc(f[2])}</td></tr>`).join('')}</tbody></table></div></div>
  </div></section>
  <section><h2>Shots</h2><div class="shots">${SHOTS.map(card).join('')}</div></section>
  <section><h2>Export to frames</h2><pre>${esc(EXPORT)}</pre><p class="lede" style="margin-top:12px">For AVIF, export PNG frames the same way and convert them with avifenc. The prototype loads .webp from these folders and falls back to its placeholder when a frame is missing.</p></section>
</main>
<script>
const D=${JSON.stringify(data)};
const pick={};
function text(s){const f=D.FINISHES[pick['f'+s.id]||0];const v=s.views?s.views[pick['v'+s.id]||0]:null;let t=s.prompt.replace('{FINISH}',f[1]).replace('{FINISH_DESC}',f[2]);if(v)t=t.replace('{VIEW}',v[1]);return t;}
function full(s){return[D.LOCKS.style.text,D.LOCKS[s.device].text,text(s),'Avoid: '+s.avoid].join('\\n\\n');}
async function copy(btn,str){try{await navigator.clipboard.writeText(str);btn.textContent='Copied';btn.classList.add('done');setTimeout(()=>{btn.textContent=btn.dataset.lock?'Copy':'Copy full prompt';btn.classList.remove('done');},1600);}
  catch(e){const p=btn.closest('.shot,.lock').querySelector('p');const r=document.createRange();r.selectNodeContents(p);const sel=getSelection();sel.removeAllRanges();sel.addRange(r);btn.textContent='Selected · press Ctrl+C';}}
document.addEventListener('click',e=>{const b=e.target.closest('.copy');if(!b)return;if(b.dataset.lock)copy(b,D.LOCKS[b.dataset.lock].text);else copy(b,full(D.SHOTS.find(s=>s.id==b.dataset.copy)));});
document.addEventListener('change',e=>{const t=e.target;const id=t.dataset.fin??t.dataset.view;if(id==null)return;pick[(t.dataset.fin!=null?'f':'v')+id]=+t.value;const s=D.SHOTS.find(x=>x.id==id);document.querySelector('[data-text="'+id+'"]').textContent=text(s);});
</script>
`;
fs.writeFileSync(path.join(__dirname, '..', 'shots.html'), html);
console.log('wrote shots.html and SHOT_PROMPTS.md');

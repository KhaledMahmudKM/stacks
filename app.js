const SUN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const MOON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
const ARROW='<svg class="arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7M9 7h8v8"/></svg>';

// ---- theme ----
const root=document.documentElement, themeBtn=document.getElementById('theme');
function setTheme(t){root.setAttribute('data-theme',t);themeBtn.innerHTML=t==='light'?MOON:SUN}
setTheme(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
themeBtn.onclick=()=>setTheme(root.getAttribute('data-theme')==='light'?'dark':'light');

// ---- escape helper (data is user-maintained, keep it safe) ----
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

// ---- elements ----
const filtersEl=document.getElementById('filters');
const groupsEl=document.getElementById('groups');
const emptyEl=document.getElementById('empty');
const qEl=document.getElementById('q');

let DATA=[], active='All';

function card(it){
  return `<a class="card" href="${esc(it.u)}" target="_blank" rel="noopener">
    <div class="card-top"><h3>${esc(it.t)}</h3>${ARROW}</div>
    <p>${esc(it.d)}</p>
    <div class="slug">/<b>${esc(it.s)}</b></div>
  </a>`;
}

function render(){
  const q=qEl.value.trim().toLowerCase();
  let shown=0;
  groupsEl.innerHTML=DATA.map(g=>{
    if(active!=='All'&&active!==g.cat) return '';
    const items=g.items.filter(it=>!q||(it.t+' '+it.d+' '+it.s).toLowerCase().includes(q));
    if(!items.length) return '';
    shown+=items.length;
    return `<section class="group">
      <div class="group-head"><h2>${esc(g.cat)}</h2><span class="rule"></span><span class="count">${items.length}</span></div>
      <div class="grid">${items.map(card).join('')}</div>
    </section>`;
  }).join('');
  emptyEl.classList.toggle('show',shown===0);
}

function buildFilters(){
  const allItems=DATA.flatMap(g=>g.items);
  const cats=['All',...DATA.map(g=>g.cat)];
  filtersEl.innerHTML='';
  cats.forEach(c=>{
    const b=document.createElement('button');
    b.className='chip'+(c==='All'?' active':'');
    const n=c==='All'?allItems.length:DATA.find(g=>g.cat===c).items.length;
    b.innerHTML=esc(c)+'<span class="n">'+n+'</span>';
    b.onclick=()=>{active=c;[...filtersEl.children].forEach(x=>x.classList.remove('active'));b.classList.add('active');render()};
    filtersEl.appendChild(b);
  });
}

function fillMeta(meta){
  if(!meta) return;
  if(meta.tagline) document.getElementById('lede').textContent=meta.tagline;
  const foot=[meta.updated?'Last update: '+meta.updated:'',meta.author?'© '+meta.author:''].filter(Boolean).join(' · ');
  if(foot) document.getElementById('foot-meta').textContent=foot;
}

function fillStats(){
  const allItems=DATA.flatMap(g=>g.items);
  document.getElementById('stat-total').textContent=allItems.length;
  const books=DATA.find(g=>/book/i.test(g.cat));
  const tools=DATA.find(g=>!/book/i.test(g.cat));
  document.getElementById('stat-books').textContent=books?books.items.length:0;
  document.getElementById('stat-tools').textContent=tools?tools.items.length:0;
}

function fillStructuredData(){
  const el=document.getElementById('ld-itemlist');
  if(!el) return;
  let pos=0;
  const elements=[];
  DATA.forEach(g=>g.items.forEach(it=>{
    elements.push({
      "@type":"ListItem",
      "position":++pos,
      "url":it.u,
      "name":it.t,
      "description":it.d
    });
  }));
  const ld={
    "@context":"https://schema.org",
    "@type":"ItemList",
    "name":"stacks — site directory",
    "numberOfItems":pos,
    "itemListElement":elements
  };
  el.textContent=JSON.stringify(ld);
}

// ---- load data ----
fetch('data.json')
  .then(r=>{ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
  .then(json=>{
    DATA=json.groups||[];
    fillMeta(json.meta);
    fillStats();
    fillStructuredData();
    buildFilters();
    render();
  })
  .catch(err=>{
    groupsEl.innerHTML='';
    emptyEl.textContent='// could not load data.json — '+err.message;
    emptyEl.classList.add('show');
  });

// ---- keyboard: "/" focuses search, Esc clears ----
addEventListener('keydown',e=>{
  if(e.key==='/'&&document.activeElement!==qEl){e.preventDefault();qEl.focus()}
  if(e.key==='Escape'&&document.activeElement===qEl){qEl.value='';render();qEl.blur()}
});

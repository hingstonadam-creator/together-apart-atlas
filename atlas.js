const byId = id => document.getElementById(id);
const esc = value => String(value ?? 'Unknown').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const drivers = ['Define','Extend','Mediate'];
const lenses = ['Adaptable layouts','Dwelling relationships','Shared circulation','Independence and community'];
const fields = {location:'Location',mix:'Dwelling mix',access:'Access strategy',shared:'Shared spaces',evidence:'Documented evidence',quality:'Evidence quality',interpretation:'Tentative interpretation',implication:'Southwark drawing test',question:'Open question'};
let records = [];

function options(id, first, values) {
  byId(id).replaceChildren(new Option(first,''));
  values.forEach(value => byId(id).add(new Option(value,value)));
}
const questions = [
  ['What is it?', 'Identify the source and its context.'],
  ['Why is it relevant?', 'Locate the point within the housing enquiry.'],
  ['What did I learn?', 'Identify the finding and its evidence.'],
  ['What does it challenge?', 'Name the assumption the finding calls into question.'],
  ['What does it connect to?', 'Explain the relationship to another point, drawing or test.'],
  ['What could architecture do with this?', 'Propose a spatial decision that a drawing can test.']
];
byId('framework').innerHTML = questions.map(([q,hint])=>'<li><strong>'+q+'</strong><span>'+hint+'</span></li>').join('');
const colours = ['#a95d46','#687f70','#516f8c','#aa8a48','#796981','#766c5d','#547c82','#93706a','#716f40','#9c8278'];
let chartFilter = '';
function drawChart(rows) {
  const metric = byId('metric').value;
  const groups = new Map();
  for (const row of rows) {
    const key = row[metric] || 'Unrecorded';
    groups.set(key,(groups.get(key)||0)+1);
  }
  let angle = -Math.PI/2;
  const slices=[], legend=[];
  for (const [label,count] of groups) {
    const fraction = count/rows.length;
    const colour = colours[legend.length % colours.length];
    const end = angle + 2*Math.PI*fraction;
    const point = a => (100+96*Math.cos(a))+','+(100+96*Math.sin(a));
    const shape = fraction===1 ? 'M100,4a96,96 0 1,1 0,192a96,96 0 1,1 0,-192Z' : 'M100,100L'+point(angle)+'A96,96 0 '+(fraction>0.5?1:0)+' 1 '+point(end)+'Z';
    slices.push('<path d="'+shape+'" fill="'+colour+'" opacity="'+(!chartFilter||chartFilter===label?1:.35)+'" stroke="var(--paper)" data-category="'+esc(label)+'"><title>'+esc(label)+' · '+count+'</title></path>');
    legend.push('<button data-category="'+esc(label)+'" aria-pressed="'+(chartFilter===label)+'"><span class="swatch" style="background:'+colour+'"></span>'+esc(label)+' · '+count+'</button>');
    angle=end;
  }
  byId('chart').innerHTML=slices.join('');
  byId('legend').innerHTML=legend.join('');
  byId('clearMetric').hidden=!chartFilter;
  byId('clearMetric').textContent='Clear filter'+(chartFilter?' · '+chartFilter:'');
}
document.querySelector('.plot').addEventListener('click',event=>{
  const item=event.target.closest('[data-category]');
  if (!item && event.target.id!=='clearMetric') return;
  chartFilter=item && chartFilter!==item.dataset.category ? item.dataset.category : '';
  research();
  if(item?.tagName==='BUTTON') [...byId('legend').children].find(b=>b.dataset.category===item.dataset.category)?.focus();
});
byId('metric').onchange=()=>{chartFilter='';research()};

function entry(record) {
  const terms = Object.entries(fields).map(([key,title]) => '<dt>'+title+'</dt><dd>'+esc(record[key])+'</dd>').join('');
  const answers=record.answers || [record.location+' · '+record.type, null, record.evidence, null, null, record.implication];
  const answerList=questions.map(([title],i)=>'<li><strong>'+title+'</strong><p>'+esc(answers[i] || 'Not yet recorded')+'</p></li>').join('');
  const quote=record.quote ? '<blockquote>'+esc(record.quote)+'<cite> — '+esc(record.author)+(record.quoteLocation?', '+esc(record.quoteLocation):'')+'</cite></blockquote>' : '';
  return '<details><summary><small>'+esc(record.number ? 'Data point '+record.number : 'Data point number unrecorded')+'</small>'+esc(record.title)+'<span>'+'Type · '+esc(record.type)+' / Method · '+esc(record.method || 'Not yet recorded')+'</span></summary><div class="entry"><p>'+esc(record.author)+'</p><h3>Key insight</h3><p>'+esc(record.insight || record.interpretation)+'</p>'+quote+'<ol class="answers">'+answerList+'</ol><details><summary>Evidence and spatial details</summary><dl>'+terms+'</dl></details><p><a href="'+esc(record.url)+'" target="_blank" rel="noopener">Original source ↗</a></p></div></details>';
}
function research() {
  const term = byId('search').value.trim().toLowerCase();
  const lens = byId('lens').value;
  const base = records.filter(r =>
    (!lens || r.lenses.includes(lenses.indexOf(lens))) &&
    (!byId('driver').value || byId('driver').value === r.driver) &&
    (!byId('kind').value || byId('kind').value === r.type) &&
    Object.values(r).join(' ').toLowerCase().includes(term));
  drawChart(base);
  const rows = base.filter(r=>!chartFilter || (r[byId('metric').value]||'Unrecorded')===chartFilter);
  byId('results').innerHTML = rows.map(entry).join('');
  byId('count').textContent = rows.length ? rows.length+' of '+records.length+' sources' : 'No matches. Change the search or filters.';
}
document.querySelector('.filters').addEventListener('change',research);
byId('search').addEventListener('input',research);
async function loadResearch() {
  try {
    const response = await fetch('../research.json');
    if (!response.ok) throw Error('Missing collection');
    records = await response.json();
    options('lens','All research lenses',lenses);
    options('driver','All drivers',drivers);
    options('kind','All source types',[...new Set(records.map(r=>r.type))].sort());
    byId('status').textContent='';
    research();
  } catch { byId('status').innerHTML = 'The research collection could not load. <button type="button">Retry</button>'; byId('status').querySelector('button').onclick=loadResearch; }
}
loadResearch();

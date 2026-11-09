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
function categoryMatches(record, metric, category) {
  if (metric === 'matrix') {
    const [driver, lens] = category.split('|');
    return record.driver === driver && record.lenses.includes(Number(lens));
  }
  return (record[metric] || 'Unrecorded') === category;
}
// Group common grammatical forms of the same architectural term.
const vocabulary = [
  ['Access', /\baccess(?:ible|ibility)?\b/i],
  ['Adaptability', /\badapt(?:able|ation|ability|ive)?\b/i],
  ['Balcony', /\bbalcon(?:y|ies)\b/i],
  ['Care', /\bcare(?:rs?|giving)?\b/i],
  ['Circulation', /\bcirculation\b/i],
  ['Cluster', /\bclusters?\b/i],
  ['Cohousing', /\bco-?housing\b/i],
  ['Community', /\bcommunit(?:y|ies)\b/i],
  ['Courtyard', /\bcourtyards?\b/i],
  ['Entry', /\b(?:entr(?:y|ies|ance|ances)|front doors?)\b/i],
  ['Garden', /\bgardens?\b/i],
  ['Gallery', /\bgaller(?:y|ies)\b/i],
  ['Independence', /\bindependen(?:t|ce|tly)\b/i],
  ['Landing', /\blandings?\b/i],
  ['Laundry', /\blaundr(?:y|ies)\b/i],
  ['Lift', /\blifts?\b/i],
  ['Privacy', /\bpriva(?:cy|te|tely)\b/i],
  ['Shared space', /\bshared (?:spaces?|areas?|facilities|amenities|domestic facilities)\b/i],
  ['Terrace', /\bterraces?\b/i],
  ['Threshold', /\bthresholds?\b/i],
  ['Walkway', /\bwalkways?\b/i]
];
function keywordsFor(record) {
  const content = [record.title,record.mix,record.access,record.shared,record.evidence,
    record.insight,record.interpretation,record.implication,record.question,...(record.answers || [])].join(' ');
  return vocabulary.filter(([,pattern])=>pattern.test(content)).map(([word])=>word);
}
function collectionSummary() {
  const categories = key => [...new Set(records.map(r=>r[key]).filter(Boolean))].sort();
  const methods = categories('method');
  const missing = records.filter(r=>!r.method).length;
  const countries = categories('country');
  const stats = [
    [records.length,'Research points',records.filter(r=>r.number!=null).length+' numbered in the register'],
    [categories('type').length,'Source types',categories('type').join(' · ')],
    [methods.length,'Recorded methods', [...methods, ...(missing?[missing+' points without a recorded method']:[])].join(' · ')],
    [countries.length,'Countries represented', records.filter(r=>r.country==='Australia').length+' points from Australia']
  ];
  byId('collection-summary').innerHTML = stats.map(([n,label,note])=>'<div><dt>'+esc(label)+'</dt><dd><strong>'+n+'</strong><span>'+esc(note)+'</span></dd></div>').join('');
}
let matrixFilter = '';
let keywordFilter = '';
let keywordIndex = new Map();
function keywordCloud(rows) {
  const counts = new Map();
  for (const row of rows) {
    for (const word of keywordIndex.get(row.id)) counts.set(word,(counts.get(word)||0)+1);
  }
  const max = Math.max(1,...counts.values());
  return [...counts].sort(([a],[b])=>a.localeCompare(b)).map(([word,count])=>
    '<button data-word="'+esc(word)+'" aria-label="'+esc(word)+', '+count+' data points" aria-pressed="'+(word===keywordFilter)+'" style="--weight:'+Math.sqrt(count/max).toFixed(3)+'">'+esc(word)+' <small>'+count+'</small></button>').join('') || '<p>No indexed keywords in these results.</p>';
}
function bindExplorer(id,attribute,select) {
  byId(id).addEventListener('click',event=>{
    const button=event.target.closest('button['+attribute+']');
    if (!button) return;
    const key=button.getAttribute(attribute);
    select(key);
    research();
    [...byId(id).querySelectorAll('button')].find(b=>b.getAttribute(attribute)===key)?.focus();
  });
}
bindExplorer('driver-matrix','data-category',key=>{matrixFilter=matrixFilter===key?'':key});
bindExplorer('keyword-cloud','data-word',word=>{keywordFilter=keywordFilter===word?'':word});
byId('clearExplorers').onclick=()=>{matrixFilter='';keywordFilter='';research()};

function matrixView(rows) {
  const cells = lenses.map((lens, index) => {
    const values = drivers.map(driver => {
      const key = driver+'|'+index;
      const count = rows.filter(r=>categoryMatches(r,'matrix',key)).length;
      return {key,driver,count};
    });
    return {lens,values};
  });
  const max = Math.max(1,...cells.flatMap(row=>row.values.map(cell=>cell.count)));
  const headers = drivers.map(d=>'<th scope="col">'+d+'</th>').join('');
  const body = cells.map(({lens,values}) => '<tr><th scope="row">'+lens+'</th>'+values.map(({key,driver,count})=>
    '<td><button data-category="'+key+'" aria-label="'+driver+' and '+lens+', '+count+' sources" aria-pressed="'+(matrixFilter===key)+'" style="--shade:'+count/max*.55+'" '+(!count?'disabled':'')+'>'+count+'</button></td>'
  ).join('')+'</tr>').join('');
  return '<p>Select a cell to find sources addressing both a design driver and a research lens. A source can appear under several lenses.</p><div class="matrix-frame"><table class="lens-matrix"><thead><tr><th>Research lens</th>'+headers+'</tr></thead><tbody>'+body+'</tbody></table></div>';
}
function countryView(rows) {
  const counts = new Map();
  for (const r of rows) {
    const country = r.country || 'Unrecorded';
    counts.set(country,(counts.get(country)||0)+1);
  }
  const ranked = [...counts].sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0]));
  const bars = ranked.map(([country,count])=>'<button data-category="'+esc(country)+'" aria-pressed="'+(chartFilter===country)+'"><span>'+esc(country)+'</span><span class="track"><i style="width:'+100*count/ranked[0][1]+'%"></i></span><strong>'+count+'</strong></button>').join('');
  return '<p>Select a country to see the projects and publications recorded there. Bar length shows the number of sources in this collection.</p><div class="country-bars">'+(bars || 'No countries match the current filters.')+'</div>';
}
function drawChart(rows) {
  const metric = byId('metric').value;
  const explorer = byId('explorer');
  const special = metric==='country';
  explorer.hidden = !special;
  document.querySelector('.plot').classList.toggle('explore-plot',special);
  byId('chart').style.display = special ? 'none' : '';
  byId('legend').hidden = special;
  byId('clearMetric').hidden = !chartFilter;
  byId('clearMetric').textContent='Clear filter · '+chartFilter;
  if (special) {
    explorer.innerHTML = countryView(rows);
    return;
  }
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

}
document.querySelector('.plot').addEventListener('click',event=>{
  const item=event.target.closest('[data-category]');
  if (!item && event.target.id!=='clearMetric') return;
  chartFilter=item && chartFilter!==item.dataset.category ? item.dataset.category : '';
  research();
  if(item?.tagName==='BUTTON') [...document.querySelectorAll('.plot button[data-category]')].find(b=>b.dataset.category===item.dataset.category)?.focus();
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
  const matchesChart = r=>!chartFilter || categoryMatches(r,byId('metric').value,chartFilter);
  const matchesMatrix = r=>!matrixFilter || categoryMatches(r,'matrix',matrixFilter);
  const matchesWord = r=>!keywordFilter || keywordIndex.get(r.id).includes(keywordFilter);
  drawChart(base.filter(r=>matchesMatrix(r) && matchesWord(r)));
  byId('driver-matrix').innerHTML=matrixView(base.filter(r=>matchesChart(r) && matchesWord(r)));
  byId('keyword-cloud').innerHTML=keywordCloud(base.filter(r=>matchesChart(r) && matchesMatrix(r)));
  const rows=base.filter(r=>matchesChart(r) && matchesMatrix(r) && matchesWord(r));
  const [driver,lensIndex]=matrixFilter.split('|');
  byId('activeExplorers').textContent=[matrixFilter && driver+' / '+lenses[lensIndex],keywordFilter].filter(Boolean).join(' · ');
  byId('clearExplorers').hidden=!(matrixFilter || keywordFilter);
  byId('showMatches').hidden=!(chartFilter || matrixFilter || keywordFilter);
  byId('showMatches').textContent = 'View '+rows.length+' matching '+(rows.length===1?'source':'sources')+' ↓';
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
    keywordIndex = new Map(records.map(r=>[r.id,keywordsFor(r)]));
    collectionSummary();
    options('lens','All research lenses',lenses);
    options('driver','All drivers',drivers);
    options('kind','All source types',[...new Set(records.map(r=>r.type))].sort());
    byId('status').textContent='';
    research();
  } catch { byId('status').innerHTML = 'The research collection could not load. <button type="button">Retry</button>'; byId('status').querySelector('button').onclick=loadResearch; }
}
loadResearch();

const byId = id => document.getElementById(id);
const esc = value => String(value ?? 'Unknown').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const drivers = ['Define','Extend','Mediate'];
const lenses = ['Adaptable layouts','Dwelling relationships','Shared circulation','Independence and community'];
const fields = {location:'Location',mix:'Dwelling mix',access:'Access strategy',shared:'Shared spaces',evidence:'Documented evidence',quality:'Recorded reliability',information:'Information collected',connectionNote:'Connection note',themes:'Themes',threads:'Research threads',collections:'Exegesis collection',interpretation:'Tentative interpretation',implication:'Southwark drawing test',question:'Open question'};
let records = [];
const wideResearchLayout = window.matchMedia('(min-width: 761px)');


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
    return (record.drivers || [record.driver]).includes(driver) && record.lenses.includes(Number(lens));
  }
  return (record[metric] || 'Unrecorded') === category;
}
// Group common grammatical forms of the same architectural term.
const vocabulary = [
  ['Data centre', /\bdata cent(?:re|er)s?\b/i],
  ['Heat recovery', /\b(?:heat recovery|waste heat|recovered heat)\b/i],
  ['Cooling', /\bcooling\b/i],
  ['Energy', /\benerg(?:y|ies)\b/i],
  ['Thermal comfort', /\bthermal comfort\b/i],
  ['Water', /\bwater\b/i],
  ['Fabrication', /\b(?:fabrication|3d print(?:ing|ed)?)\b/i],
  ['Terracotta', /\bterracotta\b/i],
  ['Material', /\bmaterials?\b/i],
  ['Sensors', /\bsensors?\b/i],
  ['Public space', /\bpublic (?:space|realm|edge)s?\b/i],
  ['Research', /\b(?:research|living lab(?:oratory)?|prototype)s?\b/i],
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
    record.insight,record.information,record.interpretation,record.implication,record.question,...(record.themes || []),...(record.threads || []),...(record.keywords || []),...(record.answers || [])].join(' ');
  return vocabulary.filter(([,pattern])=>pattern.test(content)).map(([word])=>word);
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
  return '<p>Select a cell to find sources addressing both a design driver and a research lens. Housing lenses are indexed from the recorded text. Design strategies follow the recorded Notion tags. Entries without a matching label or housing lens are excluded from this matrix.</p><div class="matrix-frame"><table class="lens-matrix"><thead><tr><th>Research lens</th>'+headers+'</tr></thead><tbody>'+body+'</tbody></table></div>';
}
function drawChart(rows) {
  const metric = byId('metric').value;
  byId('clearMetric').hidden = !chartFilter;
  byId('clearMetric').textContent='Clear filter · '+chartFilter;
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

const collectedFormat = new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'short',year:'numeric',timeZone:'Australia/Adelaide'});
function entry(record) {
  const entryLabel = record.number == null ? 'Data point · number not recorded' : 'Data point '+record.number;
  const collected = record.dateCollected ? '<time datetime="'+esc(record.dateCollected)+'">'+collectedFormat.format(new Date(record.dateCollected.length === 10 ? record.dateCollected+'T00:00:00Z' : record.dateCollected))+'</time>' : 'Not recorded';
  return '<details id="source-'+esc(record.id)+'"><summary><small>'+esc(entryLabel)+'</small>'+esc(record.title)+'<span>'+'Type · '+esc(record.type)+' / Method · '+esc(record.method || 'Not yet recorded')+' / Date collected · '+collected+'</span></summary></details>';
}
function entryBody(record) {
  if (record.indexOnly) return '<article class="entry">'+tagDetails(record)+'<p>The full research entry is pending publication.</p><p><a href="#atlas-title">Return to top ↑</a></p></article>';
  const reference = record.exegesisNumber ? '<p>Exegesis manuscript reference · R'+esc(record.exegesisNumber)+'</p>' : '';
  const source = record.url ? '<a href="'+esc(record.url)+'" target="_blank" rel="noopener">Original source ↗</a>' : 'Source recorded in the Graduate Project register. No public link supplied.';
  const notion = record.notionPageId ? '<a href="'+esc(atlasNotionUrl(record))+'" target="_blank" rel="noopener">Open in Notion ↗</a>' : 'Notion page ID not recorded.';
  const terms = Object.entries(fields).map(([key,title]) => '<dt>'+title+'</dt><dd>'+atlasText(record[key], 'Unknown')+'</dd>').join('');
  const answers=record.answers || [record.location+' · '+record.type, null, record.evidence, null, null, record.implication];
  const answerList=questions.map(([title],i)=>'<li><strong>'+title+'</strong><p>'+esc(answers[i] || 'Not yet recorded')+'</p></li>').join('');
  const quote=record.quote ? '<blockquote>'+esc(record.quote)+'<cite> — '+esc(record.author)+(record.quoteLocation?', '+esc(record.quoteLocation):'')+'</cite></blockquote>' : '';
  const verified = atlasEvidenceBlock('Verified finding',record.insight,'verified','The recorded Key Insight is shown separately from interpretation.');
  const interpretation = atlasEvidenceBlock('Tentative interpretation',record.interpretation,'interpretation','This is an application or reading of the evidence, not the evidence itself.');
  const implication = atlasEvidenceBlock('Design implication',record.implication,'implication','A proposed spatial consequence to test in plan or section.');
  const openQuestion = atlasEvidenceBlock('Open question',record.question,'question','Not yet recorded where the register leaves this field blank.');
  return '<article class="entry">'+verified+tagDetails(record)+'<p>'+esc(record.author)+'</p>'+reference+(record.context?'<p>'+esc(record.context)+'</p>':'')+quote+'<p>'+source+' &nbsp; '+notion+'</p>'+implication+'<details class="entry-questions" '+(wideResearchLayout.matches?'open':'')+'><summary>Six questions and answers</summary><ol class="answers">'+answerList+'</ol></details><div class="entry-evidence-sections">'+interpretation+openQuestion+'</div><details><summary>Evidence and spatial details</summary><dl>'+terms+'</dl></details>'+
    '<p><a href="#atlas-title">Return to top ↑</a></p></article>';
}
// Load the article when opened; the full numbered register stays available.
byId('results').addEventListener('toggle', event => {
  const panel = event.target;
  if (!panel.open || panel.parentElement !== byId('results') || panel.querySelector('article')) return;
  const record = records.find(row => panel.id === 'source-'+row.id);
  if (record) panel.insertAdjacentHTML('beforeend', entryBody(record));
}, true);
const selectedNodes = new Map();
let displayedRows = [];
let matchingIds = new Set();

function toggleNode(group,value) {
  const key = group+'|'+value;
  if (selectedNodes.delete(key)) return;
  let label = value;
  let matches;
  if (group==='source') {
    const source = records.find(row=>row.id===value);
    const themes = new Set(source.projectRelevance || []);
    const sourceDrivers = new Set(atlasDrivers(source));
    label = 'Point '+(source.number ?? source.title);
    matches = row=>row.id===value || (row.projectRelevance || []).some(theme=>themes.has(theme)) ||
      atlasDrivers(row).some(driver=>sourceDrivers.has(driver));
  } else if (group==='driver') {
    matches = row=>atlasDrivers(row).includes(value);
  } else {
    matches = row=>atlasThemesFor(row).includes(value);
  }
  selectedNodes.set(key,{label,matches});
}
let allThemes = [];
function research() {
  const term = byId('atlas-search').value.trim().toLowerCase();
  const selections = [...selectedNodes.values()];
  const matchAll = byId('theme-match').value === 'all';
  const driverFilter = byId('driver').value;
  const lens = byId('lens').value;
  const kind = byId('kind').value;
  const pool = records.filter(record =>
    (!term || atlasSearchable(record).includes(term)) &&
    (!driverFilter || record.designStrategy.includes(driverFilter)) &&
    (!lens || record.lenses.includes(lenses.indexOf(lens))) &&
    (!kind || record.type === kind));
  const base = pool.filter(row=>!selections.length || (matchAll ? selections.every(node=>node.matches(row)) : selections.some(node=>node.matches(row))));
  const matchesChart = r=>!chartFilter || categoryMatches(r,byId('metric').value,chartFilter);
  const matchesMatrix = r=>!matrixFilter || categoryMatches(r,'matrix',matrixFilter);
  const matchesWord = r=>!keywordFilter || keywordIndex.get(r.id).includes(keywordFilter);
  drawChart(base.filter(r=>matchesMatrix(r) && matchesWord(r)));
  byId('driver-matrix').innerHTML=matrixView(base.filter(r=>matchesChart(r) && matchesWord(r)));
  byId('keyword-cloud').innerHTML=keywordCloud(base.filter(r=>matchesChart(r) && matchesMatrix(r)));
  const otherFilters = r=>matchesChart(r) && matchesMatrix(r) && matchesWord(r);
  const rows=base.filter(otherFilters);
  matchingIds = new Set(rows.map(row=>row.id));
  displayedRows = rows;
  byId('node-selections').innerHTML = [...selectedNodes].map(([key,node])=>
    '<button type="button" data-remove-node="'+esc(key)+'" aria-label="Remove '+esc(node.label)+'">'+esc(node.label)+' ×</button>').join('');
  const [driver,lensIndex]=matrixFilter.split('|');
  byId('activeExplorers').textContent=[matrixFilter && driver+' / '+lenses[lensIndex],keywordFilter].filter(Boolean).join(' · ');
  byId('clearExplorers').hidden=!(matrixFilter || keywordFilter);
  const filters = [term, selections.map(node=>node.label).join(matchAll ? ' AND ' : ' OR '), driverFilter, lens, kind, chartFilter, matrixFilter && driver+' / '+lenses[lensIndex], keywordFilter].filter(Boolean);
  const count = rows.length+' of '+records.length+' matching points';
  byId('chart-status').textContent = [count,...filters].join(' · ');
  byId('atlas-clear').hidden = filters.length === 0;
  if (!matchingIds.has(selectedId)) selectedId = rows[0]?.id;
  renderNetwork();

}
document.querySelector('.filters').addEventListener('change',research);
let selectedId;
function clearFilters() {
  for (const id of ['atlas-search','driver','lens','kind']) byId(id).value = '';
  selectedNodes.clear();
  byId('theme-match').value = 'all';
  chartFilter = matrixFilter = keywordFilter = '';
  research();
}
byId('add-tag').onchange = event => {
  const value=event.target.value;
  const group=drivers.includes(value)?'driver':'atlas-theme';
  if(value && !selectedNodes.has(group+'|'+value)) toggleNode(group,value);
  event.target.value='';
  research();
};
byId('node-selections').addEventListener('click', event=>{
  const button=event.target.closest('[data-remove-node]');
  if(button) {
    selectedNodes.delete(button.dataset.removeNode);
    research();
    byId('add-tag').focus();
  }
});
byId('atlas-clear').onclick = clearFilters;
byId('atlas-search').oninput = research;
byId('driver').onchange = byId('theme-match').onchange = research;
const atlasDriverColours = {Define:'#a95d46',Extend:'#687f70',Mediate:'#516f8c'};


function atlasText(value, fallback='Not yet recorded') {
  if (Array.isArray(value)) {
    const values = value.filter(item => item !== null && item !== undefined && String(item).trim() !== '');
    return values.length ? esc(values.join(' · ')) : esc(fallback);
  }
  return value !== null && value !== undefined && String(value).trim() !== '' ? esc(value) : esc(fallback);
}
function atlasDrivers(record) {
  return (record.designStrategy || []).filter(tag=>drivers.includes(tag));
}
function atlasThemesFor(record) {
  return record.projectRelevance || [];
}
function tagDetails(record) {
  return '<dl class="record-tags"><dt>Project Relevance</dt><dd>'+atlasText(record.projectRelevance,'Unrecorded')+'</dd><dt>Design Strategy</dt><dd>'+atlasText(record.designStrategy,'Unrecorded')+'</dd></dl>';
}
function atlasNotionUrl(record) {
  const pageId = record.notionPageId || '';
  return pageId ? 'https://www.notion.so/'+pageId.split('-').join('') : '';
}
function atlasEvidenceBlock(label,value,kind,note) {
  const missing = value === null || value === undefined || (Array.isArray(value) && !value.length) || String(value).trim() === '';
  return '<section class="atlas-evidence-card '+kind+(missing?' placeholder':'')+'"><h4>'+esc(label)+(missing?' <span class="atlas-placeholder-label">PLACEHOLDER</span>':'')+'</h4><p>'+atlasText(value)+'</p><small>'+esc(note)+'</small></section>';
}
function atlasSearchable(record) {
  return Object.values(record).map(value => Array.isArray(value) ? value.join(' ') : value || '').join(' ').toLowerCase();
}
function renderSelection() {
  const record = displayedRows.find(row => row.id === selectedId);
  const detail = byId('atlas-detail');
  if (!record) {
    detail.textContent = 'No matching sources. Clear a filter to broaden the network.';
    return;
  }
  detail.innerHTML = '<p class="eyebrow">Selected source · '+esc(record.number ?? 'Unnumbered')+'</p><h3>'+esc(record.title)+'</h3><p>'+atlasText(record.insight || record.evidence,record.indexOnly?'Full entry pending publication.':'Not recorded')+'</p>'+tagDetails(record)+'<a href="#source-'+esc(record.id)+'">Read the full entry →</a>';
}
byId('atlas-detail').addEventListener('click',event => {
  if (event.target.closest('a')) byId('source-'+selectedId).open = true;
});
function atlasPreview(record) {
  if (!record) return;
  const finding = record.insight || record.evidence || 'Verified finding not yet recorded.';
  const driver = atlasDrivers(record).map(item => item.toUpperCase()).join(' · ') || 'No driver recorded';
  byId('atlas-preview').innerHTML = '<p class="eyebrow">'+esc(record.number == null ? 'Data point' : 'Data point '+record.number)+'</p><strong>'+esc(record.title)+'</strong><p>'+esc(finding)+'</p><small>'+esc(driver)+'</small>';
  byId('atlas-preview').hidden = false;
}
function hideAtlasPreview() {
  byId('atlas-preview').hidden = true;
}
const network = byId('atlas-map');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const compactNetwork = matchMedia('(max-width: 820px), (pointer: coarse)');
const positions = new Map();
let simulation;
let animation;
let inView = true;
let dragged;
let suppressClick = false;

function hubLabel(name) {
  const lines=[''];
  for (const word of name.split(' ')) {
    const i=lines.length-1;
    if (lines[i] && lines[i].length+word.length>16) lines.push(word);
    else lines[i]+=(lines[i]?' ':'')+word;
  }
  return lines.map((line,i)=>'<tspan x="0" dy="'+(i?11:0)+'">'+esc(line)+'</tspan>').join('');
}
function renderNetwork() {
  cancelAnimationFrame(animation);
  dragged = null;
  const compact = compactNetwork.matches;
  const width = compact ? 360 : Math.max(340,network.parentElement.clientWidth);
  const themes = allThemes.filter(tag=>displayedRows.some(row=>atlasThemesFor(row).includes(tag)));
  const activeDrivers = drivers.filter(driver=>displayedRows.some(row=>atlasDrivers(row).includes(driver)));
  const groups = [...themes,...activeDrivers];
  const height = compact ? 510 :
    Math.max(400,Math.min(660,width*.85),Math.ceil(displayedRows.length*1500/width));
  network.setAttribute('viewBox','0 0 '+width+' '+height);
  const hubs = groups.map((name,i)=>{
    const angle = i*2*Math.PI/groups.length-Math.PI/2;
    return {id:'hub-'+i,name,group:i<themes.length?'atlas-theme':'driver',fixed:true,
      x:width/2+Math.cos(angle)*(width/2-66),
      y:height/2+Math.sin(angle)*(height/2-48)};
  });
  const links = [];
  const points = displayedRows.map((row,i)=>{
    const connected = hubs.filter(hub=>(hub.group==='driver'?atlasDrivers(row):atlasThemesFor(row)).includes(hub.name));
    const angle = i*2.4;
    const saved = positions.get(row.id);
    const node = {id:row.id,row,vx:0,vy:0,x:saved?saved.x*width:width/2+Math.cos(angle)*width*.28,
      y:saved?saved.y*height:height/2+Math.sin(angle)*height*.28};
    connected.forEach(hub=>links.push({node,hub,selected:selectedNodes.has(hub.group+'|'+hub.name),lit:false}));
    return node;
  });
  const edges = compact ? ['force-edge','force-edge driver-edge','force-edge lit','force-edge driver-edge lit'].map(cls=>'<path class="'+cls+'"/>') : links.map(({hub})=>'<line class="force-edge '+(hub.group==='driver'?'driver-edge':'')+'"/>');
  const elements = [...points,...hubs].map(node=>{
    if (node.fixed) {
      const colour=node.group==='driver'?atlasDriverColours[node.name]:colours[Math.max(0,allThemes.indexOf(node.name))%colours.length];
      return '<g tabindex="0" role="button" data-group="'+node.group+'" data-value="'+esc(node.name)+'" aria-label="Filter by '+esc(node.name)+'" aria-pressed="'+selectedNodes.has(node.group+'|'+node.name)+'" class="force-hub"><circle r="10" fill="'+colour+'"/><text text-anchor="middle" y="24">'+hubLabel(node.name)+'</text></g>';
    }
    return '<g tabindex="0" role="button" class="net-point" data-record-id="'+esc(node.id)+'" aria-label="'+esc((node.row.number ?? '')+' '+node.row.title)+'"><circle r="10"/><text text-anchor="middle" y="3.5">'+esc(node.row.number ?? '·')+'</text><title>'+esc(node.row.title)+'</title></g>';
  });
  network.innerHTML='<g>'+edges.join('')+'</g><g>'+elements.join('')+'</g>';
  [...points,...hubs].forEach((node,i)=>{node.el=network.lastElementChild.children[i]});
  if (!compact) links.forEach((link,i)=>{link.el=network.firstElementChild.children[i]});
  simulation={width,height,points,hubs,links,compact};
  emphasize(selectedId);
  settleNetwork();
  hideAtlasPreview();
  renderSelection();
}
function emphasize(id) {
  if (!simulation) return;
  for (const link of simulation.links) {
    const {hub,node} = link;
    link.lit=id===hub.id || id===node.id || (matchingIds.has(node.id) && (selectedNodes.has('source|'+node.id) || link.selected));
    if (link.el) link.el.classList.toggle('lit',link.lit);
  }
  simulation.points.forEach(node=>node.el.setAttribute('aria-pressed',String(selectedNodes.has('source|'+node.id))));
}
function stepNetwork() {
  const {points,hubs,links,width,height} = simulation;
  for (const {node,hub,selected} of links) {
    const dx=hub.x-node.x, dy=hub.y-node.y, dist=Math.max(1,Math.hypot(dx,dy));
    const pull=(dist-54)/dist*(hub.group==='driver'?.002:.007)*(selected?1.65:1);
    node.vx+=dx*pull;
    node.vy+=dy*pull;
  }
  points.forEach((a,i)=>{
    for(let j=0;j<i;j++) {
      const b=points[j],dx=a.x-b.x || .01,dy=a.y-b.y,dist=Math.max(.1,Math.hypot(dx,dy));
      if (dist>110) continue;
      const push=(90/(dist*dist)+Math.max(0,25-dist)*.17)/dist;
      a.vx+=dx*push;b.vx-=dx*push;
      a.vy+=dy*push;b.vy-=dy*push;
    }
    for(const hub of hubs) {
      const dx=a.x-hub.x,dy=a.y-(hub.y+8);
      if(Math.abs(dx)<53 && Math.abs(dy)<28) a.vy+=(dy>=0?1:-1)*(28-Math.abs(dy))*.19;
    }
  });
  for(const node of points) {
    if(dragged?.node===node) {node.vx=node.vy=0;continue}
    node.vx=(node.vx+(width/2-node.x)*.0007)*.77;
    node.vy=(node.vy+(height/2-node.y)*.0007)*.77;
    node.x=Math.max(13,Math.min(width-13,node.x+node.vx));
    node.y=Math.max(13,Math.min(height-13,node.y+node.vy));
  }
}
function paintNetwork() {
  const {points,hubs,links,width,height}=simulation;
  for(const node of [...points,...hubs]) node.el.setAttribute('transform','translate('+node.x.toFixed(1)+' '+node.y.toFixed(1)+')');
  if (simulation.compact) {
    // Batch mobile links by appearance instead of updating every SVG line.
    const paths = ['','','',''];
    for(const {node,hub,lit} of links) {
      const index=(hub.group==='driver'?1:0)+(lit?2:0);
      paths[index]+='M'+Math.round(node.x)+' '+Math.round(node.y)+'L'+Math.round(hub.x)+' '+Math.round(hub.y);
    }
    paths.forEach((d,i)=>network.firstElementChild.children[i].setAttribute('d',d));
  } else {
    for(const {node,hub,el} of links) {
      el.setAttribute('x1',node.x);el.setAttribute('y1',node.y);
      el.setAttribute('x2',hub.x);el.setAttribute('y2',hub.y);
    }
  }
  for(const node of points) positions.set(node.id,{x:node.x/width,y:node.y/height});
}
function settleNetwork() {
  cancelAnimationFrame(animation);
  if (!simulation || !inView || document.hidden) return;
  if (reducedMotion.matches) {
    for(let i=0;i<32;i++) stepNetwork();
    paintNetwork();
    return;
  }
  const compact = simulation.compact;
  let remaining = compact ? 64 : 165;
  let previous = -Infinity;
  function tick(time) {
    if (document.hidden || !inView) return;
    if (!compact || time-previous >= 32) {
      previous=time;
      stepNetwork();
      paintNetwork();
      remaining--;
    }
    if (remaining>0) animation=requestAnimationFrame(tick);
  }
  tick(performance.now());
}
function syncActivity() {
  cancelAnimationFrame(animation);
  dragged=null;
  if (inView && !document.hidden && simulation) settleNetwork();
}
new IntersectionObserver(([entry])=>{
  if (inView!==entry.isIntersecting) {
    inView=entry.isIntersecting;
    syncActivity();
  }
}).observe(network);
document.addEventListener('visibilitychange',syncActivity);
function activateNode(event) {
  const el=event.target.closest('[data-record-id],[data-group]');
  if(!el) return;
  const group = el.dataset.group || 'source';
  const value = el.dataset.value || el.dataset.recordId;
  toggleNode(group,value);
  if (group==='source') selectedId=value;
  research();
  const target = group==='source' ? simulation.points.find(node=>node.id===value) :
    simulation.hubs.find(node=>node.group===group && node.name===value);
  target?.el.focus({preventScroll:true});
}
network.addEventListener('click',event=>{if(!suppressClick) activateNode(event)});
network.addEventListener('keydown',event=>{
  if(event.key==='Enter'||event.key===' ') {event.preventDefault();activateNode(event)}
});
network.addEventListener('pointerdown',event=>{
  const el=event.target.closest('[data-record-id]');
  if(!el || !event.isPrimary || event.button!==0) return;
  dragged={node:simulation.points.find(n=>n.id===el.dataset.recordId),x:event.clientX,y:event.clientY,pointer:event.pointerId};
  suppressClick=false;
  el.setPointerCapture(event.pointerId);
});
network.addEventListener('pointermove',event=>{
  if(!dragged || dragged.pointer!==event.pointerId) return;
  if(!suppressClick && Math.hypot(event.clientX-dragged.x,event.clientY-dragged.y)<4) return;
  const pos=new DOMPoint(event.clientX,event.clientY).matrixTransform(network.getScreenCTM().inverse());
  dragged.node.x=Math.max(13,Math.min(simulation.width-13,pos.x));
  dragged.node.y=Math.max(13,Math.min(simulation.height-13,pos.y));
  if(!suppressClick) {suppressClick=true;hideAtlasPreview()}
  // Coalesce touch events into a single display update.
  cancelAnimationFrame(animation);
  animation=requestAnimationFrame(()=>{stepNetwork();paintNetwork()});
});
function endDrag(event) {
  if(!dragged || event.pointerId!==dragged.pointer) return;
  dragged=null;
  if(suppressClick) {settleNetwork();setTimeout(()=>{suppressClick=false},0)}
}
network.addEventListener('pointerup',endDrag);
network.addEventListener('pointercancel',endDrag);
network.addEventListener('lostpointercapture',endDrag);
function inspectNode(event) {
  if(compactNetwork.matches || dragged) return;
  const el=event.target.closest('[data-record-id],[data-group]');
  if(!el) {emphasize(selectedId);hideAtlasPreview();return}
  const node=el.dataset.recordId?simulation.points.find(n=>n.id===el.dataset.recordId):simulation.hubs.find(n=>n.el===el);
  if(!node) return;
  emphasize(node.id);
  if(node.row) atlasPreview(node.row);
  else hideAtlasPreview();
}
network.addEventListener('pointerover',inspectNode);
network.addEventListener('focusin',inspectNode);
for(const event of ['pointerleave','focusout']) network.addEventListener(event,()=>{emphasize(selectedId);hideAtlasPreview()});
let resizeTimer;
function resizeNetwork() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (records.length) renderNetwork();
  }, 160);
}
compactNetwork.addEventListener('change',resizeNetwork);
new ResizeObserver(() => {
  if (!compactNetwork.matches && simulation && network.parentElement.clientWidth !== simulation.width) resizeNetwork();
}).observe(network.parentElement);

async function loadResearch() {
  try {
    const [snapshot,tags] = await Promise.all(['research.json','research-tags.json'].map(async file=>{
      const response=await fetch('../'+file);
      if (!response.ok) throw Error('Missing collection');
      return response.json();
    }));
    const published = new Map(snapshot.map(row=>[row.id,row]));
    records = tags.map(tag=>{
      const prior = published.get(tag.id);
      // A renamed aggregate can now describe a single precedent. Keep its old prose out.
      const body = prior?.title===tag.title ? prior : {indexOnly:true,lenses:[],type:null};
      const named = tag.designStrategy.filter(value=>drivers.includes(value));
      return {...body,...tag,drivers:named,driver:named[0] || ''};
    });
    keywordIndex = new Map(records.map(r=>[r.id,keywordsFor(r)]));
    records.sort((a,b)=>(a.number ?? Infinity)-(b.number ?? Infinity));
    byId('results').innerHTML = records.map(entry).join('');
    byId('count').textContent = records.length+' research points';
    allThemes = [...new Set(records.flatMap(atlasThemesFor))].sort();
    options('lens','All research lenses',lenses);
    options('driver','All strategies',[...drivers,'None']);
    options('add-tag','Choose a tag', [...allThemes,...drivers]);
    options('kind','All source types',[...new Set(records.map(r=>r.type).filter(Boolean))].sort());
    byId('status').textContent='';
    research();
  } catch { byId('status').innerHTML = 'The research collection could not load. <button type="button">Retry</button>'; byId('status').querySelector('button').onclick=loadResearch; }
}
loadResearch();


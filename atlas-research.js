const byId = id => document.getElementById(id);
const esc = value => String(value ?? 'Unknown').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const drivers = ['Define','Extend','Mediate'];
const lenses = ['Adaptable layouts','Dwelling relationships','Shared circulation','Independence and community'];
const fields = {location:'Location',mix:'Dwelling mix',access:'Access strategy',shared:'Shared spaces',evidence:'Documented evidence',quality:'Recorded reliability',information:'Information collected',connectionNote:'Connection note',themes:'Themes',threads:'Research threads',collections:'Exegesis collection',interpretation:'Tentative interpretation',implication:'Southwark drawing test',question:'Open question'};
let records = [];
const wideResearchLayout = window.matchMedia('(min-width: 761px)');
document.querySelectorAll('.research-panel').forEach(panel => { panel.open = wideResearchLayout.matches; });

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
function collectionSummary() {
  const categories = key => [...new Set(records.map(r=>r[key]).filter(Boolean))].sort();
  const methods = categories('method');
  const missing = records.filter(r=>!r.method).length;
  const countries = categories('country');
  const stats = [
    [records.length,'Research points','All active entries in the Notion register'],
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
  return '<p>Select a cell to find sources addressing both a design driver and a research lens. Housing lenses are indexed from the recorded text. Driver labels appear only where the design application explicitly names DEFINE, EXTEND or MEDIATE. Entries without a matching label or housing lens are excluded from this matrix.</p><div class="matrix-frame"><table class="lens-matrix"><thead><tr><th>Research lens</th>'+headers+'</tr></thead><tbody>'+body+'</tbody></table></div>';
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

const collectedFormat = new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'short',year:'numeric',timeZone:'Australia/Adelaide'});
function entry(record) {
  const entryLabel = record.number == null ? 'Data point · number not recorded' : 'Data point '+record.number;
  const collected = record.dateCollected ? '<time datetime="'+esc(record.dateCollected)+'">'+collectedFormat.format(new Date(record.dateCollected.length === 10 ? record.dateCollected+'T00:00:00Z' : record.dateCollected))+'</time>' : 'Not recorded';
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
  return '<details><summary><small>'+esc(entryLabel)+'</small>'+esc(record.title)+'<span>'+'Type · '+esc(record.type)+' / Method · '+esc(record.method || 'Not yet recorded')+' / Date collected · '+collected+'</span></summary><article class="entry">'+verified+'<p>'+esc(record.author)+'</p>'+reference+(record.context?'<p>'+esc(record.context)+'</p>':'')+quote+'<p>'+source+' &nbsp; '+notion+'</p>'+implication+'<details class="entry-questions" '+(wideResearchLayout.matches?'open':'')+'><summary>Six questions and answers</summary><ol class="answers">'+answerList+'</ol></details><div class="entry-evidence-sections">'+interpretation+openQuestion+'</div><details><summary>Evidence and spatial details</summary><dl>'+terms+'</dl></details></article></details>';
}
function research() {
  const term = byId('search').value.trim().toLowerCase();
  const lens = byId('lens').value;
  const activeControls = [term,lens,byId('driver').value,byId('kind').value].filter(Boolean).length;
  byId('filter-count').textContent = activeControls ? '('+activeControls+' active)' : '';
  const base = records.filter(r =>
    (!lens || r.lenses.includes(lenses.indexOf(lens))) &&
    (!byId('driver').value || (r.drivers || [r.driver]).includes(byId('driver').value)) &&
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
  byId('chart-status').textContent = [chartFilter, matrixFilter && driver+' / '+lenses[lensIndex], keywordFilter].filter(Boolean).concat(rows.length+' of '+records.length+' sources').join(' · ');
  byId('showMatches').hidden=!(chartFilter || matrixFilter || keywordFilter);
  byId('showMatches').textContent = 'View '+rows.length+' matching '+(rows.length===1?'source':'sources')+' ↓';
  byId('results').innerHTML = rows.map(entry).join('');
  byId('count').textContent = rows.length ? rows.length+' of '+records.length+' sources' : 'No matches. Change the search or filters.';
}
document.querySelector('.filters').addEventListener('change',research);
byId('search').addEventListener('input',research);

const atlasState = {driver:'',theme:'',search:'',selected:''};
let atlasInitialised = false;
const atlasDriverColours = {Define:'#a95d46',Extend:'#687f70',Mediate:'#516f8c'};
const atlasThemeColours = ['#a95d46','#687f70','#516f8c','#aa8a48','#796981','#766c5d','#547c82','#93706a'];

function atlasText(value, fallback='Not yet recorded') {
  if (Array.isArray(value)) {
    const values = value.filter(item => item !== null && item !== undefined && String(item).trim() !== '');
    return values.length ? esc(values.join(' · ')) : esc(fallback);
  }
  return value !== null && value !== undefined && String(value).trim() !== '' ? esc(value) : esc(fallback);
}
function atlasDrivers(record) {
  const source = Array.isArray(record.drivers) && record.drivers.length ? record.drivers : (record.driver ? [record.driver] : []);
  return [...new Set(source.filter(driver => drivers.includes(driver)))];
}
function atlasThemesFor(record) {
  const values = Array.isArray(record.themes) ? record.themes.filter(Boolean) : [];
  return values.length ? [...new Set(values)] : ['Theme not recorded'];
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
function atlasFilteredRows() {
  const term = atlasState.search.trim().toLowerCase();
  return records.filter(record =>
    (!atlasState.driver || atlasDrivers(record).includes(atlasState.driver)) &&
    (!atlasState.theme || atlasThemesFor(record).includes(atlasState.theme)) &&
    (!term || atlasSearchable(record).includes(term))
  );
}
function atlasBadge(label,colour) {
  return '<span class="atlas-badge" style="--badge-colour:'+colour+'">'+esc(label)+'</span>';
}
function atlasDetail(record) {
  if (!record) return '<p class="eyebrow">Selected data point</p><h3>No matching point</h3><p>Clear an atlas filter to return to the full register.</p>';
  const rowLabel = record.number == null ? 'Data point · number not recorded' : 'Data point '+record.number;
  const driverBadges = atlasDrivers(record).map(driver => atlasBadge(driver.toUpperCase(),atlasDriverColours[driver])).join('');
  const themeBadges = atlasThemesFor(record).map((theme,index) => atlasBadge(theme,atlasThemeColours[index % atlasThemeColours.length])).join('');
  const sourceMeta = [record.author,record.type,record.method].filter(Boolean).map(esc).join(' · ') || 'Source details not recorded';
  const sourceLink = record.url ? '<a href="'+esc(record.url)+'" target="_blank" rel="noopener">Original source ↗</a>' : '<span>Original source link not supplied</span>';
  const notionLink = record.notionPageId ? '<a href="'+esc(atlasNotionUrl(record))+'" target="_blank" rel="noopener">Open this data point in Notion ↗</a>' : '<span>Direct Notion link not recorded</span>';
  const notes = [
    ['Location',record.location],
    ['Dwelling mix',record.mix],
    ['Access strategy',record.access],
    ['Shared spaces',record.shared],
    ['Information collected',record.information],
    ['Connection note',record.connectionNote]
  ].map(([label,value]) => '<dt>'+label+'</dt><dd>'+atlasText(value,'Unknown')+'</dd>').join('');
  return '<div class="atlas-detail-head"><p class="eyebrow">'+esc(rowLabel)+'</p><h3>'+esc(record.title)+'</h3><p class="atlas-detail-meta">'+sourceMeta+'</p><div class="atlas-badges">'+driverBadges+themeBadges+'</div></div>'+
    '<div class="atlas-meta-grid"><div><span>Evidence quality</span><strong>'+atlasText(record.reliability || record.quality,'Unassessed')+'</strong></div><div><span>Collected</span><strong>'+atlasText(record.dateCollected,'Not recorded')+'</strong></div></div>'+
    atlasEvidenceBlock('Verified finding',record.insight,'verified','Recorded Key Insight from the Notion snapshot; read with the evidence below.')+
    atlasEvidenceBlock('Documented evidence',record.evidence,'verified','Evidence / quote recorded against this data point.')+
    (record.quote ? '<blockquote>'+esc(record.quote)+(record.quoteLocation?' <cite>· '+esc(record.quoteLocation)+'</cite>':'')+'</blockquote>' : '')+
    atlasEvidenceBlock('Tentative interpretation',record.interpretation,'interpretation','An interpretation is not presented as verified evidence.')+
    atlasEvidenceBlock('Design implication',record.implication,'implication','A proposed Southwark Grounds drawing test, not a claim about the source.')+
    atlasEvidenceBlock('Open question',record.question,'question','Kept visible so gaps in the research remain legible.')+
    '<section class="atlas-notes"><h4>Notes</h4><dl>'+notes+'</dl></section>'+
    '<section class="atlas-links"><h4>Source links</h4><p>'+sourceLink+'</p><p>'+notionLink+'</p></section>';
}
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
function atlasSelect(recordId,scrollToDetail) {
  const record = records.find(item => item.id === recordId);
  if (!record) return;
  atlasState.selected = record.id;
  renderAtlas();
  if (scrollToDetail) byId('atlas-detail').scrollIntoView({block:'nearest',behavior:'smooth'});
}
function atlasNodePosition(index) {
  const columns = 12;
  return {x:72+(index % columns)*76,y:370+Math.floor(index / columns)*48};
}
function renderAtlasMap(rows) {
  const width = 980;
  const columns = 12;
  const height = Math.max(560,390+Math.ceil(rows.length / columns)*48);
  const themeNames = [...new Set(rows.flatMap(atlasThemesFor))].sort((a,b)=>a.localeCompare(b));
  const themePositions = new Map(themeNames.map((theme,index) => {
    const span = themeNames.length > 1 ? 820/(themeNames.length-1) : 0;
    return [theme,{x:themeNames.length > 1 ? 80+index*span : 490,y:225}];
  }));
  const driverPositions = {Define:{x:170,y:72},Extend:{x:490,y:72},Mediate:{x:810,y:72}};
  const positions = new Map(rows.map((record,index) => [record.id,atlasNodePosition(index)]));
  const edges = [];
  rows.forEach(record => {
    const node = positions.get(record.id);
    atlasThemesFor(record).forEach(theme => {
      const target = themePositions.get(theme);
      edges.push('<line class="atlas-edge theme-edge" x1="'+node.x+'" y1="'+node.y+'" x2="'+target.x+'" y2="'+target.y+'"></line>');
    });
    atlasDrivers(record).forEach(driver => {
      const target = driverPositions[driver];
      edges.push('<line class="atlas-edge driver-edge" x1="'+node.x+'" y1="'+node.y+'" x2="'+target.x+'" y2="'+target.y+'"></line>');
    });
  });
  const driverNodes = drivers.map(driver => '<g class="atlas-driver-node" aria-label="'+driver+' driver"><circle cx="'+driverPositions[driver].x+'" cy="'+driverPositions[driver].y+'" r="34" fill="'+atlasDriverColours[driver]+'"></circle><text x="'+driverPositions[driver].x+'" y="'+(driverPositions[driver].y+4)+'" text-anchor="middle">'+driver.toUpperCase()+'</text></g>').join('');
  const themeNodes = themeNames.map((theme,index) => {
    const point = themePositions.get(theme);
    const count = rows.filter(record => atlasThemesFor(record).includes(theme)).length;
    return '<g class="atlas-theme-node" tabindex="0" role="button" data-atlas-theme="'+esc(theme)+'" aria-label="Theme '+esc(theme)+', '+count+' data points"><circle cx="'+point.x+'" cy="'+point.y+'" r="24" fill="'+atlasThemeColours[index % atlasThemeColours.length]+'"></circle><text x="'+point.x+'" y="'+(point.y+4)+'" text-anchor="middle">'+esc(String(index+1).padStart(2,'0'))+'</text><title>'+esc(theme)+' · '+count+' data points</title></g>';
  }).join('');
  const dataNodes = rows.map(record => {
    const point = positions.get(record.id);
    const driver = atlasDrivers(record)[0];
    const colour = driver ? atlasDriverColours[driver] : '#8c877a';
    const selected = atlasState.selected === record.id;
    const label = record.number == null ? 'Data point' : 'Data point '+record.number;
    return '<g class="atlas-node'+(selected?' selected':'')+'" tabindex="0" role="button" data-record-id="'+esc(record.id)+'" aria-selected="'+selected+'" aria-label="'+esc(label+' · '+record.title)+'" style="--node-colour:'+colour+'"><circle cx="'+point.x+'" cy="'+point.y+'" r="'+(selected?10:7)+'"></circle><text x="'+point.x+'" y="'+(point.y+3)+'" text-anchor="middle">'+esc(record.number == null ? '·' : record.number)+'</text><title>'+esc(label+' · '+record.title)+'</title></g>';
  }).join('');
  byId('atlas-map').setAttribute('viewBox','0 0 '+width+' '+height);
  byId('atlas-map').innerHTML = '<g class="atlas-edges">'+edges.join('')+'</g><g class="atlas-drivers">'+driverNodes+'</g><g class="atlas-theme-nodes">'+themeNodes+'</g><g class="atlas-data-nodes">'+dataNodes+'</g>';
}
function renderAtlasThemes(rows) {
  const groups = new Map();
  rows.forEach(record => atlasThemesFor(record).forEach(theme => {
    if (!groups.has(theme)) groups.set(theme,[]);
    groups.get(theme).push(record);
  }));
  const html = [...groups.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([theme,items]) => {
    const list = items.sort((a,b)=>(a.number ?? 9999)-(b.number ?? 9999)).map(record => '<li><button type="button" data-atlas-record-id="'+esc(record.id)+'"><span>'+esc(record.number == null ? 'DP' : 'DP '+String(record.number).padStart(3,'0'))+'</span>'+esc(record.title)+'</button></li>').join('');
    return '<details class="atlas-theme-group" '+(atlasState.theme===theme?'open':'')+'><summary><span>'+esc(theme)+'</span><small>'+items.length+' '+(items.length===1?'point':'points')+'</small></summary><ol>'+list+'</ol></details>';
  }).join('');
  byId('atlas-themes').innerHTML = html || '<p>No research themes match the current filters.</p>';
}
function renderAtlas() {
  const rows = atlasFilteredRows();
  if (!rows.some(record => record.id === atlasState.selected)) atlasState.selected = rows[0]?.id || '';
  renderAtlasMap(rows);
  renderAtlasThemes(rows);
  const selected = rows.find(record => record.id === atlasState.selected);
  byId('atlas-detail').innerHTML = atlasDetail(selected);
  byId('atlas-map-status').textContent = rows.length+' of '+records.length+' data points shown. Driver links appear only where DEFINE, EXTEND or MEDIATE are recorded.';
  byId('atlas-clear').hidden = !(atlasState.driver || atlasState.theme || atlasState.search);
  document.querySelectorAll('[data-atlas-driver]').forEach(button => {
    button.setAttribute('aria-pressed',String((button.dataset.atlasDriver || '') === atlasState.driver));
  });
  byId('atlas-theme').value = atlasState.theme;
}
function initAtlas() {
  if (!atlasInitialised) {
    const themeSelect = byId('atlas-theme');
    [...new Set(records.flatMap(atlasThemesFor))].sort((a,b)=>a.localeCompare(b)).forEach(theme => themeSelect.add(new Option(theme,theme)));
    document.querySelectorAll('[data-atlas-driver]').forEach(button => button.addEventListener('click',() => {
      atlasState.driver = button.dataset.atlasDriver || '';
      renderAtlas();
    }));
    byId('atlas-search').addEventListener('input',event => {
      atlasState.search = event.target.value;
      renderAtlas();
    });
    byId('atlas-theme').addEventListener('change',event => {
      atlasState.theme = event.target.value;
      renderAtlas();
    });
    byId('atlas-clear').addEventListener('click',() => {
      atlasState.driver='';atlasState.theme='';atlasState.search='';atlasState.selected='';
      byId('atlas-search').value='';
      renderAtlas();
    });
    byId('atlas-map').addEventListener('mouseover',event => {
      const node=event.target.closest('[data-record-id]');
      if (node) atlasPreview(records.find(record => record.id===node.dataset.recordId));
      const theme=event.target.closest('[data-atlas-theme]');
      if (theme) {
        const name=theme.dataset.atlasTheme;
        const count=atlasFilteredRows().filter(record => atlasThemesFor(record).includes(name)).length;
        byId('atlas-preview').innerHTML='<p class="eyebrow">Research theme</p><strong>'+esc(name)+'</strong><p>'+count+' data points currently connect to this theme.</p><small>Select the theme node to filter.</small>';
        byId('atlas-preview').hidden=false;
      }
    });
    byId('atlas-map').addEventListener('mouseleave',hideAtlasPreview);
    byId('atlas-map').addEventListener('focusin',event => {
      const node=event.target.closest('[data-record-id]');
      if (node) atlasPreview(records.find(record => record.id===node.dataset.recordId));
    });
    byId('atlas-map').addEventListener('focusout',hideAtlasPreview);
    byId('atlas-map').addEventListener('click',event => {
      const node=event.target.closest('[data-record-id]');
      if (node) return atlasSelect(node.dataset.recordId,true);
      const theme=event.target.closest('[data-atlas-theme]');
      if (theme) {
        atlasState.theme=theme.dataset.atlasTheme;
        atlasState.selected='';
        renderAtlas();
      }
    });
    byId('atlas-map').addEventListener('keydown',event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const node=event.target.closest('[data-record-id]');
      const theme=event.target.closest('[data-atlas-theme]');
      if (!node && !theme) return;
      event.preventDefault();
      if (node) atlasSelect(node.dataset.recordId,true);
      if (theme) {
        atlasState.theme=theme.dataset.atlasTheme;
        atlasState.selected='';
        renderAtlas();
      }
    });
    byId('atlas-themes').addEventListener('click',event => {
      const button=event.target.closest('[data-atlas-record-id]');
      if (button) atlasSelect(button.dataset.atlasRecordId,true);
    });
    atlasInitialised = true;
  }
  renderAtlas();
}

async function loadResearch() {
  try {
    const response = await fetch('../research.json');
    if (!response.ok) throw Error('Missing collection');
    records = await response.json();
    keywordIndex = new Map(records.map(r=>[r.id,keywordsFor(r)]));
    collectionSummary();
    initAtlas();
    options('lens','All research lenses',lenses);
    options('driver','All drivers',drivers);
    options('kind','All source types',[...new Set(records.map(r=>r.type))].sort());
    byId('status').textContent='';
    research();
  } catch { byId('status').innerHTML = 'The research collection could not load. <button type="button">Retry</button>'; byId('status').querySelector('button').onclick=loadResearch; }
}
loadResearch();


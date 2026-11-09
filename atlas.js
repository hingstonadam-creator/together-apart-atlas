const byId = id => document.getElementById(id);
const esc = value => String(value ?? 'Unknown').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const drivers = ['Define','Extend','Mediate'];
const lenses = ['Adaptable layouts','Dwelling relationships','Shared circulation','Independence and community'];
const fields = {location:'Location',mix:'Dwelling mix',access:'Access strategy',shared:'Shared spaces',evidence:'Documented evidence',quality:'Evidence quality',interpretation:'Tentative interpretation',implication:'Southwark drawing test',question:'Open question'};
const selected = new Set();
let records = [];

function options(id, first, values) {
  byId(id).replaceChildren(new Option(first,''));
  values.forEach(value => byId(id).add(new Option(value,value)));
}
function check(record) {
  return '<label><input type="checkbox" data-record="'+esc(record.id)+'" '+(selected.has(record.id)?'checked':'')+'> '+esc(record.title)+'</label>';
}
function entry(record) {
  const terms = Object.entries(fields).map(([key,title]) => '<dt>'+title+'</dt><dd>'+esc(record[key])+'</dd>').join('');
  return '<details><summary><small>'+esc(record.number || record.type)+'</small>'+esc(record.title)+'<span>'+esc(record.location)+' · '+esc(record.driver)+'</span></summary><div class="entry"><p>'+esc(record.author)+'</p><dl>'+terms+'</dl><p><a href="'+esc(record.url)+'" target="_blank" rel="noopener">Original source ↗</a> · <a href="#building-'+record.driver+'">View drawing test →</a></p><label><input type="checkbox" data-record="'+esc(record.id)+'" '+(selected.has(record.id)?'checked':'')+'> Include in comparison</label></div></details>';
}
function research() {
  const term = byId('search').value.trim().toLowerCase();
  const lens = byId('lens').value;
  const rows = records.filter(r =>
    (!lens || r.lenses.includes(lenses.indexOf(lens))) &&
    (!byId('driver').value || byId('driver').value === r.driver) &&
    (!byId('kind').value || byId('kind').value === r.type) &&
    Object.values(r).join(' ').toLowerCase().includes(term));
  byId('results').innerHTML = rows.map(entry).join('');
  byId('count').textContent = rows.length ? rows.length+' of '+records.length+' sources' : 'No matches. Change the search or filters.';
  byId('selected').textContent = 'Compare selected ('+selected.size+') →';
}
function compare() {
  const rows = records.filter(r => selected.has(r.id));
  byId('choices').innerHTML = records.map(check).join('');
  byId('comparison').innerHTML = rows.length ? '<div class="tablewrap" tabindex="0" aria-label="Source comparison"><table><thead><tr><th>Field</th>'+rows.map(r=>'<th scope="col">'+esc(r.title)+'</th>').join('')+'</tr></thead><tbody>'+Object.entries(fields).map(([key,title])=>'<tr><th scope="row">'+title+'</th>'+rows.map(r=>'<td>'+esc(r[key])+'</td>').join('')+'</tr>').join('')+'<tr><th>Source</th>'+rows.map(r=>'<td><a href="'+esc(r.url)+'">Original source ↗</a></td>').join('')+'</tr></tbody></table></div>' : '<p>Select two sources above to start a comparison.</p>';
}
function route() {
  const [key,driver] = location.hash.slice(1).split('-');
  const pages = ['overview','research','compare','building'];
  const page = pages.includes(key) ? key : 'overview';
  pages.forEach(id => byId(id).hidden = id !== page);
  document.querySelectorAll('nav a').forEach(a => a.hash === '#'+page ? a.setAttribute('aria-current','page') : a.removeAttribute('aria-current'));
  if (page === 'research') research();
  if (page === 'compare') compare();
  if (page === 'building') {
    const active = drivers.includes(driver) ? driver : drivers[0];
    byId('tabs').innerHTML = drivers.map(d=>'<a '+(d===active?'aria-current="true"':'')+' href="#building-'+d+'">'+d+'</a>').join('');
    document.querySelectorAll('[data-plan]').forEach(el => el.hidden = el.dataset.plan !== active);
    byId('linked').innerHTML = records.filter(r=>r.driver===active).map(entry).join('');
  }
  window.scrollTo(0,0);
}
document.addEventListener('change',event => {
  const id = event.target.dataset.record;
  if (id) {
    event.target.checked ? selected.add(id) : selected.delete(id);
    byId('selected').textContent = 'Compare selected ('+selected.size+') →';
    if (!byId('compare').hidden) { compare(); byId('choices').querySelector('[data-record="'+id+'"]').focus(); }
  } else if (event.target.closest('.filters')) research();
});
byId('search').addEventListener('input',research);
window.addEventListener('hashchange',route);
route();
async function loadResearch() {
  try {
    const response = await fetch('./research.json');
    if (!response.ok) throw Error('Missing collection');
    records = await response.json();
    options('lens','All research lenses',lenses);
    options('driver','All drivers',drivers);
    options('kind','All source types',[...new Set(records.map(r=>r.type))].sort());
    byId('status').textContent='';
    route();
  } catch { byId('status').innerHTML = 'The research collection could not load. <button type="button">Retry</button>'; byId('status').querySelector('button').onclick=loadResearch; }
}
loadResearch();

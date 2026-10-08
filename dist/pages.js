(() => {
  const pages = {
    visitor: ['Visitor Pass', 'Your event. Your parking pass.', 'Register, choose a parking zone, and keep your QR pass ready.'],
    operator: ['Operator Desk', 'Keep your event moving.', 'Manage sample inventory, prices, attendee check-in and parking gates.'],
    traffic: ['Traffic Lab', 'Watch the queue form.', 'Test individual vehicles, signal timing and lane closures at a sample junction.'],
    studio: ['Scenario Studio', 'See the impact. Before the event.', 'Build your event, adjust the map, and prepare your team.'],
    comparison: ['Compare Scenarios', 'Two plans. One clear comparison.', 'Compare the original plan with your proposed changes and try improvements.'],
    timeline: ['Event Timeline', 'Every arrival. Every departure.', 'Explore demand through the event, one half-hour interval at a time.'],
    report: ['Impact Report', 'Turn your results into a plan.', 'Review the findings, understand the assumptions, and export your impact report.']
  };
  const groups = {
    visitor: '#visitor-page', operator: '#operator-page', traffic: '#traffic-lab-page',
    studio: '.studio-grid, .pipeline, #advanced-planning, #readiness, .ops-welcome',
    comparison: '#comparison, .improvement-section, .parking-section',
    timeline: '#timeline-section',
    report: '#report, .assumptions'
  };
  let active;
  const key = 'urbanpulse-page-session-v1';
  const urlFor = page => location.protocol === 'file:' ? `${location.pathname}${location.search}#/${page}` : `/${page}${location.search}`;
  const owner = el => Object.keys(groups).find(page => el?.closest(groups[page]));
  function persist() {
    try { sessionStorage.setItem(key, JSON.stringify({inputs: readInputs(), current, step})); } catch {}
  }
  function resolve() {
    const hash = location.hash.slice(1);
    if (hash.startsWith('/') && pages[hash.slice(1)]) return hash.slice(1);
    if (hash) { const page = owner(document.getElementById(hash)); if (page) return page; }
    return location.pathname.split('/').filter(Boolean).find(part => pages[part]) || 'studio';
  }
  function show(page, {historyMode = 'push', focus = true, validate = true} = {}) {
    if (!pages[page]) return false;
    if (validate && active === 'studio' && page !== active && !run()) return false;
    persist();
    if (playTimer && !['timeline','studio'].includes(page)) $('play').click();
    active = page;
    for (const [name, selector] of Object.entries(groups)) document.querySelectorAll(selector).forEach(el => {el.hidden = name !== page;});
    const planning = ['studio','comparison','timeline','report'].includes(page);
    $('metrics').hidden = !planning || page === 'report';
    document.querySelector('.library').hidden = !planning;
    $('report-context').hidden = !planning;
    $('download-report').hidden = !planning;
    document.dispatchEvent(new CustomEvent('urbanpulse:page',{detail:page}));
    const [label, title, description] = pages[page];
    document.title = `${label} — UrbanPulse`;
    document.querySelector('.wordmark span').textContent = `/ ${label}`;
    const heading = document.querySelector('.page-title h1');
    heading.textContent = title; heading.tabIndex = -1;
    document.querySelector('.page-title p').textContent = description;
    document.querySelectorAll('[data-page]').forEach(link => {
      const selected = link.dataset.page === page;
      link.classList.toggle('active', selected);
      if (selected) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
      link.href = urlFor(link.dataset.page);
      link.title = pages[link.dataset.page][0];
    });
    if (historyMode !== 'none') history[historyMode === 'replace' ? 'replaceState' : 'pushState']({}, '', urlFor(page));
    if (page === 'studio') requestAnimationFrame(() => leaflet?.invalidateSize());
    if (focus) { heading.focus({preventScroll: true}); window.scrollTo({top: 0, behavior: 'instant'}); }
    return true;
  }
  const nav = document.createElement('nav');
  nav.className = 'page-navigation'; nav.setAttribute('aria-label', 'Project pages');
  nav.innerHTML = ['studio','comparison','timeline','report','visitor','operator','traffic'].map((id, i) => `<a data-page="${id}" href="${urlFor(id)}"><span>0${i+1}</span>${pages[id][0]}</a>`).join('');
  document.querySelector('.page-title').after(nav);
  const welcome=document.querySelector('.ops-welcome'); if(welcome)document.querySelector('.pipeline').after(welcome);
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a'); if (!link || link.target || link.hasAttribute('download')) return;
    const url = new URL(link.href, location.href); if (url.origin !== location.origin) return;
    const target = url.hash && document.getElementById(url.hash.slice(1));
    const page = link.dataset.page || owner(target) || (link.classList.contains('brand') ? 'studio' : null);
    if (!page) return;
    event.preventDefault();
    if (show(page) && target) { if (target.tagName === 'DETAILS') target.open = true; target.scrollIntoView({behavior: 'smooth', block: 'start'}); }
  });
  window.AppPages = {reveal(el) { const page = owner(el); if (page && page !== active) show(page, {focus: false, validate: false}); }};
  window.addEventListener('popstate', () => show(resolve(), {historyMode: 'none', validate: false}));
  window.addEventListener('hashchange', () => {const target = document.getElementById(location.hash.slice(1)); show(resolve(), {historyMode: 'replace', validate: false}); target?.scrollIntoView();});
  window.addEventListener('pagehide', persist);
  if (!new URLSearchParams(location.search).has('plan')) {
    try { const saved = JSON.parse(sessionStorage.getItem(key)); if (saved?.inputs) { UrbanModel.validate(saved.inputs); fillInputs(saved.inputs); current = saved.current === 'a' ? 'a' : 'b'; step = Number.isInteger(saved.step) ? Math.max(0, saved.step) : 4; run(); } } catch {}
  }
  const initialTarget = document.getElementById(location.hash.slice(1));
  show(resolve(), {historyMode: 'replace', focus: false, validate: false});
  initialTarget?.scrollIntoView();
})();

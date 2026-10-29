/* =========================================================
   ВОП-Helper — documents.js
   Протокол ВКК (печать, история, счётчики), консилиум, направление
   ========================================================= */

/* ---------- 29. Печать / ВКК ---------- */
window.addEventListener('afterprint', ()=>{
  document.body.classList.remove('printing-acq','printing-vkk','printing-consilium','printing-referral','printing-chads-hasbled');
});

function fillRuledLines(){
  const pairs=[['p-vkk-purpose','vkk-purpose'],['p-vkk-complaints','vkk-complaints'],['p-vkk-anamnesis','vkk-anamnesis'],['p-vkk-exam','vkk-exam'],['p-vkk-diagnosis','vkk-diagnosis']];
  pairs.forEach(([t,s])=>{
    const el=document.getElementById(t); const src=document.getElementById(s);
    if(el && src) el.textContent=src.value.trim();
  });
}
function setVkkToday(){
  document.getElementById('vkk-date').value = todayStr();
  saveToLocal();
}
function printVkk(){
  const v=id=>{const el=document.getElementById(id); return el ? el.value.trim() : '';};
  document.getElementById('p-vkk-protocol-num').textContent = v('vkk-protocol-num');
  document.getElementById('p-vkk-date').textContent       = v('vkk-date');
  document.getElementById('p-vkk-fio').textContent        = v('vkk-fio');
  document.getElementById('p-vkk-start').textContent      = v('vkk-start');
  document.getElementById('p-vkk-days').textContent       = v('vkk-days');
  document.getElementById('p-vkk-days-total').textContent = v('vkk-days-total');
  fillRuledLines();
  fillDoctorFields();
  saveVkkHistory();
  document.body.classList.add('printing-vkk');
  window.print();
}
function copyVkkToClipboard() {
  const v = id => document.getElementById(id).value.trim() || '—';
  const text = `
Протокол заседания ВКК № ${v('vkk-protocol-num')}
1. Дата: ${v('vkk-date')} г.
2. ФИО: ${v('vkk-fio')}
3. Цель направления: ${v('vkk-purpose')}
4. Начало случая временной нетрудоспособности: с ${v('vkk-start')} г.
5. Временная нетрудоспособность: непрерывная ${v('vkk-days')} календарных дней; суммарная за последние 12 месяцев: ${v('vkk-days-total')} календарных дней.
6. Жалобы пациента: ${v('vkk-complaints')}
7. Краткий анамнез: ${v('vkk-anamnesis')}
8. Данные осмотра: ${v('vkk-exam')}
9. Клинико-функциональный диагноз: ${v('vkk-diagnosis')}
  `.trim();
  navigator.clipboard.writeText(text).then(() => alert('Текст протокола скопирован в буфер обмена!'))
    .catch(err => alert('Не удалось скопировать: ' + err));
}
function clearVkk(){
  if(!confirm('Очистить все поля протокола? Данные будут удалены безвозвратно.')) return;
  ['vkk-protocol-num','vkk-date','vkk-fio','vkk-purpose','vkk-start','vkk-days','vkk-days-total','vkk-complaints','vkk-anamnesis','vkk-exam','vkk-diagnosis'].forEach(id=>{
    const el=document.getElementById(id); 
    if(el) {
      el.value='';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  saveToLocal();
}

/* ---------- 30. История ВКК ---------- */
const VKK_HISTORY_KEY = 'vkk_history';
function openVkkHistory() {
  renderVkkHistory();
  document.getElementById('vkk-history-modal').classList.add('active');
}
function closeVkkHistory(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('vkk-history-modal').classList.remove('active');
}
function getVkkData(){
  const v = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  return {
    protocolNum: v('vkk-protocol-num'), date: v('vkk-date'), fio: v('vkk-fio'),
    purpose: v('vkk-purpose'), start: v('vkk-start'), days: v('vkk-days'),
    daysTotal: v('vkk-days-total'), complaints: v('vkk-complaints'),
    anamnesis: v('vkk-anamnesis'), exam: v('vkk-exam'), diagnosis: v('vkk-diagnosis'),
    savedAt: new Date().toISOString()
  };
}
function saveVkkHistory(){
  const data = getVkkData();
  if(!data.fio && !data.purpose && !data.complaints) return;
  let history = [];
  try { history = JSON.parse(localStorage.getItem(VKK_HISTORY_KEY) || '[]'); } catch(e) {}
  history.unshift(data);
  if(history.length > 20) history = history.slice(0, 20);
  localStorage.setItem(VKK_HISTORY_KEY, JSON.stringify(history));
}
function renderVkkHistory(){
  const list = document.getElementById('vkk-history-list');
  if(!list) return;
  let history = [];
  try { history = JSON.parse(localStorage.getItem(VKK_HISTORY_KEY) || '[]'); } catch(e) {}
  
  if(history.length === 0) {
    list.innerHTML = '<p style="color:var(--muted); text-align:center;">История пуста.</p>';
    return;
  }

  list.innerHTML = history.map((item, idx) => {
    const date = item.date || '—';
    const fio = item.fio || 'Без ФИО';
    const num = item.protocolNum ? `№${item.protocolNum}` : '';
    return `<div class="history-item">
      <div class="meta"><b>${date}</b> ${num} — ${fio}</div>
      <div class="actions">
        <button class="btn btn-sm btn-primary" onclick="loadVkkHistory(${idx})">Загрузить</button>
        <button class="btn btn-sm btn-secondary" style="color:var(--red);" onclick="deleteVkkHistory(${idx})">Удалить</button>
      </div>
    </div>`;
  }).join('');
}
function loadVkkHistory(idx){
  let history = [];
  try { history = JSON.parse(localStorage.getItem(VKK_HISTORY_KEY) || '[]'); } catch(e) {}
  const item = history[idx];
  if(!item) return;
  
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = val || '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  setVal('vkk-protocol-num', item.protocolNum);
  setVal('vkk-date', item.date);
  setVal('vkk-fio', item.fio);
  setVal('vkk-purpose', item.purpose);
  setVal('vkk-start', item.start);
  setVal('vkk-days', item.days);
  setVal('vkk-days-total', item.daysTotal);
  setVal('vkk-complaints', item.complaints);
  setVal('vkk-anamnesis', item.anamnesis);
  setVal('vkk-exam', item.exam);
  setVal('vkk-diagnosis', item.diagnosis);

  saveToLocal();
  closeVkkHistory();
  window.scrollTo({top: document.getElementById('vkk').offsetTop - 80, behavior:'smooth'});
  alert('Протокол загружен. Вы можете отредактировать и распечатать заново.');
}
function deleteVkkHistory(idx){
  if(!confirm('Удалить эту запись из истории?')) return;
  let history = [];
  try { history = JSON.parse(localStorage.getItem(VKK_HISTORY_KEY) || '[]'); } catch(e) {}
  history.splice(idx, 1);
  localStorage.setItem(VKK_HISTORY_KEY, JSON.stringify(history));
  renderVkkHistory();
}

/* ---------- 31. Счётчик символов ВКК ---------- */
(function initCharCounters(){
  const LIMITS={'vkk-purpose':300,'vkk-complaints':600,'vkk-anamnesis':1200,'vkk-exam':1000,'vkk-diagnosis':600};
  Object.keys(LIMITS).forEach(id=>{
    const el=document.getElementById(id); if(!el) return;
    if (el.nextElementSibling && el.nextElementSibling.classList.contains('char-counter')) return;
    
    const limit=LIMITS[id];
    const counter=document.createElement('span');
    counter.className='char-counter';
    el.insertAdjacentElement('afterend', counter);
    const update=()=>{
      const len=el.value.length;
      counter.textContent=`${len} / ${limit} символов`;
      counter.classList.toggle('warn', len>limit*0.85 && len<=limit);
      counter.classList.toggle('over', len>limit);
    };
    el.addEventListener('input', update);
    update();
  });
})();

/* ---------- 32. Авто-расчет дней ВКК ---------- */
(function initVkkAutoDays() {
  const elDate = document.getElementById('vkk-date');
  const elStart = document.getElementById('vkk-start');
  const elDays = document.getElementById('vkk-days');
  if (!elDate || !elStart || !elDays) return;
  function calcDays() {
    const startDate = parseDateSafe(elStart.value);
    if (!startDate) return;
    let refDate = parseDateSafe(elDate.value);
    if (!refDate) {
      const now = new Date();
      refDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    }
    if (refDate < startDate) { elDays.value = ''; return; }
    elDays.value = getDiffDays(startDate, refDate);
    saveToLocal();
  }
  elStart.addEventListener('change', calcDays);
  elDate.addEventListener('change', calcDays);
})();

/* ---------- 34. Протокол Консилиума ---------- */
function printConsilium() {
  const v = id => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  };
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '';
  };

  const dateStr = v('cons-date');
  const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  if (dateStr && dateStr.includes('.')) {
    const parts = dateStr.split('.');
    set('p-cons-day', parts[0]);
    set('p-cons-month', months[parseInt(parts[1], 10) - 1] || '________');
    set('p-cons-year', parts[2]);
  } else {
    set('p-cons-day', '___');
    set('p-cons-month', '________');
    set('p-cons-year', '____');
  }

  set('p-cons-city', v('cons-city') || 'г. Калинковичи');

  const docText = v('cons-doctor-input') || (typeof getCurrentDoctor === 'function' ? getCurrentDoctor() : '');
  set('p-cons-doctor-top', docText);
  const shortName = docText.includes(' ') && typeof getShortDoctorName === 'function'
    ? getShortDoctorName(docText) : docText;
  set('p-cons-doctor-bottom', shortName);

  const pFio = v('cons-patient-fio');
  const pAge = v('cons-patient-age');
  let examText = pFio;
  if (pFio && pAge) {
    examText += ', ' + pAge + ' ' + (typeof getAgeString === 'function' ? getAgeString(+pAge) : 'лет');
  }
  set('p-cons-exam', examText);

  // Временно показать для измерения ширины
  const printView = document.getElementById('consilium-print-view');
  let prevCss = '';
  if (printView) {
    prevCss = printView.getAttribute('style') || '';
    printView.style.cssText = 'display:block!important;position:absolute;left:-10000px;top:0;width:210mm;visibility:hidden;';
  }

  fillBlankLines('cons-objective', v('cons-objective'));
  fillBlankLines('cons-diagnosis', v('cons-diagnosis'));
  fillBlankLines('cons-treatment', v('cons-treatment'));
  // состав оставляем пустым (заполняется от руки)

  if (printView) printView.setAttribute('style', prevCss);

  if (typeof saveConsHistory === 'function') saveConsHistory();
  document.body.classList.add('printing-consilium');
  window.print();
}


function clearConsilium() {
  if(!confirm('Очистить все поля протокола консилиума?')) return;
  ['cons-date', 'cons-patient-fio', 'cons-patient-age', 'cons-objective', 'cons-diagnosis', 'cons-treatment'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.value = '';
  });
  saveToLocal();
}

/* ---------- 35. Направление ---------- */
function printReferral() {
  const v = id => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  };
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '';
  };

  const docEl = document.getElementById('ref-doc');
  if (docEl && !docEl.value.trim() && typeof getCurrentDoctor === 'function') {
    docEl.value = getCurrentDoctor();
  }

  set('p-ref-to-phrase', v('ref-to-phrase') || 'на консультацию');
  set('p-ref-to-org', v('ref-to-org') || 'ГОККД');
  set('p-ref-to-specialist', v('ref-to-specialist') || 'кардиологу, кардиохирургу');
  set('p-ref-fio', v('ref-fio'));
  set('p-ref-age', v('ref-age'));
  set('p-ref-address', v('ref-address'));
  set('p-ref-date', v('ref-date'));
  set('p-ref-doc', v('ref-doc') || (typeof getCurrentDoctor === 'function' ? getCurrentDoctor() : ''));
  set('p-ref-head', v('ref-head'));

  // Временно показать print-view с шириной А4 для измерения
  const printView = document.getElementById('referral-print-view');
  let prevCss = '';
  if (printView) {
    prevCss = printView.getAttribute('style') || '';
    printView.style.cssText = 'display:block!important;position:absolute;left:-10000px;top:0;width:210mm;visibility:hidden;';
  }

  const fields = {
    inst: v('ref-inst') || 'УЗ «Калинковичская ЦРБ», филиал «Районная поликлиника»',
    diagnosis: v('ref-diagnosis'),
    purpose: v('ref-purpose'),
    b1: v('ref-b1'), b2: v('ref-b2'), b3: v('ref-b3'), b4: v('ref-b4'),
    b5: v('ref-b5'), b6: v('ref-b6'), b7: v('ref-b7'), b8: v('ref-b8'),
    b9: v('ref-b9'), b10: v('ref-b10'), b11: v('ref-b11'), b12: v('ref-b12'),
    r1: v('ref-r1'), r2: v('ref-r2'),
    anamnesis: v('ref-anamnesis'), treatment: v('ref-treatment'),
    hosp: v('ref-hosp'), vn: v('ref-vn'), extra: v('ref-extra')
  };

  Object.keys(fields).forEach(key => fillBlankLines(key, fields[key]));

  if (printView) printView.setAttribute('style', prevCss);

  if (typeof saveRefHistory === 'function') saveRefHistory();
  document.body.classList.add('printing-referral');
  window.print();
}

function estimateTextWidth(text, ctx) {
  return ctx.measureText(String(text || '')).width;
}

/** Разбить текст по реальной ширине линии (canvas measureText) */
function fillBlankLines(key, text) {
  const nodes = Array.from(document.querySelectorAll('[data-line="' + key + '"]'))
    .sort((a, b) => (+a.dataset.idx) - (+b.dataset.idx));
  if (!nodes.length) return;

  // очистить
  nodes.forEach(n => { n.textContent = ''; });

  const raw = String(text || '').replace(/\s+/g, ' ').trim();
  if (!raw) return;

  const font = '10.5pt "Times New Roman", Times, serif';
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = font;

  // ширина каждой линии: для .ref-fill берём clientWidth, для empty — ширину страницы-контента
  // Ширина контента А4 ≈ 182mm ≈ 688px @96dpi
  const FULL = 680;
  const widths = nodes.map((n, i) => {
    let w = n.getBoundingClientRect().width;
    if (w < 30) {
      if (n.classList.contains('ref-empty-line')) {
        w = FULL;
      } else {
        const lab = n.parentElement && n.parentElement.querySelector('.ref-lab');
        const labW = lab ? (lab.getBoundingClientRect().width || estimateTextWidth(lab.textContent, ctx)) : 0;
        w = FULL - labW - 6;
      }
    }
    return Math.max(40, w - 2);
  });

  const words = raw.split(' ');
  let wordIdx = 0;
  nodes.forEach((node, li) => {
    const maxW = widths[li];
    let line = '';
    while (wordIdx < words.length) {
      const test = line ? line + ' ' + words[wordIdx] : words[wordIdx];
      if (ctx.measureText(test).width <= maxW) {
        line = test;
        wordIdx++;
      } else {
        // слово длиннее всей строки — принудительно
        if (!line) {
          line = words[wordIdx];
          wordIdx++;
        }
        break;
      }
    }
    node.textContent = line;
  });
  // если слова остались — дописать в последнюю линию
  if (wordIdx < words.length) {
    const last = nodes[nodes.length - 1];
    const extra = words.slice(wordIdx).join(' ');
    last.textContent = (last.textContent ? last.textContent + ' ' : '') + extra;
  }
}



function clearReferral() {
  if (!confirm('Очистить все поля направления?')) return;
  const fields = [
    'ref-to-phrase','ref-to-org','ref-to-specialist','ref-date','ref-fio','ref-age','ref-address',
    'ref-diagnosis','ref-purpose',
    'ref-b1','ref-b2','ref-b3','ref-b4','ref-b5','ref-b6','ref-b7','ref-b8','ref-b9','ref-b10','ref-b11','ref-b12',
    'ref-r1','ref-r2','ref-anamnesis','ref-treatment','ref-hosp','ref-vn','ref-extra','ref-doc','ref-head'
  ];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === 'ref-to-phrase') el.value = 'на консультацию';
      else if (id === 'ref-to-org') el.value = 'ГОККД';
      else if (id === 'ref-to-specialist') el.value = 'кардиологу, кардиохирургу';
      else el.value = '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  saveToLocal();
}

/* ---------- 36. История направления ---------- */
const REF_HISTORY_KEY = 'ref_history';
function getRefData() {
  const v = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  return {
    toPhrase: v('ref-to-phrase'), toOrg: v('ref-to-org'), toSpecialist: v('ref-to-specialist'),
    inst: v('ref-inst'), date: v('ref-date'), fio: v('ref-fio'), age: v('ref-age'),
    address: v('ref-address'), diagnosis: v('ref-diagnosis'), purpose: v('ref-purpose'),
    b1: v('ref-b1'), b2: v('ref-b2'), b3: v('ref-b3'), b4: v('ref-b4'), b5: v('ref-b5'),
    b6: v('ref-b6'), b7: v('ref-b7'), b8: v('ref-b8'), b9: v('ref-b9'), b10: v('ref-b10'),
    b11: v('ref-b11'), b12: v('ref-b12'),
    r1: v('ref-r1'), r2: v('ref-r2'), anamnesis: v('ref-anamnesis'), treatment: v('ref-treatment'),
    hosp: v('ref-hosp'), vn: v('ref-vn'), extra: v('ref-extra'), doc: v('ref-doc'), head: v('ref-head'),
    savedAt: new Date().toISOString()
  };
}
function saveRefHistory() {
  const data = getRefData();
  if (!data.fio && !data.diagnosis && !data.purpose) return;
  let history = [];
  try { history = JSON.parse(localStorage.getItem(REF_HISTORY_KEY) || '[]'); } catch (e) {}
  history.unshift(data);
  if (history.length > 20) history = history.slice(0, 20);
  localStorage.setItem(REF_HISTORY_KEY, JSON.stringify(history));
}
function openRefHistory() {
  renderRefHistory();
  const m = document.getElementById('ref-history-modal');
  if (m) m.classList.add('active');
}
function closeRefHistory(e) {
  if (e && e.target !== e.currentTarget) return;
  const m = document.getElementById('ref-history-modal');
  if (m) m.classList.remove('active');
}
function renderRefHistory() {
  const list = document.getElementById('ref-history-list');
  if (!list) return;
  let history = [];
  try { history = JSON.parse(localStorage.getItem(REF_HISTORY_KEY) || '[]'); } catch (e) {}
  if (history.length === 0) {
    list.innerHTML = '<p style="color:var(--muted); text-align:center;">История пуста.</p>';
    return;
  }
  list.innerHTML = history.map((item, idx) => {
    const date = item.date || '—';
    const fio = item.fio || 'Без ФИО';
    const org = item.toOrg || '';
    return `<div class="history-item">
      <div class="meta"><b>${date}</b> — ${fio}${org ? ' → ' + org : ''}</div>
      <div class="actions">
        <button class="btn btn-sm btn-primary" onclick="loadRefHistory(${idx})">Загрузить</button>
        <button class="btn btn-sm btn-secondary" style="color:var(--red);" onclick="deleteRefHistory(${idx})">Удалить</button>
      </div>
    </div>`;
  }).join('');
}
function loadRefHistory(idx) {
  let history = [];
  try { history = JSON.parse(localStorage.getItem(REF_HISTORY_KEY) || '[]'); } catch (e) {}
  const item = history[idx];
  if (!item) return;
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = val || '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };
  setVal('ref-to-phrase', item.toPhrase);
  setVal('ref-to-org', item.toOrg);
  setVal('ref-to-specialist', item.toSpecialist);
  setVal('ref-inst', item.inst);
  setVal('ref-date', item.date);
  setVal('ref-fio', item.fio);
  setVal('ref-age', item.age);
  setVal('ref-address', item.address);
  setVal('ref-diagnosis', item.diagnosis);
  setVal('ref-purpose', item.purpose);
  for (let i = 1; i <= 12; i++) setVal('ref-b' + i, item['b' + i]);
  setVal('ref-r1', item.r1);
  setVal('ref-r2', item.r2);
  setVal('ref-anamnesis', item.anamnesis);
  setVal('ref-treatment', item.treatment);
  setVal('ref-hosp', item.hosp);
  setVal('ref-vn', item.vn);
  setVal('ref-extra', item.extra);
  setVal('ref-doc', item.doc);
  setVal('ref-head', item.head);
  saveToLocal();
  closeRefHistory();
  alert('Направление загружено. Можно отредактировать и распечатать.');
}
function deleteRefHistory(idx) {
  if (!confirm('Удалить эту запись из истории?')) return;
  let history = [];
  try { history = JSON.parse(localStorage.getItem(REF_HISTORY_KEY) || '[]'); } catch (e) {}
  history.splice(idx, 1);
  localStorage.setItem(REF_HISTORY_KEY, JSON.stringify(history));
  renderRefHistory();
}

/* ---------- 37. История консилиума ---------- */
const CONS_HISTORY_KEY = 'cons_history';
function getConsData() {
  const v = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  return {
    date: v('cons-date'), city: v('cons-city'), doctor: v('cons-doctor-input'),
    fio: v('cons-patient-fio'), age: v('cons-patient-age'),
    objective: v('cons-objective'), diagnosis: v('cons-diagnosis'), treatment: v('cons-treatment'),
    savedAt: new Date().toISOString()
  };
}
function saveConsHistory() {
  const data = getConsData();
  if (!data.fio && !data.diagnosis && !data.objective) return;
  let history = [];
  try { history = JSON.parse(localStorage.getItem(CONS_HISTORY_KEY) || '[]'); } catch (e) {}
  history.unshift(data);
  if (history.length > 20) history = history.slice(0, 20);
  localStorage.setItem(CONS_HISTORY_KEY, JSON.stringify(history));
}
function openConsHistory() {
  renderConsHistory();
  const m = document.getElementById('cons-history-modal');
  if (m) m.classList.add('active');
}
function closeConsHistory(e) {
  if (e && e.target !== e.currentTarget) return;
  const m = document.getElementById('cons-history-modal');
  if (m) m.classList.remove('active');
}
function renderConsHistory() {
  const list = document.getElementById('cons-history-list');
  if (!list) return;
  let history = [];
  try { history = JSON.parse(localStorage.getItem(CONS_HISTORY_KEY) || '[]'); } catch (e) {}
  if (history.length === 0) {
    list.innerHTML = '<p style="color:var(--muted); text-align:center;">История пуста.</p>';
    return;
  }
  list.innerHTML = history.map((item, idx) => {
    const date = item.date || '—';
    const fio = item.fio || 'Без ФИО';
    return `<div class="history-item">
      <div class="meta"><b>${date}</b> — ${fio}</div>
      <div class="actions">
        <button class="btn btn-sm btn-primary" onclick="loadConsHistory(${idx})">Загрузить</button>
        <button class="btn btn-sm btn-secondary" style="color:var(--red);" onclick="deleteConsHistory(${idx})">Удалить</button>
      </div>
    </div>`;
  }).join('');
}
function loadConsHistory(idx) {
  let history = [];
  try { history = JSON.parse(localStorage.getItem(CONS_HISTORY_KEY) || '[]'); } catch (e) {}
  const item = history[idx];
  if (!item) return;
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = val || '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };
  setVal('cons-date', item.date);
  setVal('cons-city', item.city);
  setVal('cons-doctor-input', item.doctor);
  setVal('cons-patient-fio', item.fio);
  setVal('cons-patient-age', item.age);
  setVal('cons-objective', item.objective);
  setVal('cons-diagnosis', item.diagnosis);
  setVal('cons-treatment', item.treatment);
  saveToLocal();
  closeConsHistory();
  alert('Протокол консилиума загружен.');
}
function deleteConsHistory(idx) {
  if (!confirm('Удалить эту запись из истории?')) return;
  let history = [];
  try { history = JSON.parse(localStorage.getItem(CONS_HISTORY_KEY) || '[]'); } catch (e) {}
  history.splice(idx, 1);
  localStorage.setItem(CONS_HISTORY_KEY, JSON.stringify(history));
  renderConsHistory();
}

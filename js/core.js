/* =========================================================
   ВОП-Helper — core.js
   Навигация, тема, врач, утилиты, автосохранение, даты, textarea
   ========================================================= */

/* =========================================================
   ВОП-Helper — полная логика приложения (без базы ЛС)
   ========================================================= */

/* ---------- 1. Навигация и меню (multi-page) ---------- */
function go(id){
  const isSub = /\/pages\//.test(location.pathname) || location.pathname.endsWith('/pages');
  if (id === 'home') {
    location.href = isSub ? '../index.html' : 'index.html';
    return;
  }
  const page = 'pages/' + id + '.html';
  location.href = isSub ? '../' + page : page;
}
// Nav links are real <a href>, no preventDefault needed. Only close sidebar on mobile.
document.querySelectorAll('.nav-link').forEach(a=>{
  a.addEventListener('click', ()=>{
    const sb=document.getElementById('sidebar'); if(sb) sb.classList.remove('open');
  });
});
const burgerBtn=document.getElementById('burger');
if(burgerBtn){ burgerBtn.addEventListener('click',()=>{
  const sb=document.getElementById('sidebar'); if(sb) sb.classList.toggle('open');
}); }

/* ---------- 2. Тема ---------- */
function toggleTheme(){
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  document.getElementById('theme-toggle').textContent = isDark ? '☀️' : '🌙';
}
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
(function initTheme(){
  const saved = localStorage.getItem('theme');
  if(saved === 'dark'){
    document.body.classList.add('dark');
    document.getElementById('theme-toggle').textContent = '☀️';
  }
})();

/* ---------- 3. Выбор врача ---------- */
const DOCTORS = ['Гринич Анастасия Александровна',''];
const DOCTOR_STORAGE_KEY = 'vop_doctor';
function initDoctorSelect(){
  const sel = document.getElementById('doctor-select');
  if(!sel) return;
  DOCTORS.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d; opt.textContent = d;
    sel.appendChild(opt);
  });
  const saved = localStorage.getItem(DOCTOR_STORAGE_KEY);
  if(saved && DOCTORS.includes(saved)) sel.value = saved;
  sel.addEventListener('change', () => {
    localStorage.setItem(DOCTOR_STORAGE_KEY, sel.value);
    fillDoctorFields();
  });
  fillDoctorFields();
}
function getCurrentDoctor(){
  const sel = document.getElementById('doctor-select');
  return sel ? sel.value : (DOCTORS[0] || '');
}

function getShortDoctorName(fullName) {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 3) {
    return `${parts[1][0]}.${parts[2][0]}. ${parts[0]}`; 
  }
  if (parts.length === 2) {
    return `${parts[1][0]}. ${parts[0]}`;
  }
  return fullName;
}

function fillDoctorFields(){
  const docFull = getCurrentDoctor();
  
  // Заполнение редактируемого поля в консилиуме
  const docInput = document.getElementById('cons-doctor-input');
  if(docInput) docInput.value = docFull;

  // Лечащий врач в направлении — только если поле пустое (можно править вручную)
  const refDoc = document.getElementById('ref-doc');
  if(refDoc && !refDoc.value.trim()) refDoc.value = docFull;

  ['acq-doctor-sign','chads-doctor-sign','findrisk-doctor-sign','hads-doctor-sign','auditc-doctor-sign','mmse-doctor-sign','bdi-doctor-sign','cat-doctor-sign'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.textContent = docFull;
  });
  
  const memberEl = document.getElementById('p-vkk-member-1-name');
  if(memberEl) memberEl.textContent = getShortDoctorName(docFull);
}
initDoctorSelect();

/* ---------- 4. Утилиты ---------- */
const fmt=(n,d=2)=>{const s=Number(n).toFixed(d);return s.replace(/\.?0+$/,'')||'0';};
const showBox=(id,html,cls='')=>{
  const el=document.getElementById(id); if(!el) return;
  el.className='result-box '+(cls||'');
  el.innerHTML=html;
};
function renderCheckList(containerId, items, checkboxName){
  const c=document.getElementById(containerId); if(!c) return;
  c.innerHTML=items.map(it=>
    `<label class="checkbox-row" data-p="${it.p}">
       <input type="checkbox" name="${checkboxName}" value="${it.id||''}">
       <span>${it.t}${it.p>0?' <b style="color:var(--primary-dark)">+'+it.p+'</b>':(it.p<0?' <b style="color:var(--red)">'+it.p+'</b>':'')}</span>
     </label>`).join('');
  c.querySelectorAll('.checkbox-row').forEach(el=>{
    el.addEventListener('change',()=>el.classList.toggle('selected', el.querySelector('input').checked));
  });
}

// Склонение возраста
function getAgeString(age) {
  age = Math.abs(age);
  const lastDigit = age % 10;
  const lastTwoDigits = age % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'лет';
  if (lastDigit === 1) return 'год';
  if (lastDigit >= 2 && lastDigit <= 4) return 'года';
  return 'лет';
}

/* ---------- 5. Автосохранение ---------- */
const STORAGE_KEY = 'vop_helper_data';
function saveToLocal() {
  const data = {};
  document.querySelectorAll('input, select, textarea').forEach(el => {
    if (!el.id || el.id === 'doctor-select' || el.readOnly) return;
    if (el.type === 'checkbox' || el.type === 'radio') data[el.id] = el.checked;
    else data[el.id] = el.value;
  });
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
}
function loadFromLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    Object.keys(data).forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (el.type === 'checkbox' || el.type === 'radio') {
          el.checked = data[id];
          if (el.checked) el.closest('label')?.classList.add('selected');
        } else { 
          el.value = data[id]; 
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  } catch (e) {}
}
document.addEventListener('input', saveToLocal);
document.addEventListener('change', saveToLocal);
document.addEventListener('DOMContentLoaded', loadFromLocal);

/* ---------- 6. Работа с датами ---------- */
function todayStr(){
  const d=new Date();
  return String(d.getDate()).padStart(2,'0')+'.'+
         String(d.getMonth()+1).padStart(2,'0')+'.'+d.getFullYear();
}
function parseDateSafe(str) {
  if (!str || str.length !== 10) return null;
  const parts = str.split('.');
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const y = parseInt(parts[2], 10);
  const date = new Date(Date.UTC(y, m, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m || date.getUTCDate() !== d) return null;
  return date;
}
function formatDateWithDay(d) {
  const days = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}.${mm}.${yyyy} (${days[d.getUTCDay()]})`;
}
function getDiffDays(dateStart, dateEnd) {
  return Math.round((dateEnd.getTime() - dateStart.getTime()) / 86400000) + 1;
}
function attachDateMask(id, autoFill){
  const el=document.getElementById(id); if(!el) return;
  if(autoFill && !el.value) el.value=todayStr();
  el.addEventListener('input',()=>{
    let d=el.value.replace(/\D/g,'').slice(0,8);
    let out=d;
    if(d.length>4) out=d.slice(0,2)+'.'+d.slice(2,4)+'.'+d.slice(4);
    else if(d.length>2) out=d.slice(0,2)+'.'+d.slice(2);
    el.value=out;
  });
  el.addEventListener('keydown',e=>{
    const allow=['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End','Enter'];
    if(allow.includes(e.key)) return;
    if(e.ctrlKey||e.metaKey) return;
    if(!/^\d$/.test(e.key)) e.preventDefault();
  });
}
['vkk-date','acq-date','chads-date','hasbled-date','chads-hasbled-date','findrisk-date','hads-date','auditc-date','mmse-date','bdi-date','cat-date','sick-start','sick-start-2','sick-end','cons-date','ref-date'].forEach(id => attachDateMask(id, true));
attachDateMask('vkk-start', false);

// Календари
(function enhanceDateInputs() {
  const ids = ['vkk-date','vkk-start','acq-date','chads-date','hasbled-date','chads-hasbled-date','findrisk-date','hads-date','auditc-date','mmse-date','bdi-date','cat-date','sick-start','sick-start-2','sick-end','cons-date','ref-date'];
  ids.forEach(id => {
    const textInput = document.getElementById(id);
    if (!textInput || textInput.parentElement.classList.contains('date-input-group')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'date-input-group';
    wrapper.style.position = 'relative';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    textInput.parentNode.insertBefore(wrapper, textInput);
    wrapper.appendChild(textInput);
    const datePicker = document.createElement('input');
    datePicker.type = 'date';
    datePicker.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:0;height:0;';
    wrapper.appendChild(datePicker);
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'date-picker-btn'; btn.innerHTML = '📅'; btn.title = 'Открыть календарь';
    btn.style.cssText = 'background:none; border:none; font-size:20px; cursor:pointer; padding:0 8px; position:absolute; right:0;';
    wrapper.appendChild(btn);
    function syncToPicker() {
      const val = textInput.value;
      if (val && val.length === 10) {
        const parts = val.split('.');
        datePicker.value = `${parts[2]}-${parts[1]}-${parts[0]}`;
      } else { datePicker.value = ''; }
    }
    datePicker.addEventListener('change', () => {
      if (!datePicker.value) return;
      const parts = datePicker.value.split('-');
      textInput.value = `${parts[2]}.${parts[1]}.${parts[0]}`;
      textInput.dispatchEvent(new Event('input', { bubbles: true }));
      textInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    btn.addEventListener('click', (e) => {
      e.preventDefault(); syncToPicker();
      if (datePicker.showPicker) { try { datePicker.showPicker(); } catch (err) { datePicker.focus(); datePicker.click(); } }
      else { datePicker.focus(); datePicker.click(); }
    });
  });
})();

/* ---------- 7. Авторасширение textarea ---------- */
document.querySelectorAll('textarea.auto-resize').forEach(ta => {
  const resize = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
  ta.addEventListener('input', resize);
  resize();
});


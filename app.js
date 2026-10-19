/* =========================================================
   ВОП-Helper — полная логика приложения
   ========================================================= */

/* ---------- 1. Навигация и меню ---------- */
function go(id){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  const sec=document.getElementById(id);
  if(sec) sec.classList.add('active');
  
  const activeLink = document.querySelector(`.nav-link[data-section="${id}"]`);
  if (activeLink) {
    const details = activeLink.closest('details');
    if (details && !details.open) details.open = true;
  }

  document.querySelectorAll('.nav-link').forEach(a=>{
    a.classList.toggle('active', a.dataset.section===id);
  });
  const sb=document.getElementById('sidebar'); if(sb) sb.classList.remove('open');
  window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('.nav-link').forEach(a=>{
  a.addEventListener('click',e=>{e.preventDefault();go(a.dataset.section);});
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
const DOCTORS = ['Гринич Анастасия Александровна'];
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
function fillDoctorFields(){
  // Больше не заполняем поля в шапке, так как их убрали. 
  // Заполнение будет происходить динамически в функциях печати.
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
['vkk-date','acq-date','chads-date','findrisk-date','hads-date','auditc-date','mmse-date','bdi-date','cat-date','sick-start','sick-start-2','sick-end'].forEach(id => attachDateMask(id, true));
attachDateMask('vkk-start', false);

// Календари
(function enhanceDateInputs() {
  const ids = ['vkk-date','vkk-start','acq-date','chads-date','findrisk-date','hads-date','auditc-date','mmse-date','bdi-date','cat-date','sick-start','sick-start-2','sick-end'];
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

/* ---------- 8. СКФ (eGFR) ---------- */
const egfrFormula=document.getElementById('egfr-formula');
if(egfrFormula){
  egfrFormula.addEventListener('change',e=>{
    const f=e.target.value;
    document.getElementById('egfr-race-wrap').style.display=(f==='ckdepi2009'||f==='mdrd')?'':'none';
    document.getElementById('egfr-weight-wrap').style.display=(f==='cg')?'':'none';
  });
  egfrFormula.dispatchEvent(new Event('change'));
}
function resetEgfr(){
  ['egfr-age','egfr-cr','egfr-weight'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  const r=document.getElementById('egfr-result'); if(r) r.className='result-box empty';
  const a=document.getElementById('egfr-all'); if(a) a.innerHTML='';
}
function calcEgfr(){
  const age=+document.getElementById('egfr-age').value;
  const sex=document.getElementById('egfr-sex').value;
  const unit=document.getElementById('egfr-unit').value;
  let cr=+document.getElementById('egfr-cr').value;
  const formula=document.getElementById('egfr-formula').value;
  const race=document.getElementById('egfr-race').checked;
  const weight=+document.getElementById('egfr-weight').value;
  if(!age||!cr||age<18){ showBox('egfr-result','<span style="color:var(--red)">Заполните все поля (возраст ≥18).</span>'); return; }
  if(unit==='umol') cr=cr/88.4;
  const female=(sex==='f');
  const results=[];
  {const k=female?0.7:0.9, a=female?-0.241:-0.302;
   let e=142*Math.pow(Math.min(cr/k,1),a)*Math.pow(Math.max(cr/k,1),-1.200)*Math.pow(0.9938,age)*(female?1.012:1);
   results.push({name:'CKD-EPI 2021', val:e, key:'ckdepi2021'});}
  {const k=female?0.7:0.9, a=female?-0.329:-0.411;
   let e=141*Math.pow(Math.min(cr/k,1),a)*Math.pow(Math.max(cr/k,1),-1.209)*Math.pow(0.993,age)*(female?1.018:1)*(race?1.159:1);
   results.push({name:'CKD-EPI 2009', val:e, key:'ckdepi2009'});}
  {let e=175*Math.pow(cr,-1.154)*Math.pow(age,-0.203)*(female?0.742:1)*(race?1.212:1);
   results.push({name:'MDRD', val:e, key:'mdrd'});}
  if(weight){
    let c=((140-age)*weight*(female?1.04:1.23))/cr;
    results.push({name:'Кокрофт-Голт (мл/мин)', val:c, key:'cg', isCrCl:true});
  }
  const main=results.find(r=>r.key===formula)||results[0];
  let interp, cls='good';
  if(main.isCrCl){
    if(main.val>=90){interp='Норма';cls='good';}
    else if(main.val>=60){interp='Незначительное снижение';cls='good';}
    else if(main.val>=30){interp='Умеренное снижение';cls='warn';}
    else if(main.val>=15){interp='Выраженное снижение';cls='bad';}
    else{interp='Терминальная стадия';cls='bad';}
  } else {
    if(main.val>=90){interp='C1 — Норма';cls='good';}
    else if(main.val>=60){interp='C2 — Незначительно снижена';cls='good';}
    else if(main.val>=45){interp='C3a — Умеренно снижена';cls='warn';}
    else if(main.val>=30){interp='C3b — Существенно снижена';cls='warn';}
    else if(main.val>=15){interp='C4 — Резко снижена';cls='bad';}
    else{interp='C5 — Терминальная почечная недостаточность';cls='bad';}
  }
  showBox('egfr-result',
    `<div class="label">${main.name}</div>
     <div class="val">${fmt(main.val,1)} <span style="font-size:14px;color:var(--muted)">${main.isCrCl?'мл/мин':'мл/мин/1,73м²'}</span></div>
     <div class="interp"><b>Интерпретация:</b> ${interp}</div>`, cls);
  const allEl=document.getElementById('egfr-all');
  if(allEl){
    allEl.innerHTML=`<div style="font-weight:600;margin-bottom:6px">Все формулы:</div>`+
      results.map(r=>`<div class="row"><span>${r.name}</span><b>${fmt(r.val,1)}</b></div>`).join('');
  }
}

/* ---------- 9. Клиренс креатинина ---------- */
function calcCrCl(){
  const age = +document.getElementById('crcl-age').value;
  const sex = document.getElementById('crcl-sex').value;
  const weight = +document.getElementById('crcl-weight').value;
  let cr = +document.getElementById('crcl-cr').value;
  const unit = document.getElementById('crcl-unit').value;
  if(!age || !weight || !cr){ showBox('crcl-result','<span style="color:var(--red)">Заполните все поля.</span>'); return; }
  if(unit === 'mgdl') cr = cr * 88.4;
  let crcl = ((140 - age) * weight * (sex === 'm' ? 1.23 : 1.04)) / cr;
  let cls = 'good', interp = '';
  if (crcl >= 90) interp = 'Норма';
  else if (crcl >= 60) interp = 'Незначительное снижение';
  else if (crcl >= 30) { interp = 'Умеренное снижение'; cls = 'warn'; }
  else if (crcl >= 15) { interp = 'Выраженное снижение'; cls = 'bad'; }
  else { interp = 'Терминальная стадия'; cls = 'bad'; }
  showBox('crcl-result',
    `<div class="label">Клиренс креатинина (Кокрофт-Голт)</div>
     <div class="val">${fmt(crcl, 1)} <span style="font-size:14px;color:var(--muted)">мл/мин</span></div>
     <div class="interp"><b>Интерпретация:</b> ${interp}</div>`, cls);
}

/* ---------- 10. ИМТ + ампутация ---------- */
function bmiInterpret(b){
  if(b<16) return ['Выраженный дефицит массы тела','bad'];
  if(b<18.5) return ['Недостаточная масса тела','warn'];
  if(b<25) return ['Норма','good'];
  if(b<30) return ['Избыточная масса тела (предожирение)','warn'];
  if(b<35) return ['Ожирение I степени','bad'];
  if(b<40) return ['Ожирение II степени','bad'];
  return ['Ожирение III степени (морбидное)','bad'];
}
function calcBmi(){
  const w=+document.getElementById('bmi-w').value, h=+document.getElementById('bmi-h').value/100;
  if(!w||!h){ showBox('bmi-result','<span style="color:var(--red)">Заполните вес и рост.</span>'); return; }
  const b=w/(h*h); const [txt,cls]=bmiInterpret(b);
  showBox('bmi-result',
    `<div class="label">Индекс массы тела</div>
     <div class="val">${fmt(b,1)} кг/м²</div>
     <div class="interp"><b>Интерпретация:</b> ${txt}</div>`, cls);
}
const AMP_SEGMENTS=[
  {id:'foot',name:'Стопа',pct:1.5},
  {id:'belowknee',name:'Голень / ниже колена',pct:6},
  {id:'aboveknee',name:'Бедро / выше колена',pct:16},
  {id:'hip',name:'Экзартикуляция бедра',pct:18.5},
  {id:'hand',name:'Кисть',pct:0.7},
  {id:'belowelbow',name:'Предплечье / ниже локтя',pct:2.3},
  {id:'aboveelbow',name:'Плечо / выше локтя',pct:3.5},
  {id:'shoulder',name:'Экзартикуляция плеча',pct:5},
  {id:'breast',name:'Молочная железа',pct:1.5},
];
(function renderAmpList(){
  const el=document.getElementById('amp-list'); if(!el) return;
  el.innerHTML=AMP_SEGMENTS.map(s=>
    `<div class="amp-item">
       <span>${s.name} <span style="color:var(--muted)">(${s.pct}%)</span></span>
       <select class="amp-qty" data-pct="${s.pct}" data-name="${s.name}">
         <option value="0">0</option>
         <option value="1">1</option>
         <option value="2">2</option>
       </select>
     </div>`).join('');
})();

function calcBmiAmp(){
  const w=+document.getElementById('bmiamp-w').value,h=+document.getElementById('bmiamp-h').value/100;
  if(!w||!h){ showBox('bmiamp-result','<span style="color:var(--red)">Заполните вес и рост.</span>'); return; }
  let lossPct=0; const chosen=[];
  
  document.querySelectorAll('.amp-qty').forEach(sel=>{
    const qty = +sel.value;
    if (qty > 0) {
      const pct = +sel.dataset.pct;
      lossPct += pct * qty;
      chosen.push(`${sel.dataset.name} (${qty} шт.)`);
    }
  });
  
  if(lossPct>=100){ showBox('bmiamp-result','<span style="color:var(--red)">Суммарная доля ≥100%.</span>'); return; }
  const bmiRaw=w/(h*h);
  const bmiCorr=w/(h*h*(1-lossPct/100));
  const [txt,cls]=bmiInterpret(bmiCorr);
  
  showBox('bmiamp-result',
    `<div class="label">ИМТ с поправкой на ампутацию</div>
     <div class="val">${fmt(bmiCorr,1)} кг/м²</div>
     <div class="interp">Без поправки: <b>${fmt(bmiRaw,1)}</b> кг/м²<br>Потеря массы: <b>${fmt(lossPct,1)}%</b>${chosen.length?`<br>Сегменты: ${chosen.join(', ')}`:''}<br><b>Интерпретация:</b> ${txt}</div>`, cls);
}

/* ---------- 11. SCORE2 / SCORE2-OP / SCORE2-Diabetes ---------- */
function calcScore2(){
  const age=+document.getElementById('s2-age').value;
  const sex=document.getElementById('s2-sex').value;
  const smoker=document.getElementById('s2-smoke').checked?1:0;
  const sbp=+document.getElementById('s2-sbp').value;
  const tc=+document.getElementById('s2-tc').value;
  const hdl=+document.getElementById('s2-hdl').value;
  const region=document.getElementById('s2-region').value;
  if(!age||!sbp||!tc||!hdl){ showBox('s2-result','<span style="color:var(--red)">Заполните все поля.</span>'); return; }
  if(age<40||age>69){ showBox('s2-result','<span style="color:var(--orange)">SCORE2 — 40–69 лет. Для 70+ SCORE2-OP.</span>','info'); return; }
  const coef=sex==='m'?{age:0.3742,smoke:0.6012,sbp:0.2777,tc:0.1458,hdl:-0.2698}:{age:0.4648,smoke:0.7744,sbp:0.3131,tc:0.1002,hdl:-0.2606};
  const lp=coef.age*((age-60)/5)+coef.smoke*smoker+coef.sbp*((sbp-120)/20)+coef.tc*(tc-6)+coef.hdl*((hdl-1.3)/0.5);
  const S10={m:{low:0.9605,mod:0.9475,high:0.9333,vhigh:0.9161},f:{low:0.9776,mod:0.9683,high:0.9568,vhigh:0.9423}};
  const s10=S10[sex][region];
  const risk=(1-Math.pow(s10,Math.exp(lp)))*100;
  const isYounger=age<50;
  const tLow=isYounger?2.5:5;
  const tHigh=isYounger?7.5:10;
  let cls,txt;
  if(risk<tLow){cls='good';txt='Низкий риск';}
  else if(risk<tHigh){cls='warn';txt='Умеренный риск';}
  else {cls='bad';txt='Высокий риск';}
  let rec='';
  if(risk>=tHigh) rec='Показана интенсивная гиполипидемическая терапия и коррекция факторов риска.';
  else if(risk>=tLow) rec='Рассмотреть начало гиполипидемической терапии.';
  else rec='Первичная профилактика.';
  showBox('s2-result',
    `<div class="label">SCORE2 — 10-летний риск ССЗ</div>
     <div class="val">${fmt(risk,1)}%</div>
     <div class="interp"><b>${txt}.</b> ${rec}<br><small style="color:var(--muted)">Пороги: ${tLow}% / ${tHigh}%.</small></div>`, cls);
}
function calcScore2Op(){
  const age=+document.getElementById('s2op-age').value;
  const sex=document.getElementById('s2op-sex').value;
  const smoker=document.getElementById('s2op-smoke').checked?1:0;
  const sbp=+document.getElementById('s2op-sbp').value;
  const tc=+document.getElementById('s2op-tc').value;
  const hdl=+document.getElementById('s2op-hdl').value;
  const region=document.getElementById('s2op-region').value;
  if(!age||!sbp||!tc||!hdl){ showBox('s2op-result','<span style="color:var(--red)">Заполните все поля.</span>'); return; }
  if(age<70||age>89){ showBox('s2op-result','<span style="color:var(--orange)">SCORE2-OP — 70–89 лет.</span>','info'); return; }
  const coef=sex==='m'?{age:0.3040,smoke:0.3463,sbp:0.2194,tc:0.1157,hdl:-0.1256}:{age:0.3723,smoke:0.4322,sbp:0.2404,tc:0.0763,hdl:-0.1449};
  const lp=coef.age*((age-73)/5)+coef.smoke*smoker+coef.sbp*((sbp-120)/20)+coef.tc*(tc-6)+coef.hdl*((hdl-1.3)/0.5);
  const S10={m:{low:0.7578,mod:0.7015,high:0.6402,vhigh:0.5746},f:{low:0.8354,mod:0.7990,high:0.7560,vhigh:0.7073}};
  const s10=S10[sex][region];
  const risk=(1-Math.pow(s10,Math.exp(lp)))*100;
  let cls,txt;
  if(risk<7.5){cls='good';txt='Низкий / умеренный риск';}
  else if(risk<15){cls='warn';txt='Высокий риск';}
  else {cls='bad';txt='Очень высокий риск';}
  let rec='';
  if(risk>=15) rec='Показана интенсивная терапия, вторичная профилактика.';
  else if(risk>=7.5) rec='Рассмотреть гиполипидемическую терапию.';
  else rec='Первичная профилактика.';
  showBox('s2op-result',
    `<div class="label">SCORE2-OP — 10-летний риск ССЗ</div>
     <div class="val">${fmt(risk,1)}%</div>
     <div class="interp"><b>${txt}.</b> ${rec}<br><small style="color:var(--muted)">Пороги: &lt;7.5% · 7.5–15% · ≥15%</small></div>`, cls);
}
function calcScore2Dm(){
  const age=+document.getElementById('s2dm-age').value;
  const sex=document.getElementById('s2dm-sex').value;
  const smoker=document.getElementById('s2dm-smoke').checked?1:0;
  const sbp=+document.getElementById('s2dm-sbp').value;
  const tc=+document.getElementById('s2dm-tc').value;
  const hdl=+document.getElementById('s2dm-hdl').value;
  const ageDm=+document.getElementById('s2dm-agedm').value;
  const hba1c=+document.getElementById('s2dm-hba1c').value;
  const egfr=+document.getElementById('s2dm-egfr').value;
  const region=document.getElementById('s2dm-region').value;
  if(!age||!sbp||!tc||!hdl||!ageDm||!hba1c||!egfr){ showBox('s2dm-result','<span style="color:var(--red)">Заполните все поля.</span>'); return; }
  if(age<40||age>69){ showBox('s2dm-result','<span style="color:var(--orange)">SCORE2-Diabetes — 40–69 лет.</span>','info'); return; }
  const coef = sex==='m'
    ? {age:0.3742, smoke:0.6012, sbp:0.2777, tc:0.1458, hdl:-0.2698}
    : {age:0.4648, smoke:0.7744, sbp:0.3131, tc:0.1002, hdl:-0.2606};
  const beta_hba1c = sex==='m' ? 0.25 : 0.22;
  const beta_agedm = sex==='m' ? -0.015 : -0.012;
  const beta_egfr = sex==='m' ? -0.18 : -0.15;
  let lp = coef.age * ((age - 60) / 5) + coef.smoke * smoker + coef.sbp * ((sbp - 120) / 20)
         + coef.tc * (tc - 6) + coef.hdl * ((hdl - 1.3) / 0.5)
         + beta_hba1c * (hba1c - 7.0) + beta_agedm * (ageDm - 50) + beta_egfr * Math.log(egfr / 90);
  const S10 = { m:{low:0.9605, mod:0.9475, high:0.9333, vhigh:0.9161}, f:{low:0.9776, mod:0.9683, high:0.9568, vhigh:0.9423} };
  const s10 = S10[sex][region];
  const risk = (1 - Math.pow(s10, Math.exp(lp))) * 100;
  let cls = 'good', txt = '', rec = '';
  if (risk < 5) { cls = 'good'; txt = 'Низкий риск'; rec = 'Стандартная профилактика.'; }
  else if (risk < 10) { cls = 'warn'; txt = 'Умеренный риск'; rec = 'Рассмотреть интенсификацию гиполипидемической терапии.'; }
  else if (risk < 20) { cls = 'bad'; txt = 'Высокий риск'; rec = 'Показана интенсивная гиполипидемическая терапия.'; }
  else { cls = 'bad'; txt = 'Очень высокий риск'; rec = 'Агрессивная коррекция всех факторов риска.'; }
  showBox('s2dm-result',
    `<div class="label">SCORE2-Diabetes — 10-летний риск ССЗ</div>
     <div class="val">${fmt(risk,1)}%</div>
     <div class="interp"><b>${txt}.</b> ${rec}<br><small style="color:var(--muted)">Пороги: 5% / 10% / 20%.</small></div>`, cls);
}

/* ---------- 12. CHA2DS2-VASc ---------- */
const CHADS=[
  {id:'c',  t:'Сердечная недостаточность / дисфункция ЛЖ', p:1},
  {id:'h',  t:'Артериальная гипертензия', p:1},
  {id:'a2', t:'Возраст ≥75 лет', p:2},
  {id:'d',  t:'Сахарный диабет', p:1},
  {id:'s2', t:'Инсульт / ТИА / тромбоэмболия в анамнезе', p:2},
  {id:'v',  t:'Сосудистое заболевание', p:1},
  {id:'a',  t:'Возраст 65–74 года', p:1},
  {id:'sc', t:'Женский пол', p:1},
];
renderCheckList('chads-list', CHADS, 'chads');
function getChadsScore(){
  let score=0; const selected=[];
  document.querySelectorAll('#chads-list input:checked').forEach(i=>{
    score+=+i.closest('label').dataset.p;
    selected.push(i.closest('label').querySelector('span').textContent.replace(/ \+\d+$/,'').trim());
  });
  return {score, selected};
}
function chadsInterpret(score){
  if(score===0) return {cls:'good', txt:'Низкий риск', rec:'Антикоагулянты не показаны.'};
  if(score===1) return {cls:'warn', txt:'Промежуточный риск', rec:'Рассмотреть антикоагулянтную терапию.'};
  return {cls:'bad', txt:'Высокий риск тромбоэмболии', rec:'Показана антикоагулянтная терапия.'};
}
function calcChads(){
  const {score}=getChadsScore();
  const {cls, txt, rec}=chadsInterpret(score);
  showBox('chads-result',
    `<div class="label">CHA₂DS₂-VASc</div>
     <div class="val">${score} балл(ов)</div>
     <div class="interp"><b>${txt}.</b> ${rec}</div>`, cls);
}
function resetChads(){
  document.querySelectorAll('#chads-list input').forEach(i=>i.checked=false);
  document.querySelectorAll('#chads-list .checkbox-row').forEach(r=>r.classList.remove('selected'));
  const r=document.getElementById('chads-result'); if(r) r.className='result-box empty';
}
function printChads(){
  const {score, selected}=getChadsScore();
  const {txt, rec}=chadsInterpret(score);
  document.getElementById('p-chads-fio').textContent=document.getElementById('chads-fio').value.trim();
  document.getElementById('p-chads-date').textContent=document.getElementById('chads-date').value.trim();
  document.getElementById('p-chads-doctor-sign').textContent=getCurrentDoctor();
  const html=CHADS.map(it=>{
    const checked=selected.includes(it.t.replace(/ \+\d+$/,'').trim());
    const mark=checked?'☑':'☐';
    return `<div class="acq-print-q"><div class="q-text">${mark} ${it.t} (+${it.p})</div></div>`;
  }).join('');
  document.getElementById('p-chads-questions').innerHTML=html;
  document.getElementById('p-chads-sum').textContent=score+' балл(ов)';
  document.getElementById('p-chads-interp').textContent=txt;
  document.getElementById('p-chads-rec').textContent=rec;
  document.body.classList.add('printing-acq');
  window.print();
}

/* ---------- 13. HAS-BLED ---------- */
const HASBLED=[
  {id:'h', t:'Артериальная гипертензия (САД > 160 мм рт. ст.)', p:1},
  {id:'a1',t:'Нарушение функции почек', p:1},
  {id:'a2',t:'Нарушение функции печени', p:1},
  {id:'s', t:'Инсульт в анамнезе', p:1},
  {id:'b', t:'Кровотечение в анамнезе', p:1},
  {id:'l', t:'Лабильное МНО (TTR < 60%)', p:1},
  {id:'e', t:'Возраст > 65 лет', p:1},
  {id:'d1',t:'Приём препаратов, повышающих риск кровотечения', p:1},
  {id:'d2',t:'Злоупотребление алкоголем', p:1},
];
renderCheckList('hasbled-list', HASBLED, 'hasbled');
function calcHasbled(){
  let score=0;
  document.querySelectorAll('#hasbled-list input:checked').forEach(i=>score+=+i.closest('label').dataset.p);
  let cls='good', txt='';
  if(score<=1){txt='Низкий риск кровотечений.';cls='good';}
  else if(score===2){txt='Умеренный риск.';cls='warn';}
  else {txt='Высокий риск кровотечений.';cls='bad';}
  showBox('hasbled-result',
    `<div class="label">HAS-BLED</div>
     <div class="val">${score} балл(ов)</div>
     <div class="interp">${txt}</div>`, cls);
}

/* ---------- 14. CURB-65 ---------- */
const CURB=[
  {id:'c', t:'Нарушение сознания', p:1},
  {id:'u', t:'Мочевина > 7 ммоль/л', p:1},
  {id:'r', t:'ЧДД ≥ 30 в минуту', p:1},
  {id:'b', t:'АД: САД < 90 или ДАД ≤ 60 мм рт. ст.', p:1},
  {id:'65',t:'Возраст ≥ 65 лет', p:1},
];
renderCheckList('curb-list', CURB, 'curb');
function calcCurb(){
  let score=0;
  document.querySelectorAll('#curb-list input:checked').forEach(i=>score+=+i.closest('label').dataset.p);
  let cls='good', txt='';
  if(score===0){txt='Летальность <1%. Амбулаторное лечение.';cls='good';}
  else if(score===1){txt='Летальность ~1.5%. Амбулаторное / короткое стационарное.';cls='good';}
  else if(score===2){txt='Летальность ~9%. Стационарное лечение.';cls='warn';}
  else if(score===3){txt='Летальность ~17%. Стационар, возможно ОРИТ.';cls='bad';}
  else {txt='Летальность 20–30%. ОРИТ.';cls='bad';}
  showBox('curb-result',
    `<div class="label">CURB-65</div>
     <div class="val">${score} балл(ов)</div>
     <div class="interp">${txt}</div>`, cls);
}

/* ---------- 15. GCS ---------- */
function calcGcs(){
  const e=+document.getElementById('gcs-e').value;
  const v=+document.getElementById('gcs-v').value;
  const m=+document.getElementById('gcs-m').value;
  const total=e+v+m;
  let cls='good', txt='';
  if(total>=13){txt='Лёгкое нарушение / ясное сознание';cls='good';}
  else if(total>=9){txt='Умеренное нарушение сознания';cls='warn';}
  else if(total>=4){txt='Тяжёлая кома';cls='bad';}
  else {txt='Терминальное состояние';cls='bad';}
  showBox('gcs-result',
    `<div class="label">Шкала комы Глазго</div>
     <div class="val">${total} балл(ов)</div>
     <div class="interp">E${e} + V${v} + M${m} = ${total}<br><b>${txt}</b></div>`, cls);
}

/* ---------- 16. Charlson ---------- */
const CHARLSON=[
  {t:'Инфаркт миокарда', p:1},
  {t:'Застойная сердечная недостаточность', p:1},
  {t:'Заболевание периферических артерий', p:1},
  {t:'Цереброваскулярное заболевание', p:1},
  {t:'Деменция', p:1},
  {t:'Хроническое заболевание лёгких', p:1},
  {t:'Заболевание соединительной ткани', p:1},
  {t:'Язвенная болезнь', p:1},
  {t:'Лёгкое заболевание печени', p:1},
  {t:'Сахарный диабет без осложнений', p:1},
  {t:'Сахарный диабет с осложнениями', p:2},
  {t:'Гемиплегия', p:2},
  {t:'Умеренное/тяжёлое заболевание почек', p:2},
  {t:'Солидная опухоль без метастазов', p:2},
  {t:'Лейкемия', p:2},
  {t:'Лимфома', p:2},
  {t:'Умеренное/тяжёлое заболевание печени', p:3},
  {t:'Метастатическая солидная опухоль', p:6},
  {t:'СПИД', p:6},
];
renderCheckList('charlson-list', CHARLSON, 'charlson');
function agePointsCharlson(age){
  if(age>=80) return 4;
  if(age>=70) return 3;
  if(age>=60) return 2;
  if(age>=50) return 1;
  return 0;
}
function calcCharlson(){
  let score=0;
  document.querySelectorAll('#charlson-list input:checked').forEach(i=>score+=+i.closest('label').dataset.p);
  const age=+document.getElementById('charlson-age').value||0;
  const agePts=agePointsCharlson(age);
  const total=score+agePts;
  let survival='';
  if(total===0) survival='~99%';
  else if(total<=1) survival='~98%';
  else if(total===2) survival='~90%';
  else if(total===3) survival='~77%';
  else if(total===4) survival='~53%';
  else if(total===5) survival='~21%';
  else survival='< 21%';
  let cls='good', txt='';
  if(total<=1){txt='Низкая коморбидность.';cls='good';}
  else if(total<=3){txt='Умеренная коморбидность.';cls='warn';}
  else if(total<=5){txt='Высокая коморбидность.';cls='bad';}
  else {txt='Очень высокая коморбидность.';cls='bad';}
  showBox('charlson-result',
    `<div class="label">Индекс Charlson</div>
     <div class="val">${total} балл(ов)</div>
     <div class="interp">Заболевания: <b>${score}</b> · Возраст (${age}): <b>+${agePts}</b><br><b>${txt}</b><br><small style="color:var(--muted)">10-летняя выживаемость: ${survival}</small></div>`, cls);
}

/* ---------- 17. Больничный ---------- */
function switchSickMode(mode, btn) {
  document.querySelectorAll('#sickleave .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('sick-mode-end').style.display = mode === 'calc_end' ? 'block' : 'none';
  document.getElementById('sick-mode-days').style.display = mode === 'calc_days' ? 'block' : 'none';
  document.getElementById('sick-result').className = 'result-box empty';
}
function getSickLeaveWarning(days) {
  if (days <= 10) return null;
  if (days >= 11 && days <= 30) {
    return { html: `<b>⚠ Внимание:</b> срок превышает 10 дней. Требуется продление через <b>заведующего</b> отделением.`, cls: 'warn', style: 'background:rgba(234,88,12,.1); border-left:3px solid var(--orange); color:var(--orange);' };
  }
  if (days >= 31 && days <= 119) {
    return { html: `<b>⚠ Внимание:</b> срок превышает 30 дней. Требуется продление через <b>ВКК</b>.`, cls: 'bad', style: 'background:rgba(220,38,38,.1); border-left:3px solid var(--red); color:var(--red);' };
  }
  return { html: `<b>🚨 Внимание:</b> срок достиг 120 дней. Требуется направление на <b>МРЭК</b>.`, cls: 'bad', style: 'background:rgba(220,38,38,.15); border-left:3px solid var(--red); color:var(--red); font-weight:bold;' };
}
function calcSickLeave() {
  const startStr = document.getElementById('sick-start').value.trim();
  const daysVal = parseInt(document.getElementById('sick-days').value, 10);
  const startDate = parseDateSafe(startStr);
  if (!startDate) { showBox('sick-result', '<span style="color:var(--red)">Введите корректную дату начала.</span>'); return; }
  if (!daysVal || daysVal < 1) { showBox('sick-result', '<span style="color:var(--red)">Введите количество дней > 0.</span>'); return; }
  const endDate = new Date(startDate.getTime());
  endDate.setUTCDate(startDate.getUTCDate() + daysVal - 1);
  const workDate = new Date(endDate.getTime());
  workDate.setUTCDate(endDate.getUTCDate() + 1);
  const warning = getSickLeaveWarning(daysVal);
  let warningHtml = ''; let boxCls = 'good';
  if (warning) { boxCls = warning.cls; warningHtml = `<div style="margin-top:12px; padding:10px; border-radius:6px; font-size:13px; ${warning.style}">${warning.html}</div>`; }
  showBox('sick-result',
    `<div class="label">Результат</div>
     <div style="margin-top:8px;">
       <b>Дата начала:</b> ${formatDateWithDay(startDate)}<br>
       <b>Количество дней:</b> ${daysVal}<br>
       <b>Дата окончания:</b> <span style="color:var(--primary-dark); font-weight:600;">${formatDateWithDay(endDate)}</span><br>
       <b>Выход на работу:</b> <span style="color:var(--green); font-weight:600;">${formatDateWithDay(workDate)}</span>
     </div>
     ${warningHtml}`, boxCls);
}
function calcSickDays() {
  const startStr = document.getElementById('sick-start-2').value.trim();
  const endStr = document.getElementById('sick-end').value.trim();
  const dateStart = parseDateSafe(startStr);
  const dateEnd = parseDateSafe(endStr);
  if (!dateStart || !dateEnd) { showBox('sick-result', '<span style="color:var(--red)">Введите корректные даты.</span>'); return; }
  if (dateEnd < dateStart) { showBox('sick-result', '<span style="color:var(--red)">Дата окончания раньше даты начала.</span>'); return; }
  const diffDays = getDiffDays(dateStart, dateEnd);
  const workDate = new Date(dateEnd.getTime());
  workDate.setUTCDate(dateEnd.getUTCDate() + 1);
  const warning = getSickLeaveWarning(diffDays);
  let warningHtml = ''; let boxCls = 'good';
  if (warning) { boxCls = warning.cls; warningHtml = `<div style="margin-top:12px; padding:10px; border-radius:6px; font-size:13px; ${warning.style}">${warning.html}</div>`; }
  showBox('sick-result',
    `<div class="label">Результат</div>
     <div style="margin-top:8px;">
       <b>Дата начала:</b> ${formatDateWithDay(dateStart)}<br>
       <b>Дата окончания:</b> <span style="color:var(--primary-dark); font-weight:600;">${formatDateWithDay(dateEnd)}</span><br>
       <b>Выход на работу:</b> <span style="color:var(--green); font-weight:600;">${formatDateWithDay(workDate)}</span><br>
       <b>Количество календарных дней:</b> <b>${diffDays}</b>
     </div>
     ${warningHtml}`, boxCls);
}
function resetSickLeave() {
  document.getElementById('sick-start').value = todayStr();
  document.getElementById('sick-days').value = '7';
  document.getElementById('sick-result').className = 'result-box empty';
}
function resetSickDays() {
  document.getElementById('sick-start-2').value = todayStr();
  document.getElementById('sick-end').value = todayStr();
  document.getElementById('sick-result').className = 'result-box empty';
}

/* ---------- 18. ACQ-5 ---------- */
const ACQ_QUESTIONS=[
  {q:'1. В среднем, как часто за последнюю неделю Вы просыпались ночью из-за БА?', opts:['Никогда','Очень редко','Редко','Несколько раз','Много раз','Очень много раз','Не мог(ла) спать из-за БА']},
  {q:'2. Насколько сильными были симптомы БА при пробуждении утром?', opts:['Симптомов не было','Очень слабые','Слабые','Умеренные','Довольно сильные','Очень сильные','Крайне сильные']},
  {q:'3. Насколько Вы были ограничены в деятельности из-за БА?', opts:['Совсем не ограничен','Чуть-чуть','Незначительно','Умеренно','Очень','Чрезвычайно','Полностью ограничен']},
  {q:'4. Какую часть времени у Вас была одышка?', opts:['Одышки не было','Очень небольшая','Небольшая','Умеренная','Довольно сильная','Сильная','Очень сильная']},
  {q:'5. Как часто у Вас были хрипы в груди?', opts:['Никогда','Очень редко','Редко','Иногда','Значительную часть времени','Подавляющую часть времени','Все время']},
];
(function renderAcq(){
  const el=document.getElementById('acq-list'); if(!el) return;
  el.innerHTML=ACQ_QUESTIONS.map((item,qi)=>
    `<div class="q-block"><div class="q-title">${item.q}</div>
      <div class="radio-group">${item.opts.map((o,oi)=>`<label class="radio-row"><input type="radio" name="acq${qi}" value="${oi}"><span class="num">${oi}</span><span>${o}</span></label>`).join('')}</div>
    </div>`).join('');
  el.querySelectorAll('.radio-row').forEach(row=>{
    row.addEventListener('change',()=>{
      row.closest('.radio-group').querySelectorAll('.radio-row').forEach(r=>r.classList.remove('selected'));
      row.classList.add('selected');
    });
  });
})();
function getAcqScore(){
  let sum=0, answered=0; const answers=[];
  for(let i=0;i<5;i++){
    const sel=document.querySelector(`input[name="acq${i}"]:checked`);
    if(sel){ sum+=+sel.value; answered++; answers.push(+sel.value); }
    else answers.push(null);
  }
  return {sum, answered, avg: answered===5 ? sum/5 : null, answers};
}
function acqInterpret(avg){
  if(avg<0.75) return {cls:'good', txt:'Контролируемое течение бронхиальной астмы', detail:'Хороший контроль (ACQ-5 < 0.75).'};
  if(avg<=1.5) return {cls:'warn', txt:'Частично контролируемое течение', detail:'Неполный контроль (0.75 ≤ ACQ-5 ≤ 1.5).'};
  return {cls:'bad', txt:'Неконтролируемое течение бронхиальной астмы', detail:'ACQ-5 > 1.5 — неконтролируемое течение.'};
}
function calcAcq(){
  const {sum, answered, avg}=getAcqScore();
  if(answered<5){ showBox('acq-result','<span style="color:var(--red)">Ответьте на все 5 вопросов.</span>'); return; }
  const {cls, txt, detail}=acqInterpret(avg);
  showBox('acq-result',
    `<div class="label">Средний балл ACQ-5</div><div class="val">${fmt(avg,2)}</div>
     <div class="interp">Сумма баллов: <b>${sum}</b> / 30<br><b>${txt}.</b><br>${detail}</div>`, cls);
}
function resetAcq(){
  document.querySelectorAll('#acq-list input').forEach(i=>i.checked=false);
  document.querySelectorAll('#acq-list .radio-row').forEach(r=>r.classList.remove('selected'));
  document.getElementById('acq-result').className='result-box empty';
}
function printAcq(){
  const {sum, answered, avg, answers}=getAcqScore();
  if(answered<5){ alert('Сначала ответьте на все 5 вопросов.'); return; }
  const {txt}=acqInterpret(avg);
  document.getElementById('p-acq-fio').textContent=document.getElementById('acq-fio').value.trim();
  document.getElementById('p-acq-date').textContent=document.getElementById('acq-date').value.trim();
  document.getElementById('p-acq-doctor-sign').textContent=getCurrentDoctor();
  const html=ACQ_QUESTIONS.map((item, qi)=>{
    const ans=answers[qi];
    const opts=item.opts.map((o, oi)=>`<span style="white-space:nowrap; margin-right:8pt;">${(oi===ans)?'☑':'☐'} ${oi} — ${o}</span>`).join('');
    return `<div class="acq-print-q"><div class="q-text">${item.q}</div><div class="q-opts">${opts}</div><div class="q-answer"><span class="mark">${ans}</span>Выбранный балл: <b>${ans}</b></div></div>`;
  }).join('');
  document.getElementById('p-acq-questions').innerHTML=html;
  document.getElementById('p-acq-sum').textContent=sum+' / 30';
  document.getElementById('p-acq-avg').textContent=fmt(avg,2);
  document.getElementById('p-acq-interp').textContent=txt;
  document.body.classList.add('printing-acq');
  window.print();
}

/* ---------- 19. FINDRISK ---------- */
const FINDRISK=[
  {name:'1. Возраст', opts:[{v:0,l:'До 45 лет'},{v:2,l:'45–54 года'},{v:3,l:'55–64 года'},{v:4,l:'Старше 65 лет'}]},
  {name:'2. ИМТ', opts:[{v:0,l:'Менее 25 кг/м²'},{v:1,l:'25–30 кг/м²'},{v:3,l:'Более 30 кг/м²'}]},
  {name:'3. Окружность талии', opts:[{v:0,l:'М: <94 см · Ж: <80 см'},{v:3,l:'М: 94–102 см · Ж: 80–88 см'},{v:4,l:'М: >102 см · Ж: >88 см'}]},
  {name:'4. Как часто едите овощи/фрукты?', opts:[{v:0,l:'Каждый день'},{v:1,l:'Не каждый день'}]},
  {name:'5. Физические упражнения ≥30 мин/день?', opts:[{v:0,l:'Да'},{v:2,l:'Нет'}]},
  {name:'6. Принимали лекарства для снижения АД?', opts:[{v:0,l:'Нет'},{v:2,l:'Да'}]},
  {name:'7. Был ли повышенный сахар крови?', opts:[{v:0,l:'Нет'},{v:5,l:'Да'}]},
  {name:'8. Сахарный диабет у родственников?', opts:[{v:0,l:'Нет'},{v:2,l:'Да (дедушка/бабушка, тётя/дядя)'},{v:5,l:'Да (родители, брат/сестра, ребёнок)'}]},
];
(function renderFindrisk(){
  const el=document.getElementById('findrisk-list'); if(!el) return;
  el.innerHTML=FINDRISK.map((item,qi)=>
    `<div class="q-block"><div class="q-title">${item.name}</div>
      <div class="radio-group">${item.opts.map((o)=>`<label class="radio-row"><input type="radio" name="findrisk${qi}" value="${o.v}"><span class="num">${o.v}</span><span>${o.l}</span></label>`).join('')}</div>
    </div>`).join('');
  el.querySelectorAll('.radio-row').forEach(row=>{
    row.addEventListener('change',()=>{
      row.closest('.radio-group').querySelectorAll('.radio-row').forEach(r=>r.classList.remove('selected'));
      row.classList.add('selected');
    });
  });
})();
function getFindriskScore(){
  let sum=0, answered=0; const answers=[];
  for(let i=0;i<FINDRISK.length;i++){
    const sel=document.querySelector(`input[name="findrisk${i}"]:checked`);
    if(sel){ sum+=+sel.value; answered++; answers.push(+sel.value); }
    else answers.push(null);
  }
  return {sum, answered, answers};
}
function findriskInterpret(sum){
  if(sum<7) return {cls:'good', txt:'Низкий риск', detail:'1 из 100 человек в течение 10 лет.'};
  if(sum<=11) return {cls:'warn', txt:'Слегка повышенный риск', detail:'1 из 25 человек.'};
  if(sum<=14) return {cls:'warn', txt:'Умеренный риск', detail:'1 из 6 человек.'};
  if(sum<=20) return {cls:'bad', txt:'Высокий риск', detail:'1 из 3 человек.'};
  return {cls:'bad', txt:'Очень высокий риск', detail:'1 из 2 человек.'};
}
function calcFindrisk(){
  const {sum, answered}=getFindriskScore();
  if(answered<FINDRISK.length){ showBox('findrisk-result','<span style="color:var(--red)">Ответьте на все 8 вопросов.</span>'); return; }
  const {cls, txt, detail}=findriskInterpret(sum);
  showBox('findrisk-result',
    `<div class="label">Общее количество баллов FINDRISK</div><div class="val">${sum}</div>
     <div class="interp"><b>${txt}.</b> ${detail}</div>`, cls);
}
function resetFindrisk(){
  document.querySelectorAll('#findrisk-list input').forEach(i=>i.checked=false);
  document.querySelectorAll('#findrisk-list .radio-row').forEach(r=>r.classList.remove('selected'));
  document.getElementById('findrisk-result').className='result-box empty';
}
function printFindrisk(){
  const {sum, answered, answers}=getFindriskScore();
  if(answered<FINDRISK.length){ alert('Ответьте на все 8 вопросов.'); return; }
  const {txt}=findriskInterpret(sum);
  document.getElementById('p-findrisk-fio').textContent=document.getElementById('findrisk-fio').value.trim();
  document.getElementById('p-findrisk-date').textContent=document.getElementById('findrisk-date').value.trim();
  document.getElementById('p-findrisk-doctor-sign').textContent=getCurrentDoctor();
  
  const html=FINDRISK.map((item, qi)=>{
    const ans=answers[qi];
    const opts=item.opts.map((o)=>`<span style="display:inline-block; margin-right:12pt; margin-bottom:2pt;">${(o.v===ans)?'☑':'☐'} ${o.v} — ${o.l}</span>`).join('');
    return `<div class="acq-print-q"><div class="q-text">${item.name}</div><div class="q-opts" style="line-height:1.2">${opts}</div></div>`;
  }).join('');
  
  document.getElementById('p-findrisk-questions').innerHTML=html;
  document.getElementById('p-findrisk-sum').textContent=sum+' балл(ов)';
  document.getElementById('p-findrisk-interp').textContent=txt;
  document.body.classList.add('printing-acq');
  window.print();
}

/* ---------- 20. HADS ---------- */
const HADS_QUESTIONS = [
  {q:'1. Я напряжён и мне не по себе', type:'A', opts:[{v:0,l:'Совсем не испытываю'},{v:1,l:'Иногда'},{v:2,l:'Часто'},{v:3,l:'Почти всё время'}]},
  {q:'2. То, что раньше доставляло мне удовольствие, теперь не доставляет', type:'D', opts:[{v:3,l:'Совсем не испытываю'},{v:2,l:'Иногда'},{v:1,l:'Часто'},{v:0,l:'Почти всё время'}]},
  {q:'3. Я испытываю страх, кажется, будто вот-вот случится что-то ужасное', type:'A', opts:[{v:0,l:'Совсем не испытываю'},{v:1,l:'Иногда'},{v:2,l:'Часто'},{v:3,l:'Почти всё время'}]},
  {q:'4. Я способен рассмеяться и увидеть в том или ином событии смешное', type:'D', opts:[{v:3,l:'Совсем не способен'},{v:2,l:'Иногда'},{v:1,l:'Часто'},{v:0,l:'Почти всё время'}]},
  {q:'5. Беспокойные мысли крутятся у меня в голове', type:'A', opts:[{v:0,l:'Совсем не испытываю'},{v:1,l:'Иногда'},{v:2,l:'Часто'},{v:3,l:'Почти всё время'}]},
  {q:'6. Я чувствую бодрость', type:'D', opts:[{v:3,l:'Совсем не чувствую'},{v:2,l:'Иногда'},{v:1,l:'Часто'},{v:0,l:'Почти всё время'}]},
  {q:'7. Я могу легко расслабиться', type:'A', opts:[{v:0,l:'Совсем не могу'},{v:1,l:'Иногда'},{v:2,l:'Часто'},{v:3,l:'Почти всё время'}]},
  {q:'8. Мне кажется, что я стал всё делать очень медленно', type:'D', opts:[{v:3,l:'Почти всё время'},{v:2,l:'Часто'},{v:1,l:'Иногда'},{v:0,l:'Совсем нет'}]},
  {q:'9. Я испытываю внутреннее напряжение или дрожь', type:'A', opts:[{v:0,l:'Совсем не испытываю'},{v:1,l:'Иногда'},{v:2,l:'Часто'},{v:3,l:'Почти всё время'}]},
  {q:'10. Я не слежу за своей внешностью', type:'D', opts:[{v:3,l:'Почти всё время'},{v:2,l:'Часто'},{v:1,l:'Иногда'},{v:0,l:'Совсем нет'}]},
  {q:'11. Я чувствую неуёмное беспокойство, будто мне нужно постоянно двигаться', type:'A', opts:[{v:0,l:'Совсем не испытываю'},{v:1,l:'Иногда'},{v:2,l:'Часто'},{v:3,l:'Почти всё время'}]},
  {q:'12. Я с нетерпением жду того, что должно произойти', type:'D', opts:[{v:3,l:'Совсем не жду'},{v:2,l:'Иногда'},{v:1,l:'Часто'},{v:0,l:'Почти всё время'}]},
  {q:'13. У меня бывают внезапные приступы паники', type:'A', opts:[{v:0,l:'Совсем не бывают'},{v:1,l:'Иногда'},{v:2,l:'Часто'},{v:3,l:'Почти всё время'}]},
  {q:'14. Я могу получать удовольствие от хорошей книги, радио- или телепрограммы', type:'D', opts:[{v:3,l:'Совсем не могу'},{v:2,l:'Иногда'},{v:1,l:'Часто'},{v:0,l:'Почти всё время'}]},
];
(function renderHads(){
  const el=document.getElementById('hads-list'); if(!el) return;
  el.innerHTML=HADS_QUESTIONS.map((item,qi)=>
    `<div class="q-block"><div class="q-title">${item.q}</div>
      <div class="radio-group">${item.opts.map((o,oi)=>`<label class="radio-row"><input type="radio" name="hads${qi}" value="${o.v}"><span class="num">${o.v}</span><span>${o.l}</span></label>`).join('')}</div>
    </div>`).join('');
  el.querySelectorAll('.radio-row').forEach(row=>{
    row.addEventListener('change',()=>{
      row.closest('.radio-group').querySelectorAll('.radio-row').forEach(r=>r.classList.remove('selected'));
      row.classList.add('selected');
    });
  });
})();
function getHadsScore(){
  let sumA=0, sumD=0, answeredA=0, answeredD=0; const answers=[];
  for(let i=0;i<HADS_QUESTIONS.length;i++){
    const sel=document.querySelector(`input[name="hads${i}"]:checked`);
    const type=HADS_QUESTIONS[i].type;
    if(sel){
      const v=+sel.value;
      if(type==='A'){ sumA+=v; answeredA++; }
      else { sumD+=v; answeredD++; }
      answers.push(v);
    } else answers.push(null);
  }
  return {sumA, sumD, answeredA, answeredD, answers};
}
function hadsInterpret(score){
  if(score<=7) return {cls:'good', txt:'Норма'};
  if(score<=10) return {cls:'warn', txt:'Субклинический уровень'};
  return {cls:'bad', txt:'Клинически выраженный уровень'};
}
function calcHads(){
  const {sumA, sumD, answeredA, answeredD}=getHadsScore();
  if(answeredA<7 || answeredD<7){ showBox('hads-result','<span style="color:var(--red)">Ответьте на все 14 вопросов.</span>'); return; }
  const interpA=hadsInterpret(sumA);
  const interpD=hadsInterpret(sumD);
  const cls = (interpA.cls==='bad'||interpD.cls==='bad')?'bad':(interpA.cls==='warn'||interpD.cls==='warn')?'warn':'good';
  showBox('hads-result',
    `<div class="label">HADS</div>
     <div class="val">A: ${sumA} / D: ${sumD}</div>
     <div class="interp"><b>Тревога (A):</b> ${interpA.txt} (${sumA})<br><b>Депрессия (D):</b> ${interpD.txt} (${sumD})</div>`, cls);
}
function resetHads(){
  document.querySelectorAll('#hads-list input').forEach(i=>i.checked=false);
  document.querySelectorAll('#hads-list .radio-row').forEach(r=>r.classList.remove('selected'));
  document.getElementById('hads-result').className='result-box empty';
}
function printHads(){
  const {sumA, sumD, answeredA, answeredD, answers}=getHadsScore();
  if(answeredA<7 || answeredD<7){ alert('Ответьте на все 14 вопросов.'); return; }
  const interpA=hadsInterpret(sumA);
  const interpD=hadsInterpret(sumD);
  document.getElementById('p-hads-fio').textContent=document.getElementById('hads-fio').value.trim();
  document.getElementById('p-hads-date').textContent=document.getElementById('hads-date').value.trim();
  document.getElementById('p-hads-doctor-sign').textContent=getCurrentDoctor();
  
  const html=HADS_QUESTIONS.map((item, qi)=>{
    const ans=answers[qi];
    const opts=item.opts.map((o)=>`<span style="display:inline-block; margin-right:12pt; margin-bottom:1pt;">${(o.v===ans)?'☑':'☐'} ${o.v} — ${o.l}</span>`).join('');
    return `<div class="acq-print-q"><div class="q-text">${item.q}</div><div class="q-opts" style="line-height:1.2">${opts}</div></div>`;
  }).join('');
  
  document.getElementById('p-hads-questions').innerHTML=html;
  document.getElementById('p-hads-a').textContent=sumA+' — '+interpA.txt;
  document.getElementById('p-hads-d').textContent=sumD+' — '+interpD.txt;
  document.getElementById('p-hads-interp').textContent=`A: ${interpA.txt}; D: ${interpD.txt}`;
  document.body.classList.add('printing-acq');
  window.print();
}

/* ---------- 21. AUDIT-C ---------- */
const AUDITC_QUESTIONS = [
  {q:'1. Как часто вы употребляете алкогольные напитки?', opts:[{v:0,l:'Никогда'},{v:1,l:'1 раз в месяц или реже'},{v:2,l:'2–4 раза в месяц'},{v:3,l:'2–3 раза в неделю'},{v:4,l:'4 и более раз в неделю'}]},
  {q:'2. Сколько стандартных порций алкоголя вы выпиваете в обычный день, когда пьёте?', opts:[{v:0,l:'1–2'},{v:1,l:'3–4'},{v:2,l:'5–6'},{v:3,l:'7–9'},{v:4,l:'10 и более'}]},
  {q:'3. Как часто вы выпиваете 6 и более стандартных порций за один раз?', opts:[{v:0,l:'Никогда'},{v:1,l:'Реже 1 раза в месяц'},{v:2,l:'1 раз в месяц'},{v:3,l:'1 раз в неделю'},{v:4,l:'Ежедневно или почти ежедневно'}]},
];
(function renderAuditC(){
  const el=document.getElementById('auditc-list'); if(!el) return;
  el.innerHTML=AUDITC_QUESTIONS.map((item,qi)=>
    `<div class="q-block"><div class="q-title">${item.q}</div>
      <div class="radio-group">${item.opts.map((o)=>`<label class="radio-row"><input type="radio" name="auditc${qi}" value="${o.v}"><span class="num">${o.v}</span><span>${o.l}</span></label>`).join('')}</div>
    </div>`).join('');
  el.querySelectorAll('.radio-row').forEach(row=>{
    row.addEventListener('change',()=>{
      row.closest('.radio-group').querySelectorAll('.radio-row').forEach(r=>r.classList.remove('selected'));
      row.classList.add('selected');
    });
  });
})();
function getAuditCScore(){
  let sum=0, answered=0; const answers=[];
  for(let i=0;i<AUDITC_QUESTIONS.length;i++){
    const sel=document.querySelector(`input[name="auditc${i}"]:checked`);
    if(sel){ sum+=+sel.value; answered++; answers.push(+sel.value); }
    else answers.push(null);
  }
  return {sum, answered, answers};
}
function calcAuditC(){
  const {sum, answered}=getAuditCScore();
  if(answered<3){ showBox('auditc-result','<span style="color:var(--red)">Ответьте на все 3 вопроса.</span>'); return; }
  const sex=document.getElementById('auditc-sex').value;
  const threshold = sex==='m' ? 4 : 3;
  let cls, txt, rec;
  if(sum >= threshold){ cls='bad'; txt='Положительный скрининг'; rec='Опасное потребление алкоголя. Рекомендовано краткое вмешательство.'; }
  else { cls='good'; txt='Отрицательный скрининг'; rec='Признаков опасного потребления не выявлено.'; }
  showBox('auditc-result',
    `<div class="label">AUDIT-C</div>
     <div class="val">${sum} балл(ов)</div>
     <div class="interp"><b>${txt}.</b> ${rec}<br><small style="color:var(--muted)">Порог для ${sex==='m'?'мужчин':'женщин'}: ≥${threshold}.</small></div>`, cls);
}
function resetAuditC(){
  document.querySelectorAll('#auditc-list input').forEach(i=>i.checked=false);
  document.querySelectorAll('#auditc-list .radio-row').forEach(r=>r.classList.remove('selected'));
  document.getElementById('auditc-result').className='result-box empty';
}
function printAuditC(){
  const {sum, answered, answers}=getAuditCScore();
  if(answered<3){ alert('Ответьте на все 3 вопроса.'); return; }
  const sex=document.getElementById('auditc-sex').value;
  const threshold = sex==='m' ? 4 : 3;
  const positive = sum >= threshold;
  document.getElementById('p-auditc-fio').textContent=document.getElementById('auditc-fio').value.trim();
  document.getElementById('p-auditc-date').textContent=document.getElementById('auditc-date').value.trim();
  document.getElementById('p-auditc-doctor-sign').textContent=getCurrentDoctor();
  
  const html=AUDITC_QUESTIONS.map((item, qi)=>{
    const ans=answers[qi];
    const opts=item.opts.map((o)=>`<span style="display:inline-block; margin-right:12pt; margin-bottom:1pt;">${(o.v===ans)?'☑':'☐'} ${o.v} — ${o.l}</span>`).join('');
    return `<div class="acq-print-q"><div class="q-text">${item.q}</div><div class="q-opts" style="line-height:1.2">${opts}</div></div>`;
  }).join('');
  
  document.getElementById('p-auditc-questions').innerHTML=html;
  document.getElementById('p-auditc-sum').textContent=sum+' балл(ов)';
  document.getElementById('p-auditc-interp').textContent=positive?'Положительный скрининг (≥'+threshold+')':'Отрицательный скрининг (<'+threshold+')';
  document.body.classList.add('printing-acq');
  window.print();
}

/* ---------- 22. MMSE ---------- */
const MMSE_QUESTIONS = [
  {q:'1. Ориентация во времени (год, время года, число, день недели, месяц) — по 1 баллу за каждый правильный ответ', max:5},
  {q:'2. Ориентация в месте (страна, область, город, учреждение, этаж) — по 1 баллу', max:5},
  {q:'3. Восприятие (повторение трёх слов: «яблоко», «стол», «монета») — по 1 баллу', max:3},
  {q:'4. Внимание и счёт (100 – 7 = 93; 93 – 7 = 86; 86 – 7 = 79; 79 – 7 = 72; 72 – 7 = 65) — по 1 баллу', max:5},
  {q:'5. Память (припомнить три слова из п.3) — по 1 баллу', max:3},
  {q:'6. Речь: называние двух предметов (часы, ручка) — по 1 баллу', max:2},
  {q:'7. Речь: повторение фразы «Никаких если, и или но» — 1 балл', max:1},
  {q:'8. Речь: выполнение трёхэтапной команды («Возьмите лист бумаги правой рукой, сложите его пополам и положите на стол») — по 1 баллу за каждый шаг', max:3},
  {q:'9. Речь: чтение и выполнение инструкции «Закройте глаза» — 1 балл', max:1},
  {q:'10. Речь: написание предложения — 1 балл', max:1},
  {q:'11. Речь: копирование рисунка (два пересекающихся пятиугольника) — 1 балл', max:1},
];
(function renderMmse(){
  const el=document.getElementById('mmse-list'); if(!el) return;
  el.innerHTML=MMSE_QUESTIONS.map((item,qi)=>
    `<div class="q-block"><div class="q-title">${item.q} <span style="color:var(--muted);font-weight:400;">(макс. ${item.max})</span></div>
      <div class="field" style="max-width:140px;"><input type="number" name="mmse${qi}" min="0" max="${item.max}" value="0"></div>
    </div>`).join('');
})();
function getMmseScore(){
  let sum=0, valid=true;
  for(let i=0;i<MMSE_QUESTIONS.length;i++){
    const el=document.querySelector(`input[name="mmse${i}"]`);
    if(!el){ valid=false; continue; }
    const v=+el.value;
    if(v<0||v>MMSE_QUESTIONS[i].max) valid=false;
    sum+=v;
  }
  return {sum, valid};
}
function mmseInterpret(score){
  if(score>=28) return {cls:'good', txt:'Нет нарушений когнитивных функций'};
  if(score>=25) return {cls:'warn', txt:'Легкие когнитивные нарушения'};
  if(score>=20) return {cls:'bad', txt:'Деменция легкой степени'};
  if(score>=10) return {cls:'bad', txt:'Деменция умеренной степени'};
  return {cls:'bad', txt:'Деменция тяжелой степени'};
}
function calcMmse(){
  const {sum, valid}=getMmseScore();
  if(!valid){ showBox('mmse-result','<span style="color:var(--red)">Проверьте введенные баллы (в пределах максимума).</span>'); return; }
  const {cls, txt}=mmseInterpret(sum);
  showBox('mmse-result',
    `<div class="label">MMSE</div>
     <div class="val">${sum} / 30</div>
     <div class="interp"><b>${txt}</b></div>`, cls);
}
function resetMmse(){
  document.querySelectorAll('#mmse-list input').forEach(i=>i.value='0');
  document.getElementById('mmse-result').className='result-box empty';
}
function printMmse(){
  const {sum, valid}=getMmseScore();
  if(!valid){ alert('Проверьте введенные баллы.'); return; }
  const {txt}=mmseInterpret(sum);
  document.getElementById('p-mmse-fio').textContent=document.getElementById('mmse-fio').value.trim();
  document.getElementById('p-mmse-date').textContent=document.getElementById('mmse-date').value.trim();
  document.getElementById('p-mmse-doctor-sign').textContent=getCurrentDoctor();
  const html=MMSE_QUESTIONS.map((item, qi)=>{
    const val=document.querySelector(`input[name="mmse${qi}"]`).value;
    return `<div class="acq-print-q"><div class="q-text">${item.q}</div><div class="q-answer">Балл: <b>${val}</b> / ${item.max}</div></div>`;
  }).join('');
  document.getElementById('p-mmse-questions').innerHTML=html;
  document.getElementById('p-mmse-sum').textContent=sum+' / 30';
  document.getElementById('p-mmse-interp').textContent=txt;
  document.body.classList.add('printing-acq');
  window.print();
}

/* ---------- 23. BDI ---------- */
const BDI_QUESTIONS = [
  '1. Настроение', '2. Пессимизм', '3. Чувство неудачи', '4. Неудовлетворенность', '5. Чувство вины',
  '6. Ощущение наказания', '7. Отвращение к себе', '8. Самообвинение', '9. Суицидальные мысли',
  '10. Плаксивость', '11. Раздражительность', '12. Социальная отгороженность', '13. Нерешительность',
  '14. Изменение образа тела', '15. Потеря работоспособности', '16. Нарушения сна', '17. Утомляемость',
  '18. Изменение аппетита', '19. Потеря веса', '20. Ипохондрия', '21. Потеря либидо'
];
(function renderBdi(){
  const el=document.getElementById('bdi-list'); if(!el) return;
  el.innerHTML=BDI_QUESTIONS.map((item,qi)=>
    `<div class="q-block"><div class="q-title">${item}</div>
      <div class="radio-group">${[0,1,2,3].map(v=>`<label class="radio-row"><input type="radio" name="bdi${qi}" value="${v}"><span class="num">${v}</span><span>${v===0?'Нет':v===1?'Легкая':v===2?'Умеренная':'Тяжелая'}</span></label>`).join('')}</div>
    </div>`).join('');
  el.querySelectorAll('.radio-row').forEach(row=>{
    row.addEventListener('change',()=>{
      row.closest('.radio-group').querySelectorAll('.radio-row').forEach(r=>r.classList.remove('selected'));
      row.classList.add('selected');
    });
  });
})();
function getBdiScore(){
  let sum=0, answered=0;
  for(let i=0;i<BDI_QUESTIONS.length;i++){
    const sel=document.querySelector(`input[name="bdi${i}"]:checked`);
    if(sel){ sum+=+sel.value; answered++; }
  }
  return {sum, answered};
}
function bdiInterpret(score){
  if(score<=9) return {cls:'good', txt:'Отсутствие депрессивных симптомов'};
  if(score<=15) return {cls:'warn', txt:'Легкая депрессия (субдепрессия)'};
  if(score<=19) return {cls:'warn', txt:'Умеренная депрессия'};
  if(score<=29) return {cls:'bad', txt:'Выраженная депрессия'};
  return {cls:'bad', txt:'Тяжелая депрессия'};
}
function calcBdi(){
  const {sum, answered}=getBdiScore();
  if(answered<BDI_QUESTIONS.length){ showBox('bdi-result','<span style="color:var(--red)">Ответьте на все 21 вопрос.</span>'); return; }
  const {cls, txt}=bdiInterpret(sum);
  showBox('bdi-result',
    `<div class="label">Шкала Бека (BDI)</div>
     <div class="val">${sum} / 63</div>
     <div class="interp"><b>${txt}</b></div>`, cls);
}
function resetBdi(){
  document.querySelectorAll('#bdi-list input').forEach(i=>i.checked=false);
  document.querySelectorAll('#bdi-list .radio-row').forEach(r=>r.classList.remove('selected'));
  document.getElementById('bdi-result').className='result-box empty';
}
function printBdi(){
  const {sum, answered}=getBdiScore();
  if(answered<BDI_QUESTIONS.length){ alert('Ответьте на все 21 вопрос.'); return; }
  const {txt}=bdiInterpret(sum);
  document.getElementById('p-bdi-fio').textContent=document.getElementById('bdi-fio').value.trim();
  document.getElementById('p-bdi-date').textContent=document.getElementById('bdi-date').value.trim();
  document.getElementById('p-bdi-doctor-sign').textContent=getCurrentDoctor();
  const html=BDI_QUESTIONS.map((item, qi)=>{
    const sel=document.querySelector(`input[name="bdi${qi}"]:checked`);
    const val=sel?sel.value:'—';
    return `<div class="acq-print-q"><div class="q-text">${item}</div><div class="q-answer">Балл: <b>${val}</b></div></div>`;
  }).join('');
  document.getElementById('p-bdi-questions').innerHTML=html;
  document.getElementById('p-bdi-sum').textContent=sum+' / 63';
  document.getElementById('p-bdi-interp').textContent=txt;
  document.body.classList.add('printing-acq');
  window.print();
}

/* ---------- 24. mMRC ---------- */
function calcMmrc(){
  const v=+document.getElementById('mmrc-value').value;
  let cls, txt;
  if(v<=1){ cls='good'; txt='Легкая одышка'; }
  else if(v===2){ cls='warn'; txt='Средняя одышка'; }
  else { cls='bad'; txt='Тяжелая одышка'; }
  showBox('mmrc-result',
    `<div class="label">mMRC</div>
     <div class="val">${v} балл(ов)</div>
     <div class="interp"><b>${txt}</b></div>`, cls);
}

/* ---------- 25. CAT-тест ---------- */
const CAT_QUESTIONS = [
  {q:'1. Я чувствую себя хорошо', opts:['0','1','2','3','4','5']},
  {q:'2. У меня много слизи в груди', opts:['0','1','2','3','4','5']},
  {q:'3. Я не чувствую стеснения в груди', opts:['0','1','2','3','4','5']},
  {q:'4. Я чувствую одышку при подъёме по лестнице', opts:['0','1','2','3','4','5']},
  {q:'5. Я ограничен в домашних делах', opts:['0','1','2','3','4','5']},
  {q:'6. Я уверенно выхожу из дома несмотря на ХОБЛ', opts:['0','1','2','3','4','5']},
  {q:'7. Я крепко сплю', opts:['0','1','2','3','4','5']},
  {q:'8. У меня много энергии', opts:['0','1','2','3','4','5']},
];
(function renderCat(){
  const el=document.getElementById('cat-list'); if(!el) return;
  el.innerHTML=CAT_QUESTIONS.map((item,qi)=>
    `<div class="q-block"><div class="q-title">${item.q}</div>
      <div class="radio-group">${item.opts.map((o)=>`<label class="radio-row"><input type="radio" name="cat${qi}" value="${o}"><span class="num">${o}</span><span>${o}</span></label>`).join('')}</div>
    </div>`).join('');
  el.querySelectorAll('.radio-row').forEach(row=>{
    row.addEventListener('change',()=>{
      row.closest('.radio-group').querySelectorAll('.radio-row').forEach(r=>r.classList.remove('selected'));
      row.classList.add('selected');
    });
  });
})();
function getCatScore(){
  let sum=0, answered=0;
  for(let i=0;i<CAT_QUESTIONS.length;i++){
    const sel=document.querySelector(`input[name="cat${i}"]:checked`);
    if(sel){ sum+=+sel.value; answered++; }
  }
  return {sum, answered};
}
function calcCat(){
  const {sum, answered}=getCatScore();
  if(answered<CAT_QUESTIONS.length){ showBox('cat-result','<span style="color:var(--red)">Ответьте на все 8 вопросов.</span>'); return; }
  let cls, txt;
  if(sum<10){ cls='good'; txt='Низкое влияние симптомов'; }
  else if(sum<20){ cls='warn'; txt='Среднее влияние симптомов'; }
  else if(sum<30){ cls='bad'; txt='Высокое влияние симптомов'; }
  else { cls='bad'; txt='Очень высокое влияние симптомов'; }
  showBox('cat-result',
    `<div class="label">CAT-тест</div>
     <div class="val">${sum} / 40</div>
     <div class="interp"><b>${txt}</b><br><small style="color:var(--muted)">≥10 — значимое влияние на качество жизни.</small></div>`, cls);
}
function resetCat(){
  document.querySelectorAll('#cat-list input').forEach(i=>i.checked=false);
  document.querySelectorAll('#cat-list .radio-row').forEach(r=>r.classList.remove('selected'));
  document.getElementById('cat-result').className='result-box empty';
}
function printCat(){
  const {sum, answered}=getCatScore();
  if(answered<CAT_QUESTIONS.length){ alert('Ответьте на все 8 вопросов.'); return; }
  let txt;
  if(sum<10) txt='Низкое влияние симптомов';
  else if(sum<20) txt='Среднее влияние симптомов';
  else if(sum<30) txt='Высокое влияние симптомов';
  else txt='Очень высокое влияние симптомов';
  document.getElementById('p-cat-fio').textContent=document.getElementById('cat-fio').value.trim();
  document.getElementById('p-cat-date').textContent=document.getElementById('cat-date').value.trim();
  document.getElementById('p-cat-doctor-sign').textContent=getCurrentDoctor();
  const html=CAT_QUESTIONS.map((item, qi)=>{
    const sel=document.querySelector(`input[name="cat${qi}"]:checked`);
    const val=sel?sel.value:'—';
    return `<div class="acq-print-q"><div class="q-text">${item.q}</div><div class="q-answer">Балл: <b>${val}</b></div></div>`;
  }).join('');
  document.getElementById('p-cat-questions').innerHTML=html;
  document.getElementById('p-cat-sum').textContent=sum+' / 40';
  document.getElementById('p-cat-interp').textContent=txt;
  document.body.classList.add('printing-acq');
  window.print();
}

/* ---------- 26. Ривермид ---------- */
const RIVERMEAD_ITEMS = [
  '1. Поворачивается в постели', '2. Садится из положения лежа', '3. Сидит без поддержки',
  '4. Встает из положения сидя', '5. Стоит без поддержки', '6. Пересаживается',
  '7. Ходит по комнате', '8. Поднимается по лестнице', '9. Спускается по лестнице',
  '10. Ходит на улице', '11. Ходит по неровной поверхности', '12. Ходит на расстояние 100 м',
  '13. Ходит на расстояние 400 м', '14. Бегает', '15. Прыгает'
];
(function renderRivermead(){
  const el=document.getElementById('rivermead-list'); if(!el) return;
  el.innerHTML=RIVERMEAD_ITEMS.map((item,qi)=>
    `<label class="checkbox-row" data-p="1">
       <input type="checkbox" name="rivermead${qi}">
       <span>${item}</span>
     </label>`).join('');
  el.querySelectorAll('.checkbox-row').forEach(row=>{
    row.addEventListener('change',()=>row.classList.toggle('selected', row.querySelector('input').checked));
  });
})();
function calcRivermead(){
  let score=0;
  document.querySelectorAll('#rivermead-list input:checked').forEach(()=>score++);
  let cls, txt;
  if(score>=13){ cls='good'; txt='Высокая мобильность'; }
  else if(score>=8){ cls='warn'; txt='Умеренная мобильность'; }
  else { cls='bad'; txt='Низкая мобильность'; }
  showBox('rivermead-result',
    `<div class="label">Шкала Ривермид</div>
     <div class="val">${score} / 15</div>
     <div class="interp"><b>${txt}</b></div>`, cls);
}

/* ---------- 27. Критерии Light ---------- */
function calcLight(){
  const protFluid=+document.getElementById('light-prot-fluid').value;
  const protSerum=+document.getElementById('light-prot-serum').value;
  const ldhFluid=+document.getElementById('light-ldh-fluid').value;
  const ldhSerum=+document.getElementById('light-ldh-serum').value;
  const ldhUln=+document.getElementById('light-ldh-uln').value;
  if(!protFluid||!protSerum||!ldhFluid||!ldhSerum||!ldhUln){
    showBox('light-result','<span style="color:var(--red)">Заполните все поля.</span>'); return;
  }
  const ratioProt=protFluid/protSerum;
  const ratioLdh=ldhFluid/ldhSerum;
  const ldhThreshold=(2/3)*ldhUln;
  const isExudate = ratioProt>0.5 || ratioLdh>0.6 || ldhFluid>ldhThreshold;
  let cls = isExudate?'bad':'good';
  let txt = isExudate?'Экссудат':'Транссудат';
  let details = `Белок: ${fmt(ratioProt,2)} (порог >0.5)<br>ЛДГ: ${fmt(ratioLdh,2)} (порог >0.6)<br>ЛДГ жидкости: ${ldhFluid} Ед/л (порог >${Math.round(ldhThreshold)})`;
  showBox('light-result',
    `<div class="label">Критерии Light</div>
     <div class="val">${txt}</div>
     <div class="interp">${details}<br><b>${isExudate?'Выполнен хотя бы один критерий.':'Ни один критерий не выполнен.'}</b></div>`, cls);
}

/* ---------- 28. Скрининги ---------- */
function calcScreening(){
  const age = +document.getElementById('screen-age').value;
  const sex = document.getElementById('screen-sex').value;
  if(!age){ showBox('screening-result','<span style="color:var(--red)">Введите возраст.</span>'); return; }
  let html = '';
  let frequency = '';
  if (age >= 18 && age <= 39) frequency = '1 раз в 3 года';
  else if (age >= 40) frequency = '1 раз в год';
  html += `<p><b>Частота диспансеризации:</b> ${frequency}</p>`;
  html += `<p><b>Базовые исследования:</b> Общий анализ крови, общий анализ мочи, глюкоза крови, креатинин, АЛТ, общий холестерин, триглицериды, ЭКГ.</p>`;
  if (age >= 18 && age <= 39) html += `<p><b>Периодичность базовых:</b> 1 раз в 3 года.</p>`;
  else if (age >= 40) html += `<p><b>Периодичность базовых:</b> 1 раз в год. Дополнительно: измерение внутриглазного давления.</p>`;
  html += `<h3 style="margin-top:12px;">Онкоскрининг</h3><ul style="margin-left:20px; line-height:1.8;">`;
  if (sex === 'f') {
    if (age >= 21 && age <= 29) html += `<li><b>ПАП-тест (шейка матки):</b> 1 раз в 3 года.</li>`;
    else if (age >= 30 && age <= 39) html += `<li><b>ВПЧ-тест (шейка матки):</b> 1 раз в 6 лет.</li>`;
    else if (age >= 40 && age <= 60) html += `<li><b>ВПЧ-тест (шейка матки):</b> 1 раз в 5 лет.</li>`;
    if (age >= 49 && age <= 58) html += `<li><b>Маммография:</b> 1 раз в 3 года.</li>`;
  } else if (sex === 'm') {
    if (age >= 50 && age <= 65) html += `<li><b>ПСА (простат-специфический антиген):</b> 1 раз в 2 года.</li>`;
  }
  html += `</ul>`;
  html += `<p><b>Осмотр полости рта:</b> 1 раз в 3 года (всем).</p>`;
  if (age >= 18 && age <= 39) html += `<p><b>Карта оценки симптомов предопухолевых заболеваний:</b> 1 раз в 3 года.</p>`;
  else if (age >= 40) html += `<p><b>Карта оценки симптомов предопухолевых заболеваний:</b> 1 раз в год.</p>`;
  showBox('screening-result', html, 'info');
}

/* ---------- 29. Печать / ВКК ---------- */
window.addEventListener('afterprint', ()=>{
  document.body.classList.remove('printing-acq','printing-vkk');
});

function fillRuledLines(){
  const pairs=[['p-vkk-purpose','vkk-purpose'],['p-vkk-complaints','vkk-complaints'],['p-vkk-anamnesis','vkk-anamnesis'],['p-vkk-exam','vkk-exam'],['p-vkk-diagnosis','vkk-diagnosis']];
  pairs.forEach(([t,s])=>{
    const el=document.getElementById(t); const src=document.getElementById(s);
    if(el && src) el.textContent=src.value.trim();
  });
}
function autoFitVkk(){
  const pages=document.querySelectorAll('#vkk-print-view .vkk-page');
  pages.forEach(page=>{
    const inner=page.querySelector('.vkk-page-inner'); if(!inner) return;
    inner.style.fontSize='';
    if(page.offsetParent===null && !document.body.classList.contains('printing-vkk')) return;
    const maxH=page.clientHeight;
    let pt=9;
    while(inner.scrollHeight>maxH && pt>6){ pt-=0.25; inner.style.fontSize=pt+'pt'; }
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
  saveVkkHistory();
  document.body.classList.add('printing-vkk');
  autoFitVkk();
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

/* ---------- 30. История ВКК (Модальное окно) ---------- */
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
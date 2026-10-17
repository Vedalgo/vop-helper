/* =========================================================
   ВОП-Helper — полная логика приложения
   ========================================================= */

/* ---------- 1. Навигация и меню ---------- */
function go(id){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  const sec=document.getElementById(id);
  if(sec) sec.classList.add('active');
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

/* ---------- 2. Утилиты ---------- */
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
       <span>${it.t}${it.p>0?' <b style="color:#1e40af">+'+it.p+'</b>':(it.p<0?' <b style="color:#dc2626">'+it.p+'</b>':'')}</span>
     </label>`).join('');
  c.querySelectorAll('.checkbox-row').forEach(el=>{
    el.addEventListener('change',()=>el.classList.toggle('selected', el.querySelector('input').checked));
  });
}

/* =========================================================
   3. Надежная работа с датами (UTC, Валидация, Високосные годы)
   ========================================================= */
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
  const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}.${mm}.${yyyy} (${days[d.getUTCDay()]})`;
}

function getDiffDays(dateStart, dateEnd) {
  const diffMs = dateEnd.getTime() - dateStart.getTime();
  return Math.round(diffMs / 86400000) + 1;
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

// Привязка масок
['vkk-date','acq-date','chads-date','findrisk-date','sick-start','sick-start-2','sick-end'].forEach(id => attachDateMask(id, true));
attachDateMask('vkk-start', false);

// Календари (иконка 📅)
(function enhanceDateInputs() {
  const ids = ['vkk-date','vkk-start','acq-date','chads-date','findrisk-date','sick-start','sick-start-2','sick-end'];
  ids.forEach(id => {
    const textInput = document.getElementById(id);
    if (!textInput || textInput.parentElement.classList.contains('date-input-group')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'date-input-group';
    textInput.parentNode.insertBefore(wrapper, textInput);
    wrapper.appendChild(textInput);
    const datePicker = document.createElement('input');
    datePicker.type = 'date';
    datePicker.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:0;height:0;';
    wrapper.appendChild(datePicker);
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'date-picker-btn'; btn.innerHTML = '📅'; btn.title = 'Открыть календарь';
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

/* ---------- 4. СКФ (eGFR) ---------- */
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
  if(!age||!cr||age<18){ showBox('egfr-result','<span style="color:#dc2626">Заполните все поля (возраст ≥18).</span>'); return; }
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
     <div class="val">${fmt(main.val,1)} <span style="font-size:14px;color:#64748b">${main.isCrCl?'мл/мин':'мл/мин/1,73м²'}</span></div>
     <div class="interp"><b>Интерпретация:</b> ${interp}</div>`, cls);
  const allEl=document.getElementById('egfr-all');
  if(allEl){
    allEl.innerHTML=`<div style="font-weight:600;margin-bottom:6px">Все формулы:</div>`+
      results.map(r=>`<div class="row"><span>${r.name}</span><b>${fmt(r.val,1)}</b></div>`).join('');
  }
}

/* ---------- 5. Клиренс креатинина (Кокрофт-Голт) ---------- */
function calcCrCl(){
  const age = +document.getElementById('crcl-age').value;
  const sex = document.getElementById('crcl-sex').value;
  const weight = +document.getElementById('crcl-weight').value;
  let cr = +document.getElementById('crcl-cr').value; // мкмоль/л

  if(!age || !weight || !cr){ showBox('crcl-result','<span style="color:#dc2626">Заполните все поля.</span>'); return; }

  // Формула Кокрофта-Голта: ((140 - возраст) * вес * 1.23 (муж) / 1.04 (жен)) / креатинин (мкмоль/л)
  let crcl = ((140 - age) * weight * (sex === 'm' ? 1.23 : 1.04)) / cr;

  let cls = 'good';
  let interp = '';
  if (crcl >= 90) interp = 'Норма';
  else if (crcl >= 60) interp = 'Незначительное снижение';
  else if (crcl >= 30) { interp = 'Умеренное снижение'; cls = 'warn'; }
  else if (crcl >= 15) { interp = 'Выраженное снижение'; cls = 'bad'; }
  else { interp = 'Терминальная стадия'; cls = 'bad'; }

  showBox('crcl-result',
    `<div class="label">Клиренс креатинина (Кокрофт-Голт)</div>
     <div class="val">${fmt(crcl, 1)} <span style="font-size:14px;color:#64748b">мл/мин</span></div>
     <div class="interp"><b>Интерпретация:</b> ${interp}</div>`, cls);
}

/* ---------- 6. ИМТ + ампутация ---------- */
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
  if(!w||!h){ showBox('bmi-result','<span style="color:#dc2626">Заполните вес и рост.</span>'); return; }
  const b=w/(h*h); const [txt,cls]=bmiInterpret(b);
  showBox('bmi-result',
    `<div class="label">Индекс массы тела</div>
     <div class="val">${fmt(b,1)} кг/м²</div>
     <div class="interp"><b>Интерпретация:</b> ${txt}</div>`, cls);
}
const AMP_SEGMENTS=[
  {id:'foot',name:'Стопа (одна)',pct:1.5},
  {id:'belowknee',name:'Голень / ниже колена',pct:6},
  {id:'aboveknee',name:'Бедро / выше колена',pct:16},
  {id:'hip',name:'Экзартикуляция бедра',pct:18.5},
  {id:'hand',name:'Кисть',pct:0.7},
  {id:'belowelbow',name:'Предплечье / ниже локтя',pct:2.3},
  {id:'aboveelbow',name:'Плечо / выше локтя',pct:3.5},
  {id:'shoulder',name:'Экзартикуляция плеча',pct:5},
  {id:'breast',name:'Молочная железа (одна)',pct:1.5},
];
(function renderAmpList(){
  const el=document.getElementById('amp-list'); if(!el) return;
  el.innerHTML=AMP_SEGMENTS.map(s=>
    `<label class="checkbox-row" data-amp="${s.id}">
       <input type="checkbox" value="${s.pct}">
       <span>${s.name} <span style="color:#64748b">— ${s.pct}%</span></span>
     </label>`).join('');
  el.querySelectorAll('.checkbox-row').forEach(row=>{
    row.addEventListener('change',()=>row.classList.toggle('selected', row.querySelector('input').checked));
  });
})();
function calcBmiAmp(){
  const w=+document.getElementById('bmiamp-w').value,h=+document.getElementById('bmiamp-h').value/100;
  if(!w||!h){ showBox('bmiamp-result','<span style="color:#dc2626">Заполните вес и рост.</span>'); return; }
  let lossPct=0; const chosen=[];
  document.querySelectorAll('#amp-list input:checked').forEach(inp=>{
    lossPct+=+inp.value;
    chosen.push(inp.closest('label').querySelector('span').textContent.split('—')[0].trim());
  });
  if(lossPct>=100){ showBox('bmiamp-result','<span style="color:#dc2626">Суммарная доля ≥100%.</span>'); return; }
  const bmiRaw=w/(h*h);
  const bmiCorr=w/(h*h*(1-lossPct/100));
  const [txt,cls]=bmiInterpret(bmiCorr);
  showBox('bmiamp-result',
    `<div class="label">ИМТ с поправкой на ампутацию</div>
     <div class="val">${fmt(bmiCorr,1)} кг/м²</div>
     <div class="interp">Без поправки: <b>${fmt(bmiRaw,1)}</b> кг/м²<br>Потеря массы: <b>${fmt(lossPct,1)}%</b>${chosen.length?` (${chosen.join(', ')})`:''}<br><b>Интерпретация:</b> ${txt}</div>`, cls);
}

/* ---------- 7. SCORE2 / SCORE2-OP / SCORE2-Diabetes ---------- */
function calcScore2(){
  const age=+document.getElementById('s2-age').value;
  const sex=document.getElementById('s2-sex').value;
  const smoker=document.getElementById('s2-smoke').checked?1:0;
  const sbp=+document.getElementById('s2-sbp').value;
  const tc=+document.getElementById('s2-tc').value;
  const hdl=+document.getElementById('s2-hdl').value;
  const region=document.getElementById('s2-region').value;
  if(!age||!sbp||!tc||!hdl){ showBox('s2-result','<span style="color:#dc2626">Заполните все поля.</span>'); return; }
  if(age<40||age>69){ showBox('s2-result','<span style="color:#ea580c">SCORE2 — 40–69 лет. Для 70+ SCORE2-OP.</span>','info'); return; }
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
     <div class="interp"><b>${txt}.</b> ${rec}<br><small style="color:#64748b">Пороги: ${tLow}% / ${tHigh}%.</small></div>`, cls);
}
function calcScore2Op(){
  const age=+document.getElementById('s2op-age').value;
  const sex=document.getElementById('s2op-sex').value;
  const smoker=document.getElementById('s2op-smoke').checked?1:0;
  const sbp=+document.getElementById('s2op-sbp').value;
  const tc=+document.getElementById('s2op-tc').value;
  const hdl=+document.getElementById('s2op-hdl').value;
  const region=document.getElementById('s2op-region').value;
  if(!age||!sbp||!tc||!hdl){ showBox('s2op-result','<span style="color:#dc2626">Заполните все поля.</span>'); return; }
  if(age<70||age>89){ showBox('s2op-result','<span style="color:#ea580c">SCORE2-OP — 70–89 лет.</span>','info'); return; }
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
     <div class="interp"><b>${txt}.</b> ${rec}<br><small style="color:#64748b">Пороги: &lt;7.5% · 7.5–15% · ≥15%</small></div>`, cls);
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

  if(!age||!sbp||!tc||!hdl||!ageDm||!hba1c||!egfr){ showBox('s2dm-result','<span style="color:#dc2626">Заполните все поля.</span>'); return; }
  if(age<40||age>69){ showBox('s2dm-result','<span style="color:#ea580c">SCORE2-Diabetes — 40–69 лет.</span>','info'); return; }

  // Базовые коэффициенты SCORE2 (для 40-69 лет, без диабета)
  const coef = sex==='m'
    ? {age:0.3742, smoke:0.6012, sbp:0.2777, tc:0.1458, hdl:-0.2698}
    : {age:0.4648, smoke:0.7744, sbp:0.3131, tc:0.1002, hdl:-0.2606};

  // Коэффициенты для диабетических переменных (упрощенные, основаны на литературе)
  const beta_hba1c = sex==='m' ? 0.25 : 0.22;    // Вклад HbA1c
  const beta_agedm = sex==='m' ? -0.015 : -0.012; // Вклад возраста диагностики (раньше = выше риск)
  const beta_egfr = sex==='m' ? -0.18 : -0.15;   // Вклад eGFR

  // Линейный предиктор
  let lp = coef.age * ((age - 60) / 5)
         + coef.smoke * smoker
         + coef.sbp * ((sbp - 120) / 20)
         + coef.tc * (tc - 6)
         + coef.hdl * ((hdl - 1.3) / 0.5)
         + beta_hba1c * (hba1c - 7.0)
         + beta_agedm * (ageDm - 50)
         + beta_egfr * Math.log(egfr / 90);

  // Базовая выживаемость (как в SCORE2)
  const S10 = {
    m:{low:0.9605, mod:0.9475, high:0.9333, vhigh:0.9161},
    f:{low:0.9776, mod:0.9683, high:0.9568, vhigh:0.9423}
  };
  const s10 = S10[sex][region];
  const risk = (1 - Math.pow(s10, Math.exp(lp))) * 100;

  // Интерпретация (пороги для СД 2 типа)
  let cls = 'good', txt = '', rec = '';
  if (risk < 5) { cls = 'good'; txt = 'Низкий риск'; rec = 'Стандартная профилактика.'; }
  else if (risk < 10) { cls = 'warn'; txt = 'Умеренный риск'; rec = 'Рассмотреть интенсификацию гиполипидемической терапии.'; }
  else if (risk < 20) { cls = 'bad'; txt = 'Высокий риск'; rec = 'Показана интенсивная гиполипидемическая терапия.'; }
  else { cls = 'bad'; txt = 'Очень высокий риск'; rec = 'Агрессивная коррекция всех факторов риска.'; }

  showBox('s2dm-result',
    `<div class="label">SCORE2-Diabetes — 10-летний риск ССЗ</div>
     <div class="val">${fmt(risk,1)}%</div>
     <div class="interp"><b>${txt}.</b> ${rec}<br><small style="color:#64748b">Пороги: 5% / 10% / 20%.</small></div>`, cls);
}

/* ---------- 8. CHA2DS2-VASc ---------- */
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
  const html=CHADS.map(it=>{
    const checked=selected.includes(it.t.replace(/ \+\d+$/,'').trim());
    const mark=checked?'☑':'☐';
    return `<div class="acq-print-q"><div class="q-text">${mark} ${it.t} (+${it.p})</div></div>`;
  }).join('');
  document.getElementById('p-chads-questions').innerHTML=html;
  document.getElementById('p-chads-sum').textContent=score+' балл(ов)';
  document.getElementById('p-chads-interp').textContent=txt;
  document.getElementById('p-chads-rec').textContent=rec;
  document.body.classList.add('printing-chads');
  window.print();
}

/* ---------- 9. HAS-BLED ---------- */
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

/* ---------- 10. CURB-65 ---------- */
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

/* ---------- 11. GCS ---------- */
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

/* ---------- 12. Charlson ---------- */
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
     <div class="interp">Заболевания: <b>${score}</b> · Возраст (${age}): <b>+${agePts}</b><br><b>${txt}</b><br><small style="color:#64748b">10-летняя выживаемость: ${survival}</small></div>`, cls);
}

/* ---------- 13. Больничный (дни) ---------- */
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
    return {
      html: `<b>⚠ Внимание:</b> срок превышает 10 дней. Требуется продление через <b>заведующего</b> отделением.`,
      cls: 'warn',
      style: 'background:#fff7ed; border-left:3px solid #ea580c; color:#9a3412;'
    };
  }
  if (days >= 31 && days <= 119) {
    return {
      html: `<b>⚠ Внимание:</b> срок превышает 30 дней. Требуется продление через <b>ВКК</b>.`,
      cls: 'bad',
      style: 'background:#fef2f2; border-left:3px solid #dc2626; color:#991b1b;'
    };
  }
  return {
    html: `<b>🚨 Внимание:</b> срок достиг 120 дней. Требуется направление на <b>МРЭК</b>.`,
    cls: 'bad',
    style: 'background:#fef2f2; border-left:3px solid #991b1b; color:#7f1d1d; font-weight:bold;'
  };
}
function calcSickLeave() {
  const startStr = document.getElementById('sick-start').value.trim();
  const daysVal = parseInt(document.getElementById('sick-days').value, 10);
  const startDate = parseDateSafe(startStr);
  if (!startDate) { showBox('sick-result', '<span style="color:#dc2626">Введите корректную дату начала.</span>'); return; }
  if (!daysVal || daysVal < 1) { showBox('sick-result', '<span style="color:#dc2626">Введите количество дней > 0.</span>'); return; }
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
  if (!dateStart || !dateEnd) { showBox('sick-result', '<span style="color:#dc2626">Введите корректные даты.</span>'); return; }
  if (dateEnd < dateStart) { showBox('sick-result', '<span style="color:#dc2626">Дата окончания раньше даты начала.</span>'); return; }
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

/* ---------- 14. ACQ-5 ---------- */
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
  if(answered<5){ showBox('acq-result','<span style="color:#dc2626">Ответьте на все 5 вопросов.</span>'); return; }
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

/* ---------- 15. FINDRISK ---------- */
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
  if(answered<FINDRISK.length){ showBox('findrisk-result','<span style="color:#dc2626">Ответьте на все 8 вопросов.</span>'); return; }
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
  const html=FINDRISK.map((item, qi)=>{
    const ans=answers[qi];
    const opts=item.opts.map((o)=>`<div style="margin-left:10pt;">${(o.v===ans)?'☑':'☐'} ${o.v} балл(ов) — ${o.l}</div>`).join('');
    return `<div class="acq-print-q"><div class="q-text">${item.name}</div><div class="q-opts" style="line-height:1.5">${opts}</div></div>`;
  }).join('');
  document.getElementById('p-findrisk-questions').innerHTML=html;
  document.getElementById('p-findrisk-sum').textContent=sum+' балл(ов)';
  document.getElementById('p-findrisk-interp').textContent=txt;
  document.body.classList.add('printing-findrisk');
  window.print();
}

/* ---------- 16. Скрининги (Диспансеризация) ---------- */
function calcScreening(){
  const age = +document.getElementById('screen-age').value;
  const sex = document.getElementById('screen-sex').value;

  if(!age){ showBox('screening-result','<span style="color:#dc2626">Введите возраст.</span>'); return; }

  let html = '';
  let frequency = '';

  // Определение частоты диспансеризации
  if (age >= 18 && age <= 39) {
    frequency = '1 раз в 3 года';
  } else if (age >= 40) {
    frequency = '1 раз в год';
  }

  // Базовые исследования
  html += `<p><b>Частота диспансеризации:</b> ${frequency}</p>`;
  html += `<p><b>Базовые исследования:</b> Общий анализ крови, общий анализ мочи, глюкоза крови, креатинин, АЛТ, общий холестерин, триглицериды, ЭКГ.</p>`;

  if (age >= 18 && age <= 39) {
    html += `<p><b>Периодичность базовых:</b> 1 раз в 3 года.</p>`;
  } else if (age >= 40) {
    html += `<p><b>Периодичность базовых:</b> 1 раз в год. Дополнительно: измерение внутриглазного давления.</p>`;
  }

  // Онкоскрининги
  html += `<h3 style="margin-top:12px;">Онкоскрининг</h3><ul style="margin-left:20px; line-height:1.8;">`;
  
  if (sex === 'f') {
    // Шейка матки
    if (age >= 21 && age <= 29) {
      html += `<li><b>ПАП-тест (шейка матки):</b> 1 раз в 3 года.</li>`;
    } else if (age >= 30 && age <= 39) {
      html += `<li><b>ВПЧ-тест (шейка матки):</b> 1 раз в 6 лет.</li>`;
    } else if (age >= 40 && age <= 60) {
      html += `<li><b>ВПЧ-тест (шейка матки):</b> 1 раз в 5 лет.</li>`;
    }
    // Молочная железа
    if (age >= 49 && age <= 58) {
      html += `<li><b>Маммография:</b> 1 раз в 3 года.</li>`;
    }
  } else if (sex === 'm') {
    // Простата
    if (age >= 50 && age <= 65) {
      html += `<li><b>ПСА (простат-специфический антиген):</b> 1 раз в 2 года.</li>`;
    }
  }

  html += `</ul>`;

  // Осмотр полости рта
  html += `<p><b>Осмотр полости рта:</b> 1 раз в 3 года (всем).</p>`;

  // Карта оценки симптомов
  if (age >= 18 && age <= 39) {
    html += `<p><b>Карта оценки симптомов предопухолевых заболеваний:</b> 1 раз в 3 года.</p>`;
  } else if (age >= 40) {
    html += `<p><b>Карта оценки симптомов предопухолевых заболеваний:</b> 1 раз в год.</p>`;
  }

  showBox('screening-result', html, 'info');
}

/* ---------- 17. Печать / ВКК / Авто-расчет ---------- */
window.addEventListener('afterprint', ()=>{
  document.body.classList.remove('printing-acq','printing-chads','printing-findrisk','printing-vkk');
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
    let pt=7;
    while(inner.scrollHeight>maxH && pt>6){
      pt-=0.25;
      inner.style.fontSize=pt+'pt';
    }
  });
}
function printVkk(){
  const v=id=>{const el=document.getElementById(id); return el ? el.value.trim() : '';};
  document.getElementById('p-vkk-date').textContent       = v('vkk-date');
  document.getElementById('p-vkk-fio').textContent        = v('vkk-fio');
  document.getElementById('p-vkk-start').textContent      = v('vkk-start');
  document.getElementById('p-vkk-days').textContent       = v('vkk-days');
  document.getElementById('p-vkk-days-total').textContent = v('vkk-days-total');
  fillRuledLines();
  document.body.classList.add('printing-vkk');
  autoFitVkk();
  window.print();
}
function clearVkk(){
  ['vkk-date','vkk-fio','vkk-purpose','vkk-start','vkk-days','vkk-days-total','vkk-complaints','vkk-anamnesis','vkk-exam','vkk-diagnosis'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
}

// Счётчик символов
(function initCharCounters(){
  const LIMITS={'vkk-purpose':300,'vkk-complaints':600,'vkk-anamnesis':1200,'vkk-exam':1000,'vkk-diagnosis':600};
  Object.keys(LIMITS).forEach(id=>{
    const el=document.getElementById(id); if(!el) return;
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

// Авто-расчет дней в ВКК
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
  }
  elStart.addEventListener('change', calcDays);
  elDate.addEventListener('change', calcDays);
})();
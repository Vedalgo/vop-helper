/* =========================================================
   ВОП-Helper — calculators.js
   СКФ, клиренс, ИМТ, SCORE2, CHA2DS2-VASc, HAS-BLED, CURB-65,
   GCS, Charlson, больничный
   ========================================================= */

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
function getHasbledScore(){
  let score=0; const selected=[];
  document.querySelectorAll('#hasbled-list input:checked').forEach(i=>{
    score+=+i.closest('label').dataset.p;
    selected.push(i.closest('label').querySelector('span').textContent.replace(/\s*\+\d+\s*$/,'').trim());
  });
  return {score, selected};
}
function printHasbled(){
  const {score}=getHasbledScore();
  let txt='';
  if(score<=1) txt='Низкий риск кровотечений.';
  else if(score===2) txt='Умеренный риск.';
  else txt='Высокий риск кровотечений.';

  const fioEl=document.getElementById('hasbled-fio');
  const dateEl=document.getElementById('hasbled-date');
  const set=(id,val)=>{const el=document.getElementById(id); if(el) el.textContent=val||'';};
  set('p-hasbled-fio', fioEl?fioEl.value.trim():'');
  set('p-hasbled-date', dateEl?dateEl.value.trim():'');
  set('p-hasbled-doctor-sign', typeof getCurrentDoctor==='function'?getCurrentDoctor():'');

  const html=HASBLED.map(it=>{
    const inp=document.querySelector(`#hasbled-list input[value="${it.id}"]`);
    const mark=(inp&&inp.checked)?'☑':'☐';
    return `<div class="acq-print-q"><div class="q-text">${mark} ${it.t} (+${it.p})</div></div>`;
  }).join('');
  const q=document.getElementById('p-hasbled-questions');
  if(q) q.innerHTML=html;
  set('p-hasbled-sum', score+' балл(ов)');
  set('p-hasbled-interp', txt);
  document.body.classList.add('printing-acq');
  window.print();
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



/* ---------- CHA₂DS₂-VASc + HAS-BLED (совмещённый) ---------- */
(function initChadsHasbledCombo(){
  const cList = document.getElementById('chads-list-combo');
  const hList = document.getElementById('hasbled-list-combo');
  if (!cList && !hList) return;
  if (cList && typeof CHADS !== 'undefined') {
    cList.innerHTML = CHADS.map(it =>
      `<label class="checkbox-row" data-p="${it.p}">
         <input type="checkbox" name="chads-combo" value="${it.id||''}">
         <span>${it.t} <b style="color:var(--primary-dark)">+${it.p}</b></span>
       </label>`).join('');
    cList.querySelectorAll('.checkbox-row').forEach(el=>{
      el.addEventListener('change',()=>el.classList.toggle('selected', el.querySelector('input').checked));
    });
  }
  if (hList && typeof HASBLED !== 'undefined') {
    hList.innerHTML = HASBLED.map(it =>
      `<label class="checkbox-row" data-p="${it.p}">
         <input type="checkbox" name="hasbled-combo" value="${it.id||''}">
         <span>${it.t} <b style="color:var(--primary-dark)">+${it.p}</b></span>
       </label>`).join('');
    hList.querySelectorAll('.checkbox-row').forEach(el=>{
      el.addEventListener('change',()=>el.classList.toggle('selected', el.querySelector('input').checked));
    });
  }
  // date mask
  if (typeof attachDateMask === 'function') attachDateMask('chads-hasbled-date', true);
})();

function getChadsComboScore(){
  let score=0; const selected=[];
  document.querySelectorAll('#chads-list-combo input:checked').forEach(i=>{
    score += +i.closest('label').dataset.p;
    selected.push(i.closest('label').querySelector('span').textContent.replace(/\s*\+\d+\s*$/,'').trim());
  });
  return {score, selected};
}
function getHasbledComboScore(){
  let score=0; const selected=[];
  document.querySelectorAll('#hasbled-list-combo input:checked').forEach(i=>{
    score += +i.closest('label').dataset.p;
    selected.push(i.closest('label').querySelector('span').textContent.replace(/\s*\+\d+\s*$/,'').trim());
  });
  return {score, selected};
}
function calcChadsCombo(){
  const {score}=getChadsComboScore();
  const {cls, txt, rec}=chadsInterpret(score);
  showBox('chads-combo-result',
    `<div class="label">CHA₂DS₂-VASc</div>
     <div class="val">${score} балл(ов)</div>
     <div class="interp"><b>${txt}.</b> ${rec}</div>`, cls);
}
function calcHasbledCombo(){
  const {score}=getHasbledComboScore();
  let cls='good', txt='';
  if(score<=1){txt='Низкий риск кровотечений.';cls='good';}
  else if(score===2){txt='Умеренный риск.';cls='warn';}
  else {txt='Высокий риск кровотечений.';cls='bad';}
  showBox('hasbled-combo-result',
    `<div class="label">HAS-BLED</div>
     <div class="val">${score} балл(ов)</div>
     <div class="interp">${txt}</div>`, cls);
}
function resetChadsHasbled(){
  document.querySelectorAll('#chads-list-combo input, #hasbled-list-combo input').forEach(i=>i.checked=false);
  document.querySelectorAll('#chads-list-combo .checkbox-row, #hasbled-list-combo .checkbox-row').forEach(r=>r.classList.remove('selected'));
  ['chads-combo-result','hasbled-combo-result'].forEach(id=>{
    const r=document.getElementById(id); if(r) r.className='result-box empty';
  });
}
function printChadsHasbled(){
  const fio = (document.getElementById('chads-hasbled-fio')||{}).value?.trim() || '';
  const date = (document.getElementById('chads-hasbled-date')||{}).value?.trim() || '';
  const doc = typeof getCurrentDoctor === 'function' ? getCurrentDoctor() : '';

  const ch = getChadsComboScore();
  const {txt: chTxt, rec: chRec} = chadsInterpret(ch.score);
  const hb = getHasbledComboScore();
  let hbTxt = '';
  if (hb.score <= 1) hbTxt = 'Низкий риск кровотечений.';
  else if (hb.score === 2) hbTxt = 'Умеренный риск.';
  else hbTxt = 'Высокий риск кровотечений.';

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || ''; };
  set('p-chb-fio', fio);
  set('p-chb-date', date);
  set('p-chb-doc', doc);

  const chQ = CHADS.map(it => {
    const inp = document.querySelector(`#chads-list-combo input[value="${it.id}"]`);
    const mark = (inp && inp.checked) ? '☑' : '☐';
    return `<div class="chb-q">${mark} ${it.t} <b>(+${it.p})</b></div>`;
  }).join('');
  const hbQ = HASBLED.map(it => {
    const inp = document.querySelector(`#hasbled-list-combo input[value="${it.id}"]`);
    const mark = (inp && inp.checked) ? '☑' : '☐';
    return `<div class="chb-q">${mark} ${it.t} <b>(+${it.p})</b></div>`;
  }).join('');

  const elCh = document.getElementById('p-chb-chads-q');
  const elHb = document.getElementById('p-chb-hasbled-q');
  if (elCh) elCh.innerHTML = chQ;
  if (elHb) elHb.innerHTML = hbQ;

  set('p-chb-chads-sum', ch.score + ' балл(ов)');
  set('p-chb-chads-interp', chTxt);
  set('p-chb-chads-rec', chRec);
  set('p-chb-hasbled-sum', hb.score + ' балл(ов)');
  set('p-chb-hasbled-interp', hbTxt);

  document.body.classList.add('printing-chads-hasbled');
  window.print();
}

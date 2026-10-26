/* =========================================================
   ВОП-Helper — questionnaires.js
   ACQ-5, FINDRISK, HADS, AUDIT-C, MMSE, BDI, mMRC, CAT,
   Ривермид, критерии Light
   ========================================================= */

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


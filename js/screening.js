/* =========================================================
   ВОП-Helper — screening.js
   Диспансеризация и онкоскрининг
   ========================================================= */

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


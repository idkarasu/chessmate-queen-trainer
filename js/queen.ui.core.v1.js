/* queen.ui.core.js — v1 */

(function(window,document){'use strict';

/* 1 - Namespace ve cleanup tracking --------------------------------------- */
const QueenUI={_listeners:[],_cleanupItems:[]};

const on=(el,ev,fn,opts=false)=>{
  if(!el)return;
  el.addEventListener(ev,fn,opts);
  QueenUI._listeners.push({el,ev,fn,opts})
};

const addCleanupItem=(item)=>{QueenUI._cleanupItems.push(item)};

const $=(id)=>document.getElementById(id);

const throttle=(func,delay)=>{let timeoutId;let lastExecTime=0;return function(...args){const currentTime=Date.now();if(currentTime-lastExecTime>delay){func.apply(this,args);lastExecTime=currentTime}else{clearTimeout(timeoutId);timeoutId=setTimeout(()=>{func.apply(this,args);lastExecTime=Date.now()},delay-(currentTime-lastExecTime));addCleanupItem(()=>clearTimeout(timeoutId))}}};

const t=(key,...args)=>window.Queen?.t?.(key,...args)||key;
/* Bölüm sonu --------------------------------------------------------------- */

/* 2 - Önyükleme ve yardımcılar -------------------------------------------- */
function getCardHost(){const board=$('cm-board');const card=board?.closest('.qn-wrap');return card||document.querySelector('.qn-wrap')||document.body}
function insertAfter(ref,node){if(!ref?.parentNode)return;ref.parentNode.insertBefore(node,ref.nextSibling)}
const pad2=(n)=>String((n|0)).padStart(2,'0');
const fmtMMSS=(sec)=>{sec=Math.max(0,sec|0);const m=(sec/60|0),s=sec%60;return pad2(m)+':'+pad2(s)};
const fmtMMSSDown60=(sec)=>{sec=Math.max(0,sec|0);if(sec===60)return'00:60';return'00:'+pad2(sec)};
const fmtOrDashMMSS=(sec)=>(sec&&sec>0)?fmtMMSS(sec):'—';
function setToggleButtonState(btn,{pressed,title,text}){if(!btn)return;if(typeof pressed==='boolean'){btn.setAttribute('aria-pressed',pressed?'true':'false')}if(typeof title==='string')btn.title=title;if(typeof text==='string')btn.textContent=text}
/* Bölüm sonu --------------------------------------------------------------- */

/* 3 - I18N DOM Update System ---------------------------------------------- */
function updateI18nAttributes() {
  const elements = document.querySelectorAll('[data-i18n], [data-i18n-title], [data-i18n-aria], [data-i18n-placeholder]');
  
  elements.forEach(el => {
    const i18nKey = el.getAttribute('data-i18n');
    if (i18nKey) {
      el.textContent = t(i18nKey);
    }
    
    const titleKey = el.getAttribute('data-i18n-title');
    if (titleKey) {
      el.title = t(titleKey);
    }
    
    const ariaKey = el.getAttribute('data-i18n-aria');
    if (ariaKey) {
      el.setAttribute('aria-label', t(ariaKey));
    }
    
    const placeholderKey = el.getAttribute('data-i18n-placeholder');
    if (placeholderKey) {
      el.setAttribute('placeholder', t(placeholderKey));
    }
  });
}

function updatePageLanguage() {
  const QN = window.Queen;
  if (!QN?.lang) return;
  
  const currentLang = QN.lang.current;
  
  const htmlEl = document.getElementById('html-root') || document.documentElement;
  if (htmlEl) {
    htmlEl.setAttribute('lang', currentLang);
  }
  
  const titles = {
    en: 'Queen Training - ChessMate.ink',
    tr: 'Vezir Eğitimi - ChessMate.ink',
    de: 'Dame Training - ChessMate.ink'
  };
  
  const titleEl = document.getElementById('page-title');
  if (titleEl && titles[currentLang]) {
    titleEl.textContent = titles[currentLang];
  } else if (titles[currentLang]) {
    document.title = titles[currentLang];
  }
  
  updateI18nAttributes();
}

function updateDynamicTooltips() {
  const QN = window.Queen;
  if (!QN) return;
  
  const btnSound = $('cm-sound-toggle');
  if (btnSound) {
    const isOn = !!QN.st?.soundOn;
    const tooltipKey = isOn ? 'tooltip.sound.on' : 'tooltip.sound.off';
    btnSound.title = t(tooltipKey);
    btnSound.textContent = isOn ? '🔊' : '🔇';
    btnSound.setAttribute('aria-pressed', isOn ? 'true' : 'false');
  }
  
  const btnHints = $('cm-hints');
  if (btnHints) {
    const isOn = !!QN.st?.hintsOn;
    const tooltipKey = isOn ? 'tooltip.hints.on' : 'tooltip.hints.off';
    btnHints.title = t(tooltipKey);
    btnHints.setAttribute('aria-pressed', isOn ? 'true' : 'false');
  }
  
  const btnBoard = $('cm-board-toggle');
  if (btnBoard) {
    const skin = QN.st?.boardSkin || 'classic';
    btnBoard.title = t('tooltip.board') + ` (${skin})`;
  }
  
  const btnTheme = $('cm-theme-toggle');
  if (btnTheme) {
    const theme = QN.st?.theme || 'dark';
    btnTheme.title = t('tooltip.theme');
    btnTheme.textContent = theme === 'light' ? '☀️' : '🌙';
  }
  
  const btnStart = $('qn-start');
  if (btnStart) {
    btnStart.title = t('tooltip.start');
    const currentText = btnStart.textContent;
    const hasIcon = currentText.includes('▶');
    btnStart.textContent = hasIcon ? `▶ ${t('btn.start')}` : t('btn.start');
  }
}

function updateModalContent() {
  const closeBtn = $('qn-modal-close');
  if (closeBtn) {
    closeBtn.setAttribute('aria-label', t('btn.close'));
  }
  
  const newGameBtn = $('qn-modal-newgame');
  if (newGameBtn) {
    newGameBtn.textContent = t('btn.newgame');
  }
  
  const modalTitle = document.getElementById('qn-modal-title');
  const modalDesc = document.getElementById('qn-modal-desc');
}
/* Bölüm sonu --------------------------------------------------------------- */

/* 4 - Seviye şeritleri ----------------------------------------------------- */
function updateLevelsBars(activeWave){
  const update=(rootId)=>{
    const root=$(rootId);
    if(!root)return;
    root.querySelectorAll('.lvl').forEach(el=>{
      const k=parseInt(el.dataset.k,10);
      el.classList.toggle('active',k===activeWave);
      el.classList.toggle('done',k<activeWave);
      el.classList.toggle('todo',k>activeWave)
    })
  };
  update('qn-levels-inline')
}
/* Bölüm sonu --------------------------------------------------------------- */

/* 5 - Birleşik alt panel -------------------------------------------------- */
function ensureUnderbar(){
  let underbar = $('qn-underbar');
  const board = $('cm-board');
  if(!board?.parentNode) return;
  
  if(!underbar) {
    underbar = document.createElement('div');
    underbar.id = 'qn-underbar';
    underbar.className = 'qn-underbar';
    underbar.setAttribute('role', 'region');
    underbar.setAttribute('aria-label', t('aria.gameinfo'));
    insertAfter(board, underbar);
  }
  
  if(underbar.children.length === 0) {
    const centerSection = document.createElement('div'); 
    centerSection.className = 'qn-underbar-center';
    
    const timebar = document.createElement('div');
    timebar.id = 'qn-timebar';
    timebar.className = 'qn-timebar';
    timebar.innerHTML = '<div id="qn-timefill" class="qn-timefill"></div>';
    
    const levelsInline = document.createElement('div');
    levelsInline.id = 'qn-levels-inline';
    levelsInline.className = 'qn-levels-inline';
    for(let i = 1; i <= 8; i++) {
      const sp = document.createElement('span');
      sp.className = 'lvl';
      sp.dataset.k = String(i);
      sp.textContent = String(i);
      levelsInline.appendChild(sp);
    }
    levelsInline.style.display = 'none';
    
    centerSection.appendChild(timebar);
    centerSection.appendChild(levelsInline);
    
    const bottomSection = document.createElement('div');
    bottomSection.className = 'qn-underbar-bottom';
    
    const leftSection = document.createElement('div');
    leftSection.className = 'qn-underbar-left';
    
    const hudTime = document.createElement('div');
    hudTime.id = 'hud-time';
    hudTime.className = 'hud-chip';
    hudTime.setAttribute('aria-label', t('hud.time'));
    hudTime.innerHTML = `<span class="ico">⏱️</span><span class="lbl">${t('hud.time')}</span><span class="val">00:00</span>`;
    leftSection.appendChild(hudTime);
    
    const hudCombo = document.createElement('div');
    hudCombo.id = 'hud-combo';
    hudCombo.className = 'hud-chip hud-combo';
    hudCombo.setAttribute('aria-label', 'Combo');
    hudCombo.innerHTML = `<span class="ico">🔥</span><span class="lbl">Combo</span><span class="val">×1</span>`;
    hudCombo.style.display = 'none';
    leftSection.appendChild(hudCombo);
    
    const middleSection = document.createElement('div');
    middleSection.className = 'qn-underbar-middle';
    
    const hudScore = document.createElement('div');
    hudScore.id = 'hud-score'; 
    hudScore.className = 'hud-chip';
    hudScore.setAttribute('aria-label', t('hud.score'));
    hudScore.innerHTML = `<span class="lbl">${t('hud.score')}</span><span class="val">00</span><span class="ico">♟️</span>`;
    middleSection.appendChild(hudScore);
    
    const rightSection = document.createElement('div');
    rightSection.className = 'qn-underbar-right';
    
    const hudBest = document.createElement('div');
    hudBest.id = 'hud-best';
    hudBest.className = 'hud-chip';
    hudBest.setAttribute('aria-label', t('hud.best'));  
    hudBest.innerHTML = `<span class="lbl" id="hud-best-label">${t('hud.best')}</span><span class="val">—</span><span class="ico">⏱️</span>`;
    rightSection.appendChild(hudBest);
    
    bottomSection.appendChild(leftSection);
    bottomSection.appendChild(middleSection); 
    bottomSection.appendChild(rightSection);
    
    underbar.appendChild(centerSection);
    underbar.appendChild(bottomSection);
  }
  
  function checkOverflow(){
    const isOverflowing = underbar.scrollWidth > underbar.clientWidth;
    underbar.classList.toggle('is-overflowing', isOverflowing);
  }
  
  checkOverflow();
  const resizeObserver = new ResizeObserver(throttle(checkOverflow, 100));
  resizeObserver.observe(underbar);
}

function showTimedBar(){
  const tb=$('qn-timebar'),lv=$('qn-levels-inline');
  if(tb)tb.style.display='block';
  if(lv)lv.style.display='none'
}

function showLevelsBar(){
  const tb=$('qn-timebar'),lv=$('qn-levels-inline');
  if(tb)tb.style.display='none';
  if(lv)lv.style.display='flex'
}
/* Bölüm sonu --------------------------------------------------------------- */

/* 6 - Zaman barı maske yardımcıları --------------------------------------- */
function setTimebarCoverage(cov){
  const fill=document.getElementById('qn-timefill');
  if(!fill)return;
  const clamped=Math.max(0,Math.min(1,cov));
  fill.style.transform=`scaleX(${clamped})`
}

function resetTimebarFull(){setTimebarCoverage(0)}

function updateTimebar(){
  const QN=window.Queen;
  if(!QN)return;
  if(QN.st.mode!=='timed')return;
  const total=60;
  const left=Math.max(0,QN.st.timeLeft|0);
  const frac=Math.max(0,Math.min(1,left/total));
  const coverage=1-frac;
  setTimebarCoverage(coverage)
}
/* Bölüm sonu --------------------------------------------------------------- */

/* 7 - HUD ------------------------------------------------------------------ */
function updateHud(){
  const QN=window.Queen;
  if(!QN)return;
  const $time=document.querySelector('#hud-time .val');
  const $score=document.querySelector('#hud-score .val');
  const $best=document.querySelector('#hud-best .val');
  const $bestIco=document.querySelector('#hud-best .ico');
  const $bestLbl=document.getElementById('hud-best-label');
  const bestWrap=document.getElementById('hud-best');
  
  if($score)$score.textContent=pad2(QN.st.score|0);
  
  if(QN.st.mode==='timed'){
    if($time)$time.textContent=fmtMMSSDown60(Math.max(0,QN.st.timeLeft|0));
    if(bestWrap)bestWrap.setAttribute('aria-label',t('hud.best'));
    if($bestLbl)$bestLbl.textContent=t('hud.best');
    if($best)$best.textContent=pad2(QN.st.bestTimed|0);
    if($bestIco)$bestIco.textContent='♟️'
  }else{
    if($time)$time.textContent=fmtMMSS(Math.max(0,QN.st.timeLeft|0));
    if(bestWrap)bestWrap.setAttribute('aria-label',t('hud.fastest'));
    if($bestLbl)$bestLbl.textContent=t('hud.fastest'));
    if($best)$best.textContent=fmtOrDashMMSS(QN.st.bestLevelsTime|0);
    if($bestIco)$bestIco.textContent='⏱️'
  }
}

function updateHudLabels(){
  const $timeLabel=document.querySelector('#hud-time .lbl');
  const $scoreLabel=document.querySelector('#hud-score .lbl');
  const $bestLabel=document.querySelector('#hud-best .lbl');
  const $timeWrap=document.getElementById('hud-time');
  const $scoreWrap=document.getElementById('hud-score');
  const $bestWrap=document.getElementById('hud-best');
  
  if($timeLabel)$timeLabel.textContent=t('hud.time');
  if($scoreLabel)$scoreLabel.textContent=t('hud.score');
  if($timeWrap)$timeWrap.setAttribute('aria-label',t('hud.time'));
  if($scoreWrap)$scoreWrap.setAttribute('aria-label',t('hud.score'));
  
  const QN=window.Queen;
  if(QN?.st.mode==='timed'){
    if($bestLabel)$bestLabel.textContent=t('hud.best');
    if($bestWrap)$bestWrap.setAttribute('aria-label',t('hud.best'));
  }else{
    if($bestLabel)$bestLabel.textContent=t('hud.fastest');
    if($bestWrap)$bestWrap.setAttribute('aria-label',t('hud.fastest'));
  }
}

function updateComboDisplay(){
  const QN = window.Queen;
  if(!QN) return;
  
  const hudCombo = $('hud-combo');
  const comboVal = document.querySelector('#hud-combo .val');
  const comboChip = hudCombo;
  
  if(!hudCombo || !comboVal) return;
  
  const combo = QN.st?.combo || 0;
  
  if(combo <= 1){
    hudCombo.style.display = 'none';
    if(comboChip) comboChip.classList.remove('combo-active', 'combo-high', 'combo-super');
  } else {
    hudCombo.style.display = 'inline-flex';
    comboVal.textContent = `×${combo}`;
    
    if(comboChip) {
      comboChip.classList.add('combo-active');
      comboChip.classList.toggle('combo-high', combo >= 3 && combo < 5);
      comboChip.classList.toggle('combo-super', combo >= 5);
    }
  }
  
  if(combo > 1) {
    hudCombo.setAttribute('aria-label', `Combo: ${combo} kez`);
  }
}

function animateComboChange(combo, isNew, isBreak) {
  const hudCombo = $('hud-combo');
  if(!hudCombo) return;
  
  if(isNew && combo === 1) {
    hudCombo.classList.add('combo-start');
    setTimeout(() => hudCombo.classList.remove('combo-start'), 300);
  } else if(combo > 1) {
    hudCombo.classList.add('combo-increase');
    setTimeout(() => hudCombo.classList.remove('combo-increase'), 400);
  } else if(isBreak) {
    hudCombo.classList.add('combo-break');
    setTimeout(() => hudCombo.classList.remove('combo-break'), 500);
  }
}
/* Bölüm sonu --------------------------------------------------------------- */

/* 8 - UI bağlama ---------------------------------------------------------- */
function initToolbarScroll(){
  const toolbar=document.querySelector('.cm-toolbar .qn-toolbar--single');
  if(!toolbar)return;
  
  function checkOverflow(){
    const isOverflowing=toolbar.scrollWidth>toolbar.clientWidth;
    toolbar.classList.toggle('is-overflowing',isOverflowing);
    if(isOverflowing){
      toolbar.scrollLeft=0
    }
  }
  
  function addScrollHelpers(){
    on(toolbar,'wheel',(e)=>{
      if(e.shiftKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)){
        e.preventDefault();
        const delta=e.deltaY||e.deltaX;
        toolbar.scrollLeft+=delta*0.5
      }
    },{passive:false});
    
    on(toolbar,'keydown',(e)=>{
      if(e.key==='ArrowLeft'){
        e.preventDefault();
        toolbar.scrollLeft-=50
      }else if(e.key==='ArrowRight'){
        e.preventDefault();
        toolbar.scrollLeft+=50
      }
    })
  }
  
  checkOverflow();
  addScrollHelpers();
  
  const resizeObserver=new ResizeObserver(throttle(checkOverflow,100));
  resizeObserver.observe(toolbar);
}
/* Bölüm sonu --------------------------------------------------------------- */

/* 9 - Cleanup ve lifecycle management ------------------------------------- */
QueenUI.cleanup=function(){
  this._listeners.forEach(({el,ev,fn,opts})=>{
    try{el.removeEventListener(ev,fn,opts)}catch(err){console.warn(`Failed to remove event listener ${ev}:`,err)}
  });
  this._listeners.length=0;
  
  this._cleanupItems.forEach(item=>{
    try{item()}catch(err){console.warn('Cleanup item failed:',err)}
  });
  this._cleanupItems.length=0;
};

window.QueenUICore = {
  updateI18nAttributes,
  updatePageLanguage,
  updateDynamicTooltips,
  updateModalContent,
  updateLevelsBars,
  ensureUnderbar,
  showTimedBar,
  showLevelsBar,
  setTimebarCoverage,
  resetTimebarFull,
  updateTimebar,
  updateHud,
  updateHudLabels,
  updateComboDisplay,
  animateComboChange,
  initToolbarScroll,
  
  getCardHost,
  insertAfter,
  pad2,
  fmtMMSS,
  fmtMMSSDown60,
  fmtOrDashMMSS,
  setToggleButtonState,
  on,
  addCleanupItem,
  $,
  throttle,
  t
};

window.QueenUI=QueenUI;

})(window,document);
/* Bölüm sonu --------------------------------------------------------------- */

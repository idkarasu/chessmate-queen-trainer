/* queen.ui.animations.js — v1 */

(function(window,document){'use strict';

const { on, $, throttle, t, getCardHost, addCleanupItem } = window.QueenUICore || {};

/* 1 - Geri sayım arayüzü -------------------------------------------------- */
let countdownActive = false;

function ensureCountdownDom(){
  let back=$('qn-countdown-back');
  const host=getCardHost();
  if(!back){
    back=document.createElement('div');
    back.id='qn-countdown-back';
    back.setAttribute('aria-hidden','true');
    back.innerHTML='<div id="qn-countdown">3</div>';
    host.appendChild(back)
  }else if(back.parentElement!==host){
    back.remove();
    host.appendChild(back)
  }
  Object.assign(back.style,{position:'absolute',inset:'0',zIndex:'9'});
  return back
}

async function qnCountdown(n=3){
  if(countdownActive)return;
  countdownActive=true;
  try{
    if(window.Queen?.playCountdown){
      window.Queen.playCountdown();
    }
    
    const back=ensureCountdownDom();
    const num=$('qn-countdown');
    if(!back||!num)return;
    const setFont=()=>{
      const board=$('cm-board');
      const base=(board&&(board.clientWidth||board.getBoundingClientRect().width))||360;
      num.style.fontSize=Math.max(48,Math.min(140,Math.round(base*0.22)))+'px'
    };
    setFont();
    const resizeHandler=throttle(setFont,100);
    on(window,'resize',resizeHandler,{passive:true});
    document.body.classList.add('qn-count-open');
    back.style.display='flex';
    for(let i=n;i>=1;i--){
      num.textContent=String(i);
      await new Promise(r=>{
        const timeoutId=setTimeout(r,800);
        addCleanupItem(()=>clearTimeout(timeoutId))
      })
    }
    back.style.display='none';
    document.body.classList.remove('qn-count-open')
  }finally{
    countdownActive=false
  }
}
/* Bölüm sonu --------------------------------------------------------------- */

/* 2 - Konfeti efekti ------------------------------------------------------ */
function qnConfetti(duration=1800,fadeMs=500){
  try{
    if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return
  }catch(_){}
  
  let confettiActive=true;
  addCleanupItem(()=>{confettiActive=false});
  
  try{
    const host=getCardHost();
    const rect=host.getBoundingClientRect();
    const c=document.createElement('canvas');
    c.width=Math.max(1,Math.round(rect.width));
    c.height=Math.max(1,Math.round(rect.height));
    Object.assign(c.style,{position:'absolute',inset:'0',pointerEvents:'none',zIndex:10001});
    host.appendChild(c);
    const ctx=c.getContext('2d');
    const N=Math.floor(Math.min(240,Math.max(140,rect.width/5.5)));
    const colors=['#FFD700','#3AA9FF','#6EE7B7','#FB923C','#A855F7'];
    const P=Array.from({length:N},()=>({
      x:Math.random()*c.width,
      y:-20-Math.random()*c.height*0.3,
      r:3+Math.random()*5,
      vx:(Math.random()-.5)*2,
      vy:2+Math.random()*3,
      a:Math.random()*Math.PI*2,
      va:(Math.random()-.5)*0.2,
      col:colors[(Math.random()*colors.length)|0]
    }));
    const t0=performance.now();
    
    function step(t){
      if(!confettiActive){
        c.remove();
        return
      }
      const dt=t-t0;
      const done=dt>=duration+fadeMs;
      const fading=dt>duration;
      const alpha=fading?Math.max(0,1-(dt-duration)/fadeMs):1;
      ctx.clearRect(0,0,c.width,c.height);
      ctx.save();
      ctx.globalAlpha=alpha;
      for(const p of P){
        p.x+=p.vx;
        p.y+=p.vy;
        p.a+=p.va;
        ctx.save();
        ctx.translate(p.x,p.y);
        ctx.rotate(p.a);
        ctx.fillStyle=p.col;
        ctx.fillRect(-p.r,-p.r,p.r*2,p.r*2);
        ctx.restore()
      }
      ctx.restore();
      if(!done){
        requestAnimationFrame(step)
      }else{
        c.remove();
        confettiActive=false
      }
    }
    requestAnimationFrame(step)
  }catch(err){
    console.warn('Confetti effect failed:',err);
    confettiActive=false
  }
}
/* Bölüm sonu --------------------------------------------------------------- */

/* 3 - Sonuç modali -------------------------------------------------------- */
let modalState={lastFocus:null,trapHandler:null,escHandler:null};

function ensureResultModal(){
  const host=getCardHost();
  let back=$('qn-modal-back');
  if(!back){
    back=document.createElement('div');
    back.id='qn-modal-back';
    back.style.display='none';
    back.innerHTML=`<div class="qn-modal" role="dialog" aria-modal="true" aria-labelledby="qn-modal-title" aria-describedby="qn-modal-desc"><button id="qn-modal-close" class="qn-modal__close" type="button" aria-label="${t('btn.close')}">✕</button><h3 class="qn-modal-title" id="qn-modal-title">${t('modal.timeup.title')}</h3><p class="qn-modal-desc" id="qn-modal-desc">—</p><div class="qn-modal-actions"><button id="qn-modal-newgame" class="qn-btn" type="button">${t('btn.newgame')}</button></div></div>`;
    host.appendChild(back)
  }else if(back.parentElement!==host){
    back.remove();
    host.appendChild(back)
  }
  const btn=$('qn-modal-newgame');
  const closeBtn=$('qn-modal-close');
  on(back,'click',(e)=>{if(e.target===back)closeResultModal()});
  on(closeBtn,'click',closeResultModal);
  on(btn,'click',()=>{window.Queen?.hardReset();closeResultModal()})
}

function trapFocusWithin(container){
  if(!container)return;
  const FOCUS='a[href],area[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  const nodes=Array.from(container.querySelectorAll(FOCUS)).filter(el=>el.offsetParent!==null||el===container);
  if(nodes.length===0)return;
  const first=nodes[0],last=nodes[nodes.length-1];
  modalState.trapHandler=function(e){
    if(e.key!=='Tab')return;
    if(e.shiftKey){
      if(document.activeElement===first){
        e.preventDefault();
        last.focus()
      }
    }else{
      if(document.activeElement===last){
        e.preventDefault();
        first.focus()
      }
    }
  };
  on(container,'keydown',modalState.trapHandler)
}

function addEscToClose(){
  modalState.escHandler=function(e){
    if(e.key==='Escape')closeResultModal()
  };
  on(document,'keydown',modalState.escHandler)
}

function openResultModal(title,desc){
  if(window.Queen?.playResult){
    window.Queen.playResult();
  }
  
  ensureResultModal();
  const back=$('qn-modal-back');
  const modal=back?.querySelector('.qn-modal');
  const titleEl=$('qn-modal-title');
  const descEl=$('qn-modal-desc');
  const btn=$('qn-modal-newgame');
  if(!back||!modal||!titleEl||!descEl||!btn)return;
  titleEl.textContent=title;
  descEl.textContent=desc;
  modalState.lastFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  back.style.display='flex';
  document.body.classList.add('qn-modal-open');
  btn.focus();
  trapFocusWithin(modal);
  addEscToClose()
}

function closeResultModal(){
  const back=$('qn-modal-back');
  if(back)back.style.display='none';
  document.body.classList.remove('qn-modal-open');
  modalState.trapHandler=null;
  modalState.escHandler=null;
  if(modalState.lastFocus?.focus){modalState.lastFocus.focus()}
  modalState.lastFocus=null
}
/* Bölüm sonu --------------------------------------------------------------- */

/* 4 - Cleanup ve export --------------------------------------------------- */
function cleanupAnimations(){
  countdownActive=false;
  modalState.lastFocus=null;
  modalState.trapHandler=null;
  modalState.escHandler=null;
}

window.QueenUIAnimations = {
  ensureCountdownDom,
  qnCountdown,
  qnConfetti,
  ensureResultModal,
  trapFocusWithin,
  addEscToClose,
  openResultModal,
  closeResultModal,
  cleanupAnimations
};

if(window.QueenUI) {
  const originalCleanup = window.QueenUI.cleanup;
  window.QueenUI.cleanup = function() {
    originalCleanup.call(this);
    cleanupAnimations();
  };
}

})(window,document);
/* Bölüm sonu --------------------------------------------------------------- */

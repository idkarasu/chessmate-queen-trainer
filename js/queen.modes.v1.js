/* queen.modes.js — v1 */

(function(window,document){'use strict';

/* 1 - Olay ve yardımcılar ------------------------------------------------- */
const emit=(name,detail)=>{try{document.dispatchEvent(new CustomEvent(name,{detail}))}catch(err){console.warn(`Event emission failed for ${name}:`,err)}};
const randPick=(arr)=>{if(!Array.isArray(arr)||arr.length===0)return null;return arr[(Math.random()*arr.length)|0]};
/* Bölüm sonu --------------------------------------------------------------- */

/* 2 - Vezir-güvenli yardımcılar ------------------------------------------- */
function randomSquares(core,count){
  const queen=core.st.queenSq;
  const occ=new Set([queen]);
  const all=core.allSquares();
  const out=[];
  let guard=0;
  const safeCount=Math.max(0,Math.min(count,all.length-1));
  while(out.length<safeCount&&guard++<1000){
    const sq=randPick(all);
    if(!sq||occ.has(sq))continue;
    occ.add(sq);
    out.push(sq)
  }
  return out
}
/* Bölüm sonu --------------------------------------------------------------- */

/* 3 - Doğurma yardımcıları ------------------------------------------------ */
function spawnForTimed(core){
  const pool=core.allSquares().filter(sq=>sq!==core.st.queenSq);
  if(pool.length===0){
    core.st.pawns=['d8'];
    return
  }
  const newPawn=randPick(pool);
  core.st.pawns=newPawn?[newPawn]:['d8']
}

function spawnForWave(core,n){
  const safeN=Math.max(1,Math.min(n,8));
  core.st.pawns=randomSquares(core,safeN);
  if(core.st.pawns.length===0){
    core.st.pawns=['d8']
  }
  emit('qn:wave',{wave:core.st.wave})
}
/* Bölüm sonu --------------------------------------------------------------- */

/* 4 - Modlar eklentisi ---------------------------------------------------- */
const ModesPlugin={
  _installed:false,
  install(QN){
    if(this._installed)return;
    this._installed=true;
    
    QN.modes={
      reset(core){
        const p=core._startForSide(core.st.side);
        core.st.queenSq=p.queenSq;
        
        if(core.st.mode==='timed'){
          core.st.timeLeft=60;
          spawnForTimed(core)
        }else{
          core.setWave(1);
          core.st.timeLeft=0;
          core.st.levelsStartAt=null;
          spawnForWave(core,1)
        }
      },
      
      onStart(core){
        if(core.st.mode==='timed'){
          core.startTimer('down')
        }else{
          core.st.timeLeft=0;
          core.st.levelsStartAt=Date.now();
          core.startTimer('up')
        }
      },
      
      onCapture(core,target){
        if(core.st.mode==='timed'){
          core.st.pawns=core.st.pawns.filter(sq=>sq!==target);
          spawnForTimed(core);
          return
        }
        
        core.st.pawns=core.st.pawns.filter(sq=>sq!==target);
        
        if(core.st.pawns.length===0){
          if(core.st.wave<8){
            const nextWave=Math.min(core.st.wave+1,8);
            core.setWave(nextWave);
            spawnForWave(core,nextWave)
          }else{
            // 8. dalga bitti
            if(core.st.playing && core.st.levelsStartAt){
              // Oyun başlatılmışsa ve süre takibi varsa
              let elapsedSec=1;
              const rawElapsed=(Date.now()-core.st.levelsStartAt)/1000;
              elapsedSec=Math.max(1,Math.floor(rawElapsed));
              
              emit('qn:levels-finished',{seconds:elapsedSec});
              
              if(!core.st.bestLevelsTime||elapsedSec<core.st.bestLevelsTime){
                core.setBestLevelsTime(elapsedSec)
              }
              
              core.stopTimer();
              core.st.playing=false;
              core.st.pawns=[]
            }else{
              // Oyun başlatılmamışsa, 1. dalgaya dön
              core.setWave(1);
              spawnForWave(core,1);
              core.updateInfo(core.t('msg.start.first') || "Press Start first.")
            }
          }
        }
      }
    };
    
    window.addEventListener('beforeunload',()=>{this._installed=false},{passive:true})
  },
  
  uninstall(){
    this._installed=false
  }
};
/* Bölüm sonu --------------------------------------------------------------- */

/* 5 - Export ve otomatik kurulum ------------------------------------------ */
window.QueenModesPlugin=ModesPlugin;

document.addEventListener('DOMContentLoaded',()=>{
  if(window.Queen?.use){
    window.Queen.use(ModesPlugin)
  }
},{once:true});

})(window,document);
/* Bölüm sonu --------------------------------------------------------------- */

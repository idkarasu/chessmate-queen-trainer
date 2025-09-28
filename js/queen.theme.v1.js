/* queen.theme.js — v1 */

(function(window,document){'use strict';

/* 1 - Theme Plugin -------------------------------------------------------- */
const ThemePlugin={_eventListeners:[],_installed:false,_addListener(target,event,handler,options={}){target.addEventListener(event,handler,options);this._eventListeners.push({target,event,handler,options})},cleanup(){this._eventListeners.forEach(({target,event,handler,options})=>{try{target.removeEventListener(event,handler,options)}catch(err){console.warn(`Failed to remove theme event listener ${event}:`,err)}});this._eventListeners.length=0;this._installed=false},install(Core){if(this._installed)return;this._installed=true;
/* Bölüm sonu --------------------------------------------------------------- */

/* 2 - Tema fonksiyonları -------------------------------------------------- */
if(typeof Core.toggleTheme!=='function'){Core.toggleTheme=()=>{const currentTheme=Core.st?.theme||'dark';if(typeof Core.setTheme==='function'){Core.setTheme(currentTheme==='light'?'dark':'light')}}}
if(typeof Core.cycleBoard!=='function'){Core.cycleBoard=()=>{const validSkins=['classic','green','azure'];const currentSkin=Core.st?.boardSkin||'classic';const currentIndex=Math.max(0,validSkins.indexOf(currentSkin));const nextSkin=validSkins[(currentIndex+1)%validSkins.length];if(typeof Core.setBoardSkin==='function'){Core.setBoardSkin(nextSkin)}}}
this._addListener(window,'beforeunload',()=>this.cleanup(),{passive:true})},uninstall(){this.cleanup()}};
/* Bölüm sonu --------------------------------------------------------------- */

/* 3 - Auto-installation --------------------------------------------------- */
const installPlugin=()=>{if(window.Queen?.use&&typeof window.Queen.use==='function'){try{window.Queen.use(ThemePlugin);return true}catch(err){console.warn('ThemePlugin installation failed:',err);return false}}return false};if(!installPlugin()){const observer=new MutationObserver(()=>{if(installPlugin()){observer.disconnect()}});if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',()=>{if(!installPlugin()){observer.observe(document,{childList:true,subtree:true})}},{once:true})}else{observer.observe(document,{childList:true,subtree:true})}}window.QueenThemePlugin=ThemePlugin})(window,document);
/* Bölüm sonu --------------------------------------------------------------- */

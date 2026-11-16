/* D15 motion budget: pause every CSS animation (the candle flicker, the engraved flames) while the page is hidden,
   so a backgrounded tab or a Steam Deck in sleep spends nothing on atmosphere. Reduced motion is handled in CSS. */
(function(){
  const h=document.documentElement;
  const sync=()=>h.classList.toggle("paused",document.visibilityState==="hidden");
  document.addEventListener("visibilitychange",sync);
  window.addEventListener("pagehide",()=>h.classList.add("paused"));
  window.addEventListener("pageshow",sync);
  sync();
})();

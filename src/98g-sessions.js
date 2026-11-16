"use strict";
/* Hall and chapter sessions (scopes "hall:<id>" and "chap:<hall>:<i>").
   buildSession (70c-srs.js) builds them natively: every due card in the scope, then new cards in the scope up to the
   daily new limit, two at most per sign, interleaved so the same sign never comes twice in a row. Only the titles live here. */
{const _st=sessionTitle;sessionTitle=function(sys){const s=typeof normScope==="function"?normScope(sys||""):String(sys||"");
  if(s.startsWith("chk:"))return "Re-check · "+sessionTitle(s.slice(4));
  if(s.startsWith("chap:")){const [,h,i]=s.split(":");const c=(typeof OUTLINE!=="undefined"&&OUTLINE[h]||[])[+i];return c?c.t:"No such chapter";}
  if(s.startsWith("hall:")){const h=typeof HALL!=="undefined"&&HALL[s.slice(5)];return h?h.short+" · hall review":"No such hall";}
  return _st(sys);};
 TITLES["practice:session"]=s=>sessionTitle(s);}

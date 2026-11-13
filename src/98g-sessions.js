"use strict";
/* Hall and chapter sessions (scopes "hall:<id>" and "chap:<hall>:<i>"). */
/* sessions can be scoped to a hall */
{const _bs=buildSession;buildSession=function(sys){if(sys&&String(sys).startsWith("chap:")){const [,h,i]=sys.split(":");const keep=chapCardIds(h,+i);
    const q=_bs("all").filter(c=>keep.has(c.id));if(q.length)return q;if(!CARDS)buildCards();return CARDS.filter(c=>keep.has(c.id)&&!Store.s.srs[c.id]).slice(0,12);}if(sys&&String(sys).startsWith("hall:")){const h=sys.slice(5);if(!CARDS)buildCards();
    const keep=new Set(CARDS.filter(c=>cardHall(c)===h).map(c=>c.id));const all=_bs("all");const q=all.filter(c=>keep.has(c.id));
    if(q.length)return q;/* nothing due here: take the first new cards of this hall */
    return CARDS.filter(c=>keep.has(c.id)&&!Store.s.srs[c.id]).slice(0,10);}return _bs(sys);};}
{const _st=sessionTitle;sessionTitle=function(sys){if(sys&&String(sys).startsWith("chap:")){const [,h,i]=sys.split(":");const c=(OUTLINE[h]||[])[+i];return c?c.t:"Chapter";}if(sys&&String(sys).startsWith("hall:")){const h=HALL[sys.slice(5)];return h?h.short+" · hall review":"Hall review";}return _st(sys);};TITLES["practice:session"]=s=>sessionTitle(s);}


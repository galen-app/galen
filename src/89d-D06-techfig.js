"use strict";
/* D06: figures for techniques added in 7.1 (until 89c-tech.js reads t.fig directly). */
if(typeof TECH_FIG!=="undefined"&&typeof TECH!=="undefined")TECH.forEach(t=>{if(t.fig&&typeof FIG!=="undefined"&&FIG[t.fig]&&!TECH_FIG[t.id])TECH_FIG[t.id]=t.fig;});

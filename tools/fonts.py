#!/usr/bin/env python3
"""Subset the theatre fonts (OFL, from github.com/google/fonts) to WOFF and inline them as src/01-fonts.css.
Usage: python3 tools/fonts.py <dir with the downloaded TTFs>

Sources (raw.githubusercontent.com/google/fonts/main/ofl/...):
  cormorantgaramond/CormorantGaramond[wght].ttf, CormorantGaramond-Italic[wght].ttf
  cormorantsc/CormorantSC-Bold.ttf
  imfellenglish/IMFeENrm28P.ttf, IMFeENit28P.ttf
  atkinsonhyperlegible/AtkinsonHyperlegible-{Regular,Bold,Italic}.ttf
  jetbrainsmono/JetBrainsMono[wght].ttf

Changes in 7.1 (D15):
  * keep the lnum/tnum features in the serif faces, so headings and numbers can use lining figures
    (Cormorant's default old-style figures make "S1" and "S2" read like "SI");
  * Atkinson Hyperlegible draws a slashed zero, which in prose reads as the letter Ø ("1ØØ%").
    The zero is redrawn without the slash: the outer contour is kept and the counter is the outer
    contour scaled into the original counter's box. JetBrains Mono (used for codes and tables) keeps its own zero.
"""
import sys, os, base64, io
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates
from fontTools.varLib import instancer
from fontTools import subset
src = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
UNI = "U+0020-007E,U+00A0-017F,U+2010-2027,U+2030-203A,U+2039-203A,U+2190-2193,U+2212,U+2264-2265,U+2248,U+00D7,U+2022,U+2026,U+2766,U+2619,U+2042,U+00B7,U+0370-03FF,U+2160-216F"
JOBS = [  # family, file, weight, style, variable-instance
 ("Cormorant Garamond","CormorantGaramond[wght].ttf",500,"normal",500),
 ("Cormorant Garamond","CormorantGaramond[wght].ttf",700,"normal",700),
 ("Cormorant Garamond","CormorantGaramond-Italic[wght].ttf",500,"italic",500),
 ("Cormorant SC","CormorantSC-Bold.ttf",700,"normal",None),
 ("IM Fell English","IMFeENrm28P.ttf",400,"normal",None),
 ("IM Fell English","IMFeENit28P.ttf",400,"italic",None),
 ("Atkinson Hyperlegible","AtkinsonHyperlegible-Regular.ttf",400,"normal",None),
 ("Atkinson Hyperlegible","AtkinsonHyperlegible-Bold.ttf",700,"normal",None),
 ("Atkinson Hyperlegible","AtkinsonHyperlegible-Italic.ttf",400,"italic",None),
 ("JetBrains Mono","JetBrainsMono[wght].ttf",500,"normal",500),
]
def uni(s):
  out=[]
  for part in s.split(","):
    a=part[2:].split("-");lo=int(a[0],16);hi=int(a[-1],16);out+=range(lo,hi+1)
  return out

def unslash_zero(f):
  """Replace a slashed zero (outer contour + two counters split by the slash) with a plain oval zero."""
  gl=f["glyf"]
  if "zero" not in gl: return
  g=gl["zero"]
  if g.isComposite() or g.numberOfContours!=3: return
  c=list(g.coordinates); e=list(g.endPtsOfContours); fl=list(g.flags)
  outer=c[:e[0]+1]; ofl=fl[:e[0]+1]
  inner=c[e[0]+1:]
  bx=lambda pts:(min(p[0] for p in pts),max(p[0] for p in pts),min(p[1] for p in pts),max(p[1] for p in pts))
  ox0,ox1,oy0,oy1=bx(outer); ix0,ix1,iy0,iy1=bx(inner)
  ocx,ocy=(ox0+ox1)/2,(oy0+oy1)/2; icx,icy=(ix0+ix1)/2,(iy0+iy1)/2
  sx=(ix1-ix0)/(ox1-ox0); sy=(iy1-iy0)/(oy1-oy0)
  counter=[(round(icx+(x-ocx)*sx),round(icy+(y-ocy)*sy)) for x,y in outer][::-1]
  cfl=ofl[::-1]
  g.coordinates=GlyphCoordinates(outer+counter)
  g.flags=bytearray(list(ofl)+list(cfl))
  g.endPtsOfContours=[len(outer)-1,len(outer)+len(counter)-1]
  g.numberOfContours=2
  g.program=type(g.program)() if hasattr(g,"program") else None
  if g.program is not None: g.program.fromBytecode(b"")
  g.recalcBounds(gl)

css=["/* Theatre fonts, OFL, subset by tools/fonts.py. Inlined so the app looks right offline. Atkinson's zero is unslashed (see fonts.py). */"]
total=0
for fam,fn,w,st,inst in JOBS:
  f=TTFont(os.path.join(src,fn))
  if inst is not None and "fvar" in f: f=instancer.instantiateVariableFont(f,{"wght":inst})
  if fam=="Atkinson Hyperlegible": unslash_zero(f)
  opts=subset.Options();opts.flavor="woff"
  opts.layout_features=["kern","liga","onum","pnum","lnum","tnum","smcp","c2sc","dlig","case"] if fam!="JetBrains Mono" else ["kern","tnum"]
  opts.name_IDs=[1,2];opts.notdef_outline=True
  if fam=="JetBrains Mono": u=[c for c in uni("U+0020-007E,U+00B7,U+00D7,U+2212,U+2264-2265,U+2190-2193")]
  elif fam in ("IM Fell English","Cormorant SC"): u=uni("U+0020-007E,U+00B7,U+2018-201D,U+2014,U+2766,U+2619,U+2160-216F,U+00E6,U+0153")
  else: u=uni(UNI)
  s=subset.Subsetter(opts);s.populate(unicodes=u);s.subset(f)
  b=io.BytesIO();f.flavor="woff";f.save(b);data=b.getvalue();total+=len(data)
  css.append('@font-face{font-family:"%s";font-style:%s;font-weight:%d;font-display:swap;src:url(data:font/woff;base64,%s) format("woff")}'%(fam,st,w,base64.b64encode(data).decode()))
  print(fam,w,st,len(data))
open(os.path.join(here,"..","src","01-fonts.css"),"w").write("\n".join(css)+"\n")
print("total",total)

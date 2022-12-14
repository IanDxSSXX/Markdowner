function style(styleString: string) {
    return `<style>${styleString}</style>`
}

// ---- copied everything from css/ folder for shadow dom usage
export const latexStyle = style(`/* section */
h2 {
    counter-reset: subsection;
    font-size: 1.4rem;      /* \\Large */
    font-weight: bold;
    margin-top: 3.5ex;
    margin-bottom: 2.3ex;
}


/* subsection */
h3 {
    font-size: 1.2rem;      /* \\large */
    font-weight: bold;
    margin-top: 3.25ex;
    margin-bottom: 1.5ex;
}


/* subsubsection */
h4 {
    font-size: 1rem;        /* \\normalsize */
    font-weight: bold;
    margin-top: 3.25ex;
    margin-bottom: 1.5ex;
}


:root, :host {
    --size: 10pt;
    --line-height: 1.2;

    /* --linewidth makes no sense here; it is the width of the line in the current environment */

    --paperwidth: 100%;         /* paper is the browser window */

    /* TeX's even/oddsidemargin are not available in CSS, the HtmlGenerator translates the relevant lengths
     * to marginleftwidth, marginrightwidth, and textwidth, as well as marginparwidth - all relative to the paper.
     * So if a fixed width page is desired, simply set --paperwidth to an absolute value.
     */

    --parindent: 1.5em;
    --parskip: 0px;             /* needs to be a length, otherwise calc(2px + var(--parskip)) will return 0 */

    --smallskipamount: 0.3rem;
    --medskipamount: 0.6rem;
    --bigskipamount: 1.2rem;

    --listparindent: 0px;
    --itemindent: 0px;

    --leftmargini: 2.5em;
    --leftmarginii: 2.2em;
    --leftmarginiii: 1.87em;
    --leftmarginiv: 1.7em;
    --leftmarginv: 1em;
    --leftmarginvi: 1em;

    --leftmargin: var(--leftmargini);

    --labelsep: 0.5rem;

    --fboxrule: 0.4pt;
    --fboxsep: 3pt;

    /* multicols */
    --columnwidth: 15pt;

    --columnsep: 35pt;
    --columnseprule: 0pt;
    --columnseprulecolor: black;

    --multicolsep: 12pt;
}


.twocolumn {
    --parindent: 1em;

    --marginparsep: 1rem;

    --leftmargini: 2em;
    --leftmarginv: 0.5em;
    --leftmarginvi: 0.5em;
}


.list {
    --topsep: 0.8rem;
    --parsep: 0.4rem;
    --itemsep: 0.4rem;
    --leftmargin: var(--leftmargini);
}

.list .list {
    --topsep: 0.4rem;
    --parsep: 0.2rem;
    --itemsep: var(--parsep);
    --leftmargin: var(--leftmarginii);
}

.list .list .list {
    --topsep: 0.2rem;
    --parsep: 0;
    --itemsep: var(--topsep);
    --leftmargin: var(--leftmarginiii);
}

.list .list .list .list {
    --topsep: 0;
    --leftmargin: var(--leftmarginiv);
}

.list .list .list .list .list {
    --leftmargin: var(--leftmarginv);
}

.list .list .list .list .list .list {
    --leftmargin: var(--leftmarginvi);
}



/***************/
/* page layout */
/***************/

/* .page is the element when used as a web component */
body, .page {
    display: grid;

    grid-template-columns: [margin-left] var(--marginleftwidth) [body] var(--textwidth) [margin-right] var(--marginrightwidth);
    grid-template-rows: auto;

    margin: 0;
    padding: 0;

    max-width: var(--paperwidth);   /* elements wider than this overflow, but don't increase bodywidth */
    min-width: var(--paperwidth);
}


/* LaTeX page body */
.body {
    grid-column: body;
    grid-row: 1;
}

/* LaTeX page margins */
.margin-left {
    grid-column: margin-left;
    grid-row: 1;
    justify-self: end;

    display: flex;
}

.margin-right {
    grid-column: margin-right;
    grid-row: 1;
    justify-self: start;

    display: flex;
}

.marginpar {
    width: var(--marginparwidth);           /* ideally in percent relative to margin */
    min-width: var(--marginparwidth);       /* min-width if in grid/flex container, to force this width */

    margin-left: var(--marginparsep);
    margin-right: var(--marginparsep);
}

.marginpar > * {
    padding-bottom: var(--marginparpush);   /* use padding, which is included in offsetHeight, margin is not */
}


/* columns */
.onecolumn {
    column-count: 1;
}

.twocolumn {
    column-count: 2;
}

.multicols {
    margin-top: var(--multicolsep);
    margin-bottom: var(--multicolsep);

    column-gap: var(--columnsep);
    column-rule: var(--columnseprule) solid var(--columnseprulecolor);
    column-fill: balance;
}

.span-cols {
    column-span: all;
}


/*********/
/* fonts */
/*********/

html, .page {
    font-family: "Computer Modern Serif", serif;
    font-size: var(--size);

    text-align: justify;
    line-height: var(--line-height);
    hyphens: manual;
}

.katex {
    font-size: 1em !important;
}

.katex,
.katex .mainrm,
.katex .mathit,
.katex .mathbf {
    font-family: "Computer Modern Serif" !important;  /* for KaTeX_Main */
}

.katex .mathdefault,
.katex .boldsymbol {
    font-family: "Computer Modern Serif" !important;  /* for KaTeX_Math */
}

.katex .mathsf,
.katex .textsf,
.katex .mathboldsf,
.katex .textboldsf,
.katex .mathitsf,
.katex .textitsf {
    font-family: "Computer Modern Sans" !important;  /* for KaTeX_SansSerif */
}



/* family */
.rm {
    font-family: "Computer Modern Serif", serif;
    font-variant-ligatures: normal;
}
.sf {
    font-family: "Computer Modern Sans", sans-serif;
    font-variant-ligatures: normal;
}
.tt {
    font-family: "Computer Modern Typewriter", monospace;
    font-variant-ligatures: none;
}

/* weight */
.md {
    font-weight: normal;
}

.bf {
    font-weight: bold;
}

/* shape - LaTeX doesn't support slanted small-caps by default */
.up {
    font-family: "Computer Modern Serif", serif;
    font-style: normal;
    font-variant-caps: normal;
}

.it {
    font-style: italic;
    font-variant-caps: normal;
}

.sl {
    font-family: "Computer Modern Serif Slanted";
    font-style: oblique;
    font-variant-caps: normal;
}

.sf.sl {
    font-family: "Computer Modern Sans", sans-serif;
    font-style: oblique;
    font-variant-caps: normal;
}

.tt.sl {
    font-family: "Computer Modern Typewriter Slanted", monospace;
    font-style: oblique;
    font-variant-caps: normal;
}

.sc {
    font-family: "Computer Modern Serif", serif;
    font-style: normal;
    font-variant-caps: small-caps;
}




/* size */

.tiny {
    font-size: .5rem;
}

.scriptsize {
    font-size: .7rem;
}

.footnotesize {
    font-size: .82rem;
}

.small {
    font-size: .91rem;
}

.normalsize {
    font-size: 1rem;
}

.large {
    font-size: 1.2rem;
}

.Large {
    font-size: 1.4rem;
}

.LARGE {
    font-size: 1.7rem;
}

.huge {
    font-size: 2rem;
}

.Huge {
    font-size: 2.5rem;
}




/**************/
/* sectioning */
/**************/

h1, h2, h3, h4 {
    /* \\normalfont */
    font-family: "Computer Modern Serif", serif;
    font-style: normal;
    font-variant-caps: normal;

    text-align: left;
}


.titlepage {
    height: 100vh;
    min-height: 20rem;
}

.title {
    font-size: 1.7rem;  /* LARGE */
}

.author, .date {
    font-size: 1.2rem;  /* large */
}



/*************/
/* alignment */
/*************/

.centering, .list.center {
    text-indent: 0;
    text-align: center;
}

.raggedright, .list.flushleft {
    text-indent: 0;
    text-align: left;
}

.raggedleft, .list.flushright {
    text-indent: 0;
    text-align: right;
}


/* alignment environments are lists (trivlist), so margin has to be removed */

.list.center, .list.flushleft, .list.flushright {
    margin-left: 0 !important;
}

/* a list on its own justifies */
.list {
    text-align: justify;
}



/*********/
/* boxes */
/*********/


.hbox {
    display: inline-block;
    white-space: nowrap;
    text-indent: 0;
}

.phantom {
    visibility: hidden;
}


.llap {
    display: inline-flex;
    flex-direction: column;
    width: 0;
    align-items: flex-end;
}

.clap {
    display: inline-flex;
    flex-direction: column;
    width: 0;
    align-items: center;
}

.rlap {
    display: inline-block;
    width: 0;
}


.stretch {
    display: inline-flex;
    flex-direction: row;

    justify-content: stretch;
    align-items: stretch;
}

.smash {
    display: inline-flex;
    flex-direction: row;
    height: 0px;
    align-items: flex-end;
}


/* a class to align text to the baseline, and a class to locate the baseline */

.align-baseline {
    line-height: 0;
}

.align-baseline::after {
    content: '';
    display: inline-block;
}

.mpbaseline {
    line-height: 0;
    width: 0;
    height: 0;
    display: inline-block;
}

/* parbox/minipage */

.parbox {
    display: inline-block;
    text-indent: 0;
}

/* pos: t (top) */
.p-t {
    display: inline-flex;
}

/* pos: c (center) */
.p-c {
    vertical-align: middle;
}

/* pos: b (bottom) */
.p-b {
    /* default */
    vertical-align: baseline;       /* TODO: what if llap inside?? */
}



/* if we want a fixed height *and* bottom alignment */
.pbh.p-b {
    vertical-align: text-bottom;
}


/* the following are only possible if height was given, too */

.p-t.p-ct {
    vertical-align: baseline;
}

.p-t.p-cc {
    vertical-align: text-top;
    align-items: center;
}

/* pos: top, inner-pos: bottom */
.p-t.p-cb {
    vertical-align: text-top;
    display: inline-flex;
    align-items: flex-end;
}

/* pos and inner-pos: center */
.p-c.p-cc {
    display: inline-flex;
    align-items: center;
}

.p-c.p-cb {
    display: inline-flex;
    align-items: flex-end;
}


.p-b.p-ct {
    display: inline-flex;
    align-items: flex-start;
}

.p-b.p-cc {
    display: inline-flex;
    align-items: center;
}

/* pos: bottom, inner-pos: bottom */
.p-b.p-cb {
    vertical-align: baseline;
    display: inline-flex;
    align-items: flex-end;
}

.p-b.p-cb::before {
    /* move the baseline to the bottom of a flex item */
    content: "x";
    display: inline-block;
    width: 0;
    visibility: hidden;
}




.underline {
    border-bottom: 0.4pt solid;
    line-height: 1;
}


.frame {
    padding: var(--fboxsep);
    border: var(--fboxrule) solid;
    margin-top: 2px;
    margin-bottom: 2px;
}


/****************/
/* environments */
/****************/

.pframe {
    border-style: solid;
}

.picture {
    display: inline-block;  /* so that it can be given a fixed size */
    position: relative;
    vertical-align: bottom; /* needed for \\put */
    text-indent: 0;         /* pictures in a paragraph still should not have indentation */
    /* width: 0; */
}

/* the coordinate system of the picture */
.picture-canvas {
    display: flex;
    align-items: flex-end;
    position: absolute;
    left: 0;
    bottom: 0;
}

/* cannot do this, it pushes the whole picture up by the depth of the font :(
.picture-canvas > .hbox::after {
    content: "";
    display: inline;
}
*/


/* objects in a picture */
.put-obj {
    display: block;
    position: relative;
    line-height: 0;
    /* width: 0; */         /* picture objects only have a height, but we cannot set the
                               width to 0 directly because it breaks vertical baseline alignment of text */
}

/* make text align on the baseline in \\put - needs line-height: 0 in .put-obj! */
.put-obj:after {
    content: '';
    display: inline-block;
}


.strut {
    display: block;
}

.picture-object {
    position: absolute;
    display: flex;          /* to align text and boxes at the bottom */
                            /* line-height: 0px; works for boxes, but breaks text */
}


/**********/
/* macros */
/**********/

code {
    white-space: pre;
}


/**********/
/* spaces */
/**********/

/* reset */
p, ul, ol, dl, div {
    margin: 0;
    padding: 0;
}

p {
    margin-top: var(--parskip);
    text-indent: var(--parindent);
}


h1 + p, h1 + * p:first-child,
h2 + p, h2 + * p:first-child,
h3 + p, h3 + * p:first-child,
h4 + p, h4 + * p:first-child,
.noindent,
.continue {
    text-indent: 0;
}




/* predefined horizontal spaces */
.negthinspace {
    margin-left: -0.16666667em;
}


/* vertical space - insert the actual space (negative or positive) with margin-bottom */
.vspace {
    display: block;
}

/* vertical space that forces a linebreak */
.breakspace {
    display: table;
}

/* inline vertical space - this cannot be negative */
.vspace-inline {
    display: inline-block;
    height: calc(1em * var(--line-height));     /* full maximum height, including the leading: line-height * font-size */
    vertical-align: top;                        /* if bottom is used, space could be inserted above this line of text */
}


/* predefined vertical spaces */
.smallskip {
    margin-bottom: var(--smallskipamount);
}

.medskip {
    margin-bottom: var(--medskipamount);
}

.bigskip {
    margin-bottom: var(--bigskipamount);
}


/****************/
/* environments */
/****************/


/* lists */

.list {
    margin: calc(var(--topsep) + var(--parskip)) 0;
    margin-left: var(--leftmargin);
}

.list p:first-of-type {
    text-indent: var(--itemindent);
}

.list p + p {
    margin-top: var(--parsep);
    text-indent: var(--listparindent);
}

.list li + li,
.list dd + dt {
    margin-top: calc(var(--itemsep) + var(--parsep));
}


/* labels */

li {
    list-style: none;
}

/* label should be next to the item, so the first element after the label needs to be inline */
.itemlabel + * {
    display: inline;
}

.itemlabel > * {
    position: relative;
    right: var(--labelsep);
}




/* description */

dd, dd > p:first-child {
    display: inline;
}

/* start a new line after dd and before dt */
dd::after {
    content: "";
    display: block;
}


dt {
    display: inline-block;
    font-weight: bold;
}

.list dt {
    margin-left: calc(-1 * var(--leftmargin));
}

dd {
    margin-left: var(--labelsep);
}



/* quote, quotation, verse */

.quote, .quotation, .verse {
    margin-left: var(--leftmargin);
    margin-right: var(--leftmargin);
}

.quotation {
    --parsep: 0px;
    --itemindent: 1.5em;
    --listparindent: var(--itemindent);
}

.verse {
    text-align: left;

    margin-left: calc(1.5em + var(--leftmargin));
    --itemindent: -1.5em;
    --listparindent: var(--itemindent);
}





/* the TeX and LaTeX logos */

span.tex,
span.latex {
    text-transform: uppercase;
}

span.latex > .a {
    font-size: 0.8em;
    vertical-align: 0.2em;
    margin-left:  -0.45em;
    margin-right: -0.15em;
}

span.tex > .e,
span.latex > .e {
    margin-left: -0.2em;
    margin-right: -0.2em;
    position: relative;
    top: 0.45ex;
}

@font-face {
\tfont-family: 'Computer Modern Sans';
\tsrc: url('cmunss.woff') format('woff');
\tfont-weight: normal;
\tfont-style: normal;
}


@font-face {
\tfont-family: 'Computer Modern Sans';
\tsrc: url('cmunsx.woff') format('woff');
\tfont-weight: bold;
\tfont-style: normal;
}


@font-face {
\tfont-family: 'Computer Modern Sans';
\tsrc: url('cmunsi.woff') format('woff');
\tfont-weight: normal;
\tfont-style: italic;
}


@font-face {
\tfont-family: 'Computer Modern Sans';
\tsrc: url('cmunso.woff') format('woff');
\tfont-weight: bold;
\tfont-style: oblique;
}

@font-face {
\tfont-family: 'Computer Modern Serif';
\tsrc: url('cmunrm.woff') format('woff');
\tfont-weight: normal;
\tfont-style: normal;
}


@font-face {
\tfont-family: 'Computer Modern Serif';
\tsrc: url('cmunbx.woff') format('woff');
\tfont-weight: bold;
\tfont-style: normal;
}


@font-face {
\tfont-family: 'Computer Modern Serif';
\tsrc: url('cmunti.woff') format('woff');
\tfont-weight: normal;
\tfont-style: italic;
}


@font-face {
\tfont-family: 'Computer Modern Serif';
\tsrc: url('cmunbi.woff') format('woff');
\tfont-weight: bold;
\tfont-style: italic;
}

@font-face {
\tfont-family: 'Computer Modern Serif Slanted';
\tsrc: url('cmunsl.woff') format('woff');
\tfont-weight: normal;
\tfont-style: normal;
}


@font-face {
\tfont-family: 'Computer Modern Serif Slanted';
\tsrc: url('cmunbl.woff') format('woff');
\tfont-weight: bold;
\tfont-style: normal;
}

@font-face {
\tfont-family: 'Computer Modern Typewriter';
\tsrc: url('cmuntt.woff') format('woff');
\tfont-weight: normal;
\tfont-style: normal;
}


@font-face {
\tfont-family: 'Computer Modern Typewriter';
\tsrc: url('cmuntb.woff') format('woff');
\tfont-weight: bold;
\tfont-style: normal;
}


@font-face {
\tfont-family: 'Computer Modern Typewriter';
\tsrc: url('cmunit.woff') format('woff');
\tfont-weight: normal;
\tfont-style: italic;
}


@font-face {
\tfont-family: 'Computer Modern Typewriter';
\tsrc: url('cmuntx.woff') format('woff');
\tfont-weight: bold;
\tfont-style: italic;
}

@font-face {
\tfont-family: 'Computer Modern Typewriter Slanted';
\tsrc: url('cmunst.woff') format('woff');
\tfont-weight: normal;
\tfont-style: oblique;
}

/* stylelint-disable font-family-no-missing-generic-family-keyword */
@font-face {
  font-family: 'KaTeX_AMS';
  src: url('../fonts/KaTeX_AMS-Regular.woff') format('woff');
  font-weight: normal;
  font-style: normal;
}
@font-face {
  font-family: 'KaTeX_Caligraphic';
  src: url('../fonts/KaTeX_Caligraphic-Bold.woff') format('woff');
  font-weight: bold;
  font-style: normal;
}
@font-face {
  font-family: 'KaTeX_Caligraphic';
  src: url('../fonts/KaTeX_Caligraphic-Regular.woff') format('woff');
  font-weight: normal;
  font-style: normal;
}
@font-face {
  font-family: 'KaTeX_Fraktur';
  src: url('../fonts/KaTeX_Fraktur-Bold.woff') format('woff');
  font-weight: bold;
  font-style: normal;
}
@font-face {
  font-family: 'KaTeX_Fraktur';
  src: url('../fonts/KaTeX_Fraktur-Regular.woff') format('woff');
  font-weight: normal;
  font-style: normal;
}
@font-face {
  font-family: 'KaTeX_Main';
  src: url('../fonts/KaTeX_Main-Bold.woff') format('woff');
  font-weight: bold;
  font-style: normal;
}
@font-face {
  font-family: 'KaTeX_Main';
  src: url('../fonts/KaTeX_Main-BoldItalic.woff') format('woff');
  font-weight: bold;
  font-style: italic;
}
@font-face {
  font-family: 'KaTeX_Main';
  src: url('../fonts/KaTeX_Main-Italic.woff') format('woff');
  font-weight: normal;
  font-style: italic;
}
@font-face {
  font-family: 'KaTeX_Main';
  src: url('../fonts/KaTeX_Main-Regular.woff') format('woff');
  font-weight: normal;
  font-style: normal;
}
@font-face {
  font-family: 'KaTeX_Math';
  src: url('../fonts/KaTeX_Math-BoldItalic.woff') format('woff');
  font-weight: bold;
  font-style: italic;
}
@font-face {
  font-family: 'KaTeX_Math';
  src: url('../fonts/KaTeX_Math-Italic.woff') format('woff');
  font-weight: normal;
  font-style: italic;
}
@font-face {
  font-family: 'KaTeX_SansSerif';
  src: url('../fonts/KaTeX_SansSerif-Bold.woff') format('woff');
  font-weight: bold;
  font-style: normal;
}
@font-face {
  font-family: 'KaTeX_SansSerif';
  src: url('../fonts/KaTeX_SansSerif-Italic.woff') format('woff');
  font-weight: normal;
  font-style: italic;
}
@font-face {
  font-family: 'KaTeX_SansSerif';
  src: url('../fonts/KaTeX_SansSerif-Regular.woff') format('woff');
  font-weight: normal;
  font-style: normal;
}
@font-face {
  font-family: 'KaTeX_Script';
  src: url('../fonts/KaTeX_Script-Regular.woff') format('woff');
  font-weight: normal;
  font-style: normal;
}
@font-face {
  font-family: 'KaTeX_Size1';
  src: url('../fonts/KaTeX_Size1-Regular.woff') format('woff');
  font-weight: normal;
  font-style: normal;
}
@font-face {
  font-family: 'KaTeX_Size2';
  src: url('../fonts/KaTeX_Size2-Regular.woff') format('woff');
  font-weight: normal;
  font-style: normal;
}
@font-face {
  font-family: 'KaTeX_Size3';
  src: url('../fonts/KaTeX_Size3-Regular.woff') format('woff');
  font-weight: normal;
  font-style: normal;
}
@font-face {
  font-family: 'KaTeX_Size4';
  src: url('../fonts/KaTeX_Size4-Regular.woff') format('woff');
  font-weight: normal;
  font-style: normal;
}
@font-face {
  font-family: 'KaTeX_Typewriter';
  src: url('../fonts/KaTeX_Typewriter-Regular.woff') format('woff');
  font-weight: normal;
  font-style: normal;
}
.katex {
  font: normal 1.21em KaTeX_Main, Times New Roman, serif;
  line-height: 1.2;
  text-indent: 0;
  text-rendering: auto;
}
.katex * {
  -ms-high-contrast-adjust: none !important;
}
.katex .katex-mathml {
  position: absolute;
  clip: rect(1px, 1px, 1px, 1px);
  padding: 0;
  border: 0;
  height: 1px;
  width: 1px;
  overflow: hidden;
}
.katex .katex-html {
  /* \\newline is an empty block at top level, between .base elements */
}
.katex .katex-html > .newline {
  display: block;
}
.katex .base {
  position: relative;
  display: inline-block;
  white-space: nowrap;
  width: min-content;
}
.katex .strut {
  display: inline-block;
}
.katex .textbf {
  font-weight: bold;
}
.katex .textit {
  font-style: italic;
}
.katex .textrm {
  font-family: KaTeX_Main;
}
.katex .textsf {
  font-family: KaTeX_SansSerif;
}
.katex .texttt {
  font-family: KaTeX_Typewriter;
}
.katex .mathdefault {
  font-family: KaTeX_Math;
  font-style: italic;
}
.katex .mathit {
  font-family: KaTeX_Main;
  font-style: italic;
}
.katex .mathrm {
  font-style: normal;
}
.katex .mathbf {
  font-family: KaTeX_Main;
  font-weight: bold;
}
.katex .boldsymbol {
  font-family: KaTeX_Math;
  font-weight: bold;
  font-style: italic;
}
.katex .amsrm {
  font-family: KaTeX_AMS;
}
.katex .mathbb,
.katex .textbb {
  font-family: KaTeX_AMS;
}
.katex .mathcal {
  font-family: KaTeX_Caligraphic;
}
.katex .mathfrak,
.katex .textfrak {
  font-family: KaTeX_Fraktur;
}
.katex .mathtt {
  font-family: KaTeX_Typewriter;
}
.katex .mathscr,
.katex .textscr {
  font-family: KaTeX_Script;
}
.katex .mathsf,
.katex .textsf {
  font-family: KaTeX_SansSerif;
}
.katex .mathboldsf,
.katex .textboldsf {
  font-family: KaTeX_SansSerif;
  font-weight: bold;
}
.katex .mathitsf,
.katex .textitsf {
  font-family: KaTeX_SansSerif;
  font-style: italic;
}
.katex .mainrm {
  font-family: KaTeX_Main;
  font-style: normal;
}
.katex .vlist-t {
  display: inline-table;
  table-layout: fixed;
}
.katex .vlist-r {
  display: table-row;
}
.katex .vlist {
  display: table-cell;
  vertical-align: bottom;
  position: relative;
}
.katex .vlist > span {
  display: block;
  height: 0;
  position: relative;
}
.katex .vlist > span > span {
  display: inline-block;
}
.katex .vlist > span > .pstrut {
  overflow: hidden;
  width: 0;
}
.katex .vlist-t2 {
  margin-right: -2px;
}
.katex .vlist-s {
  display: table-cell;
  vertical-align: bottom;
  font-size: 1px;
  width: 2px;
  min-width: 2px;
}
.katex .msupsub {
  text-align: left;
}
.katex .mfrac > span > span {
  text-align: center;
}
.katex .mfrac .frac-line {
  display: inline-block;
  width: 100%;
  border-bottom-style: solid;
}
.katex .mfrac .frac-line,
.katex .overline .overline-line,
.katex .underline .underline-line,
.katex .hline,
.katex .hdashline,
.katex .rule {
  min-height: 1px;
}
.katex .mspace {
  display: inline-block;
}
.katex .llap,
.katex .rlap,
.katex .clap {
  width: 0;
  position: relative;
}
.katex .llap > .inner,
.katex .rlap > .inner,
.katex .clap > .inner {
  position: absolute;
}
.katex .llap > .fix,
.katex .rlap > .fix,
.katex .clap > .fix {
  display: inline-block;
}
.katex .llap > .inner {
  right: 0;
}
.katex .rlap > .inner,
.katex .clap > .inner {
  left: 0;
}
.katex .clap > .inner > span {
  margin-left: -50%;
  margin-right: 50%;
}
.katex .rule {
  display: inline-block;
  border: solid 0;
  position: relative;
}
.katex .overline .overline-line,
.katex .underline .underline-line,
.katex .hline {
  display: inline-block;
  width: 100%;
  border-bottom-style: solid;
}
.katex .hdashline {
  display: inline-block;
  width: 100%;
  border-bottom-style: dashed;
}
.katex .sqrt > .root {
  margin-left: 0.27777778em;
  margin-right: -0.55555556em;
}
.katex .sizing,
.katex .fontsize-ensurer {
  display: inline-block;
}
.katex .sizing.reset-size1.size1,
.katex .fontsize-ensurer.reset-size1.size1 {
  font-size: 1em;
}
.katex .sizing.reset-size1.size2,
.katex .fontsize-ensurer.reset-size1.size2 {
  font-size: 1.2em;
}
.katex .sizing.reset-size1.size3,
.katex .fontsize-ensurer.reset-size1.size3 {
  font-size: 1.4em;
}
.katex .sizing.reset-size1.size4,
.katex .fontsize-ensurer.reset-size1.size4 {
  font-size: 1.6em;
}
.katex .sizing.reset-size1.size5,
.katex .fontsize-ensurer.reset-size1.size5 {
  font-size: 1.8em;
}
.katex .sizing.reset-size1.size6,
.katex .fontsize-ensurer.reset-size1.size6 {
  font-size: 2em;
}
.katex .sizing.reset-size1.size7,
.katex .fontsize-ensurer.reset-size1.size7 {
  font-size: 2.4em;
}
.katex .sizing.reset-size1.size8,
.katex .fontsize-ensurer.reset-size1.size8 {
  font-size: 2.88em;
}
.katex .sizing.reset-size1.size9,
.katex .fontsize-ensurer.reset-size1.size9 {
  font-size: 3.456em;
}
.katex .sizing.reset-size1.size10,
.katex .fontsize-ensurer.reset-size1.size10 {
  font-size: 4.148em;
}
.katex .sizing.reset-size1.size11,
.katex .fontsize-ensurer.reset-size1.size11 {
  font-size: 4.976em;
}
.katex .sizing.reset-size2.size1,
.katex .fontsize-ensurer.reset-size2.size1 {
  font-size: 0.83333333em;
}
.katex .sizing.reset-size2.size2,
.katex .fontsize-ensurer.reset-size2.size2 {
  font-size: 1em;
}
.katex .sizing.reset-size2.size3,
.katex .fontsize-ensurer.reset-size2.size3 {
  font-size: 1.16666667em;
}
.katex .sizing.reset-size2.size4,
.katex .fontsize-ensurer.reset-size2.size4 {
  font-size: 1.33333333em;
}
.katex .sizing.reset-size2.size5,
.katex .fontsize-ensurer.reset-size2.size5 {
  font-size: 1.5em;
}
.katex .sizing.reset-size2.size6,
.katex .fontsize-ensurer.reset-size2.size6 {
  font-size: 1.66666667em;
}
.katex .sizing.reset-size2.size7,
.katex .fontsize-ensurer.reset-size2.size7 {
  font-size: 2em;
}
.katex .sizing.reset-size2.size8,
.katex .fontsize-ensurer.reset-size2.size8 {
  font-size: 2.4em;
}
.katex .sizing.reset-size2.size9,
.katex .fontsize-ensurer.reset-size2.size9 {
  font-size: 2.88em;
}
.katex .sizing.reset-size2.size10,
.katex .fontsize-ensurer.reset-size2.size10 {
  font-size: 3.45666667em;
}
.katex .sizing.reset-size2.size11,
.katex .fontsize-ensurer.reset-size2.size11 {
  font-size: 4.14666667em;
}
.katex .sizing.reset-size3.size1,
.katex .fontsize-ensurer.reset-size3.size1 {
  font-size: 0.71428571em;
}
.katex .sizing.reset-size3.size2,
.katex .fontsize-ensurer.reset-size3.size2 {
  font-size: 0.85714286em;
}
.katex .sizing.reset-size3.size3,
.katex .fontsize-ensurer.reset-size3.size3 {
  font-size: 1em;
}
.katex .sizing.reset-size3.size4,
.katex .fontsize-ensurer.reset-size3.size4 {
  font-size: 1.14285714em;
}
.katex .sizing.reset-size3.size5,
.katex .fontsize-ensurer.reset-size3.size5 {
  font-size: 1.28571429em;
}
.katex .sizing.reset-size3.size6,
.katex .fontsize-ensurer.reset-size3.size6 {
  font-size: 1.42857143em;
}
.katex .sizing.reset-size3.size7,
.katex .fontsize-ensurer.reset-size3.size7 {
  font-size: 1.71428571em;
}
.katex .sizing.reset-size3.size8,
.katex .fontsize-ensurer.reset-size3.size8 {
  font-size: 2.05714286em;
}
.katex .sizing.reset-size3.size9,
.katex .fontsize-ensurer.reset-size3.size9 {
  font-size: 2.46857143em;
}
.katex .sizing.reset-size3.size10,
.katex .fontsize-ensurer.reset-size3.size10 {
  font-size: 2.96285714em;
}
.katex .sizing.reset-size3.size11,
.katex .fontsize-ensurer.reset-size3.size11 {
  font-size: 3.55428571em;
}
.katex .sizing.reset-size4.size1,
.katex .fontsize-ensurer.reset-size4.size1 {
  font-size: 0.625em;
}
.katex .sizing.reset-size4.size2,
.katex .fontsize-ensurer.reset-size4.size2 {
  font-size: 0.75em;
}
.katex .sizing.reset-size4.size3,
.katex .fontsize-ensurer.reset-size4.size3 {
  font-size: 0.875em;
}
.katex .sizing.reset-size4.size4,
.katex .fontsize-ensurer.reset-size4.size4 {
  font-size: 1em;
}
.katex .sizing.reset-size4.size5,
.katex .fontsize-ensurer.reset-size4.size5 {
  font-size: 1.125em;
}
.katex .sizing.reset-size4.size6,
.katex .fontsize-ensurer.reset-size4.size6 {
  font-size: 1.25em;
}
.katex .sizing.reset-size4.size7,
.katex .fontsize-ensurer.reset-size4.size7 {
  font-size: 1.5em;
}
.katex .sizing.reset-size4.size8,
.katex .fontsize-ensurer.reset-size4.size8 {
  font-size: 1.8em;
}
.katex .sizing.reset-size4.size9,
.katex .fontsize-ensurer.reset-size4.size9 {
  font-size: 2.16em;
}
.katex .sizing.reset-size4.size10,
.katex .fontsize-ensurer.reset-size4.size10 {
  font-size: 2.5925em;
}
.katex .sizing.reset-size4.size11,
.katex .fontsize-ensurer.reset-size4.size11 {
  font-size: 3.11em;
}
.katex .sizing.reset-size5.size1,
.katex .fontsize-ensurer.reset-size5.size1 {
  font-size: 0.55555556em;
}
.katex .sizing.reset-size5.size2,
.katex .fontsize-ensurer.reset-size5.size2 {
  font-size: 0.66666667em;
}
.katex .sizing.reset-size5.size3,
.katex .fontsize-ensurer.reset-size5.size3 {
  font-size: 0.77777778em;
}
.katex .sizing.reset-size5.size4,
.katex .fontsize-ensurer.reset-size5.size4 {
  font-size: 0.88888889em;
}
.katex .sizing.reset-size5.size5,
.katex .fontsize-ensurer.reset-size5.size5 {
  font-size: 1em;
}
.katex .sizing.reset-size5.size6,
.katex .fontsize-ensurer.reset-size5.size6 {
  font-size: 1.11111111em;
}
.katex .sizing.reset-size5.size7,
.katex .fontsize-ensurer.reset-size5.size7 {
  font-size: 1.33333333em;
}
.katex .sizing.reset-size5.size8,
.katex .fontsize-ensurer.reset-size5.size8 {
  font-size: 1.6em;
}
.katex .sizing.reset-size5.size9,
.katex .fontsize-ensurer.reset-size5.size9 {
  font-size: 1.92em;
}
.katex .sizing.reset-size5.size10,
.katex .fontsize-ensurer.reset-size5.size10 {
  font-size: 2.30444444em;
}
.katex .sizing.reset-size5.size11,
.katex .fontsize-ensurer.reset-size5.size11 {
  font-size: 2.76444444em;
}
.katex .sizing.reset-size6.size1,
.katex .fontsize-ensurer.reset-size6.size1 {
  font-size: 0.5em;
}
.katex .sizing.reset-size6.size2,
.katex .fontsize-ensurer.reset-size6.size2 {
  font-size: 0.6em;
}
.katex .sizing.reset-size6.size3,
.katex .fontsize-ensurer.reset-size6.size3 {
  font-size: 0.7em;
}
.katex .sizing.reset-size6.size4,
.katex .fontsize-ensurer.reset-size6.size4 {
  font-size: 0.8em;
}
.katex .sizing.reset-size6.size5,
.katex .fontsize-ensurer.reset-size6.size5 {
  font-size: 0.9em;
}
.katex .sizing.reset-size6.size6,
.katex .fontsize-ensurer.reset-size6.size6 {
  font-size: 1em;
}
.katex .sizing.reset-size6.size7,
.katex .fontsize-ensurer.reset-size6.size7 {
  font-size: 1.2em;
}
.katex .sizing.reset-size6.size8,
.katex .fontsize-ensurer.reset-size6.size8 {
  font-size: 1.44em;
}
.katex .sizing.reset-size6.size9,
.katex .fontsize-ensurer.reset-size6.size9 {
  font-size: 1.728em;
}
.katex .sizing.reset-size6.size10,
.katex .fontsize-ensurer.reset-size6.size10 {
  font-size: 2.074em;
}
.katex .sizing.reset-size6.size11,
.katex .fontsize-ensurer.reset-size6.size11 {
  font-size: 2.488em;
}
.katex .sizing.reset-size7.size1,
.katex .fontsize-ensurer.reset-size7.size1 {
  font-size: 0.41666667em;
}
.katex .sizing.reset-size7.size2,
.katex .fontsize-ensurer.reset-size7.size2 {
  font-size: 0.5em;
}
.katex .sizing.reset-size7.size3,
.katex .fontsize-ensurer.reset-size7.size3 {
  font-size: 0.58333333em;
}
.katex .sizing.reset-size7.size4,
.katex .fontsize-ensurer.reset-size7.size4 {
  font-size: 0.66666667em;
}
.katex .sizing.reset-size7.size5,
.katex .fontsize-ensurer.reset-size7.size5 {
  font-size: 0.75em;
}
.katex .sizing.reset-size7.size6,
.katex .fontsize-ensurer.reset-size7.size6 {
  font-size: 0.83333333em;
}
.katex .sizing.reset-size7.size7,
.katex .fontsize-ensurer.reset-size7.size7 {
  font-size: 1em;
}
.katex .sizing.reset-size7.size8,
.katex .fontsize-ensurer.reset-size7.size8 {
  font-size: 1.2em;
}
.katex .sizing.reset-size7.size9,
.katex .fontsize-ensurer.reset-size7.size9 {
  font-size: 1.44em;
}
.katex .sizing.reset-size7.size10,
.katex .fontsize-ensurer.reset-size7.size10 {
  font-size: 1.72833333em;
}
.katex .sizing.reset-size7.size11,
.katex .fontsize-ensurer.reset-size7.size11 {
  font-size: 2.07333333em;
}
.katex .sizing.reset-size8.size1,
.katex .fontsize-ensurer.reset-size8.size1 {
  font-size: 0.34722222em;
}
.katex .sizing.reset-size8.size2,
.katex .fontsize-ensurer.reset-size8.size2 {
  font-size: 0.41666667em;
}
.katex .sizing.reset-size8.size3,
.katex .fontsize-ensurer.reset-size8.size3 {
  font-size: 0.48611111em;
}
.katex .sizing.reset-size8.size4,
.katex .fontsize-ensurer.reset-size8.size4 {
  font-size: 0.55555556em;
}
.katex .sizing.reset-size8.size5,
.katex .fontsize-ensurer.reset-size8.size5 {
  font-size: 0.625em;
}
.katex .sizing.reset-size8.size6,
.katex .fontsize-ensurer.reset-size8.size6 {
  font-size: 0.69444444em;
}
.katex .sizing.reset-size8.size7,
.katex .fontsize-ensurer.reset-size8.size7 {
  font-size: 0.83333333em;
}
.katex .sizing.reset-size8.size8,
.katex .fontsize-ensurer.reset-size8.size8 {
  font-size: 1em;
}
.katex .sizing.reset-size8.size9,
.katex .fontsize-ensurer.reset-size8.size9 {
  font-size: 1.2em;
}
.katex .sizing.reset-size8.size10,
.katex .fontsize-ensurer.reset-size8.size10 {
  font-size: 1.44027778em;
}
.katex .sizing.reset-size8.size11,
.katex .fontsize-ensurer.reset-size8.size11 {
  font-size: 1.72777778em;
}
.katex .sizing.reset-size9.size1,
.katex .fontsize-ensurer.reset-size9.size1 {
  font-size: 0.28935185em;
}
.katex .sizing.reset-size9.size2,
.katex .fontsize-ensurer.reset-size9.size2 {
  font-size: 0.34722222em;
}
.katex .sizing.reset-size9.size3,
.katex .fontsize-ensurer.reset-size9.size3 {
  font-size: 0.40509259em;
}
.katex .sizing.reset-size9.size4,
.katex .fontsize-ensurer.reset-size9.size4 {
  font-size: 0.46296296em;
}
.katex .sizing.reset-size9.size5,
.katex .fontsize-ensurer.reset-size9.size5 {
  font-size: 0.52083333em;
}
.katex .sizing.reset-size9.size6,
.katex .fontsize-ensurer.reset-size9.size6 {
  font-size: 0.5787037em;
}
.katex .sizing.reset-size9.size7,
.katex .fontsize-ensurer.reset-size9.size7 {
  font-size: 0.69444444em;
}
.katex .sizing.reset-size9.size8,
.katex .fontsize-ensurer.reset-size9.size8 {
  font-size: 0.83333333em;
}
.katex .sizing.reset-size9.size9,
.katex .fontsize-ensurer.reset-size9.size9 {
  font-size: 1em;
}
.katex .sizing.reset-size9.size10,
.katex .fontsize-ensurer.reset-size9.size10 {
  font-size: 1.20023148em;
}
.katex .sizing.reset-size9.size11,
.katex .fontsize-ensurer.reset-size9.size11 {
  font-size: 1.43981481em;
}
.katex .sizing.reset-size10.size1,
.katex .fontsize-ensurer.reset-size10.size1 {
  font-size: 0.24108004em;
}
.katex .sizing.reset-size10.size2,
.katex .fontsize-ensurer.reset-size10.size2 {
  font-size: 0.28929605em;
}
.katex .sizing.reset-size10.size3,
.katex .fontsize-ensurer.reset-size10.size3 {
  font-size: 0.33751205em;
}
.katex .sizing.reset-size10.size4,
.katex .fontsize-ensurer.reset-size10.size4 {
  font-size: 0.38572806em;
}
.katex .sizing.reset-size10.size5,
.katex .fontsize-ensurer.reset-size10.size5 {
  font-size: 0.43394407em;
}
.katex .sizing.reset-size10.size6,
.katex .fontsize-ensurer.reset-size10.size6 {
  font-size: 0.48216008em;
}
.katex .sizing.reset-size10.size7,
.katex .fontsize-ensurer.reset-size10.size7 {
  font-size: 0.57859209em;
}
.katex .sizing.reset-size10.size8,
.katex .fontsize-ensurer.reset-size10.size8 {
  font-size: 0.69431051em;
}
.katex .sizing.reset-size10.size9,
.katex .fontsize-ensurer.reset-size10.size9 {
  font-size: 0.83317261em;
}
.katex .sizing.reset-size10.size10,
.katex .fontsize-ensurer.reset-size10.size10 {
  font-size: 1em;
}
.katex .sizing.reset-size10.size11,
.katex .fontsize-ensurer.reset-size10.size11 {
  font-size: 1.19961427em;
}
.katex .sizing.reset-size11.size1,
.katex .fontsize-ensurer.reset-size11.size1 {
  font-size: 0.20096463em;
}
.katex .sizing.reset-size11.size2,
.katex .fontsize-ensurer.reset-size11.size2 {
  font-size: 0.24115756em;
}
.katex .sizing.reset-size11.size3,
.katex .fontsize-ensurer.reset-size11.size3 {
  font-size: 0.28135048em;
}
.katex .sizing.reset-size11.size4,
.katex .fontsize-ensurer.reset-size11.size4 {
  font-size: 0.32154341em;
}
.katex .sizing.reset-size11.size5,
.katex .fontsize-ensurer.reset-size11.size5 {
  font-size: 0.36173633em;
}
.katex .sizing.reset-size11.size6,
.katex .fontsize-ensurer.reset-size11.size6 {
  font-size: 0.40192926em;
}
.katex .sizing.reset-size11.size7,
.katex .fontsize-ensurer.reset-size11.size7 {
  font-size: 0.48231511em;
}
.katex .sizing.reset-size11.size8,
.katex .fontsize-ensurer.reset-size11.size8 {
  font-size: 0.57877814em;
}
.katex .sizing.reset-size11.size9,
.katex .fontsize-ensurer.reset-size11.size9 {
  font-size: 0.69453376em;
}
.katex .sizing.reset-size11.size10,
.katex .fontsize-ensurer.reset-size11.size10 {
  font-size: 0.83360129em;
}
.katex .sizing.reset-size11.size11,
.katex .fontsize-ensurer.reset-size11.size11 {
  font-size: 1em;
}
.katex .delimsizing.size1 {
  font-family: KaTeX_Size1;
}
.katex .delimsizing.size2 {
  font-family: KaTeX_Size2;
}
.katex .delimsizing.size3 {
  font-family: KaTeX_Size3;
}
.katex .delimsizing.size4 {
  font-family: KaTeX_Size4;
}
.katex .delimsizing.mult .delim-size1 > span {
  font-family: KaTeX_Size1;
}
.katex .delimsizing.mult .delim-size4 > span {
  font-family: KaTeX_Size4;
}
.katex .nulldelimiter {
  display: inline-block;
  width: 0.12em;
}
.katex .delimcenter {
  position: relative;
}
.katex .op-symbol {
  position: relative;
}
.katex .op-symbol.small-op {
  font-family: KaTeX_Size1;
}
.katex .op-symbol.large-op {
  font-family: KaTeX_Size2;
}
.katex .op-limits > .vlist-t {
  text-align: center;
}
.katex .accent > .vlist-t {
  text-align: center;
}
.katex .accent .accent-body {
  position: relative;
}
.katex .accent .accent-body:not(.accent-full) {
  width: 0;
}
.katex .overlay {
  display: block;
}
.katex .mtable .vertical-separator {
  display: inline-block;
  margin: 0 -0.025em;
  border-right: 0.05em solid;
  min-width: 1px;
}
.katex .mtable .vs-dashed {
  border-right: 0.05em dashed;
}
.katex .mtable .arraycolsep {
  display: inline-block;
}
.katex .mtable .col-align-c > .vlist-t {
  text-align: center;
}
.katex .mtable .col-align-l > .vlist-t {
  text-align: left;
}
.katex .mtable .col-align-r > .vlist-t {
  text-align: right;
}
.katex .svg-align {
  text-align: left;
}
.katex svg {
  display: block;
  position: absolute;
  width: 100%;
  height: inherit;
  fill: currentColor;
  stroke: currentColor;
  fill-rule: nonzero;
  fill-opacity: 1;
  stroke-width: 1;
  stroke-linecap: butt;
  stroke-linejoin: miter;
  stroke-miterlimit: 4;
  stroke-dasharray: none;
  stroke-dashoffset: 0;
  stroke-opacity: 1;
}
.katex svg path {
  stroke: none;
}
.katex .stretchy {
  width: 100%;
  display: block;
  position: relative;
  overflow: hidden;
}
.katex .stretchy::before,
.katex .stretchy::after {
  content: "";
}
.katex .hide-tail {
  width: 100%;
  position: relative;
  overflow: hidden;
}
.katex .halfarrow-left {
  position: absolute;
  left: 0;
  width: 50.2%;
  overflow: hidden;
}
.katex .halfarrow-right {
  position: absolute;
  right: 0;
  width: 50.2%;
  overflow: hidden;
}
.katex .brace-left {
  position: absolute;
  left: 0;
  width: 25.1%;
  overflow: hidden;
}
.katex .brace-center {
  position: absolute;
  left: 25%;
  width: 50%;
  overflow: hidden;
}
.katex .brace-right {
  position: absolute;
  right: 0;
  width: 25.1%;
  overflow: hidden;
}
.katex .x-arrow-pad {
  padding: 0 0.5em;
}
.katex .x-arrow,
.katex .mover,
.katex .munder {
  text-align: center;
}
.katex .boxpad {
  padding: 0 0.3em 0 0.3em;
}
.katex .fbox {
  box-sizing: border-box;
  border: 0.04em solid black;
}
.katex .fcolorbox {
  box-sizing: border-box;
  border: 0.04em solid;
}
.katex .cancel-pad {
  padding: 0 0.2em 0 0.2em;
}
.katex .cancel-lap {
  margin-left: -0.2em;
  margin-right: -0.2em;
}
.katex .sout {
  border-bottom-style: solid;
  border-bottom-width: 0.08em;
}
.katex-display {
  display: block;
  margin: 1em 0;
  text-align: center;
}
.katex-display > .katex {
  display: block;
  text-align: center;
  white-space: nowrap;
}
.katex-display > .katex > .katex-html {
  display: block;
  position: relative;
}
.katex-display > .katex > .katex-html > .tag {
  position: absolute;
  right: 0;
}
`)


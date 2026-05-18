'use strict';

const path = require('path');
const PptxGenJS = require('pptxgenjs');

const pptx = new PptxGenJS();

// ─── PALETTE ─────────────────────────────────────────────────────────────────
const C = {
  bg:        '1a1f36',   // dark navy
  bgCard:    '242b47',   // card navy
  bgDeep:    '131726',   // deeper navy for contrast
  accent:    '4f8ef7',   // blue accent
  accentSoft:'1e3a6e',   // soft blue card
  purple:    '7c3aed',
  purpleSoft:'3b1f6b',
  green:     '10b981',
  greenSoft: '0d3d30',
  amber:     'f59e0b',
  amberSoft: '4a2f05',
  red:       'ef4444',
  redSoft:   '4a1515',
  white:     'FFFFFF',
  textMuted: '94a3b8',
  textDim:   '64748b',
  border:    '2e3758',
  border2:   '3d4a6b',
  line:      '2e3758',
};

const FF_HEAD  = 'Calibri';
const FF_BODY  = 'Calibri';
const FF_MONO  = 'Courier New';
const SLIDES   = 12;

pptx.layout  = 'LAYOUT_WIDE';
pptx.author  = 'BAGHDAD Mohamed & BAAKKA Monssfe';
pptx.company = 'Moul Hanout';
pptx.title   = 'Moul Hanout — Smart Inventory & Alert System';

// ─── PRIMITIVES ──────────────────────────────────────────────────────────────

function bg(slide, color) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.33, h: 7.5,
    fill: { color: color || C.bg },
    line: { color: color || C.bg },
  });
}

function card(slide, x, y, w, h, fillColor, borderColor, radius) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: radius !== undefined ? radius : 0.1,
    fill: { color: fillColor || C.bgCard },
    line: { color: borderColor || C.border, width: 1 },
  });
}

function accentBar(slide, x, y, h, color) {
  slide.addShape(pptx.ShapeType.rect, {
    x, y, w: 0.06, h,
    fill: { color: color || C.accent },
    line: { color: color || C.accent },
  });
}

function pill(slide, x, y, w, h, text, bgColor, textColor, fontSize) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.04,
    fill: { color: bgColor || C.accentSoft },
    line: { color: bgColor || C.accentSoft },
  });
  slide.addText(text.toUpperCase(), {
    x, y, w, h,
    fontFace: FF_BODY,
    fontSize: fontSize || 7.5,
    bold: true,
    color: textColor || C.accent,
    align: 'center',
    valign: 'mid',
    charSpacing: 1.2,
    margin: 0,
  });
}

function label(slide, x, y, text, color) {
  slide.addText(text.toUpperCase(), {
    x, y, w: 5, h: 0.18,
    fontFace: FF_BODY,
    fontSize: 8,
    bold: true,
    color: color || C.accent,
    charSpacing: 1.5,
    margin: 0,
  });
}

function heading(slide, x, y, w, text, size, color) {
  slide.addText(text, {
    x, y, w, h: 1.2,
    fontFace: FF_HEAD,
    fontSize: size || 26,
    bold: true,
    color: color || C.white,
    margin: 0,
  });
}

function body(slide, x, y, w, h, text, size, color) {
  slide.addText(text, {
    x, y, w, h,
    fontFace: FF_BODY,
    fontSize: size || 10.5,
    color: color || C.textMuted,
    margin: 0,
  });
}

function mono(slide, x, y, w, h, text, size) {
  slide.addText(text, {
    x, y, w, h,
    fontFace: FF_MONO,
    fontSize: size || 9.5,
    color: C.accent,
    margin: 0,
  });
}

function separator(slide, x, y, w, color) {
  slide.addShape(pptx.ShapeType.rect, {
    x, y, w, h: 0.01,
    fill: { color: color || C.border2 },
    line: { color: color || C.border2 },
  });
}

function pageNum(slide, num) {
  slide.addText(`${String(num).padStart(2, '0')} / ${SLIDES}`, {
    x: 12.5, y: 7.2, w: 0.6, h: 0.18,
    fontFace: FF_BODY,
    fontSize: 8,
    color: C.textDim,
    align: 'right',
    margin: 0,
  });
}

const SOFT_MAP = {
  [C.green]:  C.greenSoft,
  [C.accent]: C.accentSoft,
  [C.purple]: C.purpleSoft,
  [C.amber]:  C.amberSoft,
  [C.red]:    C.redSoft,
};

function sectionTag(slide, text, color) {
  const soft = color ? (SOFT_MAP[color] || C.accentSoft) : C.accentSoft;
  pill(slide, 0.46, 0.18, 1.4, 0.24, text, soft, color || C.accent, 7.5);
}

function divider(slide, dark) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.46, y: 0.52, w: 12.42, h: 0.015,
    fill: { color: dark ? C.bgDeep : C.border },
    line: { color: dark ? C.bgDeep : C.border },
  });
}

function circle(slide, x, y, size, fillColor, text, textColor, fontSize) {
  slide.addShape(pptx.ShapeType.ellipse, {
    x, y, w: size, h: size,
    fill: { color: fillColor || C.accent },
    line: { color: fillColor || C.accent },
  });
  if (text) {
    slide.addText(text, {
      x, y, w: size, h: size,
      fontFace: FF_HEAD,
      fontSize: fontSize || 12,
      bold: true,
      color: textColor || C.white,
      align: 'center',
      valign: 'mid',
      margin: 0,
    });
  }
}

function arrow(slide, x, y, color) {
  slide.addShape(pptx.ShapeType.chevron, {
    x, y, w: 0.26, h: 0.26,
    fill: { color: color || C.textDim },
    line: { color: color || C.textDim },
  });
}

function bulletRow(slide, x, y, w, text, bulletColor, textColor, fontSize) {
  circle(slide, x, y + 0.05, 0.1, bulletColor || C.accent);
  slide.addText(text, {
    x: x + 0.16, y, w: w - 0.16, h: 0.25,
    fontFace: FF_BODY,
    fontSize: fontSize || 10.5,
    color: textColor || C.textMuted,
    margin: 0,
  });
}

// ─── SLIDE 01 — TITLE ────────────────────────────────────────────────────────
function slide01() {
  const s = pptx.addSlide();
  bg(s, C.bg);

  // Left accent column
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 0.36, h: 7.5,
    fill: { color: C.accent },
    line: { color: C.accent },
  });

  // Decorative top-right gradient panel
  s.addShape(pptx.ShapeType.rect, {
    x: 8.1, y: 0, w: 5.23, h: 7.5,
    fill: { color: C.bgDeep },
    line: { color: C.bgDeep },
  });
  s.addShape(pptx.ShapeType.rect, {
    x: 8.1, y: 0, w: 0.06, h: 7.5,
    fill: { color: C.border2 },
    line: { color: C.border2 },
  });

  // Overline
  s.addText('TRANSFORMATION DIGITALE DU COMMERCE DE PROXIMITE', {
    x: 0.62, y: 0.64, w: 7.2, h: 0.22,
    fontFace: FF_BODY,
    fontSize: 8.5,
    bold: true,
    color: C.accent,
    charSpacing: 2.0,
    margin: 0,
  });

  // Main title
  s.addText('Moul Hanout', {
    x: 0.62, y: 1.0, w: 7.0, h: 0.82,
    fontFace: FF_HEAD,
    fontSize: 44,
    bold: true,
    color: C.white,
    margin: 0,
  });

  // Sub-headline
  s.addText('Smart Inventory &\nAlert System', {
    x: 0.62, y: 1.9, w: 7.0, h: 1.0,
    fontFace: FF_HEAD,
    fontSize: 26,
    bold: false,
    color: C.accent,
    margin: 0,
  });

  separator(s, 0.62, 3.12, 7.0, C.border2);

  s.addText('How we killed stock blindness\nin traditional grocery stores', {
    x: 0.62, y: 3.28, w: 6.8, h: 0.72,
    fontFace: FF_BODY,
    fontSize: 14,
    color: C.textMuted,
    margin: 0,
  });

  // Team block
  s.addText('EQUIPE PROJET', {
    x: 0.62, y: 4.3, w: 2.0, h: 0.2,
    fontFace: FF_BODY, fontSize: 8, bold: true,
    color: C.textDim, charSpacing: 1.5, margin: 0,
  });
  s.addText('BAGHDAD Mohamed\nBAAKKA Monssfe', {
    x: 0.62, y: 4.58, w: 3.6, h: 0.72,
    fontFace: FF_HEAD, fontSize: 17,
    bold: true, color: C.white, margin: 0,
  });

  // Right panel content — tech stack
  s.addText('STACK TECHNIQUE', {
    x: 8.42, y: 0.72, w: 3.0, h: 0.2,
    fontFace: FF_BODY, fontSize: 8, bold: true,
    color: C.accent, charSpacing: 1.5, margin: 0,
  });
  const techs = [
    ['NestJS', 'Backend REST API', C.green, C.greenSoft],
    ['Next.js', 'Interface proprietaire', C.accent, C.accentSoft],
    ['PostgreSQL + Prisma', 'Source de verite', C.purple, C.purpleSoft],
    ['Redis', 'Cache sessions', C.amber, C.amberSoft],
  ];
  techs.forEach((t, i) => {
    const ty = 1.14 + i * 1.2;
    card(s, 8.42, ty, 4.42, 0.96, C.bgCard, C.border, 0.08);
    s.addShape(pptx.ShapeType.rect, {
      x: 8.42, y: ty, w: 0.06, h: 0.96,
      fill: { color: t[2] }, line: { color: t[2] },
    });
    s.addText(t[0], {
      x: 8.64, y: ty + 0.14, w: 3.5, h: 0.28,
      fontFace: FF_HEAD, fontSize: 15, bold: true,
      color: C.white, margin: 0,
    });
    s.addText(t[1], {
      x: 8.64, y: ty + 0.52, w: 3.5, h: 0.22,
      fontFace: FF_BODY, fontSize: 9.5,
      color: C.textMuted, margin: 0,
    });
  });

  pageNum(s, 1);

  s.addNotes('Presentez le projet, les deux developpeurs, et le contexte de transformation digitale des epiceries traditionnelles. Insistez sur le fait que Moul Hanout resout un probleme concret et frequent: la rupture de stock silencieuse.');
}

// ─── SLIDE 02 — THE PROBLEM ──────────────────────────────────────────────────
function slide02() {
  const s = pptx.addSlide();
  bg(s);
  sectionTag(s, 'Le Problème');
  divider(s);
  pageNum(s, 2);

  heading(s, 0.46, 0.66, 8.5,
    "La rupture n'est pas un manque de stock,\nc'est un manque de visibilite.", 22, C.white);

  // Story card
  card(s, 0.46, 2.1, 7.8, 1.4, C.bgCard, C.border, 0.1);
  accentBar(s, 0.46, 2.1, 1.4, C.red);
  pill(s, 0.7, 2.22, 0.9, 0.22, 'Histoire', C.redSoft, C.red, 7.5);
  body(s, 0.7, 2.56, 7.2, 0.82,
    "Lundi matin. Un client demande une Coca-Cola. Le rayon semble vide, le vendeur s'excuse, et la vente est perdue. Pourtant, trois caisses sont encore en reserve — personne ne les a reliees au stock utile. La perte est invisible jusqu'a ce qu'elle arrive.",
    10.8, C.textMuted);

  // 4 pain points
  const pains = [
    { title: 'Suivi manuel',     desc: 'Aucune vision fiable\ndu stock reel par produit',        color: C.red,    soft: C.redSoft    },
    { title: 'Expiration',       desc: 'Dates notees sur papier\nou pas notees du tout',          color: C.amber,  soft: C.amberSoft  },
    { title: 'Alerte tardive',   desc: 'Le probleme n\'apparait\nqu\'a la demande client',        color: C.purple, soft: C.purpleSoft },
    { title: 'Decisions faibles',desc: 'Le proprietaire ne sait\npas quoi reappro en priorite',  color: C.accent, soft: C.accentSoft },
  ];
  pains.forEach((p, i) => {
    const x = 0.46 + i * 3.0;
    card(s, x, 3.72, 2.64, 2.5, C.bgCard, C.border, 0.1);
    s.addShape(pptx.ShapeType.roundRect, {
      x: x + 0.2, y: 3.94, w: 0.46, h: 0.26,
      rectRadius: 0.04,
      fill: { color: p.soft }, line: { color: p.soft },
    });
    s.addText(p.title, {
      x: x + 0.2, y: 4.34, w: 2.22, h: 0.36,
      fontFace: FF_HEAD, fontSize: 15, bold: true,
      color: C.white, margin: 0,
    });
    s.addText(p.desc, {
      x: x + 0.2, y: 4.82, w: 2.22, h: 0.72,
      fontFace: FF_BODY, fontSize: 10,
      color: C.textMuted, margin: 0,
    });
  });

  // Right quote panel
  card(s, 8.62, 2.1, 4.26, 4.12, C.bgDeep, C.border, 0.1);
  s.addText('"', { x: 8.86, y: 2.28, w: 0.6, h: 0.6, fontFace: FF_HEAD, fontSize: 52, bold: true, color: C.accent, margin: 0 });
  body(s, 8.86, 2.88, 3.72, 1.6,
    'Le client demande, le rayon est vide, et on decouvre trop tard qu\'il restait encore des unites ailleurs.',
    12, C.white);
  body(s, 8.86, 4.62, 3.4, 0.4, '— Observation en epicerie traditionnelle', 9, C.textDim);

  s.addNotes('Racontez l\'histoire du Lundi matin — c\'est une histoire que tout proprietaire d\'epicerie reconnait immediatement. Les 4 problemes sont universels dans ce secteur. Le but est d\'etablir une empathie avec l\'audience avant de presenter la solution.');
}

// ─── SLIDE 03 — OUR SOLUTION ─────────────────────────────────────────────────
function slide03() {
  const s = pptx.addSlide();
  bg(s);
  sectionTag(s, 'La Solution');
  divider(s);
  pageNum(s, 3);

  heading(s, 0.46, 0.66, 9.0,
    'Transformer un stock passif en systeme\nde surveillance actif.', 22, C.white);

  // 3 pillars
  const pillars = [
    { icon: '01', title: 'Stock Trace',       desc: 'Chaque entree et sortie met a jour currentStock en temps reel. L\'historique complet des mouvements est conserve.',          color: C.green,  soft: C.greenSoft },
    { icon: '02', title: 'Seuils Produits',   desc: 'Chaque produit a son propre lowStockThreshold (defaut: 5 unites). Le seuil est configurable selon les besoins du magasin.', color: C.amber,  soft: C.amberSoft },
    { icon: '03', title: 'Alertes Fiables',   desc: 'Le moteur reconcilie en continu. Il cree, conserve et supprime les alertes automatiquement selon l\'etat reel du stock.',   color: C.accent, soft: C.accentSoft },
  ];
  pillars.forEach((p, i) => {
    const x = 0.46 + i * 4.2;
    card(s, x, 2.04, 3.76, 3.2, C.bgCard, C.border, 0.1);
    s.addShape(pptx.ShapeType.rect, {
      x, y: 2.04, w: 3.76, h: 0.08,
      fill: { color: p.color }, line: { color: p.color },
    });
    s.addText(p.icon, {
      x: x + 0.26, y: 2.28, w: 0.7, h: 0.52,
      fontFace: FF_HEAD, fontSize: 32, bold: true,
      color: p.color, margin: 0,
    });
    s.addText(p.title, {
      x: x + 0.26, y: 2.94, w: 3.1, h: 0.36,
      fontFace: FF_HEAD, fontSize: 17, bold: true,
      color: C.white, margin: 0,
    });
    s.addText(p.desc, {
      x: x + 0.26, y: 3.44, w: 3.12, h: 1.52,
      fontFace: FF_BODY, fontSize: 10.3,
      color: C.textMuted, margin: 0,
    });
  });

  // Value statement
  card(s, 0.46, 5.52, 12.42, 1.2, C.accentSoft, C.accent, 0.1);
  s.addText('Promesse du projet', {
    x: 0.72, y: 5.68, w: 2.0, h: 0.2,
    fontFace: FF_BODY, fontSize: 8, bold: true,
    color: C.accent, charSpacing: 1.2, margin: 0,
  });
  s.addText("Passer d'une reaction tardive (je vois le probleme quand le client demande) a une prevention continue (le systeme m'alerte avant que le client arrive).",
    {
      x: 0.72, y: 5.96, w: 11.7, h: 0.52,
      fontFace: FF_BODY, fontSize: 11.5,
      color: C.white, margin: 0,
    }
  );

  s.addNotes('Les 3 piliers sont la colonne vertebrale du projet. Insistez sur le fait que ce n\'est pas simplement un logiciel de gestion de stock — c\'est un systeme d\'aide a la decision. La promesse finale doit resonner avec les decideurs non-techniques.');
}

// ─── SLIDE 04 — ARCHITECTURE ─────────────────────────────────────────────────
function slide04() {
  const s = pptx.addSlide();
  bg(s);
  sectionTag(s, 'Architecture');
  divider(s);
  pageNum(s, 4);

  heading(s, 0.46, 0.66, 9.0,
    "Frontend → API → Moteur Alertes → Notification", 20, C.white);
  body(s, 0.46, 1.52, 9.0, 0.35,
    'Le backend est la source de verite. Le frontend orchestre les actions. Le module alertes agit comme moteur metier independant.', 10.5, C.textMuted);

  // 3 architecture layers
  const layers = [
    {
      x: 0.46, title: 'Frontend — Next.js',
      color: C.accent, soft: C.accentSoft,
      rows: ['Dashboard proprietaire', 'Page /inventaire + /alertes', 'Badge alertes + polling 30s', 'JWT Auth via cookies'],
    },
    {
      x: 4.16, title: 'API — NestJS',
      color: C.green, soft: C.greenSoft,
      rows: ['Controllers fins (routes only)', 'Services metier (logique metier)', 'JwtAuthGuard + RolesGuard', 'Transform interceptor JSON'],
    },
    {
      x: 7.86, title: 'Donnees & Moteurs',
      color: C.purple, soft: C.purpleSoft,
      rows: ['Prisma ORM + PostgreSQL', 'Transactions atomiques', 'AlertsPort (interface decouplage)', 'Cron email 15 min'],
    },
  ];

  layers.forEach((layer, i) => {
    card(s, layer.x, 2.04, 3.4, 3.52, C.bgCard, C.border, 0.1);
    s.addShape(pptx.ShapeType.rect, {
      x: layer.x, y: 2.04, w: 3.4, h: 0.08,
      fill: { color: layer.color }, line: { color: layer.color },
    });
    pill(s, layer.x + 0.22, 2.26, 2.4, 0.26, layer.title, layer.soft, layer.color, 8.5);
    layer.rows.forEach((r, j) => {
      bulletRow(s, layer.x + 0.24, 2.76 + j * 0.6, 3.0, r, layer.color, C.textMuted, 10);
    });

    // Arrow between layers
    if (i < 2) {
      s.addShape(pptx.ShapeType.rightArrow, {
        x: layer.x + 3.46, y: 3.52, w: 0.44, h: 0.28,
        fill: { color: C.border2 }, line: { color: C.border2 },
      });
    }
  });

  // AlertsPort callout
  card(s, 0.46, 5.82, 7.52, 1.0, C.bgDeep, C.border, 0.08);
  pill(s, 0.68, 5.98, 1.4, 0.22, 'Cle archi', C.purpleSoft, C.purple);
  body(s, 0.68, 6.3, 7.1, 0.38,
    "ALERTS_PORT — InventoryService appelle une interface, jamais directement AlertsService. Les modules restent independants et testables.", 10.2, C.white);

  // Email notif block
  card(s, 8.26, 5.82, 4.62, 1.0, C.bgDeep, C.border, 0.08);
  pill(s, 8.48, 5.98, 1.2, 0.22, 'Email cron', C.amberSoft, C.amber);
  body(s, 8.48, 6.3, 4.2, 0.38,
    "Cron job toutes les 15 minutes — envoie un email groupant LOW_STOCK + EXPIRY aux owners.", 10.2, C.white);

  s.addNotes('Montrez comment les 3 couches communiquent sans etre directement couplees. Le point cle est ALERTS_PORT qui est une interface, pas une dependance directe. Cela facilite les tests et l\'evolution du systeme.');
}

// ─── SLIDE 05 — INVENTORY MODULE DEEP DIVE ───────────────────────────────────
function slide05() {
  const s = pptx.addSlide();
  bg(s);
  sectionTag(s, 'Module Inventaire', C.green);
  divider(s);
  pageNum(s, 5);

  heading(s, 0.46, 0.66, 9.5,
    "L'inventaire convertit chaque produit en objet de pilotage.", 21, C.white);

  // Schema fields panel
  card(s, 0.46, 2.0, 4.0, 4.72, C.bgCard, C.border, 0.1);
  label(s, 0.72, 2.18, 'Schema Produit', C.green);
  separator(s, 0.72, 2.46, 3.6, C.border);

  const fields = [
    ['currentStock',      'Quantite exploitable en temps reel', C.green],
    ['lowStockThreshold', 'Seuil declencheur alerte (defaut: 5)', C.amber],
    ['expirationDate',    'Base des alertes de peremption', C.red],
    ['isLowStock',        'computed: currentStock <= seuil', C.accent],
    ['isExpiringSoon',    'computed: expiry dans 5 jours max', C.purple],
    ['stockMovements',    'Historique entrees / sorties', C.textMuted],
  ];
  fields.forEach((f, i) => {
    const fy = 2.62 + i * 0.68;
    mono(s, 0.72, fy, 1.82, 0.24, f[0], 9.5);
    body(s, 2.62, fy, 1.6, 0.24, f[1], 9, C.textDim);
    if (i < fields.length - 1) separator(s, 0.72, fy + 0.3, 3.52, C.border);
  });

  // API endpoints
  card(s, 4.86, 2.0, 3.7, 4.72, C.bgCard, C.border, 0.1);
  label(s, 5.1, 2.18, 'Endpoints API', C.accent);
  separator(s, 5.1, 2.46, 3.22, C.border);

  const endpoints = [
    ['GET',  '/inventory',           'Liste produits + statuts'],
    ['POST', '/inventory/stock-in',  'Entree stock (OWNER)'],
    ['POST', '/inventory/stock-out', 'Sortie stock (OWNER)'],
    ['GET',  '/inventory/expiring',  'Produits < 5 jours (OWNER)'],
    ['GET',  '/inventory/movements', '50 derniers mouvements'],
  ];
  const methColors    = { GET: C.green,     POST: C.accent    };
  const methColorSoft = { GET: C.greenSoft, POST: C.accentSoft };
  endpoints.forEach((ep, i) => {
    const ey = 2.62 + i * 0.8;
    pill(s, 5.1, ey, 0.5, 0.22, ep[0], methColorSoft[ep[0]], methColors[ep[0]], 7.5);
    mono(s, 5.68, ey, 2.5, 0.22, ep[1], 9);
    body(s, 5.1, ey + 0.3, 3.1, 0.3, ep[2], 9, C.textDim);
    if (i < endpoints.length - 1) separator(s, 5.1, ey + 0.64, 3.22, C.border);
  });

  // Rules panel
  card(s, 8.96, 2.0, 3.92, 4.72, C.bgDeep, C.border, 0.1);
  label(s, 9.2, 2.18, 'Regles Service', C.amber);
  separator(s, 9.2, 2.46, 3.48, C.border);
  const rules = [
    'Stock IN: transaction atomique (stock + mouvement + audit + alertes)',
    'Stock OUT: erreur si quantite > currentStock — jamais de stock negatif',
    'Toute modification appelle syncProductAlerts() dans la meme transaction',
    'Aucune logique metier dans le controller — le service porte tout',
    'Prisma = unique acces base de donnees',
  ];
  rules.forEach((r, i) => {
    bulletRow(s, 9.2, 2.68 + i * 0.76, 3.4, r, C.amber, C.textMuted, 9.8);
  });

  s.addNotes('Ce slide montre la richesse du modele de donnees. Insistez sur isLowStock et isExpiringSoon qui sont des champs calcules retournes par l\'API — ils simplifient enormement la logique frontend. La regle "jamais de stock negatif" est une protection cle de l\'integrite des donnees.');
}

// ─── SLIDE 06 — ALERTS MODULE DEEP DIVE ──────────────────────────────────────
function slide06() {
  const s = pptx.addSlide();
  bg(s);
  sectionTag(s, 'Module Alertes', C.red);
  divider(s);
  pageNum(s, 6);

  heading(s, 0.46, 0.66, 9.0,
    "Le moteur cree, maintient et supprime les alertes automatiquement.", 21, C.white);

  // Alert types
  const types = [
    {
      x: 0.46, type: 'LOW_STOCK',
      trigger: 'currentStock <= lowStockThreshold',
      message: '"Stock bas pour {nom}: {stock} unite(s) restantes sur un seuil de {seuil}."',
      color: C.amber, soft: C.amberSoft,
      desc: 'Alerte quand le stock passe sous le seuil configurable du produit.',
    },
    {
      x: 6.56, type: 'EXPIRY',
      trigger: 'currentStock > 0 && date < now + 5j',
      message: '"Expiration proche pour {nom}: lot a verifier avant le {date}."',
      color: C.red, soft: C.redSoft,
      desc: 'Alerte quand un produit en stock a moins de 5 jours avant peremption.',
    },
  ];

  types.forEach((t) => {
    card(s, t.x, 2.02, 5.7, 2.58, C.bgCard, C.border, 0.1);
    s.addShape(pptx.ShapeType.rect, {
      x: t.x, y: 2.02, w: 5.7, h: 0.07,
      fill: { color: t.color }, line: { color: t.color },
    });
    pill(s, t.x + 0.24, 2.22, 1.4, 0.24, t.type, t.soft, t.color, 8);
    body(s, t.x + 0.24, 2.6, 5.1, 0.4, t.desc, 10.5, C.white);
    label(s, t.x + 0.24, 3.14, 'Condition', C.textDim);
    mono(s, t.x + 0.24, 3.38, 5.0, 0.26, t.trigger, 9.5);
    label(s, t.x + 0.24, 3.74, 'Message generé', C.textDim);
    body(s, t.x + 0.24, 3.98, 5.1, 0.48, t.message, 9.5, C.textMuted);
  });

  // Reconciliation logic
  card(s, 0.46, 4.82, 7.8, 1.92, C.bgCard, C.border, 0.1);
  label(s, 0.72, 4.98, 'Logique de reconciliation', C.purple);
  separator(s, 0.72, 5.26, 7.36, C.border);

  const recon = [
    ['Condition vraie + pas d\'alerte   →', 'CREATION', C.green],
    ['Condition vraie + alerte existante →', 'CONSERVATION (message mis a jour)', C.accent],
    ['Condition fausse + alerte active   →', 'SUPPRESSION automatique', C.red],
    ['Doublons detectes                  →', 'Conserve 1, supprime les autres', C.amber],
  ];
  recon.forEach((r, i) => {
    mono(s, 0.72, 5.38 + i * 0.36, 3.4, r[0], 9.5);
    pill(s, 4.22, 5.36 + i * 0.36, 3.6, 0.24, r[1], C.bgDeep, r[2], 8.5);
  });

  // Email block
  card(s, 8.66, 4.82, 4.22, 1.92, C.bgDeep, C.border, 0.1);
  label(s, 8.9, 4.98, 'Email Notifications', C.accent);
  separator(s, 8.9, 5.26, 3.72, C.border);
  bulletRow(s, 8.9, 5.38, 3.6, 'Cron: toutes les 15 minutes', C.accent, C.textMuted, 9.8);
  bulletRow(s, 8.9, 5.76, 3.6, 'Destinataires: users OWNER actifs', C.accent, C.textMuted, 9.8);
  bulletRow(s, 8.9, 6.14, 3.6, 'emailSentAt: evite les doublons email', C.accent, C.textMuted, 9.8);
  bulletRow(s, 8.9, 6.52, 3.6, 'Polling frontend: rafraichit toutes les 30s', C.accent, C.textMuted, 9.8);

  s.addNotes('Le point cle ici est la RECONCILIATION. Contrairement a un simple systeme qui envoie des notifications, notre moteur maintient un etat coherent. Une alerte disparait quand le stock remonte. Cela evite le "bruit" des alertes fantomes qui fatiguent les utilisateurs.');
}

// ─── SLIDE 07 — DATA FLOW DIAGRAM ────────────────────────────────────────────
function slide07() {
  const s = pptx.addSlide();
  bg(s);
  sectionTag(s, 'Flux de Donnees', C.accent);
  divider(s);
  pageNum(s, 7);

  heading(s, 0.46, 0.66, 11.0,
    "Une vente declenche un flux atomique: stock → alertes → notification.", 20, C.white);

  // Flow steps
  const steps = [
    { n: '1', title: 'Vente\nfinalisee',    desc: 'Le POS confirme\nles lignes et quantites', color: C.accent,  soft: C.accentSoft },
    { n: '2', title: 'Stock\ndecremente',   desc: 'currentStock -=\nquantite vendue',           color: C.green,   soft: C.greenSoft  },
    { n: '3', title: 'Mouvement\necrit',    desc: 'StockMovement\ntype=OUT + reason',           color: C.green,   soft: C.greenSoft  },
    { n: '4', title: 'Audit\nLog cree',     desc: 'Action STOCK_OUT\n+ payload JSON',           color: C.purple,  soft: C.purpleSoft },
    { n: '5', title: 'Alertes\nréconciliées',desc: 'LOW_STOCK et EXPIRY\nrecalcules',           color: C.amber,   soft: C.amberSoft  },
    { n: '6', title: 'Email +\nDashboard',  desc: 'Badge mis a jour\nEmail owner 15min',        color: C.red,     soft: C.redSoft    },
  ];

  steps.forEach((step, i) => {
    const x = 0.42 + i * 2.12;
    card(s, x, 2.04, 1.88, 2.72, C.bgCard, C.border, 0.1);
    s.addShape(pptx.ShapeType.rect, {
      x, y: 2.04, w: 1.88, h: 0.06,
      fill: { color: step.color }, line: { color: step.color },
    });
    circle(s, x + 0.7, 2.2, 0.46, step.soft, step.n, step.color, 16);
    s.addText(step.title, {
      x: x + 0.14, y: 2.82, w: 1.6, h: 0.5,
      fontFace: FF_HEAD, fontSize: 12, bold: true,
      color: C.white, align: 'center', margin: 0,
    });
    s.addText(step.desc, {
      x: x + 0.14, y: 3.4, w: 1.6, h: 0.88,
      fontFace: FF_BODY, fontSize: 9.2,
      color: C.textMuted, align: 'center', margin: 0,
    });
    if (i < steps.length - 1) {
      arrow(s, x + 1.88, 3.18, C.border2);
    }
  });

  // Transaction boundary
  s.addShape(pptx.ShapeType.rect, {
    x: 0.42, y: 4.98, w: 7.98, h: 0.04,
    fill: { color: C.green }, line: { color: C.green },
  });
  s.addShape(pptx.ShapeType.rect, {
    x: 8.4, y: 4.98, w: 4.48, h: 0.04,
    fill: { color: C.amber }, line: { color: C.amber },
  });
  s.addText('TRANSACTION PRISMA ATOMIQUE — etapes 1 a 5 dans une seule unite de travail', {
    x: 0.42, y: 5.1, w: 7.98, h: 0.24,
    fontFace: FF_BODY, fontSize: 8.5, bold: true,
    color: C.green, align: 'center', charSpacing: 0.8, margin: 0,
  });
  s.addText('ASYNC — CRON 15 MIN', {
    x: 8.4, y: 5.1, w: 4.48, h: 0.24,
    fontFace: FF_BODY, fontSize: 8.5, bold: true,
    color: C.amber, align: 'center', charSpacing: 0.8, margin: 0,
  });

  // Key insight
  card(s, 0.46, 5.5, 12.42, 1.2, C.bgDeep, C.border, 0.08);
  s.addText('Point critique:', {
    x: 0.7, y: 5.66, w: 1.5, h: 0.2,
    fontFace: FF_BODY, fontSize: 8.5, bold: true,
    color: C.accent, charSpacing: 0.5, margin: 0,
  });
  body(s, 2.32, 5.66, 10.1, 0.22,
    'Etapes 2 a 5 sont dans la MEME transaction Prisma. Si la reevaluation des alertes echoue, la modification du stock est aussi annulee. Le systeme ne laisse jamais un stock modifie avec des alertes incoherentes.',
    10.5, C.white);
  body(s, 0.7, 5.96, 12.1, 0.58,
    'Si le stock passe sous le seuil → alerte cree instantanement | Si le stock remonte → alerte supprimee instantanement | Email envoye en batch toutes les 15 minutes aux owners.',
    9.5, C.textMuted);

  s.addNotes('C\'est le slide le plus technique. Pour les non-techniques, simplifiez: "Quand une vente est faite, le systeme met a jour le stock ET verifie les alertes en meme temps — si quelque chose echoue, tout est annule pour garder les donnees propres." Pour les techniques, insistez sur la garantie ACID de PostgreSQL via Prisma.');
}

// ─── SLIDE 08 — KEY CODE MOMENTS ─────────────────────────────────────────────
function slide08() {
  const s = pptx.addSlide();
  bg(s);
  sectionTag(s, 'Décisions Techniques', C.purple);
  divider(s);
  pageNum(s, 8);

  heading(s, 0.46, 0.66, 9.5,
    "Trois choix d'implementation qui expliquent la solidite du projet.", 21, C.white);

  const decisions = [
    {
      x: 0.46,
      tag: 'Decouplage',
      tagColor: C.purple,
      tagSoft: C.purpleSoft,
      title: "Interface AlertsPort",
      code: "interface AlertsPort {\n  syncProductAlerts(\n    tx: PrismaClient,\n    product: AlertSyncProduct\n  ): Promise<void>;\n}",
      insight: "InventoryService depend d'une interface, jamais de AlertsService. Les deux modules restent testables independamment et peuvent evoluer sans se casser.",
      color: C.purple,
    },
    {
      x: 4.54,
      tag: 'Coherence',
      tagColor: C.green,
      tagSoft: C.greenSoft,
      title: "Transaction Atomique",
      code: "await prisma.$transaction(async (tx) => {\n  // 1. Update currentStock\n  // 2. Create StockMovement\n  // 3. Create AuditLog\n  // 4. syncProductAlerts(tx, product)\n});",
      insight: "Les 4 operations vivent dans la meme transaction. Impossible d'avoir un stock mis a jour avec des alertes incoherentes — la base de donnees garantit la coherence.",
      color: C.green,
    },
    {
      x: 8.62,
      tag: 'Performance',
      tagColor: C.accent,
      tagSoft: C.accentSoft,
      title: "currentStock en cache DB",
      code: "// Champ calcule stocke en base:\n// Product.currentStock Int @default(0)\n//\n// Evite:\n// SELECT SUM(qtyDelta) FROM movements\n// WHERE productId = ?",
      insight: "Stocker currentStock directement en base evite de recalculer depuis l'historique complet a chaque lecture. Lecture O(1) au lieu de O(n mouvements).",
      color: C.accent,
    },
  ];

  decisions.forEach((d) => {
    card(s, d.x, 2.02, 3.7, 4.82, C.bgCard, C.border, 0.1);
    accentBar(s, d.x, 2.02, 4.82, d.color);
    pill(s, d.x + 0.22, 2.2, 1.0, 0.24, d.tag, d.tagSoft, d.tagColor, 7.5);
    s.addText(d.title, {
      x: d.x + 0.22, y: 2.58, w: 3.2, h: 0.36,
      fontFace: FF_HEAD, fontSize: 15, bold: true,
      color: C.white, margin: 0,
    });
    // Code block
    card(s, d.x + 0.2, 3.04, 3.28, 1.92, C.bgDeep, C.border, 0.06);
    s.addText(d.code, {
      x: d.x + 0.34, y: 3.14, w: 3.0, h: 1.72,
      fontFace: FF_MONO, fontSize: 8.5,
      color: d.tagColor, margin: 0,
    });
    // Insight
    body(s, d.x + 0.22, 5.1, 3.2, 1.58, d.insight, 9.8, C.textMuted);
  });

  s.addNotes('Ces 3 decisions sont les plus importantes de l\'implementation. Pour le jury technique: montrez que vous avez pense a l\'evolution (decouplage), a la fiabilite (transaction), et a la performance (cache). Pour les non-techniques: "Nous avons fait des choix qui rendent le systeme fiable et rapide."');
}

// ─── SLIDE 09 — DEMO FLOW ────────────────────────────────────────────────────
function slide09() {
  const s = pptx.addSlide();
  bg(s);
  sectionTag(s, 'Parcours Propriétaire', C.accent);
  divider(s);
  pageNum(s, 9);

  heading(s, 0.46, 0.66, 9.0,
    "Ce que voit et fait le proprietaire, pas a pas.", 21, C.white);

  const journey = [
    { n: '1', step: 'Badge alerte',         desc: 'Un compteur rouge apparait sur la navigation — nombre d\'alertes non lues.', color: C.red,   soft: C.redSoft    },
    { n: '2', step: 'Ouvre /alertes',       desc: 'Liste des alertes triees: non-lues en premier, puis par date. Type LOW_STOCK ou EXPIRY visible.', color: C.amber, soft: C.amberSoft  },
    { n: '3', step: 'Clique sur un produit',desc: 'Navigue vers /inventaire?focus={productId} — le produit est surligne automatiquement.', color: C.accent, soft: C.accentSoft },
    { n: '4', step: 'Corrige le stock',     desc: 'Formulaire Stock IN: saisit la quantite, la raison, et optionnellement une date de peremption.', color: C.green,  soft: C.greenSoft  },
    { n: '5', step: 'Alerte disparait',     desc: 'Si currentStock depasse le seuil, l\'alerte est supprimee automatiquement. Aucune action manuelle.', color: C.green,  soft: C.greenSoft  },
  ];

  journey.forEach((j, i) => {
    const y = 2.04 + i * 0.98;
    card(s, 0.46, y, 8.06, 0.8, C.bgCard, C.border, 0.08);
    circle(s, 0.62, y + 0.19, 0.44, j.soft, j.n, j.color, 14);
    s.addText(j.step, {
      x: 1.22, y: y + 0.14, w: 2.0, h: 0.24,
      fontFace: FF_HEAD, fontSize: 13, bold: true,
      color: C.white, margin: 0,
    });
    body(s, 3.32, y + 0.14, 4.86, 0.48, j.desc, 9.8, C.textMuted);

    // Vertical connector
    if (i < journey.length - 1) {
      s.addShape(pptx.ShapeType.rect, {
        x: 0.82, y: y + 0.8, w: 0.04, h: 0.18,
        fill: { color: C.border2 }, line: { color: C.border2 },
      });
    }
  });

  // Right panel — key UX design decisions
  card(s, 8.96, 2.04, 3.92, 4.78, C.bgDeep, C.border, 0.1);
  label(s, 9.2, 2.2, 'Design UX Retenu', C.accent);
  separator(s, 9.2, 2.48, 3.44, C.border);

  const ux = [
    ['Signal toujours visible', 'Badge persistent dans la navigation'],
    ['Chemin direct',           'Un clic de l\'alerte vers le produit'],
    ['Contextualise',           'Focus automatique sur le produit cible'],
    ['Auto-resolution',         'Pas de "marquer comme resolu" manuel requis'],
    ['Polling leger',           '30s — suffisant, pas besoin de websockets'],
  ];
  ux.forEach((u, i) => {
    const uy = 2.68 + i * 0.8;
    s.addText(u[0], {
      x: 9.2, y: uy, w: 3.44, h: 0.24,
      fontFace: FF_HEAD, fontSize: 11.5, bold: true,
      color: C.white, margin: 0,
    });
    body(s, 9.2, uy + 0.3, 3.44, 0.32, u[1], 9.5, C.textMuted);
    if (i < ux.length - 1) separator(s, 9.2, uy + 0.66, 3.44, C.border);
  });

  s.addNotes('Montrez le parcours en faisant une vraie demo si possible. Le point fort est que l\'alerte disparait automatiquement quand le stock est corrige — c\'est un detail UX crucial qui donne confiance au proprietaire que le systeme est "en vie" et pas juste une liste statique.');
}

// ─── SLIDE 10 — IMPACT ───────────────────────────────────────────────────────
function slide10() {
  const s = pptx.addSlide();
  bg(s);
  sectionTag(s, 'Impact', C.green);
  divider(s);
  pageNum(s, 10);

  heading(s, 0.46, 0.66, 9.5,
    "Le projet remplace une logique de reaction\npar une logique de prevention.", 21, C.white);

  // BEFORE column
  card(s, 0.46, 2.04, 5.82, 4.24, C.bgCard, C.border, 0.1);
  s.addShape(pptx.ShapeType.rect, {
    x: 0.46, y: 2.04, w: 5.82, h: 0.07,
    fill: { color: C.red }, line: { color: C.red },
  });
  pill(s, 0.7, 2.24, 0.8, 0.24, 'AVANT', C.redSoft, C.red, 8.5);
  s.addText('Le magasin voit le probleme quand il est deja trop tard.', {
    x: 0.7, y: 2.62, w: 5.2, h: 0.58,
    fontFace: FF_HEAD, fontSize: 17, bold: true,
    color: C.white, margin: 0,
  });
  separator(s, 0.7, 3.32, 5.28, C.border);
  const before = [
    'Stock verifie manuellement ou de memoire',
    'Dates de peremption hors systeme (papier)',
    'Rupture detectee devant le client (trop tard)',
    'Reapprovisionnement sans priorite claire',
    'Aucune trace des mouvements de stock',
  ];
  before.forEach((b, i) => {
    bulletRow(s, 0.7, 3.5 + i * 0.52, 5.0, b, C.red, C.textMuted, 10.5);
  });

  // AFTER column
  card(s, 6.68, 2.04, 5.82, 4.24, C.bgCard, C.border, 0.1);
  s.addShape(pptx.ShapeType.rect, {
    x: 6.68, y: 2.04, w: 5.82, h: 0.07,
    fill: { color: C.green }, line: { color: C.green },
  });
  pill(s, 6.92, 2.24, 0.8, 0.24, 'APRES', C.greenSoft, C.green, 8.5);
  s.addText("Le systeme anticipe le risque et pousse l'action utile.", {
    x: 6.92, y: 2.62, w: 5.2, h: 0.58,
    fontFace: FF_HEAD, fontSize: 17, bold: true,
    color: C.white, margin: 0,
  });
  separator(s, 6.92, 3.32, 5.28, C.border);
  const after = [
    'Stock visible produit par produit, temps reel',
    'Seuils et dates surveilles automatiquement',
    'Alertes 5 jours avant expiration, avant la vente',
    'Correction guidee depuis le dashboard',
    'Historique complet: 50 derniers mouvements',
  ];
  after.forEach((a, i) => {
    bulletRow(s, 6.92, 3.5 + i * 0.52, 5.0, a, C.green, C.textMuted, 10.5);
  });

  // VS divider
  circle(s, 6.19, 3.82, 0.58, C.bgDeep, 'VS', C.textDim, 13);

  // Bottom impact statement
  card(s, 0.46, 6.5, 12.42, 0.72, C.accentSoft, C.accent, 0.08);
  s.addText('Changement principal:', {
    x: 0.7, y: 6.65, w: 2.0, h: 0.24,
    fontFace: FF_BODY, fontSize: 8.5, bold: true,
    color: C.accent, charSpacing: 0.5, margin: 0,
  });
  body(s, 2.82, 6.65, 9.8, 0.24,
    'Le proprietaire passe de "je reagis a la plainte client" a "je vois le probleme 5 jours avant et je commande a temps."', 11, C.white);

  s.addNotes('C\'est le slide le plus important pour les parties prenantes non-techniques. Traduisez tout en termes metier: moins de ventes perdues, moins de produits perimes, moins de stress pour le proprietaire. Si vous avez des chiffres estimatifs, c\'est le bon endroit pour les mentionner.');
}

// ─── SLIDE 11 — WHAT WE LEARNED ─────────────────────────────────────────────
function slide11() {
  const s = pptx.addSlide();
  bg(s);
  sectionTag(s, 'Ce Qu\'on a Appris', C.amber);
  divider(s);
  pageNum(s, 11);

  heading(s, 0.46, 0.66, 9.5,
    "La simplicite bien placee vaut mieux que la complexite spectaculaire.", 21, C.white);

  const lessons = [
    {
      n: '01',
      title: 'Le decouplage est utile tout de suite',
      body: "L'interface ALERTS_PORT n'a pas servi seulement pour \"l'avenir\": elle a clarifie les responsabilites des le developpement. On a ecrit un meilleur service inventaire parce qu'on a defini la frontiere avec le module alertes.",
      tag: 'Architecture',
      color: C.purple,
      soft: C.purpleSoft,
    },
    {
      n: '02',
      title: 'La transaction achete de la confiance',
      body: "Le cout de mise en oeuvre (passer le client Prisma dans la transaction) est tres faible par rapport au risque d'un stock modifie avec des alertes fausses. La coherence n'est pas optionnelle dans un systeme de gestion de stock.",
      tag: 'Fiabilite',
      color: C.green,
      soft: C.greenSoft,
    },
    {
      n: '03',
      title: 'Le polling simple a gagne face au temps reel',
      body: "Un rafraichissement toutes les 30 secondes est suffisant pour les alertes en epicerie. Ajouter des WebSockets aurait triple la complexite pour un gain marginal. On a resiste a la tentation de sur-engineerer.",
      tag: 'Pragmatisme',
      color: C.amber,
      soft: C.amberSoft,
    },
  ];

  lessons.forEach((l, i) => {
    const y = 2.04 + i * 1.58;
    card(s, 0.46, y, 12.42, 1.32, C.bgCard, C.border, 0.1);
    accentBar(s, 0.46, y, 1.32, l.color);
    s.addText(l.n, {
      x: 0.72, y: y + 0.08, w: 0.56, h: 0.5,
      fontFace: FF_HEAD, fontSize: 28, bold: true,
      color: l.soft, margin: 0,
    });
    pill(s, 1.42, y + 0.14, 1.0, 0.24, l.tag, l.soft, l.color, 7.5);
    s.addText(l.title, {
      x: 2.58, y: y + 0.12, w: 4.2, h: 0.3,
      fontFace: FF_HEAD, fontSize: 14, bold: true,
      color: C.white, margin: 0,
    });
    body(s, 6.94, y + 0.1, 5.68, 1.06, l.body, 10.2, C.textMuted);
  });

  // Closing reflections
  card(s, 0.46, 6.88, 12.42, 0.38, C.bgDeep, C.border, 0.06);
  body(s, 0.7, 6.96, 12.0, 0.22,
    'En resume: choisir les bonnes contraintes (decouplage + transaction + simplicit2) a produit un systeme plus fiable que si on avait essaye de tout optimiser.',
    9.8, C.textDim);

  s.addNotes('Ce slide montre la maturite de l\'equipe. Des developpeurs juniors auraient sur-engineere (WebSockets, micro-services). Vous avez fait des choix pragmatiques justifies par le contexte. Cela rassure un jury technique autant qu\'un investisseur.');
}

// ─── SLIDE 12 — THANK YOU / Q&A ──────────────────────────────────────────────
function slide12() {
  const s = pptx.addSlide();
  bg(s, C.bgDeep);

  // Full-width accent top bar
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.33, h: 0.12,
    fill: { color: C.accent }, line: { color: C.accent },
  });

  // Right decorative panel
  s.addShape(pptx.ShapeType.rect, {
    x: 8.1, y: 0, w: 5.23, h: 7.5,
    fill: { color: C.bg }, line: { color: C.bg },
  });
  s.addShape(pptx.ShapeType.rect, {
    x: 8.1, y: 0, w: 0.04, h: 7.5,
    fill: { color: C.border2 }, line: { color: C.border2 },
  });

  // Main closing text
  s.addText('Merci.', {
    x: 0.62, y: 1.2, w: 7.0, h: 1.3,
    fontFace: FF_HEAD, fontSize: 64, bold: true,
    color: C.white, margin: 0,
  });
  s.addText("Questions &\nDemonstration", {
    x: 0.62, y: 2.62, w: 7.0, h: 0.96,
    fontFace: FF_HEAD, fontSize: 28, bold: false,
    color: C.accent, margin: 0,
  });

  separator(s, 0.62, 3.74, 7.0, C.border2);

  // Summary takeaways
  s.addText('BILAN', {
    x: 0.62, y: 3.92, w: 1.0, h: 0.2,
    fontFace: FF_BODY, fontSize: 8, bold: true,
    color: C.textDim, charSpacing: 1.5, margin: 0,
  });
  const takeaways = [
    [C.green,  'Le probleme traite est reel et frequent dans le secteur'],
    [C.accent, 'La solution repose sur des choix techniques defensables'],
    [C.purple, "L'architecture respecte la separation des responsabilites"],
    [C.amber,  "Le resultat parle autant au proprietaire qu'au jury technique"],
  ];
  takeaways.forEach((t, i) => {
    bulletRow(s, 0.62, 4.22 + i * 0.58, 7.0, t[1], t[0], C.textMuted, 11);
  });

  // Contact / right panel
  s.addText('BAGHDAD Mohamed', {
    x: 8.4, y: 1.4, w: 4.5, h: 0.42,
    fontFace: FF_HEAD, fontSize: 20, bold: true,
    color: C.white, margin: 0,
  });
  s.addText('BAAKKA Monssfe', {
    x: 8.4, y: 1.96, w: 4.5, h: 0.42,
    fontFace: FF_HEAD, fontSize: 20, bold: true,
    color: C.white, margin: 0,
  });

  separator(s, 8.4, 2.52, 4.5, C.border2);

  s.addText('Moul Hanout', {
    x: 8.4, y: 2.72, w: 4.5, h: 0.36,
    fontFace: FF_HEAD, fontSize: 18, bold: false,
    color: C.accent, margin: 0,
  });
  body(s, 8.4, 3.18, 4.5, 0.5,
    'Digital Transformation of Traditional Grocery Stores via Smart Tracking', 11, C.textMuted);

  separator(s, 8.4, 3.82, 4.5, C.border2);

  // Tech recap pills
  s.addText('STACK', {
    x: 8.4, y: 4.02, w: 1.0, h: 0.2,
    fontFace: FF_BODY, fontSize: 8, bold: true,
    color: C.textDim, charSpacing: 1.5, margin: 0,
  });
  const tpills = [
    ['NestJS', C.green, C.greenSoft],
    ['Next.js', C.accent, C.accentSoft],
    ['Prisma', C.purple, C.purpleSoft],
    ['PostgreSQL', C.amber, C.amberSoft],
  ];
  tpills.forEach((tp, i) => {
    const px = i < 2 ? 8.4 + i * 1.88 : 8.4 + (i - 2) * 1.88;
    const py = i < 2 ? 4.3 : 4.72;
    pill(s, px, py, 1.64, 0.3, tp[0], tp[2], tp[1], 9);
  });

  // Slide numbers summary
  s.addText('12 slides — NestJS + Next.js + PostgreSQL + Prisma + Redis', {
    x: 0.46, y: 7.12, w: 10, h: 0.2,
    fontFace: FF_BODY, fontSize: 8,
    color: C.textDim, margin: 0,
  });
  pageNum(s, 12);

  s.addNotes('Terminez avec confiance. Le systeme est en production, les choix sont justifies. Pour la demonstration: montrez le flux alerte → inventaire → correction → disparition de l\'alerte. C\'est le moment "wow" qui resonne avec tout le monde dans la salle.');
}

// ─── GENERATE ────────────────────────────────────────────────────────────────
slide01();
slide02();
slide03();
slide04();
slide05();
slide06();
slide07();
slide08();
slide09();
slide10();
slide11();
slide12();

const outPath = path.join(__dirname, 'inventory-alerts.pptx');
pptx.writeFile({ fileName: outPath }).then(() => {
  console.log('Generated:', outPath);
}).catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

'use strict';

const path = require('path');
const PptxGenJS = require('pptxgenjs');

const pptx = new PptxGenJS();

const C = {
  ink: '172033',
  inkSoft: '334155',
  slate: '64748B',
  line: 'D8E0EA',
  paper: 'F5F1E8',
  paperWarm: 'EEE7DA',
  white: 'FFFFFF',
  green: '1F6B52',
  greenSoft: 'DCEEE6',
  amber: 'B7791F',
  amberSoft: 'F6E7CB',
  red: 'B94A48',
  redSoft: 'F5D9D5',
  navy: '1E293B',
  navySoft: 'DCE4F0',
};

const FF_BODY = 'Aptos';
const FF_DISPLAY = 'Aptos Display';
const SLIDE_TOTAL = 12;

pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'BAGHDAD Mohamed & BAAKKA Monssfe';
pptx.company = 'Moul Hanout';
pptx.subject = 'Professional project presentation';
pptx.title = 'Moul Hanout - Inventory and Intelligent Alerts';
pptx.lang = 'fr-MA';
pptx.theme = {
  headFontFace: FF_DISPLAY,
  bodyFontFace: FF_BODY,
  lang: 'fr-MA',
};

function addPageFrame(slide, number, section, dark = false) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 7.5,
    line: { color: dark ? C.navy : C.paper, transparency: 100 },
    fill: { color: dark ? C.ink : C.paper },
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 0.42,
    y: 0.38,
    w: 12.49,
    h: 0.02,
    line: { color: dark ? C.ink : C.line },
    fill: { color: dark ? C.ink : C.line },
  });

  slide.addText(section.toUpperCase(), {
    x: 0.56,
    y: 0.17,
    w: 3.2,
    h: 0.18,
    fontFace: FF_BODY,
    fontSize: 8,
    bold: true,
    color: dark ? C.paperWarm : C.green,
    charSpacing: 1.6,
  });

  slide.addText(`${String(number).padStart(2, '0')} / ${SLIDE_TOTAL}`, {
    x: 12.15,
    y: 7.05,
    w: 0.7,
    h: 0.2,
    fontFace: FF_BODY,
    fontSize: 8,
    color: dark ? C.paperWarm : C.slate,
    align: 'right',
  });
}

function addTitle(slide, title, subtitle, options = {}) {
  const titleColor = options.dark ? C.white : C.ink;
  const subtitleColor = options.dark ? C.paperWarm : C.inkSoft;

  slide.addText(title, {
    x: 0.56,
    y: 0.58,
    w: 8.5,
    h: 0.76,
    fontFace: FF_DISPLAY,
    fontSize: options.size || 24,
    bold: true,
    color: titleColor,
    breakLine: false,
    margin: 0,
  });

  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.56,
      y: 1.18,
      w: 8.9,
      h: 0.45,
      fontFace: FF_BODY,
      fontSize: 10.5,
      color: subtitleColor,
      margin: 0,
    });
  }
}

function addCard(slide, x, y, w, h, opts = {}) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: opts.radius || 0.06,
    line: { color: opts.line || C.line, width: opts.lineWidth || 1 },
    fill: { color: opts.fill || C.white },
    shadow: opts.shadow
      ? { type: 'outer', color: 'BFC8D4', blur: 1, angle: 45, distance: 1, opacity: 0.18 }
      : undefined,
  });
}

function addMetric(slide, x, y, w, label, value, tone = 'green') {
  const fill = tone === 'amber' ? C.amberSoft : tone === 'red' ? C.redSoft : C.greenSoft;
  const accent = tone === 'amber' ? C.amber : tone === 'red' ? C.red : C.green;

  addCard(slide, x, y, w, 1.28, { fill: C.white, line: C.line });
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w: 0.08,
    h: 1.28,
    fill: { color: accent },
    line: { color: accent },
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: x + 0.22,
    y: y + 0.2,
    w: 0.42,
    h: 0.24,
    rectRadius: 0.03,
    fill: { color: fill },
    line: { color: fill },
  });
  slide.addText(label.toUpperCase(), {
    x: x + 0.78,
    y: y + 0.16,
    w: w - 0.92,
    h: 0.18,
    fontFace: FF_BODY,
    fontSize: 8,
    color: C.slate,
    bold: true,
    charSpacing: 1,
  });
  slide.addText(value, {
    x: x + 0.22,
    y: y + 0.52,
    w: w - 0.38,
    h: 0.42,
    fontFace: FF_DISPLAY,
    fontSize: 20,
    color: C.ink,
    bold: true,
    margin: 0,
  });
}

function addBulletList(slide, items, x, y, w, opts = {}) {
  const color = opts.color || C.inkSoft;
  const bulletColor = opts.bulletColor || C.green;
  items.forEach((item, index) => {
    const rowY = y + index * (opts.step || 0.42);
    slide.addShape(pptx.ShapeType.ellipse, {
      x,
      y: rowY + 0.06,
      w: 0.1,
      h: 0.1,
      fill: { color: bulletColor },
      line: { color: bulletColor },
    });
    slide.addText(item, {
      x: x + 0.18,
      y: rowY,
      w,
      h: 0.25,
      fontFace: FF_BODY,
      fontSize: opts.fontSize || 10.5,
      color,
      margin: 0,
    });
  });
}

function addQuote(slide, text, source, dark = false) {
  addCard(slide, 8.92, 0.92, 3.41, 2.15, {
    fill: dark ? C.navy : C.white,
    line: dark ? '42516A' : C.line,
  });
  slide.addText('Constat terrain', {
    x: 9.16,
    y: 1.16,
    w: 2.2,
    h: 0.2,
    fontFace: FF_BODY,
    fontSize: 8,
    color: dark ? C.paperWarm : C.green,
    bold: true,
    charSpacing: 1.2,
  });
  slide.addText(`"${text}"`, {
    x: 9.16,
    y: 1.48,
    w: 2.72,
    h: 0.9,
    fontFace: FF_DISPLAY,
    fontSize: 15,
    color: dark ? C.white : C.ink,
    italic: true,
    margin: 0,
  });
  slide.addText(source, {
    x: 9.16,
    y: 2.42,
    w: 2.5,
    h: 0.2,
    fontFace: FF_BODY,
    fontSize: 8.5,
    color: dark ? C.paperWarm : C.slate,
    margin: 0,
  });
}

function addFlowArrow(slide, x, y, w, color) {
  slide.addShape(pptx.ShapeType.chevron, {
    x,
    y,
    w,
    h: 0.28,
    fill: { color },
    line: { color },
  });
}

function addFooter(slide, text, dark = false) {
  slide.addText(text, {
    x: 0.56,
    y: 7.02,
    w: 8.5,
    h: 0.18,
    fontFace: FF_BODY,
    fontSize: 8,
    color: dark ? C.paperWarm : C.slate,
    margin: 0,
  });
}

function slide01() {
  const slide = pptx.addSlide();
  slide.background = { color: C.ink };

  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 7.5,
    line: { color: C.ink },
    fill: { color: C.ink },
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 0.64,
    y: 0.58,
    w: 0.14,
    h: 5.84,
    line: { color: C.green },
    fill: { color: C.green },
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 8.75,
    y: 0.92,
    w: 3.66,
    h: 5.62,
    line: { color: '314157' },
    fill: { color: C.navy },
  });

  slide.addText('TRANSFORMATION DIGITALE DU COMMERCE DE PROXIMITE', {
    x: 1.02,
    y: 0.72,
    w: 5.8,
    h: 0.22,
    fontFace: FF_BODY,
    fontSize: 8.5,
    color: C.greenSoft,
    bold: true,
    charSpacing: 1.8,
  });

  slide.addText('Moul Hanout', {
    x: 1.02,
    y: 1.2,
    w: 5.6,
    h: 0.85,
    fontFace: FF_DISPLAY,
    fontSize: 30,
    color: C.white,
    bold: true,
    margin: 0,
  });

  slide.addText('Inventaire intelligent et alertes automatiques pour eliminer les ruptures silencieuses en epicerie.', {
    x: 1.02,
    y: 2.12,
    w: 5.6,
    h: 0.72,
    fontFace: FF_BODY,
    fontSize: 14,
    color: C.paperWarm,
    margin: 0,
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 1.02,
    y: 3.18,
    w: 6.7,
    h: 0.02,
    line: { color: '42516A' },
    fill: { color: '42516A' },
  });

  addMetric(slide, 1.02, 3.48, 1.95, 'Problem', 'Ruptures');
  addMetric(slide, 3.15, 3.48, 1.95, 'Systeme', 'Temps reel');
  addMetric(slide, 5.28, 3.48, 1.95, 'Alerte', 'Automatique', 'amber');

  slide.addText('Equipe projet', {
    x: 1.02,
    y: 5.2,
    w: 1.4,
    h: 0.2,
    fontFace: FF_BODY,
    fontSize: 8.5,
    color: C.greenSoft,
    bold: true,
    charSpacing: 1.2,
  });

  slide.addText('BAGHDAD Mohamed\nBAAKKA Monssfe', {
    x: 1.02,
    y: 5.48,
    w: 3.2,
    h: 0.62,
    fontFace: FF_DISPLAY,
    fontSize: 17,
    color: C.white,
    bold: true,
    margin: 0,
  });

  slide.addText('NestJS\nNext.js\nPostgreSQL + Prisma\nRedis', {
    x: 9.16,
    y: 1.38,
    w: 2.2,
    h: 2.8,
    fontFace: FF_BODY,
    fontSize: 14,
    color: C.white,
    margin: 0,
    breakLine: true,
  });

  slide.addText('Architecture retenue', {
    x: 9.16,
    y: 4.88,
    w: 2.2,
    h: 0.18,
    fontFace: FF_BODY,
    fontSize: 8,
    color: C.paperWarm,
    bold: true,
    charSpacing: 1.2,
  });

  slide.addText('Backend = source de verite\nFrontend = couche de pilotage\nAlertes = moteur de decision metier', {
    x: 9.16,
    y: 5.18,
    w: 2.66,
    h: 0.9,
    fontFace: FF_BODY,
    fontSize: 10.5,
    color: C.paperWarm,
    margin: 0,
  });

  slide.addText('01 / 12', {
    x: 12.15,
    y: 7.05,
    w: 0.7,
    h: 0.2,
    fontFace: FF_BODY,
    fontSize: 8,
    color: C.paperWarm,
    align: 'right',
  });
}

function slide02() {
  const slide = pptx.addSlide();
  addPageFrame(slide, 2, 'Contexte');
  addTitle(
    slide,
    "La rupture n'est pas un manque de stock, c'est un manque de visibilite.",
    "Le projet part d'un probleme operationnel simple: le magasin perd des ventes alors que le produit existe parfois encore en reserve."
  );
  addQuote(
    slide,
    "Le client demande, le rayon est vide, et on decouvre trop tard qu'il restait encore des unites ailleurs.",
    'Observation type en epicerie traditionnelle'
  );

  addCard(slide, 0.56, 1.98, 8.04, 1.36, { fill: C.white, line: C.line, shadow: true });
  slide.addText('Scene de depart', {
    x: 0.82,
    y: 2.18,
    w: 1.6,
    h: 0.18,
    fontFace: FF_BODY,
    fontSize: 8.2,
    color: C.green,
    bold: true,
    charSpacing: 1.2,
  });
  slide.addText(
    "Lundi matin. Un client demande une Coca-Cola. Le rayon semble vide, le vendeur s'excuse, et la vente est perdue. Pourtant, trois caisses sont encore en reserve: personne ne les a reliees au stock utile.",
    {
      x: 0.82,
      y: 2.48,
      w: 7.45,
      h: 0.58,
      fontFace: FF_BODY,
      fontSize: 12.5,
      color: C.ink,
      margin: 0,
    }
  );

  const pains = [
    ['Suivi manuel', 'Aucune vision fiable du stock reel par produit.'],
    ['Expiration oubliee', 'Les dates sont notees sur papier ou pas notees du tout.'],
    ['Alerte tardive', "Le probleme n'apparait qu'au moment ou le client demande."],
    ['Decision faible', 'Le proprietaire ne sait pas quoi reapprovisionner en priorite.'],
  ];

  pains.forEach((item, index) => {
    const x = 0.56 + index * 3.08;
    addCard(slide, x, 3.78, 2.76, 2.28, { fill: C.white, line: C.line });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: x + 0.22,
      y: 4.02,
      w: 0.46,
      h: 0.26,
      rectRadius: 0.03,
      fill: { color: index === 1 ? C.amberSoft : index === 2 ? C.redSoft : C.greenSoft },
      line: { color: index === 1 ? C.amberSoft : index === 2 ? C.redSoft : C.greenSoft },
    });
    slide.addText(item[0], {
      x: x + 0.22,
      y: 4.42,
      w: 2.22,
      h: 0.32,
      fontFace: FF_DISPLAY,
      fontSize: 14.5,
      color: C.ink,
      bold: true,
      margin: 0,
    });
    slide.addText(item[1], {
      x: x + 0.22,
      y: 4.86,
      w: 2.26,
      h: 0.76,
      fontFace: FF_BODY,
      fontSize: 10.2,
      color: C.inkSoft,
      margin: 0,
    });
  });

  addFooter(slide, 'Le besoin metier a guider le projet: rendre visible ce qui etait invisible.');
}

function slide03() {
  const slide = pptx.addSlide();
  addPageFrame(slide, 3, 'Proposition');
  addTitle(
    slide,
    'La solution transforme un stock passif en systeme de surveillance actif.',
    "L'inventaire n'est plus un simple tableau: chaque mouvement alimente un moteur d'alertes et une interface de decision pour le proprietaire."
  );

  addMetric(slide, 0.56, 1.95, 2.2, 'PILIER 1', 'Stock trace');
  addMetric(slide, 2.92, 1.95, 2.2, 'PILIER 2', 'Seuils produits', 'amber');
  addMetric(slide, 5.28, 1.95, 2.2, 'PILIER 3', 'Alertes fiables', 'red');

  addCard(slide, 0.56, 3.05, 7.2, 2.62, { fill: C.white, line: C.line, shadow: true });
  slide.addText('Mecanique de valeur', {
    x: 0.82,
    y: 3.28,
    w: 1.8,
    h: 0.18,
    fontFace: FF_BODY,
    fontSize: 8.2,
    color: C.green,
    bold: true,
    charSpacing: 1.2,
  });

  const steps = [
    { title: 'Chaque entree ou sortie met a jour currentStock', x: 0.86, color: C.greenSoft },
    { title: 'Le seuil produit et la date d expiration sont reevalues', x: 3.18, color: C.amberSoft },
    { title: "Le proprietaire recoit l'alerte avant la rupture", x: 5.5, color: C.redSoft },
  ];

  steps.forEach((step) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: step.x,
      y: 3.76,
      w: 1.78,
      h: 1.22,
      rectRadius: 0.05,
      fill: { color: step.color },
      line: { color: C.line },
    });
    slide.addText(step.title, {
      x: step.x + 0.16,
      y: 4.02,
      w: 1.46,
      h: 0.72,
      fontFace: FF_BODY,
      fontSize: 10.2,
      color: C.ink,
      align: 'center',
      valign: 'mid',
      bold: true,
      margin: 0.03,
    });
  });

  addFlowArrow(slide, 2.7, 4.22, 0.34, C.green);
  addFlowArrow(slide, 5.02, 4.22, 0.34, C.amber);

  addCard(slide, 8.1, 1.95, 4.25, 3.72, { fill: C.ink, line: C.ink });
  slide.addText('Resultat attendu', {
    x: 8.38,
    y: 2.22,
    w: 2.2,
    h: 0.2,
    fontFace: FF_BODY,
    fontSize: 8.2,
    color: C.paperWarm,
    bold: true,
    charSpacing: 1.2,
  });
  addBulletList(
    slide,
    [
      'Le magasin sait quel produit manque vraiment.',
      "Le proprietaire voit les priorites avant l'impact client.",
      "Les dates d'expiration deviennent exploitables.",
      'Le systeme supprime les alertes quand la condition disparait.',
    ],
    8.38,
    2.62,
    3.25,
    { color: C.white, bulletColor: C.greenSoft, step: 0.52, fontSize: 10.4 }
  );

  addFooter(slide, "La promesse du projet: passer d'une reaction tardive a une prevention continue.");
}

function slide04() {
  const slide = pptx.addSlide();
  addPageFrame(slide, 4, 'Architecture');
  addTitle(
    slide,
    "L'architecture relie la caisse, l'inventaire et les alertes sans casser les frontieres du systeme.",
    "Le backend reste la source de verite, le frontend orchestre les actions, et le module d'alertes agit comme moteur metier specialise."
  );

  const cols = [
    {
      x: 0.7,
      title: 'Frontend Next.js',
      color: C.greenSoft,
      bullets: ['Dashboard proprietaire', 'Inventaire et alertes', 'Badge et polling 30 s'],
    },
    {
      x: 4.47,
      title: 'API NestJS',
      color: C.navySoft,
      bullets: ['Controllers fins', 'Services metier', 'Validation et roles'],
    },
    {
      x: 8.24,
      title: 'Donnees et moteurs',
      color: C.amberSoft,
      bullets: ['Prisma + PostgreSQL', 'Transactions stock', 'Reconciliation alertes'],
    },
  ];

  cols.forEach((col) => {
    addCard(slide, col.x, 2.08, 3.22, 3.34, { fill: C.white, line: C.line, shadow: true });
    slide.addShape(pptx.ShapeType.rect, {
      x: col.x,
      y: 2.08,
      w: 3.22,
      h: 0.16,
      fill: { color: C.ink },
      line: { color: C.ink },
    });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: col.x + 0.24,
      y: 2.42,
      w: 0.54,
      h: 0.28,
      rectRadius: 0.03,
      fill: { color: col.color },
      line: { color: col.color },
    });
    slide.addText(col.title, {
      x: col.x + 0.24,
      y: 2.84,
      w: 2.56,
      h: 0.32,
      fontFace: FF_DISPLAY,
      fontSize: 14.5,
      color: C.ink,
      bold: true,
      margin: 0,
    });
    addBulletList(slide, col.bullets, col.x + 0.24, 3.36, 2.55, {
      step: 0.5,
      fontSize: 10.3,
      color: C.inkSoft,
      bulletColor: C.green,
    });
  });

  addFlowArrow(slide, 3.96, 3.62, 0.28, C.green);
  addFlowArrow(slide, 7.73, 3.62, 0.28, C.amber);

  addCard(slide, 1.1, 5.82, 11.15, 0.72, { fill: C.paperWarm, line: C.line });
  slide.addText(
    "Contrat architectural retenu: le frontend consomme l'API, les services portent la logique metier, Prisma est l'unique acces a la base, et le port ALERTS_PORT evite le couplage direct entre modules.",
    {
      x: 1.34,
      y: 6.06,
      w: 10.55,
      h: 0.22,
      fontFace: FF_BODY,
      fontSize: 10.4,
      color: C.ink,
      align: 'center',
      margin: 0,
    }
  );

  addFooter(slide, 'Cette architecture respecte la separation backend / frontend / shared definie dans le projet.');
}

function slide05() {
  const slide = pptx.addSlide();
  addPageFrame(slide, 5, 'Flux metier');
  addTitle(
    slide,
    "Une vente finalisee declenche un flux atomique qui maintient le stock et les alertes coherents.",
    "Le point cle n'est pas l'interface: c'est la transaction backend qui empile mouvement, stock, audit et alertes dans une seule unite de travail."
  );

  const flow = [
    ['1', 'Validation vente', 'Le POS confirme les lignes et les quantites vendues.'],
    ['2', 'Mise a jour stock', 'currentStock est decremente produit par produit.'],
    ['3', 'Audit mouvement', 'Le mouvement est ecrit pour garder la trace.'],
    ['4', 'Reevaluation alertes', 'LOW_STOCK et EXPIRY sont recalcules.'],
    ['5', 'Notification owner', 'Badge dashboard et e-mail prennent le relai.'],
  ];

  flow.forEach((step, index) => {
    const x = 0.74 + index * 2.48;
    addCard(slide, x, 2.38, 2.08, 2.36, {
      fill: index === 3 ? C.amberSoft : index === 4 ? C.greenSoft : C.white,
      line: C.line,
      shadow: true,
    });
    slide.addText(step[0], {
      x: x + 0.18,
      y: 2.58,
      w: 0.32,
      h: 0.24,
      fontFace: FF_DISPLAY,
      fontSize: 18,
      bold: true,
      color: C.green,
      margin: 0,
    });
    slide.addText(step[1], {
      x: x + 0.18,
      y: 2.98,
      w: 1.62,
      h: 0.32,
      fontFace: FF_DISPLAY,
      fontSize: 13.5,
      bold: true,
      color: C.ink,
      margin: 0,
    });
    slide.addText(step[2], {
      x: x + 0.18,
      y: 3.44,
      w: 1.68,
      h: 0.82,
      fontFace: FF_BODY,
      fontSize: 9.9,
      color: C.inkSoft,
      margin: 0,
    });

    if (index < flow.length - 1) {
      addFlowArrow(slide, x + 2.02, 3.44, 0.28, index === 2 ? C.amber : C.green);
    }
  });

  addCard(slide, 0.74, 5.18, 12.0, 0.82, { fill: C.ink, line: C.ink });
  slide.addText(
    "Point critique: les etapes 2 a 4 vivent dans la meme transaction Prisma. Si la reevaluation des alertes echoue, la modification de stock est annulee elle aussi. Le systeme ne laisse jamais un stock modifie avec des alertes incoherentes.",
    {
      x: 1.0,
      y: 5.45,
      w: 11.48,
      h: 0.26,
      fontFace: FF_BODY,
      fontSize: 10.5,
      color: C.white,
      align: 'center',
      margin: 0,
    }
  );

  addFooter(slide, "La coherence transactionnelle est l'argument technique le plus fort de la solution.");
}

function slide06() {
  const slide = pptx.addSlide();
  addPageFrame(slide, 6, 'Module inventaire');
  addTitle(
    slide,
    "Le module inventaire convertit chaque produit en objet de pilotage, pas seulement en ligne de catalogue.",
    "La qualite du systeme vient des champs metier retenus et de la discipline de mise a jour imposee par le service backend."
  );

  addCard(slide, 0.56, 1.98, 4.12, 3.98, { fill: C.white, line: C.line, shadow: true });
  slide.addText('Champs structurants', {
    x: 0.82,
    y: 2.22,
    w: 1.7,
    h: 0.18,
    fontFace: FF_BODY,
    fontSize: 8.2,
    color: C.green,
    bold: true,
    charSpacing: 1.2,
  });

  const fields = [
    ['currentStock', 'Quantite exploitable en temps reel'],
    ['lowStockThreshold', "Seuil qui declenche l'alerte"],
    ['expirationDate', 'Base des alertes de peremption'],
    ['stockMovements', 'Historique de toutes les entrees et sorties'],
    ['auditLogs', 'Trace des actions sensibles'],
  ];

  fields.forEach((field, index) => {
    const rowY = 2.64 + index * 0.62;
    slide.addText(field[0], {
      x: 0.82,
      y: rowY,
      w: 1.4,
      h: 0.22,
      fontFace: FF_DISPLAY,
      fontSize: 11.2,
      bold: true,
      color: C.ink,
      margin: 0,
    });
    slide.addText(field[1], {
      x: 2.28,
      y: rowY,
      w: 1.94,
      h: 0.22,
      fontFace: FF_BODY,
      fontSize: 9.9,
      color: C.inkSoft,
      margin: 0,
    });
    if (index < fields.length - 1) {
      slide.addShape(pptx.ShapeType.rect, {
        x: 0.82,
        y: rowY + 0.3,
        w: 3.52,
        h: 0.01,
        fill: { color: C.line },
        line: { color: C.line },
      });
    }
  });

  addCard(slide, 5.02, 1.98, 3.08, 3.98, { fill: C.paperWarm, line: C.line });
  slide.addText('Regles de service', {
    x: 5.28,
    y: 2.22,
    w: 1.55,
    h: 0.18,
    fontFace: FF_BODY,
    fontSize: 8.2,
    color: C.amber,
    bold: true,
    charSpacing: 1.2,
  });
  addBulletList(
    slide,
    [
      'Aucune logique metier en controller.',
      'Aucun acces SQL hors Prisma.',
      'Stock IN et Stock OUT passent par le service.',
      "Chaque mouvement peut alimenter l'alerting.",
      'Le module reste isole et testable.',
    ],
    5.28,
    2.62,
    2.2,
    { step: 0.54, fontSize: 10.1, color: C.inkSoft, bulletColor: C.amber }
  );

  addCard(slide, 8.44, 1.98, 4.33, 3.98, { fill: C.ink, line: C.ink });
  slide.addText('Pourquoi cela compte', {
    x: 8.74,
    y: 2.22,
    w: 1.75,
    h: 0.18,
    fontFace: FF_BODY,
    fontSize: 8.2,
    color: C.paperWarm,
    bold: true,
    charSpacing: 1.2,
  });
  slide.addText(
    "Le module inventaire n'est pas un ecran d'administration. Il devient la base de calcul de toute la supervision magasin. Plus ce module est propre, plus les alertes, les rapports et les decisions proprietaire sont fiables.",
    {
      x: 8.74,
      y: 2.62,
      w: 3.46,
      h: 1.4,
      fontFace: FF_BODY,
      fontSize: 11.2,
      color: C.white,
      margin: 0,
    }
  );
  slide.addShape(pptx.ShapeType.rect, {
    x: 8.74,
    y: 4.5,
    w: 3.1,
    h: 0.02,
    fill: { color: '42516A' },
    line: { color: '42516A' },
  });
  slide.addText('Principe retenu: un produit = un etat de stock + un contexte de risque.', {
    x: 8.74,
    y: 4.74,
    w: 3.32,
    h: 0.44,
    fontFace: FF_DISPLAY,
    fontSize: 13,
    color: C.paperWarm,
    bold: true,
    margin: 0,
  });

  addFooter(slide, "Le choix des donnees metier explique la qualite du reste de la plateforme.");
}

function slide07() {
  const slide = pptx.addSlide();
  addPageFrame(slide, 7, 'Module alertes');
  addTitle(
    slide,
    "Le moteur d'alertes ne se contente pas de creer des notifications: il maintient un etat propre et sans doublons.",
    "La valeur vient de la reconciliation: creer une alerte quand la condition apparait, la conserver tant qu'elle reste vraie, puis la supprimer quand le risque disparait."
  );

  addCard(slide, 0.56, 2.04, 3.78, 3.84, { fill: C.white, line: C.line, shadow: true });
  addCard(slide, 4.78, 2.04, 3.78, 3.84, { fill: C.white, line: C.line, shadow: true });
  addCard(slide, 9.0, 2.04, 3.22, 3.84, { fill: C.ink, line: C.ink });

  slide.addText('Deux types surveilles', {
    x: 0.82,
    y: 2.28,
    w: 1.82,
    h: 0.18,
    fontFace: FF_BODY,
    fontSize: 8.2,
    color: C.green,
    bold: true,
    charSpacing: 1.2,
  });
  addBulletList(
    slide,
    [
      'LOW_STOCK: currentStock <= lowStockThreshold',
      'EXPIRY: date de peremption proche',
      'Fenetre de 5 jours pour les produits a risque',
    ],
    0.82,
    2.72,
    2.9,
    { step: 0.58, fontSize: 10.3, color: C.inkSoft, bulletColor: C.green }
  );

  slide.addText('Logique de reconciliation', {
    x: 5.04,
    y: 2.28,
    w: 2.0,
    h: 0.18,
    fontFace: FF_BODY,
    fontSize: 8.2,
    color: C.amber,
    bold: true,
    charSpacing: 1.2,
  });
  addBulletList(
    slide,
    [
      'Condition vraie + pas d alerte -> creation',
      'Condition vraie + alerte existante -> conservation',
      'Condition fausse + alerte existante -> suppression',
      'Resultat: aucune alerte fantome ou en double',
    ],
    5.04,
    2.72,
    2.82,
    { step: 0.5, fontSize: 10.1, color: C.inkSoft, bulletColor: C.amber }
  );

  slide.addText('Impact produit', {
    x: 9.3,
    y: 2.3,
    w: 1.5,
    h: 0.18,
    fontFace: FF_BODY,
    fontSize: 8.2,
    color: C.paperWarm,
    bold: true,
    charSpacing: 1.2,
  });
  slide.addText(
    "Le proprietaire voit uniquement les alertes utiles. Le signal reste credible, donc il est consulte et traite.",
    {
      x: 9.3,
      y: 2.72,
      w: 2.3,
      h: 0.86,
      fontFace: FF_BODY,
      fontSize: 11,
      color: C.white,
      margin: 0,
    }
  );
  slide.addShape(pptx.ShapeType.rect, {
    x: 9.3,
    y: 3.94,
    w: 2.25,
    h: 0.02,
    fill: { color: '42516A' },
    line: { color: '42516A' },
  });
  slide.addText('Une bonne alerte est rare, precise et actionnable.', {
    x: 9.3,
    y: 4.16,
    w: 2.45,
    h: 0.46,
    fontFace: FF_DISPLAY,
    fontSize: 13,
    color: C.paperWarm,
    bold: true,
    margin: 0,
  });

  addFooter(slide, "Le moteur d'alertes est un module metier, pas un simple service d'envoi.");
}

function slide08() {
  const slide = pptx.addSlide();
  addPageFrame(slide, 8, 'Experience utilisateur');
  addTitle(
    slide,
    "L'experience proprietaire est concise: voir l'alerte, ouvrir le produit, corriger le stock, fermer le risque.",
    "Le parcours evite les ecrans inutiles et relie directement le signal, le contexte et l'action de correction."
  );

  const journey = [
    ['1', 'Badge rouge', 'Le compteur non lu est visible depuis la navigation.'],
    ['2', 'Dropdown alertes', "Le proprietaire ouvre les 5 alertes prioritaires et clique sur le produit."],
    ['3', 'Inventaire cible', 'Le produit est preselectionne pour gagner du temps.'],
    ['4', 'Stock IN / correction', 'La quantite et le motif sont saisis en une action.'],
    ['5', 'Disparition automatique', "L'alerte est supprimee si le seuil n'est plus atteint."],
  ];

  journey.forEach((step, index) => {
    const y = 1.96 + index * 0.9;
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 0.74,
      y: y + 0.03,
      w: 0.34,
      h: 0.34,
      fill: { color: index === 4 ? C.green : C.ink },
      line: { color: index === 4 ? C.green : C.ink },
    });
    slide.addText(step[0], {
      x: 0.74,
      y: y + 0.08,
      w: 0.34,
      h: 0.12,
      fontFace: FF_BODY,
      fontSize: 9,
      color: C.white,
      bold: true,
      align: 'center',
      margin: 0,
    });
    addCard(slide, 1.28, y, 6.45, 0.56, { fill: C.white, line: C.line });
    slide.addText(step[1], {
      x: 1.54,
      y: y + 0.12,
      w: 1.84,
      h: 0.18,
      fontFace: FF_DISPLAY,
      fontSize: 12.6,
      color: C.ink,
      bold: true,
      margin: 0,
    });
    slide.addText(step[2], {
      x: 3.58,
      y: y + 0.12,
      w: 3.72,
      h: 0.18,
      fontFace: FF_BODY,
      fontSize: 9.7,
      color: C.inkSoft,
      margin: 0,
    });
  });

  addCard(slide, 8.12, 1.96, 4.18, 4.48, { fill: C.paperWarm, line: C.line, shadow: true });
  slide.addText('Pourquoi le parcours fonctionne', {
    x: 8.4,
    y: 2.22,
    w: 2.1,
    h: 0.18,
    fontFace: FF_BODY,
    fontSize: 8.2,
    color: C.amber,
    bold: true,
    charSpacing: 1.2,
  });
  addBulletList(
    slide,
    [
      'Le signal est toujours visible.',
      "L'interface conduit vers l'action au lieu de demander une recherche.",
      'Le temps entre detection et correction est minimal.',
      "Le systeme confirme la resolution sans demander d'action manuelle supplementaire.",
    ],
    8.4,
    2.66,
    3.2,
    { step: 0.62, fontSize: 10.3, color: C.ink, bulletColor: C.amber }
  );
  slide.addText('L UX est bonne car elle suit le processus metier reel du proprietaire.', {
    x: 8.4,
    y: 5.38,
    w: 3.1,
    h: 0.4,
    fontFace: FF_DISPLAY,
    fontSize: 13,
    color: C.ink,
    bold: true,
    margin: 0,
  });

  addFooter(slide, "La presentation du produit n'est pas decorative: elle sert la rapidite d'intervention.");
}

function slide09() {
  const slide = pptx.addSlide();
  addPageFrame(slide, 9, 'Choix techniques');
  addTitle(
    slide,
    "Trois decisions d'architecture donnent au projet sa solidite technique.",
    "Elles ne sont pas visibles au premier regard, mais ce sont elles qui rendent le systeme coherent, maintenable et evolutif."
  );

  const decisions = [
    {
      x: 0.56,
      title: "Port d'alertes",
      body: "InventoryService depend d'une abstraction ALERTS_PORT au lieu d'importer directement AlertsService. Les modules restent decouples et testables.",
      tag: 'Decouplage',
      tone: C.greenSoft,
    },
    {
      x: 4.48,
      title: 'Transaction Prisma',
      body: "Stock, mouvement, audit et alertes vivent dans la meme transaction. L'application evite les etats partiels et les corrections manuelles.",
      tag: 'Cohherence',
      tone: C.amberSoft,
    },
    {
      x: 8.4,
      title: 'currentStock en cache',
      body: "La colonne currentStock evite de recalculer le stock depuis tout l'historique a chaque lecture. Le reporting reste rapide sans sacrifier la trace.",
      tag: 'Performance',
      tone: C.navySoft,
    },
  ];

  decisions.forEach((decision) => {
    addCard(slide, decision.x, 2.12, 3.36, 3.88, { fill: C.white, line: C.line, shadow: true });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: decision.x + 0.24,
      y: 2.4,
      w: 0.86,
      h: 0.26,
      rectRadius: 0.03,
      fill: { color: decision.tone },
      line: { color: decision.tone },
    });
    slide.addText(decision.tag.toUpperCase(), {
      x: decision.x + 0.28,
      y: 2.46,
      w: 0.78,
      h: 0.12,
      fontFace: FF_BODY,
      fontSize: 8,
      color: C.ink,
      bold: true,
      charSpacing: 1,
      align: 'center',
      margin: 0,
    });
    slide.addText(decision.title, {
      x: decision.x + 0.24,
      y: 2.92,
      w: 2.6,
      h: 0.4,
      fontFace: FF_DISPLAY,
      fontSize: 15.5,
      color: C.ink,
      bold: true,
      margin: 0,
    });
    slide.addText(decision.body, {
      x: decision.x + 0.24,
      y: 3.52,
      w: 2.82,
      h: 1.6,
      fontFace: FF_BODY,
      fontSize: 10.4,
      color: C.inkSoft,
      margin: 0,
    });
  });

  addFooter(slide, "Ces choix montrent que la qualite d'un projet se joue autant dans les contrats internes que dans les ecrans.");
}

function slide10() {
  const slide = pptx.addSlide();
  addPageFrame(slide, 10, 'Avant / apres');
  addTitle(
    slide,
    'Le projet remplace une logique de reaction par une logique de prevention.',
    "Le gain n'est pas seulement esthetique ou technique: il change le moment ou le proprietaire prend sa decision."
  );

  addCard(slide, 0.72, 2.02, 5.78, 3.94, { fill: 'F8EFEF', line: 'E8C6C5', shadow: true });
  addCard(slide, 6.82, 2.02, 5.78, 3.94, { fill: 'EEF7F2', line: 'CDE4D8', shadow: true });

  slide.addText('AVANT', {
    x: 1.0,
    y: 2.28,
    w: 0.9,
    h: 0.18,
    fontFace: FF_BODY,
    fontSize: 8.4,
    bold: true,
    color: C.red,
    charSpacing: 1.4,
  });
  slide.addText('Le magasin voit le probleme quand il est deja trop tard.', {
    x: 1.0,
    y: 2.66,
    w: 4.6,
    h: 0.38,
    fontFace: FF_DISPLAY,
    fontSize: 18,
    color: C.ink,
    bold: true,
    margin: 0,
  });
  addBulletList(
    slide,
    [
      'Stock verifie manuellement ou de memoire',
      'Dates de peremption hors systeme',
      'Rupture detectee devant le client',
      'Reapprovisionnement decide trop tard',
    ],
    1.0,
    3.34,
    4.4,
    { step: 0.56, fontSize: 10.5, color: C.inkSoft, bulletColor: C.red }
  );

  slide.addText('APRES', {
    x: 7.12,
    y: 2.28,
    w: 0.9,
    h: 0.18,
    fontFace: FF_BODY,
    fontSize: 8.4,
    bold: true,
    color: C.green,
    charSpacing: 1.4,
  });
  slide.addText("Le systeme anticipe le risque et pousse l'action utile.", {
    x: 7.12,
    y: 2.66,
    w: 4.7,
    h: 0.38,
    fontFace: FF_DISPLAY,
    fontSize: 18,
    color: C.ink,
    bold: true,
    margin: 0,
  });
  addBulletList(
    slide,
    [
      'Stock visible produit par produit',
      'Seuils et dates surveilles en continu',
      "Alertes visibles avant l'impact client",
      'Correction guidee depuis le dashboard',
    ],
    7.12,
    3.34,
    4.45,
    { step: 0.56, fontSize: 10.5, color: C.inkSoft, bulletColor: C.green }
  );

  addFooter(slide, "Le changement principal: le magasin devient capable d'agir avant la perte de vente.");
}

function slide11() {
  const slide = pptx.addSlide();
  addPageFrame(slide, 11, 'Apprentissages');
  addTitle(
    slide,
    'Le projet a confirme que la simplicite bien placee vaut mieux que la complexite spectaculaire.',
    "Trois apprentissages ressortent de l'implementation et expliquent aussi nos arbitrages techniques."
  );

  const lessons = [
    [
      'Le decouplage est utile tout de suite',
      "L'interface ALERTS_PORT n'a pas servi seulement pour plus tard: elle a clarifie le service inventaire des le developpement.",
    ],
    [
      'La transaction achete de la confiance',
      "Le cout de mise en oeuvre est faible par rapport au risque d'un stock modifie avec des alertes fausses ou absentes.",
    ],
    [
      'Le polling simple a gagne',
      "Un rafraichissement toutes les 30 secondes est suffisant pour ce cas d'usage et reste plus robuste qu'un temps reel sur-engineere.",
    ],
  ];

  lessons.forEach((lesson, index) => {
    const y = 2.08 + index * 1.42;
    addCard(slide, 0.76, y, 11.86, 1.04, { fill: C.white, line: C.line, shadow: true });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 1.02,
      y: y + 0.24,
      w: 0.52,
      h: 0.26,
      rectRadius: 0.03,
      fill: { color: index === 1 ? C.amberSoft : C.greenSoft },
      line: { color: index === 1 ? C.amberSoft : C.greenSoft },
    });
    slide.addText(`${index + 1}`.padStart(2, '0'), {
      x: 1.02,
      y: y + 0.29,
      w: 0.52,
      h: 0.1,
      fontFace: FF_BODY,
      fontSize: 8.5,
      color: C.ink,
      bold: true,
      align: 'center',
      margin: 0,
    });
    slide.addText(lesson[0], {
      x: 1.84,
      y: y + 0.2,
      w: 3.2,
      h: 0.22,
      fontFace: FF_DISPLAY,
      fontSize: 14,
      bold: true,
      color: C.ink,
      margin: 0,
    });
    slide.addText(lesson[1], {
      x: 5.18,
      y: y + 0.2,
      w: 6.96,
      h: 0.38,
      fontFace: FF_BODY,
      fontSize: 10.3,
      color: C.inkSoft,
      margin: 0,
    });
  });

  addFooter(slide, "Les meilleures decisions du projet sont celles qui ont augmente la clarte du systeme.");
}

function slide12() {
  const slide = pptx.addSlide();
  slide.background = { color: C.ink };
  addPageFrame(slide, 12, 'Conclusion', true);

  slide.addText('Conclusion', {
    x: 0.56,
    y: 0.7,
    w: 2.0,
    h: 0.22,
    fontFace: FF_BODY,
    fontSize: 8.5,
    bold: true,
    color: C.greenSoft,
    charSpacing: 1.8,
  });
  slide.addText("Le projet ne se contente pas d'afficher le stock: il le rend exploitable.", {
    x: 0.56,
    y: 1.14,
    w: 7.5,
    h: 0.82,
    fontFace: FF_DISPLAY,
    fontSize: 28,
    color: C.white,
    bold: true,
    margin: 0,
  });
  slide.addText(
    "Moul Hanout montre comment une architecture propre, un module inventaire discipline et un moteur d'alertes bien concu peuvent transformer une epicerie traditionnelle en systeme de decision fiable.",
    {
      x: 0.56,
      y: 2.18,
      w: 6.9,
      h: 0.8,
      fontFace: FF_BODY,
      fontSize: 13,
      color: C.paperWarm,
      margin: 0,
    }
  );

  addMetric(slide, 0.56, 3.46, 2.16, 'GAIN 1', 'Visibilite');
  addMetric(slide, 2.92, 3.46, 2.16, 'GAIN 2', 'Cohherence', 'amber');
  addMetric(slide, 5.28, 3.46, 2.16, 'GAIN 3', 'Action', 'red');

  addCard(slide, 8.1, 1.28, 4.18, 4.8, { fill: C.navy, line: '42516A' });
  slide.addText('Message final', {
    x: 8.42,
    y: 1.64,
    w: 1.8,
    h: 0.18,
    fontFace: FF_BODY,
    fontSize: 8.2,
    color: C.paperWarm,
    bold: true,
    charSpacing: 1.2,
  });
  addBulletList(
    slide,
    [
      'Le probleme traite est concret et frequent.',
      'La solution repose sur des choix techniques defensables.',
      "L'architecture respecte les frontieres du projet.",
      "Le resultat parle autant au proprietaire qu'a l'equipe d'evaluation.",
    ],
    8.42,
    2.14,
    3.1,
    { step: 0.62, fontSize: 10.6, color: C.white, bulletColor: C.greenSoft }
  );
  slide.addText('Merci.', {
    x: 8.42,
    y: 5.2,
    w: 1.2,
    h: 0.34,
    fontFace: FF_DISPLAY,
    fontSize: 18,
    color: C.white,
    bold: true,
    margin: 0,
  });
  slide.addText('Questions et demonstration', {
    x: 8.42,
    y: 5.54,
    w: 2.6,
    h: 0.22,
    fontFace: FF_BODY,
    fontSize: 10.2,
    color: C.paperWarm,
    margin: 0,
  });

  addFooter(slide, 'Deck genere depuis presentation/generate.js', true);
}

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

const outPath = path.join(__dirname, 'moul-hanout-inventory-alerts-professional.pptx');

pptx.writeFile({ fileName: outPath }).then(() => {
  console.log(`Presentation generated: ${outPath}`);
});

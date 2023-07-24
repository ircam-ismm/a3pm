export default function getTransform(annotationType, order, refOrder) {
  switch (annotationType) {
    case 'slider': return getTransformSlider(order, refOrder);
    case 'triangle': return getTransformTriangle(order, refOrder);
    case 'square': return getTransformSquare(order, refOrder);
  }
}

function getOrder(order, refOrder) {
  let indexOrder = '';
  for (let i = 0; i < refOrder.length; i++) {
    indexOrder = indexOrder + refOrder.indexOf(order[i]);
  }
  return indexOrder;
}

function getTransformSlider(order, refOrder) {
  const indexOrder = getOrder(order, refOrder);
  switch (indexOrder) {
    case '01': return id;
    case '10': return sliderSym;
  }
}

function getTransformTriangle(order, refOrder) {
  const indexOrder = getOrder(order, refOrder);
  switch (indexOrder) {
    case '012': return id;
    case '201': return (u => rotate(u, 2 * Math.PI / 3));
    case '120': return (u => rotate(u, 4 * Math.PI / 3));
    case '021': return symVert;
    case '102': return (u => symVert(rotate(u, 2 * Math.PI / 3)));
    case '210': return (u => symVert(rotate(u, 4 * Math.PI / 3)));
  }
}

function getTransformSquare(order, refOrder) {
  const indexOrder = getOrder(order, refOrder);
  switch (indexOrder) {
    case '0123': return id;
    case '0132': return swapCD;
    case '0213': return swapBC;
    case '0231': return (u => swapCD(symVert(u)));
    case '0312': return (u => swapBC(symVert(u)));
    case '0321': return symVert;
    case '1023': return (u => swapCD(symVert(rotate(u, Math.PI / 2))));
    case '1032': return (u => rotate(symVert(u), -Math.PI / 2));
    case '1203': return (u => swapBC(symVert(rotate(u, Math.PI))));
    case '1230': return (u => rotate(u, -Math.PI / 2));
    case '1302': return (u => swapBC(rotate(u, Math.PI)));
    case '1320': return (u => swapCD(rotate(u, -Math.PI / 2)));
    case '2013': return (u => swapCD(rotate(u, Math.PI / 2)));
    case '2031': return (u => swapBC(symVert(rotate(u, Math.PI / 2))));
    case '2103': return (u => rotate(symVert(u), Math.PI));
    case '2130': return (u => swapBC(rotate(u, -Math.PI / 2)));
    case '2301': return (u => rotate(u, Math.PI));
    case '2310': return (u => swapCD(symVert(rotate(u, -Math.PI / 2))));
    case '3012': return (u => rotate(u, Math.PI / 2));
    case '3021': return (u => swapBC(rotate(u, Math.PI / 2)));
    case '3102': return (u => swapCD(symVert(rotate(u, Math.PI))));
    case '3120': return (u => swapBC(symVert(rotate(u, -Math.PI / 2))));
    case '3201': return (u => swapCD(rotate(u, Math.PI)));
    case '3210': return (u => rotate(symVert(u), Math.PI / 2));
  }
}


function id(u) {
  return u;
}

function sliderSym(u) {
  return [1 - u[0]];
}

function rotate(u, angle) {
  const [x, y] = u;
  return [Math.cos(angle) * x - Math.sin(angle) * y, Math.sin(angle) * x + Math.cos(angle) * y];
}

function symVert(u) {
  const [x, y] = u;
  return [-x, y];
}

function translate(u, vect) {
  const [x, y] = u;
  return [x + vect[0], y + vect[1]];
}

function homothety(u, r) {
  const [x, y] = u;
  return [x * r, y * r];
}

function swapCDBilin(u) {
  const [x, y] = u;
  return [x, x * (1 - y) + y * (1 - x)];
}

function swapCD(u) {
  const unitC = homothety(translate(rotate(homothety(u, 1 / 2), 3 * Math.PI / 4), [1 / 2 / Math.sqrt(2), 1 / 2 / Math.sqrt(2)]), Math.sqrt(2));
  const transform = swapCDBilin(unitC);
  const origC = homothety(rotate(translate(homothety(transform, 1 / Math.sqrt(2)), [-1 / 2 / Math.sqrt(2), -1 / 2 / Math.sqrt(2)]), -3 * Math.PI / 4), 2);
  return origC;
}

function swapBCBilin(u) {
  const [x, y] = u;
  return [x * (1 - y) + y * (1 - x), y];
}

function swapBC(u) {
  const unitC = homothety(translate(rotate(homothety(u, 1 / 2), 3 * Math.PI / 4), [1 / 2 / Math.sqrt(2), 1 / 2 / Math.sqrt(2)]), Math.sqrt(2));
  const transform = swapBCBilin(unitC);
  const origC = homothety(rotate(translate(homothety(transform, 1 / Math.sqrt(2)), [-1 / 2 / Math.sqrt(2), -1 / 2 / Math.sqrt(2)]), -3 * Math.PI / 4), 2);
  return origC;
}


// a b c d normal 
// d a b c rot90
// c d a b rot180
// b c d a rot270

// a d c b symVert
// b a d c rot90SymVert
// c b a d rot180SymVert
// d c b a rot270SymVert

// a b d c swapCD
// c a b d swapCDRot90
// d c a b swapCDRot180
// b d c a swapCDRot270

// a c d b swapCDSymVert
// b a c d swapCDSymVertRot90
// d b a c swapCDSymVertRot180
// c d b a swapCDSymVertRot270

// a c b d swapBC
// d a c b swapBCRot90
// b d a c swapBCRot180
// c b d a swapBCRot270

// a d b c swapBCSymVert
// d b c a swapBCSymVertRot90
// b c a d swapBCSymVertRot180
// c a d b swapBCSymVertRot270



// a b c d normal 
// a b d c swapCD
// a c b d swapBC
// a c d b swapCDSymVert
// a d b c swapBCSymVert
// a d c b symVert

// b a c d swapCDSymVertRot90
// b a d c rot90SymVert
// b c a d swapBCSymVertRot180
// b c d a rot270
// b d a c swapBCRot180
// b d c a swapCDRot270

// c a b d swapCDRot90
// c a d b swapBCSymVertRot270
// c b a d rot180SymVert
// c b d a swapBCRot270
// c d a b rot180
// c d b a swapCDSymVertRot270

// d a b c rot90
// d a c b swapBCRot90
// d b a c swapCDSymVertRot180
// d b c a swapBCSymVertRot90
// d c a b swapCDrot180
// d c b a rot270SymVert



function getTransformSlider(order, refOrder) {
  const [a, b] = refOrder;
  switch (order) {
    case [a, b]: return 'normal';
    case [b, a]: return 'sym';
  }
}

function getTransformTriangle(order, refOrder){
  const [a, b, c] = refOrder;
  switch (order) {
    case [a, b, c]: return 'normal';
    case [c, a, b]: return 'rot120';
    case [b, c, a]: return 'rot240';
    case [a, c, b]: return 'symTop';
    case [b, a, c]: return 'rot120SymTop';
    case [c, b, a]: return 'rot240SymTop';
  }
}

function rotate(u, angle) {
  const [x, y] = u;
  return [Math.cos(angle) * x - Math.sin(angle) * y, Math.sin(angle) * x + Math.cos(angle) * y];
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


// a b c d normal 
// d a b c rot90
// c d a b rot180
// b c d a rot270

// a d c b symVert
// b a d c rot90SymVert
// c b a d rot180SymVert
// d c b a rot270SymVert






// a b c d normal 
// a b d c 
// a c b d
// a c d b
// a d b c
// a d c b symVert

// b a c d
// b a d c rot90SymVert
// b c a d
// b c d a rot270
// b d a c
// b d c a

// c a b d
// c a d b
// c b a d rot180SymVert
// c b d a
// c d a b rot180
// c d b a

// d a b c rot90
// d a c b 
// d b a c
// d b c a 
// d c a b
// d c b a rot270SymVert



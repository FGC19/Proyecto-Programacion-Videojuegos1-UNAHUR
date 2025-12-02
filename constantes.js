// Constantes de Z-Index para ordenar las capas visuales
const Z_INDEX = {
  fondo: 0,
  arboles: 100,
  personajes: 200,
  zombies: 200,
  player: 250,
  balas: 300,
  faroles: 150,
  containerIluminacion: 1000,
  spriteAmarilloParaElAtardecer: 999,
  ui: 10000 // UI siempre arriba de todo
};

// Función para crear un sprite negro de fondo
function crearSpriteNegro(width, height) {
  const graphics = new PIXI.Graphics();
  graphics.beginFill(0x000000);
  graphics.drawRect(0, 0, width, height);
  graphics.endFill();
  
  const texture = graphics.generateTexture();
  const sprite = new PIXI.Sprite(texture);
  return sprite;
}

// Función para crear un sprite con gradiente radial (luz)
function crearSpriteConGradiente(radio, color) {
  const graphics = new PIXI.Graphics();
  
  // Crear gradiente radial usando círculos concéntricos
  const steps = 20;
  for (let i = steps; i >= 0; i--) {
    const r = (radio * i) / steps;
    const alpha = 1 - (i / steps);
    graphics.circle(0, 0, r);
    graphics.fill({ color: color, alpha: alpha });
  }
  
  const texture = graphics.generateTexture();
  const sprite = new PIXI.Sprite(texture);
  sprite.anchor.set(0.5);
  sprite.blendMode = PIXI.BLEND_MODES.ADD;
  
  return sprite;
}

// Función para calcular distancia entre dos posiciones
function calcularDistancia(pos1, pos2) {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

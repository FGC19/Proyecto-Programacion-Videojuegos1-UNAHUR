class Bala extends Objeto {
  constructor(x, y, juego, velX, velY) {
    super(x, y, 20, juego);
    this.velocidad.x = velX;
    this.velocidad.y = velY;

    this.juego = juego;
    this.grid = juego.grid;
    this.vision = 2;
    
    // Cargar la textura del sprite
    this.sprite = new PIXI.Sprite();
    this.sprite.texture = PIXI.Texture.from("./Arrow.png");
    
    // Ajustar el tamaño para que se vea (puedes cambiar estos valores)
    this.sprite.width = 32;   // ← CAMBIO: de 2 a 32
    this.sprite.height = 32;  // ← CAMBIO: de 2 a 32
    
    // Centrar el pivot para que rote correctamente
    this.sprite.anchor.set(0.5, 0.5); // ← NUEVO: centrar el anchor
    
    // Calcular el ángulo de rotación según la dirección
    const angulo = Math.atan2(velY, velX); // ← NUEVO: calcular ángulo
    this.sprite.rotation = angulo; // ← NUEVO: rotar la flecha
    
    this.container.addChild(this.sprite);
    this.debug = 0;

    this.juego.app.stage.addChild(this.container);
  }

  update() {
    super.update();

    if (
      this.container.x < 0 ||
      this.container.y > this.juego.canvasHeight ||
      this.container.y < 0 ||
      this.container.x > this.juego.canvasWidth 
    ) {
      this.borrar();
    }

    let objs = Object.values(
      (this.miCeldaActual || {}).objetosAca || {}
    ).filter((k) => k instanceof Zombie);
    
    if (objs.length > 0) {
      let elZombieMasCercano;
      let distMin = 99999;
      let cual = null;
      
      for (let i = 0; i < objs.length; i++) {
        let dist = calculoDeDistanciaRapido(
          this.container.x,
          this.container.y,
          objs[i].container.x,
          objs[i].container.y
        );
        if (dist < distMin) {
          distMin = dist;
          cual = i;
        }
      }
      
      if (cual != null) {
        objs[cual].recibirTiro();
        this.borrar();
      }
    }
  }
}
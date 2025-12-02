class Bala extends Objeto {
  constructor(x, y, juego, velX, velY, origen) { // ← NUEVO: recibe origen (el jugador)
    super(x, y, 20, juego);
    this.velocidad.x = velX;
    this.velocidad.y = velY;
    this.origen = origen; // ← NUEVO: Guardar quién disparó

    this.juego = juego;
    this.grid = juego.grid;
    this.vision = 2;
    
    this.sprite = new PIXI.Sprite();
    this.sprite.texture = PIXI.Texture.from("./Arrow.png");
    
    this.sprite.width = 32;
    this.sprite.height = 32;
    
    this.sprite.anchor.set(0.5, 0.5);
    
    const angulo = Math.atan2(velY, velX);
    this.sprite.rotation = angulo;
    
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
        objs[cual].recibirTiro(this.origen); // ← MODIFICADO: Pasar el origen (jugador)
        this.borrar();
      }
    }
  }
}

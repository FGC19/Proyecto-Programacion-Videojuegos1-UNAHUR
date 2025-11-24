class Farol extends EntidadEstatica {
  constructor(x, y, juego, radioLuz = 200) {
    super(x, y, juego);
    this.radioLuz = radioLuz;
    this.radio = 15; // Radio de colisión
    this.encendido = true;
    this.posicion = { x, y }; // Guardar posición para cálculos
    
    // Agregar a la lista de faroles del juego
    if (!this.juego.faroles) {
      this.juego.faroles = [];
    }
    this.juego.faroles.push(this);
    
    this.crearSprite();
    this.actualizarMiPosicionEnLaGrilla();
  }

  async crearSprite() {
    try {
      // Intentar cargar sprite de farol
      const texture = await PIXI.Texture.from("./img/farol.png");
      this.sprite = new PIXI.Sprite(texture);
      this.sprite.anchor.set(0.5, 1);
      this.container.addChild(this.sprite);
      this.listo = true;
    } catch (error) {
      // Crear placeholder si no hay imagen
      this.crearPlaceholder();
    }
  }

  crearPlaceholder() {
    const graphics = new PIXI.Graphics();
    
    // Poste
    graphics.beginFill(0x444444);
    graphics.drawRect(-3, -60, 6, 60);
    graphics.endFill();
    
    // Lámpara
    graphics.beginFill(this.encendido ? 0xFFFF99 : 0x666666);
    graphics.drawCircle(0, -60, 10);
    graphics.endFill();
    
    this.container.addChild(graphics);
    this.sprite = graphics;
    this.listo = true;
  }

  prender() {
    this.encendido = true;
    if (this.sprite && this.sprite.tint !== undefined) {
      this.sprite.tint = 0xFFFFFF;
    }
  }

  apagar() {
    this.encendido = false;
    if (this.sprite && this.sprite.tint !== undefined) {
      this.sprite.tint = 0x666666;
    }
  }

  estoyVisibleEnPantalla(margen = 1) {
    const posEnPantalla = this.getPosicionEnPantalla();
    const screenWidth = this.juego.app.screen.width;
    const screenHeight = this.juego.app.screen.height;
    
    return (
      posEnPantalla.x > -this.radioLuz * margen &&
      posEnPantalla.x < screenWidth + this.radioLuz * margen &&
      posEnPantalla.y > -this.radioLuz * margen &&
      posEnPantalla.y < screenHeight + this.radioLuz * margen
    );
  }

  getPosicionEnPantalla() {
    return {
      x: this.container.x + this.juego.app.stage.position.x,
      y: this.container.y + this.juego.app.stage.position.y
    };
  }

  update() {
    super.update();
    // Actualizar posición para el sistema de iluminación
    this.posicion.x = this.container.x;
    this.posicion.y = this.container.y;
  }

  borrar() {
    if (this.juego.faroles) {
      this.juego.faroles = this.juego.faroles.filter(f => f !== this);
    }
    super.borrar();
  }
}
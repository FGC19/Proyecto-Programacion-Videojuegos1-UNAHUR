class Arbol extends EntidadEstatica {
  constructor(x, y, juego, tipo, scaleX) {
    super(x, y, juego);
    this.radio = 12;
    this.scaleX = scaleX || 1;
    this.tipo = tipo || Math.floor(Math.random() * 2) + 1;
    this.container.label = "arbol" + this.id;
    this.crearSprite();
    
    // Agregar a la lista de obstáculos del juego
    if (!this.juego.obstaculos) {
      this.juego.obstaculos = [];
    }
    this.juego.obstaculos.push(this);
    
    // Para la animación de skew (balanceo suave)
    this.offsetSkew = Math.random() * Math.PI * 2;
    this.velocidadSkew = 0.1 + Math.random() * 0.05;
    this.cantidadDeSkew = 0.005 + Math.random() * 0.01;
    this.offsetSkew2 = Math.random() * Math.PI * 2;
    this.velocidadSkew2 = 0.1 + Math.random() * 0.05;
    this.cantidadDeSkew2 = 0.005 + Math.random() * 0.01;
    
    this.actualizarMiPosicionEnLaGrilla();
  }

  async crearSprite() {
    try {
      // Intentar cargar la textura del árbol
      const texture = await PIXI.Texture.from("./img/arbol" + this.tipo + ".png");
      this.sprite = new PIXI.Sprite(texture);
      this.sprite.anchor.set(0.5, 1);
      this.container.addChild(this.sprite);
      this.sprite.scale.x = this.scaleX;
      this.listo = true;
    } catch (error) {
      console.warn("No se pudo cargar la textura del árbol, usando placeholder");
      // Crear un sprite placeholder si no se encuentra la imagen
      this.crearPlaceholder();
    }
  }

  crearPlaceholder() {
    // Crear un gráfico simple como placeholder
    const graphics = new PIXI.Graphics();
    
    // Copa del árbol
    graphics.beginFill(0x228B22);
    graphics.drawCircle(0, -30, 20);
    graphics.endFill();
    
    // Tronco
    graphics.beginFill(0x8B4513);
    graphics.drawRect(-5, -10, 10, 10);
    graphics.endFill();
    
    this.container.addChild(graphics);
    this.sprite = graphics;
    this.listo = true;
  }

  update() {
    super.update();
    this.tick();
  }

  tick() {
    if (this.sprite && this.juego.contadorDeFrames) {
      // Usar el contador de frames del juego como "tiempo"
      const tiempo = this.juego.contadorDeFrames;
      
      // Aplicar skew suave para simular balanceo del árbol por el viento
      this.sprite.skew.x =
        Math.sin(tiempo * 0.01 * this.velocidadSkew + this.offsetSkew) *
          this.cantidadDeSkew +
        Math.sin(tiempo * 0.03 * this.velocidadSkew2 + this.offsetSkew2) *
          this.cantidadDeSkew2 * 0.3;
    }
  }

  borrar() {
    // Remover de la lista de obstáculos
    if (this.juego.obstaculos) {
      this.juego.obstaculos = this.juego.obstaculos.filter(o => o !== this);
    }
    // Remover de la lista de árboles
    if (this.juego.arboles) {
      this.juego.arboles = this.juego.arboles.filter(a => a !== this);
    }
    super.borrar();
  }

  // Método para el sistema de iluminación
  estoyVisibleEnPantalla(margen = 1) {
    const posEnPantalla = this.getPosicionEnPantalla();
    const screenWidth = this.juego.app.screen.width;
    const screenHeight = this.juego.app.screen.height;
    
    return (
      posEnPantalla.x > -100 * margen &&
      posEnPantalla.x < screenWidth + 100 * margen &&
      posEnPantalla.y > -100 * margen &&
      posEnPantalla.y < screenHeight + 100 * margen
    );
  }

  getPosicionEnPantalla() {
    return {
      x: this.container.x + this.juego.app.stage.position.x,
      y: this.container.y + this.juego.app.stage.position.y
    };
  }
}
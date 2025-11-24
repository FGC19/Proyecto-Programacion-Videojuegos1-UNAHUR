// Clase base Objeto
class Objeto {
  constructor(x, y, velocidadMax, juego) {
    this.id = generarID();
    this.grid = juego.grid;
    this.app = juego.app;
    this.juego = juego;
    this.container = new PIXI.Container();
    this.juego.app.stage.addChild(this.container);
    this.listo = false;
    this.container.x = x;
    this.container.y = y;

    this.velocidad = new PIXI.Point(0, 0);
    this.velocidadMax = velocidadMax;
    this.velocidadMaxCuadrada = velocidadMax * velocidadMax;

    this.spritesAnimados = {};
  }

  cambiarSprite(cual, numero, loop = true) {
    this.spriteActual = cual;
    let sprite = this.spritesAnimados[cual];
    if (!sprite) return null;
    if (numero != undefined) {
      sprite.gotoAndPlay(numero);
    }
    sprite.loop = loop;
    this.container.removeChildren();
    this.container.addChild(sprite);

    return sprite;
  }

  cargarVariosSpritesAnimados(inObj, w, h, velocidad, cb) {
    let ret = {};
    let keys = Object.keys(inObj);
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      this.cargarSpriteAnimado(inObj[key], w, h, velocidad, (spriteAnimado) => {
        ret[key] = spriteAnimado;
        if (Object.keys(ret).length == keys.length) {
          //TERMINO
          this.spritesAnimados = { ...this.spritesAnimados, ...ret };
          if (cb instanceof Function) cb(this.spritesAnimados);
        }
      });
    }
  }

  cargarSpriteAnimado(url, frameWidth, frameHeight, vel, cb) {
    let texture = PIXI.Texture.from(url);
    texture.baseTexture.on("loaded", () => {
      let width = texture.baseTexture.width;
      let height = texture.baseTexture.height;
      let cantFramesX = width / frameWidth;
      let cantFramesY = height / frameHeight;

      const frames = [];

      for (let i = 0; i < cantFramesX; i++) {
        for (let j = 0; j < cantFramesY; j++) {
          const rectangle = new PIXI.Rectangle(
            i * frameWidth,
            j * frameHeight,
            frameWidth,
            frameHeight
          );
          const frame = new PIXI.Texture(texture.baseTexture, rectangle);
          
          frames.push(frame);
        }
      }

      const animatedSprite = new PIXI.AnimatedSprite(frames);

      animatedSprite.animationSpeed = vel;
      animatedSprite.loop = true;

      animatedSprite.anchor.set(0.5, 1);

      animatedSprite.play();

      if (cb) cb(animatedSprite);
    });
  }

  borrar() {
    this.juego.app.stage.removeChild(this.container);
    if (this instanceof Zombie) {
      this.juego.zombies = this.juego.zombies.filter((k) => k != this);
    } else if (this instanceof Bala) {
      this.juego.balas = this.juego.balas.filter((k) => k != this);
    }

    this.grid.remove(this);
  }

  obtenerVecinos() {
    let vecinos = [];
    const cellSize = this.grid.cellSize;
    const xIndex = Math.floor(this.container.x / cellSize);
    const yIndex = Math.floor(this.container.y / cellSize);
    const margen = 1;
    
    for (let i = -margen; i <= margen; i++) {
      for (let j = -margen; j <= margen; j++) {
        const cell = this.grid.getCell(xIndex + i, yIndex + j);

        if (cell) {
          vecinos = [
            ...vecinos,
            ...Object.values(cell.objetosAca).filter((k) => k != this),
          ];
        }
      }
    }
    return vecinos;
  }

  estoyEnLaMismaCeldaQue(fulano) {
    return (
      fulano.miCeldaActual &&
      this.miCeldaActual &&
      fulano.miCeldaActual == this.miCeldaActual
    );
  }

  normalizarVelocidad() {
    if (this.velocidad.x == 0 && this.velocidad.y == 0) {
      return;
    }

    let magnitud = calculoDeDistanciaRapido(
      0,
      0,
      this.velocidad.x,
      this.velocidad.y
    );

    if (magnitud == 0) return;

    this.velocidad.x /= magnitud;
    this.velocidad.y /= magnitud;

    this.velocidad.x *= this.velocidadMax;
    this.velocidad.y *= this.velocidadMax;
    if (isNaN(this.velocidad.x)) debugger;
  }

  update() {
    this.normalizarVelocidad();

    this.container.x += this.velocidad.x;
    this.container.y += this.velocidad.y;
    
    this.actualizarZIndex();
    this.actualizarLado();
    this.actualizarPosicionEnGrid();
  }

  actualizarPosicionEnGrid() {
    this.grid.update(this);
  }

  aplicarFuerza(fuerza) {
    if (!fuerza) return;
    this.velocidad.x += fuerza.x;
    this.velocidad.y += fuerza.y;

    const velocidadCuadrada =
      this.velocidad.x * this.velocidad.x + this.velocidad.y * this.velocidad.y;
    if (velocidadCuadrada > this.velocidadMaxCuadrada) {
      const magnitud = Math.sqrt(velocidadCuadrada);
      this.velocidad.x = (this.velocidad.x / magnitud) * this.velocidadMax;
      this.velocidad.y = (this.velocidad.y / magnitud) * this.velocidadMax;
    }
  }

  // ← NUEVO: Método para verificar colisiones con obstáculos
  verificarColisionesConObstaculos() {
    if (!this.juego.obstaculos || this.esEstatico) return null;
    
    let fuerzaRepulsion = new PIXI.Point(0, 0);
    let hayColision = false;

    const cellSize = this.grid.cellSize;
    const xIndex = Math.floor(this.container.x / cellSize);
    const yIndex = Math.floor(this.container.y / cellSize);
    
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const cell = this.grid.getCell(xIndex + i, yIndex + j);
        if (!cell) continue;
        
        const obstaculosEnCelda = Object.values(cell.objetosAca).filter(
          obj => obj instanceof EntidadEstatica
        );
        
        obstaculosEnCelda.forEach(obstaculo => {
          if (obstaculo.colisionaCon(this)) {
            const repulsion = obstaculo.obtenerVectorDeRepulsion(this);
            fuerzaRepulsion.x += repulsion.x;
            fuerzaRepulsion.y += repulsion.y;
            hayColision = true;
          }
        });
      }
    }
    
    return hayColision ? fuerzaRepulsion : null;
  }

  actualizarLado() {
    if (this.velocidad.x > 0) {
      this.container.scale.x = 1;
    } else if (this.velocidad.x < 0) {
      this.container.scale.x = -1;
    } else if (this.velocidad.y == 0 && this instanceof Zombie) {
      if (this.juego.player.container.x > this.container.x) {
        this.container.scale.x = 1;
      } else {
        this.container.scale.x = -1;
      }
    }
  }

  actualizarZIndex() {
    this.container.zIndex = this.container.y;
  }

  actualizarRotacion() {
    if (this.velocidad.x !== 0 || this.velocidad.y !== 0) {
      const angulo = Math.atan2(this.velocidad.y, this.velocidad.x);
      this.container.rotation = angulo;
    }
  }
}

// Modificar el método update() en la clase Objeto para incluir colisiones:
// Agregar antes de super.update() en Player y Zombie:
/*
update() {
  // ... código existente ...
  
  // Verificar colisiones con obstáculos
  const repulsion = this.verificarColisionesConObstaculos();
  if (repulsion) {
    this.aplicarFuerza(repulsion);
  }
  
  super.update();
}
*/

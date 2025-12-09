// ============================================================
// ESTADOS DE EMOCIÓN - Finite State Machine
// ============================================================

// Clase base para todos los estados
class EstadoEmocional {
  constructor(hombreLobo) {
    this.hombreLobo = hombreLobo;
  }

  entrar() {}
  salir() {}
  actualizar() {}
  verificarTransiciones() {
    return null;
  }

  obtenerMultiplicadorVelocidad() {
    return 1;
  }

  obtenerMultiplicadorDanio() {
    return 1;
  }

  obtenerMultiplicadorAnimacion() {
    return 1;
  }

  obtenerSprite(tipoSprite) {
    return tipoSprite;
  }
}

// ============================================================
// ESTADO NORMAL
// ============================================================
class EstadoNormal extends EstadoEmocional {
  entrar() {
    console.log("😐 Hombre Lobo en estado NORMAL");
    
    this.hombreLobo.velocidadMax = this.hombreLobo.velocidadBase;
    this.hombreLobo.container.tint = 0xffffff;
    
    Object.keys(this.hombreLobo.spritesAnimados).forEach(key => {
      if (this.hombreLobo.spritesAnimados[key] && this.hombreLobo.spritesAnimados[key].animationSpeed) {
        this.hombreLobo.spritesAnimados[key].animationSpeed = this.hombreLobo.velocidadAnimacionBase;
      }
    });
  }

  salir() {}
  actualizar() {}

  verificarTransiciones() {
    if (this.hombreLobo.fueGolpeado && this.hombreLobo.vida > 0) {
      return new EstadoEnojado(this.hombreLobo);
    }
    return null;
  }

  obtenerMultiplicadorVelocidad() {
    return 1;
  }

  obtenerMultiplicadorDanio() {
    return 1;
  }

  obtenerMultiplicadorAnimacion() {
    return 1;
  }

  obtenerSprite(tipoSprite) {
    return tipoSprite;
  }
}

// ============================================================
// ESTADO ENOJADO
// ============================================================
class EstadoEnojado extends EstadoEmocional {
  entrar() {
    console.log("🔥 ¡Hombre Lobo ENOJADO!");
    
    // Aumentar velocidad a 3.5x
    this.hombreLobo.velocidadMax = this.hombreLobo.velocidadBase * 3.5;
    
    // Cambiar color a rojo
    this.hombreLobo.container.tint = 0xff2222;
    
    // Efecto de parpadeo al enojarse
    this.hombreLobo.container.alpha = 0.7;
    setTimeout(() => {
      if (this.hombreLobo.container) {
        this.hombreLobo.container.alpha = 1;
      }
    }, 100);
    
    // Aumentar velocidad de animaciones
    Object.keys(this.hombreLobo.spritesAnimados).forEach(key => {
      if (this.hombreLobo.spritesAnimados[key] && this.hombreLobo.spritesAnimados[key].animationSpeed) {
        this.hombreLobo.spritesAnimados[key].animationSpeed = this.hombreLobo.velocidadAnimacionBase * 2.2;
      }
    });
    
    console.log(`   Velocidad: ${this.hombreLobo.velocidadMax.toFixed(2)}`);
    console.log(`   Daño: ${this.obtenerMultiplicadorDanio() * this.hombreLobo.danioBase}`);
  }

  salir() {
    console.log("😌 Hombre Lobo dejó de estar enojado");
  }

  actualizar() {}

  verificarTransiciones() {
    return null;
  }

  obtenerMultiplicadorVelocidad() {
    return 3.5;
  }

  obtenerMultiplicadorDanio() {
    return 2.5;
  }

  obtenerMultiplicadorAnimacion() {
    return 2.2;
  }

  obtenerSprite(tipoSprite) {
    return tipoSprite + "Enojado";
  }
}

// ============================================================
// MÁQUINA DE ESTADOS FINITOS (FSM)
// ============================================================
class MaquinaDeEstadosEmocionales {
  constructor(hombreLobo) {
    this.hombreLobo = hombreLobo;
    this.estadoActual = new EstadoNormal(hombreLobo);
    this.estadoActual.entrar();
  }

  cambiarEstado(nuevoEstado) {
    if (!nuevoEstado) return;
    
    this.estadoActual.salir();
    this.estadoActual = nuevoEstado;
    this.estadoActual.entrar();
  }

  actualizar() {
    this.estadoActual.actualizar();
    
    const nuevoEstado = this.estadoActual.verificarTransiciones();
    if (nuevoEstado) {
      this.cambiarEstado(nuevoEstado);
    }
  }

  obtenerMultiplicadorVelocidad() {
    return this.estadoActual.obtenerMultiplicadorVelocidad();
  }

  obtenerMultiplicadorDanio() {
    return this.estadoActual.obtenerMultiplicadorDanio();
  }

  obtenerSprite(tipoSprite) {
    return this.estadoActual.obtenerSprite(tipoSprite);
  }

  esEnojado() {
    return this.estadoActual instanceof EstadoEnojado;
  }
}

// ============================================================
// CLASE HOMBRE LOBO ACTUALIZADA CON FSM
// ============================================================
class HombreLobo extends Objeto {
  constructor(x, y, velocidad, juego) {
    super(x, y, velocidad, juego);
    this.equipoParaUpdate = Math.floor(Math.random() * 9) + 1;
    this.juego = juego;
    this.grid = juego.grid;
    this.vision = 100 + Math.floor(Math.random() * 150);
    this.vida = 2;
    this.vidaMaxima = 2;
    this.debug = 0;
    this.radio = 20;

    this.fsmEmocional = null;
    this.fueGolpeado = false;
    
    this.velocidadBase = velocidad;
    this.danioBase = 10;
    this.velocidadAnimacionBase = velocidad * 0.5;

    this.spritesTotales = 11;
    this.spritesCargados = 0;

    this.cargarSpriteAnimado("./img/hombresloboWalk.png", 128, 128, this.velocidadAnimacionBase, (sprite) => {
      this.spritesAnimados.correr = sprite;
      this.verificarCargaCompleta();
    });

    this.cargarSpriteAnimado("./img/hombresloboAttack_1.png", 128, 128, this.velocidadAnimacionBase, (sprite) => {
      this.spritesAnimados.ataque1 = sprite;
      this.verificarCargaCompleta();
    });

    this.cargarSpriteAnimado("./img/hombresloboAttack_2.png", 128, 128, this.velocidadAnimacionBase, (sprite) => {
      this.spritesAnimados.ataque2 = sprite;
      this.verificarCargaCompleta();
    });

    this.cargarSpriteAnimado("./img/hombresloboAttack_3.png", 128, 128, this.velocidadAnimacionBase, (sprite) => {
      this.spritesAnimados.ataque3 = sprite;
      this.verificarCargaCompleta();
    });

    this.cargarSpriteAnimado("./img/hombresloboDead.png", 128, 128, this.velocidadAnimacionBase * 0.5, (sprite) => {
      this.spritesAnimados.morir = sprite;
      this.verificarCargaCompleta();
    });

    this.cargarSpriteAnimado("./img/hombresloboHurt.png", 128, 128, this.velocidadAnimacionBase * 1.5, (sprite) => {
      this.spritesAnimados.recibeTiro = sprite;
      this.verificarCargaCompleta();
    });

    this.cargarSpriteAnimado("./img/hombreslobo.png", 128, 128, this.velocidadAnimacionBase, (sprite) => {
      this.spritesAnimados.correrEnojado = sprite;
      this.verificarCargaCompleta();
    });

    this.cargarSpriteAnimado("./img/hombreslobo.png", 128, 128, this.velocidadAnimacionBase, (sprite) => {
      this.spritesAnimados.ataque1Enojado = sprite;
      this.verificarCargaCompleta();
    });

    this.cargarSpriteAnimado("./img/hombreslobo.png", 128, 128, this.velocidadAnimacionBase, (sprite) => {
      this.spritesAnimados.ataque2Enojado = sprite;
      this.verificarCargaCompleta();
    });

    this.cargarSpriteAnimado("./img/hombreslobo.png", 128, 128, this.velocidadAnimacionBase, (sprite) => {
      this.spritesAnimados.ataque3Enojado = sprite;
      this.verificarCargaCompleta();
    });

    this.cargarSpriteAnimado("./img/hombreslobo.png", 128, 128, this.velocidadAnimacionBase * 1.5, (sprite) => {
      this.spritesAnimados.recibeTiroEnojado = sprite;
      this.verificarCargaCompleta();
    });

    this.estados = { IDLE: 0, YENDO_AL_PLAYER: 1, ATACANDO: 2 };
    this.estado = this.estados.IDLE;
    this.ultimoAtaque = 0;
    this.cooldownAtaque = 500;
  }

  verificarCargaCompleta() {
    this.spritesCargados++;
    if (this.spritesCargados === this.spritesTotales) {
      console.log("✓ Todos los sprites del hombre lobo cargados!");
      this.listo = true;
      
      this.fsmEmocional = new MaquinaDeEstadosEmocionales(this);
      
      this.cambiarSprite("correr");
    }
  }

  obtenerDanioActual() {
    if (!this.fsmEmocional) return this.danioBase;
    return this.danioBase * this.fsmEmocional.obtenerMultiplicadorDanio();
  }

  recibirTiro(origen) {
    this.vida -= 1;
    
    if (this.juego.particleSystem && origen) {
      this.juego.particleSystem.hacerQueLeSalgaSangreAAlguien(this, origen);
    }
    
    if (!this.fueGolpeado && this.vida > 0) {
      this.fueGolpeado = true;
    }
    
    if (this.vida <= 0) {
      this.juego.hombresLobo = this.juego.hombresLobo.filter((k) => k != this);
      this.grid.remove(this);
      let sprite = this.cambiarSprite("morir", 0, false);
      
      if (this.juego.sistemaNiveles) {
        this.juego.sistemaNiveles.hombreLoboEliminado();
      }
      
      setTimeout(() => {
        this.borrar();
      }, 800);
    } else {
      const spriteHurt = this.fsmEmocional ? this.fsmEmocional.obtenerSprite("recibeTiro") : "recibeTiro";
      let sprite = this.cambiarSprite(spriteHurt, 0, false);
      
      const spriteCorrer = this.fsmEmocional ? this.fsmEmocional.obtenerSprite("correr") : "correr";
      
      setTimeout(() => {
        if (this.estado === this.estados.YENDO_AL_PLAYER || this.estado === this.estados.IDLE) {
          this.cambiarSprite(spriteCorrer);
        }
      }, 300);

      this.velocidad.x = 0;
      this.velocidad.y = 0;
    }
  }

  mirarAlrededor() {
    this.vecinos = this.obtenerVecinos();
    this.vecinosHombresLobo = this.vecinos.filter(v => v instanceof HombreLobo);
    this.celdasVecinas = this.miCeldaActual.obtenerCeldasVecinas();
    this.estoyViendoAlPlayer = this.evaluarSiEstoyViendoAlPlayer();
    this.tengoDeVecinoAlPlayer = false;
    this.estoyTocandoAlPlayer = false;

    if (this.estoyViendoAlPlayer) {
      this.tengoDeVecinoAlPlayer = this.vecinos.includes(this.juego.player);
    }

    if (this.tengoDeVecinoAlPlayer) {
      this.distanciaAlPlayer = calculoDeDistanciaRapido(
        this.container.x,
        this.container.y,
        this.juego.player.container.x,
        this.juego.player.container.y
      );
      
      if (this.distanciaAlPlayer < this.juego.grid.cellSize) {
        this.estoyTocandoAlPlayer = true;
      }
    } else {
      this.distanciaAlPlayer = null;
    }
  }

  hacerCosasSegunEstado() {
    let vecAtraccionAlPlayer, vecSeparacion, vecAlineacion, vecCohesion, bordes, evasionObstaculos;
    let sumaDeVectores = new PIXI.Point(0, 0);

    bordes = this.ajustarPorBordes();
    evasionObstaculos = this.resolverColisionesConObstaculos();

    const spriteCorrer = this.fsmEmocional ? this.fsmEmocional.obtenerSprite("correr") : "correr";
    const esEnojado = this.fsmEmocional ? this.fsmEmocional.esEnojado() : false;

    if (esEnojado) {
      if (this.estado == this.estados.YENDO_AL_PLAYER || this.estado == this.estados.IDLE) {
        vecAtraccionAlPlayer = this.atraccionAlJugador();
        this.cambiarSprite(spriteCorrer);
        
        sumaDeVectores.x += (vecAtraccionAlPlayer || {}).x || 0;
        sumaDeVectores.x += (bordes || {}).x || 0;
        sumaDeVectores.x += (evasionObstaculos || {}).x || 0;

        sumaDeVectores.y += (vecAtraccionAlPlayer || {}).y || 0;
        sumaDeVectores.y += (bordes || {}).y || 0;
        sumaDeVectores.y += (evasionObstaculos || {}).y || 0;

        this.aplicarFuerza(sumaDeVectores);
      }
    } else {
      if (this.estado == this.estados.YENDO_AL_PLAYER) {
        vecAtraccionAlPlayer = this.atraccionAlJugador();
        this.cambiarSprite(spriteCorrer);
      } else if (this.estado == this.estados.IDLE) {
        vecAlineacion = this.alineacion(this.vecinosHombresLobo);
        vecCohesion = this.cohesion(this.vecinosHombresLobo);
        this.cambiarSprite(spriteCorrer);
        
        if (this.vecinosHombresLobo.length === 0) {
          if (!this.movimientoAleatorio || Math.random() < 0.01) {
            this.movimientoAleatorio = new PIXI.Point(
              (Math.random() - 0.5) * 0.5,
              (Math.random() - 0.5) * 0.5
            );
          }
          sumaDeVectores.x += this.movimientoAleatorio.x;
          sumaDeVectores.y += this.movimientoAleatorio.y;
        }
      }

      if (
        this.estado == this.estados.IDLE ||
        this.estado == this.estados.YENDO_AL_PLAYER
      ) {
        vecSeparacion = this.separacion(this.vecinosHombresLobo);

        sumaDeVectores.x += (vecSeparacion || {}).x || 0;
        sumaDeVectores.x += (vecAlineacion || {}).x || 0;
        sumaDeVectores.x += (vecCohesion || {}).x || 0;
        sumaDeVectores.x += (vecAtraccionAlPlayer || {}).x || 0;
        sumaDeVectores.x += (bordes || {}).x || 0;
        sumaDeVectores.x += (evasionObstaculos || {}).x || 0;

        sumaDeVectores.y += (vecSeparacion || {}).y || 0;
        sumaDeVectores.y += (vecAlineacion || {}).y || 0;
        sumaDeVectores.y += (vecCohesion || {}).y || 0;
        sumaDeVectores.y += (vecAtraccionAlPlayer || {}).y || 0;
        sumaDeVectores.y += (bordes || {}).y || 0;
        sumaDeVectores.y += (evasionObstaculos || {}).y || 0;

        this.aplicarFuerza(sumaDeVectores);
      }
    }

    if (this.estado == this.estados.ATACANDO) {
      this.velocidad.x = 0;
      this.velocidad.y = 0;
      this.atacar();
    }
  }

  update() {
    if (!this.listo) return;
    
    if (this.fsmEmocional) {
      this.fsmEmocional.actualizar();
    }
    
    if (this.juego.contadorDeFrames % this.equipoParaUpdate == 0) {
      this.mirarAlrededor();
      this.segunDatosCambiarDeEstado();
      this.hacerCosasSegunEstado();
    }

    super.update();
  }

  resolverColisionesConObstaculos() {
    if (!this.juego.obstaculos) return null;
    
    let fuerzaEvasion = new PIXI.Point(0, 0);
    let hayColision = false;
    
    const radioDeteccion = this.radio + 40;
    
    for (let obstaculo of this.juego.obstaculos) {
      const dx = this.container.x - obstaculo.container.x;
      const dy = this.container.y - obstaculo.container.y;
      const distancia = Math.sqrt(dx * dx + dy * dy);
      const radioTotal = this.radio + obstaculo.radio;
      
      if (distancia < radioTotal && distancia > 0) {
        const superposicion = radioTotal - distancia;
        const nx = dx / distancia;
        const ny = dy / distancia;
        
        this.container.x += nx * superposicion;
        this.container.y += ny * superposicion;
        hayColision = true;
      }
      
      if (distancia < radioDeteccion && distancia > 0) {
        const nx = dx / distancia;
        const ny = dy / distancia;
        
        const fuerza = (radioDeteccion - distancia) / radioDeteccion;
        
        if (this.estado === this.estados.YENDO_AL_PLAYER) {
          const tangencialX = -ny;
          const tangencialY = nx;
          
          const haciaJugadorX = this.juego.player.container.x - this.container.x;
          const haciaJugadorY = this.juego.player.container.y - this.container.y;
          
          const productopunto = tangencialX * haciaJugadorX + tangencialY * haciaJugadorY;
          const direccion = productopunto > 0 ? 1 : -1;
          
          fuerzaEvasion.x += nx * fuerza * 3 + tangencialX * direccion * fuerza * 2;
          fuerzaEvasion.y += ny * fuerza * 3 + tangencialY * direccion * fuerza * 2;
        } else {
          fuerzaEvasion.x += nx * fuerza * 2;
          fuerzaEvasion.y += ny * fuerza * 2;
        }
      }
    }
    
    return hayColision || fuerzaEvasion.x !== 0 || fuerzaEvasion.y !== 0 ? fuerzaEvasion : null;
  }

  segunDatosCambiarDeEstado() {
    const esEnojado = this.fsmEmocional ? this.fsmEmocional.esEnojado() : false;
    
    if (esEnojado) {
      if (this.estoyTocandoAlPlayer) {
        this.estado = this.estados.ATACANDO;
      } else {
        this.estado = this.estados.YENDO_AL_PLAYER;
      }
    } else {
      if (this.estoyTocandoAlPlayer) {
        this.estado = this.estados.ATACANDO;
      } else if (this.estoyViendoAlPlayer) {
        this.estado = this.estados.YENDO_AL_PLAYER;
      } else {
        this.estado = this.estados.IDLE;
      }
    }
  }

  atacar() {
    try {
      const ahora = Date.now();
      const distanciaAlPlayer = calculoDeDistanciaRapido(
        this.container.x,
        this.container.y,
        this.juego.player.container.x,
        this.juego.player.container.y
      );

      if (ahora - this.ultimoAtaque >= this.cooldownAtaque && distanciaAlPlayer < this.juego.grid.cellSize) {
        const numAtaque = (Math.floor(Math.random() * 2) + 1).toString();
        
        const spriteAtaque = this.fsmEmocional 
          ? this.fsmEmocional.obtenerSprite("ataque" + numAtaque)
          : "ataque" + numAtaque;
        
        const sprite = this.cambiarSprite(spriteAtaque, 0, false);

        if (this.juego && this.juego.player && typeof this.juego.player.recibirDanio === 'function') {
          const danio = this.obtenerDanioActual();
          this.juego.player.recibirDanio(danio, this);
        }

        this.ultimoAtaque = ahora;

        const spriteCorrer = this.fsmEmocional ? this.fsmEmocional.obtenerSprite("correr") : "correr";

        setTimeout(() => {
          if (this.estado === this.estados.ATACANDO || this.estado === this.estados.YENDO_AL_PLAYER || this.estado === this.estados.IDLE) {
            this.cambiarSprite(spriteCorrer);
          }
        }, 350);
      }
    } catch (e) {
      // Silenciar errores
    }
  }

  evaluarSiEstoyViendoAlPlayer() {
    const distanciaCuadrada = distanciaAlCuadrado(
      this.container.x,
      this.container.y,
      this.juego.player.container.x,
      this.juego.player.container.y
    );

    if (distanciaCuadrada < this.vision ** 2) {
      return true;
    }
    return false;
  }

  atraccionAlJugador() {
    const vecDistancia = new PIXI.Point(
      this.juego.player.container.x - this.container.x,
      this.juego.player.container.y - this.container.y
    );

    let vecNormalizado = normalizarVector(vecDistancia.x, vecDistancia.y);

    vecDistancia.x = vecNormalizado.x;
    vecDistancia.y = vecNormalizado.y;
    return vecDistancia;
  }

  cohesion(vecinos) {
    const vecPromedio = new PIXI.Point(0, 0);
    let total = 0;

    vecinos.forEach((hombreLobo) => {
      vecPromedio.x += hombreLobo.container.x;
      vecPromedio.y += hombreLobo.container.y;
      total++;
    });

    if (total > 0) {
      vecPromedio.x /= total;
      vecPromedio.y /= total;

      vecPromedio.x = vecPromedio.x - this.container.x;
      vecPromedio.y = vecPromedio.y - this.container.y;

      vecPromedio.x *= 0.05;
      vecPromedio.y *= 0.05;
    }

    return vecPromedio;
  }

  separacion(vecinos) {
    const vecFuerza = new PIXI.Point(0, 0);

    vecinos.forEach((hombreLobo) => {
      const distancia = distanciaAlCuadrado(
        this.container.x,
        this.container.y,
        hombreLobo.container.x,
        hombreLobo.container.y
      );

      const dif = new PIXI.Point(
        this.container.x - hombreLobo.container.x,
        this.container.y - hombreLobo.container.y
      );
      dif.x /= distancia;
      dif.y /= distancia;
      vecFuerza.x += dif.x;
      vecFuerza.y += dif.y;
    });

    vecFuerza.x *= 2;
    vecFuerza.y *= 2;
    return vecFuerza;
  }

  alineacion(vecinos) {
    const vecPromedio = new PIXI.Point(0, 0);
    let total = 0;

    vecinos.forEach((hombreLobo) => {
      vecPromedio.x += hombreLobo.velocidad.x;
      vecPromedio.y += hombreLobo.velocidad.y;
      total++;
    });

    if (total > 0) {
      vecPromedio.x /= total;
      vecPromedio.y /= total;

      vecPromedio.x *= 0.3;
      vecPromedio.y *= 0.3;
    }

    return vecPromedio;
  }

  ajustarPorBordes() {
    let fuerza = new PIXI.Point(0, 0);

    if (this.container.x < 0) fuerza.x = -this.container.x;
    if (this.container.y < 0) fuerza.y = -this.container.y;
    if (this.container.x > this.juego.canvasWidth)
      fuerza.x = -(this.container.x - this.juego.canvasWidth);
    if (this.container.y > this.juego.canvasHeight)
      fuerza.y = -(this.container.y - this.juego.canvasHeight);

    return fuerza;
  }

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

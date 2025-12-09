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
// CLASE HOMBRE LOBO
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

    this.estados = { IDLE: 0, YENDO_AL_PLAYER: 1, ATACANDO: 2 };
    this.estado = this.estados.IDLE;
    this.ultimoAtaque = 0;
    this.cooldownAtaque = 500;
    this.cooldownAtaqueEnojado = 300;

    // Cargar sprites usando el cache global
    this.inicializarSprites();
  }

  async inicializarSprites() {
    // Esperar a que las texturas globales estén cargadas
    await HombreLobo.cargarTexturasGlobales();
    
    // Crear sprites animados a partir del cache
    this.crearSpritesDesdeCache();
    
    this.listo = true;
    this.fsmEmocional = new MaquinaDeEstadosEmocionales(this);
    this.cambiarSprite("correr");
  }

  crearSpritesDesdeCache() {
    const specs = {
      correr: { url: "./img/hombresloboWalk.png", w: 128, h: 128, speed: this.velocidadAnimacionBase },
      ataque1: { url: "./img/hombresloboAttack_1.png", w: 128, h: 128, speed: this.velocidadAnimacionBase },
      ataque2: { url: "./img/hombresloboAttack_2.png", w: 128, h: 128, speed: this.velocidadAnimacionBase },
      ataque3: { url: "./img/hombresloboAttack_3.png", w: 128, h: 128, speed: this.velocidadAnimacionBase },
      morir: { url: "./img/hombresloboDead.png", w: 128, h: 128, speed: this.velocidadAnimacionBase * 0.5 },
      recibeTiro: { url: "./img/hombresloboHurt.png", w: 128, h: 128, speed: this.velocidadAnimacionBase * 1.5 },
      correrEnojado: { url: "./img/hombreslobo.png", w: 128, h: 128, speed: this.velocidadAnimacionBase },
      ataque1Enojado: { url: "./img/hombreslobo.png", w: 128, h: 128, speed: this.velocidadAnimacionBase },
      ataque2Enojado: { url: "./img/hombreslobo.png", w: 128, h: 128, speed: this.velocidadAnimacionBase },
      ataque3Enojado: { url: "./img/hombreslobo.png", w: 128, h: 128, speed: this.velocidadAnimacionBase },
      recibeTiroEnojado: { url: "./img/hombreslobo.png", w: 128, h: 128, speed: this.velocidadAnimacionBase * 1.5 }
    };
    
    Object.keys(specs).forEach(key => {
      const spec = specs[key];
      const texture = HombreLobo.texturasCache[key];
      
      if (!texture || !texture.baseTexture.valid) return;
      
      const width = texture.baseTexture.width;
      const height = texture.baseTexture.height;
      const cantFramesX = Math.floor(width / spec.w);
      const cantFramesY = Math.floor(height / spec.h);
      
      const frames = [];
      for (let i = 0; i < cantFramesX; i++) {
        for (let j = 0; j < cantFramesY; j++) {
          const rectangle = new PIXI.Rectangle(
            i * spec.w,
            j * spec.h,
            spec.w,
            spec.h
          );
          const frame = new PIXI.Texture(texture.baseTexture, rectangle);
          frames.push(frame);
        }
      }
      
      const animatedSprite = new PIXI.AnimatedSprite(frames);
      animatedSprite.animationSpeed = spec.speed;
      animatedSprite.loop = true;
      animatedSprite.anchor.set(0.5, 1);
      animatedSprite.play();
      
      this.spritesAnimados[key] = animatedSprite;
    });
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
      if (this.estado == this.estados.YENDO_AL_PLAYER) {
        vecAtraccionAlPlayer = this.atraccionAlJugador();
        this.cambiarSprite(spriteCorrer);
        
        if (this.distanciaAlPlayer && this.distanciaAlPlayer < this.juego.grid.cellSize * 1.5) {
          this.estado = this.estados.ATACANDO;
          this.atacar();
        }
        
        sumaDeVectores.x += (vecAtraccionAlPlayer || {}).x || 0;
        sumaDeVectores.x += (bordes || {}).x || 0;
        sumaDeVectores.x += (evasionObstaculos || {}).x || 0;

        sumaDeVectores.y += (vecAtraccionAlPlayer || {}).y || 0;
        sumaDeVectores.y += (bordes || {}).y || 0;
        sumaDeVectores.y += (evasionObstaculos || {}).y || 0;

        this.aplicarFuerza(sumaDeVectores);
      } else if (this.estado == this.estados.IDLE) {
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
      const rangoAtaque = this.juego.grid.cellSize * 1.5;
      
      if (this.distanciaAlPlayer && this.distanciaAlPlayer < rangoAtaque) {
        this.estado = this.estados.ATACANDO;
      } else if (this.estoyViendoAlPlayer || this.distanciaAlPlayer) {
        this.estado = this.estados.YENDO_AL_PLAYER;
      } else {
        this.estado = this.estados.IDLE;
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

      const esEnojado = this.fsmEmocional ? this.fsmEmocional.esEnojado() : false;
      const cooldown = esEnojado ? this.cooldownAtaqueEnojado : this.cooldownAtaque;
      const rangoAtaque = esEnojado ? this.juego.grid.cellSize * 1.5 : this.juego.grid.cellSize;

      if (ahora - this.ultimoAtaque >= cooldown && distanciaAlPlayer < rangoAtaque) {
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
        
        const duracionAtaque = esEnojado ? 250 : 350;

        setTimeout(() => {
          if (this.estado === this.estados.ATACANDO || this.estado === this.estados.YENDO_AL_PLAYER || this.estado === this.estados.IDLE) {
            this.cambiarSprite(spriteCorrer);
          }
        }, duracionAtaque);
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
    const margen = 20;

    if (this.container.x < margen) {
      this.container.x = margen;
      fuerza.x = 1;
    }
    
    if (this.container.y < margen) {
      this.container.y = margen;
      fuerza.y = 1;
    }
    
    if (this.container.x > this.juego.canvasWidth - margen) {
      this.container.x = this.juego.canvasWidth - margen;
      fuerza.x = -1;
    }
    
    if (this.container.y > this.juego.canvasHeight - margen) {
      this.container.y = this.juego.canvasHeight - margen;
      fuerza.y = -1;
    }

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

// ============================================================
// CACHE GLOBAL DE TEXTURAS - DEFINIDO AL FINAL
// ============================================================
HombreLobo.texturasCargadas = false;
HombreLobo.texturasCache = {};
HombreLobo.cargandoTexturas = false;
HombreLobo.promesaCarga = null;

HombreLobo.cargarTexturasGlobales = function() {
  if (HombreLobo.texturasCargadas) {
    return Promise.resolve();
  }
  
  if (HombreLobo.cargandoTexturas) {
    return HombreLobo.promesaCarga;
  }
  
  HombreLobo.cargandoTexturas = true;
  console.log("🎨 Cargando texturas de HombreLobo (primera vez)...");
  
  const urls = {
    correr: "./img/hombresloboWalk.png",
    ataque1: "./img/hombresloboAttack_1.png",
    ataque2: "./img/hombresloboAttack_2.png",
    ataque3: "./img/hombresloboAttack_3.png",
    morir: "./img/hombresloboDead.png",
    recibeTiro: "./img/hombresloboHurt.png",
    correrEnojado: "./img/hombreslobo.png",
    ataque1Enojado: "./img/hombreslobo.png",
    ataque2Enojado: "./img/hombreslobo.png",
    ataque3Enojado: "./img/hombreslobo.png",
    recibeTiroEnojado: "./img/hombreslobo.png"
  };
  
  const promesas = Object.keys(urls).map(key => {
    return new Promise((resolve) => {
      const texture = PIXI.Texture.from(urls[key]);
      texture.baseTexture.on("loaded", () => {
        HombreLobo.texturasCache[key] = texture;
        resolve();
      });
    });
  });
  
  HombreLobo.promesaCarga = Promise.all(promesas).then(() => {
    HombreLobo.texturasCargadas = true;
    HombreLobo.cargandoTexturas = false;
    console.log("✅ Texturas de HombreLobo cargadas!");
  });
  
  return HombreLobo.promesaCarga;
};

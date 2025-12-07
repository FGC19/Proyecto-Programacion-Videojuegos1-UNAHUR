// ============================================================
// ESTADOS DE EMOCIÓN - Finite State Machine
// ============================================================

// Clase base para todos los estados
class EstadoEmocional {
  constructor(zombie) {
    this.zombie = zombie;
  }

  // Métodos que cada estado debe implementar
  entrar() {
    // Código que se ejecuta al entrar al estado
  }

  salir() {
    // Código que se ejecuta al salir del estado
  }

  actualizar() {
    // Código que se ejecuta cada frame mientras está en este estado
  }

  verificarTransiciones() {
    // Retorna el siguiente estado si debe cambiar, o null si permanece
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
    // Retorna el nombre del sprite a usar según el tipo
    return tipoSprite;
  }
}

// ============================================================
// ESTADO NORMAL
// ============================================================
class EstadoNormal extends EstadoEmocional {
  entrar() {
    console.log("😐 Zombie en estado NORMAL");
    
    // Restaurar velocidad normal
    this.zombie.velocidadMax = this.zombie.velocidadBase;
    
    // Restaurar color normal
    this.zombie.container.tint = 0xffffff;
    
    // Restaurar velocidad de animaciones
    Object.keys(this.zombie.spritesAnimados).forEach(key => {
      if (this.zombie.spritesAnimados[key] && this.zombie.spritesAnimados[key].animationSpeed) {
        this.zombie.spritesAnimados[key].animationSpeed = this.zombie.velocidadAnimacionBase;
      }
    });
  }

  salir() {
    // Cleanup al salir del estado normal
  }

  actualizar() {
    // Comportamiento específico del estado normal cada frame
  }

  verificarTransiciones() {
    // Transición a ENOJADO si fue golpeado
    if (this.zombie.fueGolpeado && this.zombie.vida > 0) {
      return new EstadoEnojado(this.zombie);
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
    // Sprites normales
    return tipoSprite; // "correr", "ataque1", "recibeTiro", etc.
  }
}

// ============================================================
// ESTADO ENOJADO
// ============================================================
class EstadoEnojado extends EstadoEmocional {
  entrar() {
    console.log("🔥 ¡Zombie ENOJADO!");
    
    // Aumentar velocidad
    this.zombie.velocidadMax = this.zombie.velocidadBase * 1.8;
    
    // Cambiar color a rojo
    this.zombie.container.tint = 0xff2222;
    
    // Efecto de parpadeo al enojarse
    this.zombie.container.alpha = 0.7;
    setTimeout(() => {
      if (this.zombie.container) {
        this.zombie.container.alpha = 1;
      }
    }, 100);
    
    // Aumentar velocidad de animaciones
    Object.keys(this.zombie.spritesAnimados).forEach(key => {
      if (this.zombie.spritesAnimados[key] && this.zombie.spritesAnimados[key].animationSpeed) {
        this.zombie.spritesAnimados[key].animationSpeed = this.zombie.velocidadAnimacionBase * 1.5;
      }
    });
    
    console.log(`   Velocidad: ${this.zombie.velocidadMax.toFixed(2)}`);
    console.log(`   Daño: ${this.obtenerMultiplicadorDanio() * this.zombie.danioBase}`);
  }

  salir() {
    // Cleanup al salir del estado enojado
    console.log("😌 Zombie dejó de estar enojado");
  }

  actualizar() {
    // El zombie enojado podría tener comportamiento especial
    // Por ejemplo: gruñir, emitir partículas de furia, etc.
  }

  verificarTransiciones() {
    // El zombie permanece enojado hasta morir
    // Puedes agregar condiciones para que se calme, por ejemplo:
    // - Después de cierto tiempo
    // - Si el jugador se aleja mucho
    // - Si recibe curación, etc.
    
    return null; // Permanece enojado
  }

  obtenerMultiplicadorVelocidad() {
    return 1.8; // 80% más rápido
  }

  obtenerMultiplicadorDanio() {
    return 2.5; // 2.5x más daño
  }

  obtenerMultiplicadorAnimacion() {
    return 1.5; // 50% más rápido
  }

  obtenerSprite(tipoSprite) {
    // Sprites de enojo (usa las animaciones alternativas)
    return tipoSprite + "Enojado"; // "correrEnojado", "ataque1Enojado", etc.
  }
}

// ============================================================
// MÁQUINA DE ESTADOS FINITOS (FSM)
// ============================================================
class MaquinaDeEstadosEmocionales {
  constructor(zombie) {
    this.zombie = zombie;
    this.estadoActual = new EstadoNormal(zombie);
    this.estadoActual.entrar();
  }

  cambiarEstado(nuevoEstado) {
    if (!nuevoEstado) return;
    
    // Salir del estado actual
    this.estadoActual.salir();
    
    // Cambiar al nuevo estado
    this.estadoActual = nuevoEstado;
    
    // Entrar al nuevo estado
    this.estadoActual.entrar();
  }

  actualizar() {
    // Actualizar el estado actual
    this.estadoActual.actualizar();
    
    // Verificar si debe cambiar de estado
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
// CLASE ZOMBIE ACTUALIZADA CON FSM
// ============================================================
class Zombie extends Objeto {
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

    // ========== NUEVO: FSM de estados emocionales ==========
    this.fsmEmocional = null; // Se inicializa después de cargar sprites
    this.fueGolpeado = false;
    // ========== FIN NUEVO ==========
    
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
      
      // ========== NUEVO: Inicializar FSM cuando los sprites están listos ==========
      this.fsmEmocional = new MaquinaDeEstadosEmocionales(this);
      // ========== FIN NUEVO ==========
      
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
    
    // ========== MODIFICADO: Marcar como golpeado para FSM ==========
    if (!this.fueGolpeado && this.vida > 0) {
      this.fueGolpeado = true;
      // La FSM detectará esto en verificarTransiciones()
    }
    // ========== FIN MODIFICADO ==========
    
    if (this.vida <= 0) {
      this.juego.zombies = this.juego.zombies.filter((k) => k != this);
      this.grid.remove(this);
      let sprite = this.cambiarSprite("morir", 0, false);
      
      if (this.juego.sistemaNiveles) {
        this.juego.sistemaNiveles.zombieEliminado();
      }
      
      setTimeout(() => {
        this.borrar();
      }, 800);
    } else {
      // ========== MODIFICADO: Usar FSM para obtener sprite correcto ==========
      const spriteHurt = this.fsmEmocional ? this.fsmEmocional.obtenerSprite("recibeTiro") : "recibeTiro";
      let sprite = this.cambiarSprite(spriteHurt, 0, false);
      
      const spriteCorrer = this.fsmEmocional ? this.fsmEmocional.obtenerSprite("correr") : "correr";
      // ========== FIN MODIFICADO ==========
      
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
    this.vecinosZombies = this.vecinos.filter(v => v instanceof Zombie);
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

    // ========== MODIFICADO: Usar FSM para obtener sprite correcto ==========
    const spriteCorrer = this.fsmEmocional ? this.fsmEmocional.obtenerSprite("correr") : "correr";
    const esEnojado = this.fsmEmocional ? this.fsmEmocional.esEnojado() : false;
    // ========== FIN MODIFICADO ==========

    if (esEnojado) {
      // Comportamiento cuando está enojado: solo perseguir
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
      // Comportamiento normal: con grupo
      if (this.estado == this.estados.YENDO_AL_PLAYER) {
        vecAtraccionAlPlayer = this.atraccionAlJugador();
        this.cambiarSprite(spriteCorrer);
      } else if (this.estado == this.estados.IDLE) {
        vecAlineacion = this.alineacion(this.vecinosZombies);
        vecCohesion = this.cohesion(this.vecinosZombies);
        this.cambiarSprite(spriteCorrer);
        
        if (this.vecinosZombies.length === 0) {
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
        vecSeparacion = this.separacion(this.vecinosZombies);

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
    
    // ========== NUEVO: Actualizar FSM ==========
    if (this.fsmEmocional) {
      this.fsmEmocional.actualizar();
    }
    // ========== FIN NUEVO ==========
    
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
    // ========== MODIFICADO: Usar FSM para saber si está enojado ==========
    const esEnojado = this.fsmEmocional ? this.fsmEmocional.esEnojado() : false;
    // ========== FIN MODIFICADO ==========
    
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
        
        // ========== MODIFICADO: Usar FSM para obtener sprite correcto ==========
        const spriteAtaque = this.fsmEmocional 
          ? this.fsmEmocional.obtenerSprite("ataque" + numAtaque)
          : "ataque" + numAtaque;
        // ========== FIN MODIFICADO ==========
        
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

    vecinos.forEach((zombie) => {
      vecPromedio.x += zombie.container.x;
      vecPromedio.y += zombie.container.y;
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

    vecinos.forEach((zombie) => {
      const distancia = distanciaAlCuadrado(
        this.container.x,
        this.container.y,
        zombie.container.x,
        zombie.container.y
      );

      const dif = new PIXI.Point(
        this.container.x - zombie.container.x,
        this.container.y - zombie.container.y
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

    vecinos.forEach((zombie) => {
      vecPromedio.x += zombie.velocidad.x;
      vecPromedio.y += zombie.velocidad.y;
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
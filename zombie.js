class Zombie extends Objeto {
  constructor(x, y, velocidad, juego) {
    super(x, y, velocidad, juego);
    this.equipoParaUpdate = Math.floor(Math.random() * 9) + 1;
    this.juego = juego;
    this.grid = juego.grid;
    this.vision = 100 + Math.floor(Math.random() * 150);
    this.vida = 2; // ← CAMBIADO: Ahora tiene 2 de vida
    this.vidaMaxima = 2; // ← NUEVO: Guardar vida máxima
    this.debug = 0;
    this.radio = 20;

    // ========== NUEVO: Sistema de estados de emoción ==========
    this.estadosEmocion = {
      NORMAL: 'normal',
      ENOJADO: 'enojado'
    };
    this.estadoEmocional = this.estadosEmocion.NORMAL;
    this.fueGolpeado = false; // ← NUEVO: Bandera para saber si ya fue golpeado
    
    // Estadísticas base
    this.velocidadBase = velocidad;
    this.danioBase = 10;
    this.velocidadAnimacionBase = velocidad * 0.5;
    
    // Multiplicadores para estado enojado
    this.multiplicadorVelocidadEnojado = 1.8; // 80% más rápido
    this.multiplicadorDanioEnojado = 2.5; // 2.5x más daño
    this.multiplicadorAnimacionEnojado = 1.5; // Animación más rápida
    // ========== FIN NUEVO ==========

    this.spritesTotales = 11; // ← CAMBIADO: Ahora cargamos más sprites
    this.spritesCargados = 0;

    // Sprites para estado NORMAL
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

    // ========== NUEVO: Sprites para estado ENOJADO ==========
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
      this.cambiarSprite("correr");
    }
  }

  // ========== NUEVO: Métodos para manejar el estado de enojo ==========
  cambiarEstadoEmocional(nuevoEstado) {
    if (this.estadoEmocional === nuevoEstado) return;
    
    this.estadoEmocional = nuevoEstado;
    
    if (nuevoEstado === this.estadosEmocion.ENOJADO) {
      // Aumentar velocidad máxima
      this.velocidadMax = this.velocidadBase * this.multiplicadorVelocidadEnojado;
      
      // Aumentar velocidad de todas las animaciones
      Object.keys(this.spritesAnimados).forEach(key => {
        if (this.spritesAnimados[key] && this.spritesAnimados[key].animationSpeed) {
          const velocidadOriginal = this.spritesAnimados[key].animationSpeed;
          this.spritesAnimados[key].animationSpeed = velocidadOriginal * this.multiplicadorAnimacionEnojado;
        }
      });
      
      // Aplicar efecto visual: tinte rojo intenso
      this.container.tint = 0xff2222;
      
      // Opcional: Hacer que parpadee brevemente
      this.container.alpha = 0.7;
      setTimeout(() => {
        if (this.container) this.container.alpha = 1;
      }, 100);
      
      console.log("🔥 ¡Zombie ENOJADO! Vel:", this.velocidadMax.toFixed(2), "Daño:", this.obtenerDanioActual());
      
    } else if (nuevoEstado === this.estadosEmocion.NORMAL) {
      // Restaurar velocidad normal
      this.velocidadMax = this.velocidadBase;
      
      // Restaurar velocidad de animación normal
      Object.keys(this.spritesAnimados).forEach(key => {
        if (this.spritesAnimados[key] && this.spritesAnimados[key].animationSpeed) {
          const velocidadEnojada = this.spritesAnimados[key].animationSpeed;
          this.spritesAnimados[key].animationSpeed = velocidadEnojada / this.multiplicadorAnimacionEnojado;
        }
      });
      
      // Quitar tinte (volver a blanco = color normal)
      this.container.tint = 0xffffff;
    }
  }

  obtenerDanioActual() {
    if (this.estadoEmocional === this.estadosEmocion.ENOJADO) {
      return this.danioBase * this.multiplicadorDanioEnojado;
    }
    return this.danioBase;
  }
  // ========== FIN NUEVO ==========

  recibirTiro() {
    this.vida -= 1; // ← CAMBIADO: Cada flecha hace 1 de daño
    
    // ========== NUEVO: Activar modo enojo al primer golpe ==========
    if (!this.fueGolpeado && this.vida > 0) {
      this.fueGolpeado = true;
      this.cambiarEstadoEmocional(this.estadosEmocion.ENOJADO);
    }
    // ========== FIN NUEVO ==========
    
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
      // ← MODIFICADO: Usar sprite según estado emocional
      const spriteHurt = this.estadoEmocional === this.estadosEmocion.ENOJADO ? "recibeTiroEnojado" : "recibeTiro";
      let sprite = this.cambiarSprite(spriteHurt, 0, false);
      
      const spriteCorrer = this.estadoEmocional === this.estadosEmocion.ENOJADO ? "correrEnojado" : "correr";
      
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
    
    // ← NUEVO: Obtener zombies vecinos específicamente para comportamiento grupal
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

    const spriteCorrer = this.estadoEmocional === this.estadosEmocion.ENOJADO ? "correrEnojado" : "correr";

    // ← NUEVO: Si está enojado, SOLO perseguir al jugador (ignorar grupo)
    if (this.estadoEmocional === this.estadosEmocion.ENOJADO) {
      if (this.estado == this.estados.YENDO_AL_PLAYER || this.estado == this.estados.IDLE) {
        vecAtraccionAlPlayer = this.atraccionAlJugador();
        this.cambiarSprite(spriteCorrer);
        
        // Solo aplicar atracción al jugador, bordes y evasión de obstáculos
        sumaDeVectores.x += (vecAtraccionAlPlayer || {}).x || 0;
        sumaDeVectores.x += (bordes || {}).x || 0;
        sumaDeVectores.x += (evasionObstaculos || {}).x || 0;

        sumaDeVectores.y += (vecAtraccionAlPlayer || {}).y || 0;
        sumaDeVectores.y += (bordes || {}).y || 0;
        sumaDeVectores.y += (evasionObstaculos || {}).y || 0;

        this.aplicarFuerza(sumaDeVectores);
      }
    } else {
      // ← Comportamiento NORMAL (con grupo)
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
    if (this.juego.contadorDeFrames % this.equipoParaUpdate == 0) {
      this.mirarAlrededor();
      this.segunDatosCambiarDeEstado();
      this.hacerCosasSegunEstado(); // La evasión ya se aplica aquí
    }

    super.update();
  }

  resolverColisionesConObstaculos() {
    if (!this.juego.obstaculos) return null;
    
    let fuerzaEvasion = new PIXI.Point(0, 0);
    let hayColision = false;
    
    // Radio de detección más amplio para evasión anticipada
    const radioDeteccion = this.radio + 40;
    
    for (let obstaculo of this.juego.obstaculos) {
      const dx = this.container.x - obstaculo.container.x;
      const dy = this.container.y - obstaculo.container.y;
      const distancia = Math.sqrt(dx * dx + dy * dy);
      const radioTotal = this.radio + obstaculo.radio;
      
      // Si está en colisión directa, empujar fuera
      if (distancia < radioTotal && distancia > 0) {
        const superposicion = radioTotal - distancia;
        const nx = dx / distancia;
        const ny = dy / distancia;
        
        this.container.x += nx * superposicion;
        this.container.y += ny * superposicion;
        hayColision = true;
      }
      
      // Sistema de evasión anticipada
      if (distancia < radioDeteccion && distancia > 0) {
        const nx = dx / distancia;
        const ny = dy / distancia;
        
        // Fuerza de repulsión que disminuye con la distancia
        const fuerza = (radioDeteccion - distancia) / radioDeteccion;
        
        // Si está persiguiendo al jugador, calcular vector tangencial para rodear
        if (this.estado === this.estados.YENDO_AL_PLAYER) {
          // Vector perpendicular para esquivar (rodear el obstáculo)
          const tangencialX = -ny;
          const tangencialY = nx;
          
          // Decidir dirección de esquive según posición del jugador
          const haciaJugadorX = this.juego.player.container.x - this.container.x;
          const haciaJugadorY = this.juego.player.container.y - this.container.y;
          
          // Producto punto para saber qué lado del obstáculo es mejor
          const productopunto = tangencialX * haciaJugadorX + tangencialY * haciaJugadorY;
          const direccion = productopunto > 0 ? 1 : -1;
          
          // Combinar repulsión normal con movimiento tangencial
          fuerzaEvasion.x += nx * fuerza * 3 + tangencialX * direccion * fuerza * 2;
          fuerzaEvasion.y += ny * fuerza * 3 + tangencialY * direccion * fuerza * 2;
        } else {
          // Si no está persiguiendo, solo repeler
          fuerzaEvasion.x += nx * fuerza * 2;
          fuerzaEvasion.y += ny * fuerza * 2;
        }
      }
    }
    
    return hayColision || fuerzaEvasion.x !== 0 || fuerzaEvasion.y !== 0 ? fuerzaEvasion : null;
  }

  segunDatosCambiarDeEstado() {
    // ← MODIFICADO: Si está enojado, siempre perseguir o atacar (nunca IDLE)
    if (this.estadoEmocional === this.estadosEmocion.ENOJADO) {
      if (this.estoyTocandoAlPlayer) {
        this.estado = this.estados.ATACANDO;
      } else {
        this.estado = this.estados.YENDO_AL_PLAYER; // Siempre perseguir cuando enojado
      }
    } else {
      // Comportamiento normal
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
        
        // ← MODIFICADO: Usar sprite de ataque según estado emocional
        const spriteAtaque = this.estadoEmocional === this.estadosEmocion.ENOJADO 
          ? "ataque" + numAtaque + "Enojado" 
          : "ataque" + numAtaque;
        
        const sprite = this.cambiarSprite(spriteAtaque, 0, false);

        // ← MODIFICADO: Usar daño actual según el estado emocional
        if (this.juego && this.juego.player && typeof this.juego.player.recibirDanio === 'function') {
          const danio = this.obtenerDanioActual();
          this.juego.player.recibirDanio(danio);
        }

        this.ultimoAtaque = ahora;

        const spriteCorrer = this.estadoEmocional === this.estadosEmocion.ENOJADO ? "correrEnojado" : "correr";

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

      // ← MODIFICADO: Aumentar la fuerza de cohesión para mejor agrupación
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

      // ← MODIFICADO: Aumentar la fuerza de alineación
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
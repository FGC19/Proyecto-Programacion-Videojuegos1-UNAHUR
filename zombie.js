class Zombie extends Objeto {
  constructor(x, y, velocidad, juego) {
    super(x, y, velocidad, juego);
    this.equipoParaUpdate = Math.floor(Math.random() * 9) + 1;
    this.juego = juego;
    this.grid = juego.grid;
    this.vision = 100 + Math.floor(Math.random() * 150);
    this.vida = 1;
    this.debug = 0;
    this.radio = 20; // Radio de colisión

    this.spritesTotales = 6;
    this.spritesCargados = 0;

    // Velocidad de animación más lenta (dividida entre 2)
    const velocidadAnimacion = velocidad * 0.5;

    this.cargarSpriteAnimado("./img/hombresloboWalk.png", 128, 128, velocidadAnimacion, (sprite) => {
      this.spritesAnimados.correr = sprite;
      this.verificarCargaCompleta();
    });

    this.cargarSpriteAnimado("./img/hombresloboAttack_1.png", 128, 128, velocidadAnimacion, (sprite) => {
      this.spritesAnimados.ataque1 = sprite;
      this.verificarCargaCompleta();
    });

    this.cargarSpriteAnimado("./img/hombresloboAttack_2.png", 128, 128, velocidadAnimacion, (sprite) => {
      this.spritesAnimados.ataque2 = sprite;
      this.verificarCargaCompleta();
    });

    this.cargarSpriteAnimado("./img/hombresloboAttack_3.png", 128, 128, velocidadAnimacion, (sprite) => {
      this.spritesAnimados.ataque3 = sprite;
      this.verificarCargaCompleta();
    });

    this.cargarSpriteAnimado("./img/hombresloboDead.png", 128, 128, velocidadAnimacion * 0.5, (sprite) => {
      this.spritesAnimados.morir = sprite;
      this.verificarCargaCompleta();
    });

    this.cargarSpriteAnimado("./img/hombresloboHurt.png", 128, 128, velocidadAnimacion * 1.5, (sprite) => {
      this.spritesAnimados.recibeTiro = sprite;
      this.verificarCargaCompleta();
    });

    this.estados = { IDLE: 0, YENDO_AL_PLAYER: 1, ATACANDO: 2 };
    this.estado = this.estados.IDLE;
    // Sistema de ataque: cooldown para no pegar cada frame
    this.ultimoAtaque = 0;
    this.cooldownAtaque = 500; // ms entre ataques (reducido)
  }

  verificarCargaCompleta() {
    this.spritesCargados++;
    if (this.spritesCargados === this.spritesTotales) {
      console.log("✓ Todos los sprites del hombre lobo cargados!");
      this.listo = true;
      this.cambiarSprite("correr");
    }
  }

  recibirTiro() {
    this.vida -= 1.34;
    if (this.vida <= 0) {
      this.juego.zombies = this.juego.zombies.filter((k) => k != this);
      this.grid.remove(this);
      let sprite = this.cambiarSprite("morir", 0, false);
      
      // Notificar al sistema de niveles
      if (this.juego.sistemaNiveles) {
        this.juego.sistemaNiveles.zombieEliminado();
      }
      
      setTimeout(() => {
        this.borrar();
      }, 800);
    } else {
      let sprite = this.cambiarSprite("recibeTiro", 0, false);
      
      setTimeout(() => {
        if (this.estado === this.estados.YENDO_AL_PLAYER || this.estado === this.estados.IDLE) {
          this.cambiarSprite("correr");
        }
      }, 300);

      this.velocidad.x = 0;
      this.velocidad.y = 0;
    }
  }

  mirarAlrededor() {
    this.vecinos = this.obtenerVecinos();
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
    let vecAtraccionAlPlayer, vecSeparacion, vecAlineacion, vecCohesion, bordes;
    let sumaDeVectores = new PIXI.Point(0, 0);

    bordes = this.ajustarPorBordes();

    if (this.estado == this.estados.YENDO_AL_PLAYER) {
      vecAtraccionAlPlayer = this.atraccionAlJugador();
      this.cambiarSprite("correr");
    } else if (this.estado == this.estados.IDLE) {
      vecAlineacion = this.alineacion(this.vecinos);
      vecCohesion = this.cohesion(this.vecinos);
      this.cambiarSprite("correr");
    }

    if (
      this.estado == this.estados.IDLE ||
      this.estado == this.estados.YENDO_AL_PLAYER
    ) {
      vecSeparacion = this.separacion(this.vecinos);

      sumaDeVectores.x += (vecSeparacion || {}).x || 0;
      sumaDeVectores.x += (vecAlineacion || {}).x || 0;
      sumaDeVectores.x += (vecCohesion || {}).x || 0;
      sumaDeVectores.x += (vecAtraccionAlPlayer || {}).x || 0;
      sumaDeVectores.x += (bordes || {}).x || 0;

      sumaDeVectores.y += (vecSeparacion || {}).y || 0;
      sumaDeVectores.y += (vecAlineacion || {}).y || 0;
      sumaDeVectores.y += (vecCohesion || {}).y || 0;
      sumaDeVectores.y += (vecAtraccionAlPlayer || {}).y || 0;
      sumaDeVectores.y += (bordes || {}).y || 0;

      this.aplicarFuerza(sumaDeVectores);
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
      this.hacerCosasSegunEstado();
    }

    super.update();

    // Verificar colisiones y aplicar repulsión
    this.resolverColisionesConObstaculos();
  }

  resolverColisionesConObstaculos() {
    if (!this.juego.obstaculos) return;
    
    for (let obstaculo of this.juego.obstaculos) {
      const dx = this.container.x - obstaculo.container.x;
      const dy = this.container.y - obstaculo.container.y;
      const distancia = Math.sqrt(dx * dx + dy * dy);
      const radioTotal = this.radio + obstaculo.radio;
      
      if (distancia < radioTotal && distancia > 0) {
        // Calcular la superposición
        const superposicion = radioTotal - distancia;
        
        // Normalizar el vector de dirección
        const nx = dx / distancia;
        const ny = dy / distancia;
        
        // Empujar al zombie fuera del árbol
        this.container.x += nx * superposicion;
        this.container.y += ny * superposicion;
        
        // Cambiar dirección ligeramente
        this.velocidad.x += nx * 0.5;
        this.velocidad.y += ny * 0.5;
      }
    }
  }

  segunDatosCambiarDeEstado() {
    if (this.estoyTocandoAlPlayer) {
      this.estado = this.estados.ATACANDO;
    } else if (this.estoyViendoAlPlayer) {
      this.estado = this.estados.YENDO_AL_PLAYER;
    } else {
      this.estado = this.estados.IDLE;
    }
  }

  atacar() {
    // Comprobar distancia y cooldown primero (no depender del sprite)
    try {
      const ahora = Date.now();
      const distanciaAlPlayer = calculoDeDistanciaRapido(
        this.container.x,
        this.container.y,
        this.juego.player.container.x,
        this.juego.player.container.y
      );

      if (ahora - this.ultimoAtaque >= this.cooldownAtaque && distanciaAlPlayer < this.juego.grid.cellSize) {
        // Ejecutar animación de ataque una vez
        const cualAtaque = (Math.floor(Math.random() * 2) + 1).toString();
        const sprite = this.cambiarSprite("ataque" + cualAtaque, 0, false);

        // Aplicar daño al player
        if (this.juego && this.juego.player && typeof this.juego.player.recibirDanio === 'function') {
          this.juego.player.recibirDanio(10, { x: this.container.x, y: this.container.y }, 4);
        }

        this.ultimoAtaque = ahora;

        // Volver a correr después de un breve tiempo (duración de ataque)
        setTimeout(() => {
          if (this.estado === this.estados.ATACANDO || this.estado === this.estados.YENDO_AL_PLAYER || this.estado === this.estados.IDLE) {
            this.cambiarSprite("correr");
          }
        }, 350);
      }
    } catch (e) {
      // Silenciar errores por seguridad
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

      vecPromedio.x *= 0.02;
      vecPromedio.y *= 0.02;
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

      vecPromedio.x *= 0.2;
      vecPromedio.y *= 0.2;
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

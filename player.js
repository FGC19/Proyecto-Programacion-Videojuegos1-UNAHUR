class Player extends Objeto {
  constructor(x, y, juego) {
    super(x, y, 3, juego);
    this.velocidadMaximaOriginal = 3;
    this.juego = juego;
    this.grid = juego.grid;
    this.radio = 20; // Radio de colisión del jugador
    
    // Sistema de vida
    this.vidaMaxima = 100;
    this.vida = 100;
    this.invulnerable = false;
  this.tiempoInvulnerabilidad = 350; // ms de invulnerabilidad después de recibir daño (reducido)
  // Estado para el sistema de daño
  this.estaMuerto = false;
  this.ultimoGolpe = 0; // timestamp del último golpe recibido

    this.cargarVariosSpritesAnimados(
      {
        idle: "./img/samuraiIdle.png",
        correr: "./img/samuraiRun.png",
        disparar: "./img/samuraiShot.png",
      },
      128,
      128,
      0.2,
      (e) => {
        this.listo = true;
        this.cambiarSprite("idle");
      }
    );
  }

  disparar() {
    if (!this.listo || !this.spritesAnimados.disparar) {
      return;
    }

    if (this.velocidad.x !== 0 || this.velocidad.y !== 0) {
      return;
    }

    let sprite = this.cambiarSprite("disparar", 0, false);
    
    setTimeout(() => {
      this.cambiarSprite("idle");
    }, 1000);

    let angulo = Math.atan2(
      this.juego.mouse.x - this.app.stage.x - this.container.x,
      this.juego.mouse.y - this.app.stage.y - this.container.y
    );
    
    this.juego.balas.push(
      new Bala(
        this.container.x,
        this.container.y - 40,
        this.juego,
        Math.sin(angulo),
        Math.cos(angulo)
      )
    );

    this.velocidad.x = 0;
    this.velocidad.y = 0;
  }

  update() {
    if (!this.listo) return;
    if (this.estaMuerto) return; // Si está muerto, no procesar entrada ni movimiento
    this.vecinos = this.obtenerVecinos();

    if (this.juego.keyboard.a) {
      this.velocidad.x = -1;
    } else if (this.juego.keyboard.d) {
      this.velocidad.x = 1;
    } else {
      this.velocidad.x = 0;
    }

    if (this.juego.keyboard.w) {
      this.velocidad.y = -1;
    } else if (this.juego.keyboard.s) {
      this.velocidad.y = 1;
    } else {
      this.velocidad.y = 0;
    }

    let cantidadDeObjetosEnMiCelda = Object.keys(
      (this.miCeldaActual || {}).objetosAca || {}
    ).length;

    if (cantidadDeObjetosEnMiCelda > 3) {
      let cant = cantidadDeObjetosEnMiCelda - 3;
      this.velocidadMax = this.velocidadMaximaOriginal * (0.3 + 0.7 / cant);
    } else {
      this.velocidadMax = this.velocidadMaximaOriginal;
    }

    if (Math.abs(this.velocidad.y) > 0 || Math.abs(this.velocidad.x) > 0) {
      this.cambiarSprite("correr");
    } else if (this.spriteActual == "correr") {
      this.cambiarSprite("idle");
    }

    super.update();

    // Verificar colisiones y aplicar repulsión
    this.resolverColisionesConObstaculos();
  }

  // -------------------- Sistema de daño --------------------
  // amount: cantidad de vida a restar
  // fuente: objeto con {x, y} o contenedor del que proviene el daño (opcional)
  recibirDanio(amount, fuente = null, knockback = 6) {
    if (this.estaMuerto) return false;
    if (this.invulnerable) return false;

    this.vida -= amount;
    if (this.vida < 0) this.vida = 0;
    this.ultimoGolpe = Date.now();

    // Feedback visual simple: parpadeo mediante alpha
    const prevAlpha = this.container.alpha;
    this.container.alpha = 0.5;
    setTimeout(() => {
      // Si el jugador murió en el interín, mantener un estado distinto
      if (!this.estaMuerto) this.container.alpha = prevAlpha;
    }, 150);

    // Activar invulnerabilidad temporal
    this.invulnerable = true;
    setTimeout(() => {
      this.invulnerable = false;
    }, this.tiempoInvulnerabilidad);

    // Aplicar retroceso si hay fuente con coordenadas
    if (fuente && typeof fuente.x === "number" && typeof fuente.y === "number") {
      this.aplicarKnockback(fuente, knockback);
    }

    // Si la vida llegó a cero, gestionar muerte
    if (this.vida <= 0) {
      this.morir();
    }

    return true;
  }

  aplicarKnockback(fuente, fuerza = 6) {
    const dx = this.container.x - fuente.x;
    const dy = this.container.y - fuente.y;
    const distancia = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / distancia;
    const ny = dy / distancia;

    // Añadir al vector de velocidad actual para empujar al jugador
    this.velocidad.x += nx * fuerza;
    this.velocidad.y += ny * fuerza;
  }

  morir() {
    this.estaMuerto = true;
    this.listo = false;
    // Detener movimiento
    this.velocidad.x = 0;
    this.velocidad.y = 0;
    this.velocidadMax = 0;

    // Feedback visual de muerte
    this.container.alpha = 0.35;

    // Intentar llamar a un manejador de muerte del juego si existe
    if (this.juego && typeof this.juego.onPlayerDeath === "function") {
      try {
        this.juego.onPlayerDeath();
      } catch (e) {
        // no hacer nada si falla
      }
    }
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
        
        // Empujar al jugador fuera del árbol
        this.container.x += nx * superposicion;
        this.container.y += ny * superposicion;
        
        // Opcional: Reducir velocidad al chocar
        this.velocidad.x *= 0.5;
        this.velocidad.y *= 0.5;
      }
    }
  }

  atraccionAlMouse(mouse) {
    if (!mouse) return null;
    const vecMouse = new PIXI.Point(
      mouse.x - this.container.x,
      mouse.y - this.container.y
    );
    const distanciaCuadrada = distanciaAlCuadrado(
      this.container.x,
      this.container.y,
      mouse.x,
      mouse.y
    );

    if (distanciaCuadrada < 100 * 100) {
      vecMouse.x *= 0.2;
      vecMouse.y *= 0.2;
      return vecMouse;
    }

    return null;
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

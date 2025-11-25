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
    this.tiempoInvulnerabilidad = 1000; // 1 segundo de invulnerabilidad después de recibir daño

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
    
    // Verificar colisiones con zombies
    this.verificarColisionesConZombies();
    
    // Efecto visual cuando está invulnerable
    if (this.invulnerable) {
      this.container.alpha = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
    } else {
      this.container.alpha = 1;
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

  verificarColisionesConZombies() {
    if (this.invulnerable) return;
    
    for (let zombie of this.juego.zombies) {
      if (!zombie.listo) continue;
      
      const dx = this.container.x - zombie.container.x;
      const dy = this.container.y - zombie.container.y;
      const distancia = Math.sqrt(dx * dx + dy * dy);
      const radioTotal = this.radio + zombie.radio;
      
      if (distancia < radioTotal) {
        this.recibirDanio(5); // Recibe 5 de daño por contacto
        break; // Solo un zombie puede dañar por frame
      }
    }
  }

  recibirDanio(cantidad) {
    if (this.invulnerable) return;
    
    this.vida -= cantidad;
    
    // Asegurar que la vida no sea negativa
    if (this.vida < 0) this.vida = 0;
    
    // Activar invulnerabilidad temporal
    this.invulnerable = true;
    setTimeout(() => {
      this.invulnerable = false;
    }, this.tiempoInvulnerabilidad);
    
    // Si la vida llega a 0 o menos, morir
    if (this.vida <= 0) {
      this.morir();
    }
  }

  morir() {
    // Notificar al juego que el jugador murió
    if (this.juego.sistemaNiveles) {
      this.juego.sistemaNiveles.gameOver();
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

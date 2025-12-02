class ParticleSystem {
  static texturas = {};
  static cantTexturas = 15; // ← Aumentado de 10 a 15
  
  static getRandomSangre() {
    return ParticleSystem.texturas[
      "sangre" + Math.floor(Math.random() * ParticleSystem.cantTexturas)
    ];
  }
  
  constructor(juego) {
    this.juego = juego;
    this.particulas = [];
    this.pregenerarTexturas();
    this.gravedad = { x: 0, y: 0.5 }; // Adaptado a 2D (x, y)
  }
  
  pregenerarTexturas() {
    // Paleta de colores de sangre: rojos y bordó
    const coloresSangre = [
      0x8B0000, // Rojo oscuro (dark red)
      0xA52A2A, // Marrón (brown)
      0xB22222, // Ladrillo de fuego (firebrick)
      0xDC143C, // Carmesí (crimson)
      0xFF0000, // Rojo puro
      0xCD5C5C, // Rojo indio (indian red)
      0x800000, // Granate (maroon)
      0x8B0000, // Rojo oscuro
      0x9B111E, // Rojo rubí
      0x660000, // Bordó oscuro
      0x7C0A02, // Sangre coagulada
      0x450003, // Bordó muy oscuro
      0x990000, // Rojo medio oscuro
      0xAA0000, // Rojo carmín
      0x6A0001  // Bordó profundo
    ];
    
    // Crear 15 círculos de sangre con colores variados
    for (let i = 0; i < ParticleSystem.cantTexturas; i++) {
      const graphics = new PIXI.Graphics();
      
      // Seleccionar color de la paleta
      const color = coloresSangre[i % coloresSangre.length];
      
      // Variar el tamaño entre 2 y 4 píxeles
      const tamaño = 2 + Math.random() * 2;
      
      graphics.beginFill(color);
      graphics.drawCircle(0, 0, tamaño);
      graphics.endFill();
      
      const texture = this.juego.app.renderer.generateTexture(graphics);
      ParticleSystem.texturas["sangre" + i] = texture;
      graphics.destroy();
    }
    
    // Crear textura de saliva
    const salivaGraphics = new PIXI.Graphics();
    salivaGraphics.beginFill(0xffffff);
    salivaGraphics.drawCircle(0, 0, 1.5);
    salivaGraphics.endFill();
    ParticleSystem.texturas["saliva"] = this.juego.app.renderer.generateTexture(salivaGraphics);
    salivaGraphics.destroy();
  }
  
  hacerQueLeSalgaSangreAAlguien(quien, quienLePega) {
    if (!quien || !quienLePega || !quien.container || !quienLePega.container) return;
    
    const pos = {
      x: quien.container.x,
      y: quien.container.y - 40 // Un poco arriba del centro del personaje
    };
    
    // Calcular dirección del golpe
    const dx = pos.x - quienLePega.container.x;
    const dy = pos.y - quienLePega.container.y;
    const distancia = Math.sqrt(dx * dx + dy * dy);
    
    let direccion = { x: 0, y: 0 };
    if (distancia > 0) {
      direccion.x = (dx / distancia) * 2;
      direccion.y = (dy / distancia) * 2;
    }
    
    // Crear entre 8 y 15 partículas de sangre (antes era 3-8)
    const cant = 8 + Math.floor(Math.random() * 8);
    for (let i = 0; i < cant; i++) {
      const velocidadInicial = {
        x: direccion.x + (Math.random() * 5 - 2.5), // Mayor dispersión
        y: direccion.y + (Math.random() * 5 - 2.5) - 2.5 // Mayor bias hacia arriba
      };
      this.crearUnaParticula(pos, velocidadInicial, ParticleSystem.getRandomSangre());
    }
  }
  
  crearUnaParticula(pos, velocidadInicial, textura) {
    const particula = new Particula(pos, velocidadInicial, textura, this);
    this.particulas.push(particula);
    this.juego.app.stage.addChild(particula.sprite);
  }
  
  quitarParticula(particula) {
    this.juego.app.stage.removeChild(particula.sprite);
    this.particulas = this.particulas.filter((p) => p !== particula);
    particula.sprite.destroy();
  }
  
  update() {
    for (let i = this.particulas.length - 1; i >= 0; i--) {
      this.particulas[i].update(this.gravedad);
    }
  }
}

class Particula {
  constructor(pos, velocidadInicial, textura, particleSystem) {
    this.particleSystem = particleSystem;
    this.posicion = { x: pos.x, y: pos.y };
    this.velocidad = {
      x: velocidadInicial.x,
      y: velocidadInicial.y
    };
    this.textura = textura;
    this.sprite = new PIXI.Sprite(textura);
    this.sprite.x = this.posicion.x;
    this.sprite.y = this.posicion.y;
    this.sprite.alpha = 1;
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.zIndex = Z_INDEX.balas; // Usar el z-index de balas
    
    // Tiempo de vida
    this.tiempoVida = 0;
    this.tiempoMaximo = 120; // Frames antes de desaparecer
    this.enSuelo = false;
  }
  
  quitar() {
    this.particleSystem.quitarParticula(this);
  }
  
  update(gravedad) {
    this.tiempoVida++;
    
    // Si está en el suelo, solo desvanecer
    if (this.enSuelo) {
      this.sprite.alpha *= 0.98;
      if (this.sprite.alpha < 0.05 || this.tiempoVida > this.tiempoMaximo) {
        this.quitar();
      }
      return;
    }
    
    // Aplicar gravedad
    this.velocidad.y += gravedad.y;
    
    // Aplicar fricción del aire
    this.velocidad.x *= 0.98;
    this.velocidad.y *= 0.98;
    
    // Actualizar posición
    this.posicion.x += this.velocidad.x;
    this.posicion.y += this.velocidad.y;
    
    // Actualizar sprite
    this.sprite.x = this.posicion.x;
    this.sprite.y = this.posicion.y;
    
    // Actualizar zIndex basado en la posición Y
    this.sprite.zIndex = this.posicion.y;
    
    // Detectar si llegó al "suelo" (velocidad hacia abajo muy baja)
    if (this.velocidad.y > 0 && Math.abs(this.velocidad.y) < 0.5) {
      this.enSuelo = true;
      this.velocidad.x = 0;
      this.velocidad.y = 0;
    }
    
    // Límites del canvas
    if (this.posicion.x < 0 || this.posicion.x > this.particleSystem.juego.canvasWidth ||
        this.posicion.y < 0 || this.posicion.y > this.particleSystem.juego.canvasHeight) {
      this.quitar();
    }
  }
}

class ParticleSystem {
  static texturas = {};
  static cantTexturas = 15;
  
  static getRandomSangre() {
    return ParticleSystem.texturas[
      "sangre" + Math.floor(Math.random() * ParticleSystem.cantTexturas)
    ];
  }
  
  constructor(juego) {
    this.juego = juego;
    this.particulas = [];
    this.pregenerarTexturas();
    this.gravedad = { x: 0, y: 0.5 };
  }
  
  pregenerarTexturas() {
    const coloresSangre = [
      0x8B0000, 0xA52A2A, 0xB22222, 0xDC143C, 0xFF0000, 0xCD5C5C, 0x800000, 
      0x8B0000, 0x9B111E, 0x660000, 0x7C0A02, 0x450003, 0x990000, 0xAA0000, 0x6A0001
    ];
    
    for (let i = 0; i < ParticleSystem.cantTexturas; i++) {
      const graphics = new PIXI.Graphics();
      const color = coloresSangre[i % coloresSangre.length];
      const tamaño = 2 + Math.random() * 2;
      
      graphics.beginFill(color);
      graphics.drawCircle(0, 0, tamaño);
      graphics.endFill();
      
      const texture = this.juego.app.renderer.generateTexture(graphics);
      ParticleSystem.texturas["sangre" + i] = texture;
      graphics.destroy();
    }
    
    const salivaGraphics = new PIXI.Graphics();
    salivaGraphics.beginFill(0xffffff);
    salivaGraphics.drawCircle(0, 0, 1.5);
    salivaGraphics.endFill();
    ParticleSystem.texturas["saliva"] = this.juego.app.renderer.generateTexture(salivaGraphics);
    salivaGraphics.destroy();
  }
  
  hacerQueLeSalgaSangreAAlguien(quien, quienLePega) {
    if (!quien || !quienLePega || !quien.container || !quienLePega.container) return;
    
    // Las partículas salen de la posición del que RECIBE el daño
    const pos = {
      x: quien.container.x,
      y: quien.container.y - 40
    };
    
    // Calcular dirección desde quien pega HACIA quien recibe
    const dx = pos.x - quienLePega.container.x;
    const dy = pos.y - quienLePega.container.y;
    const distancia = Math.sqrt(dx * dx + dy * dy);
    
    let direccion = { x: 0, y: 0 };
    if (distancia > 0) {
      // Dirección hacia donde recibe el impacto (alejándose del atacante)
      direccion.x = (dx / distancia) * 3;
      direccion.y = (dy / distancia) * 3;
    }
    
    // Crear entre 12 y 25 partículas de sangre (antes era 8-16)
    const cant = 12 + Math.floor(Math.random() * 14);
    for (let i = 0; i < cant; i++) {
      const velocidadInicial = {
        x: direccion.x + (Math.random() * 6 - 3),
        y: direccion.y + (Math.random() * 6 - 3) - 3
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
    this.sprite.zIndex = Z_INDEX.balas;
    
    this.tiempoVida = 0;
    this.tiempoMaximo = 120;
    this.enSuelo = false;
  }
  
  quitar() {
    this.particleSystem.quitarParticula(this);
  }
  
  update(gravedad) {
    this.tiempoVida++;
    
    if (this.enSuelo) {
      this.sprite.alpha *= 0.98;
      if (this.sprite.alpha < 0.05 || this.tiempoVida > this.tiempoMaximo) {
        this.quitar();
      }
      return;
    }
    
    this.velocidad.y += gravedad.y;
    this.velocidad.x *= 0.98;
    this.velocidad.y *= 0.98;
    
    this.posicion.x += this.velocidad.x;
    this.posicion.y += this.velocidad.y;
    
    this.sprite.x = this.posicion.x;
    this.sprite.y = this.posicion.y;
    this.sprite.zIndex = this.posicion.y;
    
    if (this.velocidad.y > 0 && Math.abs(this.velocidad.y) < 0.5) {
      this.enSuelo = true;
      this.velocidad.x = 0;
      this.velocidad.y = 0;
    }
    
    if (this.posicion.x < 0 || this.posicion.x > this.particleSystem.juego.canvasWidth ||
        this.posicion.y < 0 || this.posicion.y > this.particleSystem.juego.canvasHeight) {
      this.quitar();
    }
  }
}

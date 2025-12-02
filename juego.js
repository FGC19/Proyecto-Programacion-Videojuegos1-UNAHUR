// Clase Juego (Actualizada con Sistema de Partículas)
class Juego {
  constructor() {
    this.pausa = false;
    this.canvasWidth = window.innerWidth * 2;
    this.canvasHeight = window.innerHeight * 2;
    this.app = new PIXI.Application({
      width: this.canvasWidth,
      height: this.canvasHeight,
      resizeTo: window,
      backgroundColor: 0x1099bb,
    });
    document.body.appendChild(this.app.view);
    this.gridActualizacionIntervalo = 10;
    this.contadorDeFrames = 0;
    this.grid = new Grid(50, this);
    this.zombies = [];
    this.balas = [];
    this.obstaculos = [];
    this.arboles = [];

    this.keyboard = {};

    this.app.stage.sortableChildren = true;

    // ========== NUEVO: Inicializar sistema de partículas ==========
    this.particleSystem = new ParticleSystem(this);
    console.log("✓ Sistema de partículas inicializado");
    // ========== FIN NUEVO ==========

    this.ponerFondo();
    this.ponerProtagonista();
    
    this.sistemaNiveles = new SistemaNiveles(this);

    this.ponerListeners();

    setTimeout(() => {
      this.app.ticker.add(this.actualizar.bind(this));
      window.__PIXI_APP__ = this.app;
      
      this.sistemaNiveles.iniciarNivel(1);
    }, 100);
  }

  ponerFondo() {
    PIXI.Texture.fromURL("./img/pasto5.png").then((patternTexture) => {
      this.backgroundSprite = new PIXI.TilingSprite(patternTexture, 5000, 5000);
      this.app.stage.addChild(this.backgroundSprite);
    });
  }

  ponerProtagonista() {
    this.player = new Player(
      window.innerWidth / 2,
      window.innerHeight * 0.9,
      this
    );
  }

  ponerArboles(cantidad) {
    for (let i = 0; i < cantidad; i++) {
      const x = Math.random() * this.canvasWidth;
      const y = Math.random() * this.canvasHeight;
      const tipo = Math.floor(Math.random() * 2) + 1;
      const scale = 0.8 + Math.random() * 0.4;
      
      const arbol = new Arbol(x, y, this, tipo, scale);
      this.arboles.push(arbol);
    }
  }

  ponerFaroles(cantidad) {
    for (let i = 0; i < cantidad; i++) {
      const x = Math.random() * this.canvasWidth;
      const y = Math.random() * this.canvasHeight;
      const radioLuz = 150 + Math.random() * 100;
      
      new Farol(x, y, this, radioLuz);
    }
  }

  ponerZombies(cant) {
    for (let i = 0; i < cant; i++) {
      let velocidad = Math.random() * 0.2 + 0.5;
      const zombie = new Zombie(
        Math.random() * this.canvasWidth,
        Math.random() * this.canvasHeight,
        velocidad,
        this
      );
      this.zombies.push(zombie);
      this.grid.add(zombie);
    }
  }

  ponerZombiesConConfiguracion(cant, velocidadMin, velocidadMax) {
    for (let i = 0; i < cant; i++) {
      let velocidad = Math.random() * (velocidadMax - velocidadMin) + velocidadMin;
      const zombie = new Zombie(
        Math.random() * this.canvasWidth,
        Math.random() * this.canvasHeight,
        velocidad,
        this
      );
      this.zombies.push(zombie);
      this.grid.add(zombie);
    }
  }

  mouseDownEvent() {
    this.player.disparar();
  }

  ponerListeners() {
    this.app.view.addEventListener("mousedown", () => {
      (this.mouse || {}).click = true;
      this.mouseDownEvent();
    });
    this.app.view.addEventListener("mouseup", () => {
      (this.mouse || {}).click = false;
    });

    this.app.view.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.app.view.addEventListener("mouseleave", () => {
      this.mouse = null;
    });
    window.addEventListener("resize", () => {
      this.app.renderer.resize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener("keydown", (e) => {
      this.keyboard[e.key.toLowerCase()] = true;
    });

    window.addEventListener("keyup", (e) => {
      delete this.keyboard[e.key.toLowerCase()];
    });

    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === 'l' && this.sistemaIluminacion) {
        this.sistemaIluminacion.toggle();
      }
    });
  }

  onMouseMove(event) {
    this.mouse = { x: 0, y: 0 };
    const rect = this.app.view.getBoundingClientRect();
    this.mouse.x = event.clientX - rect.left;
    this.mouse.y = event.clientY - rect.top;
  }

  pausar() {
    this.pausa = !this.pausa;
  }

  actualizar() {
    if (this.pausa) return;
    this.contadorDeFrames++;

    this.player.update();
    
    this.zombies.forEach((zombie) => {
      zombie.update();
    });
    
    this.balas.forEach((bala) => {
      bala.update();
    });

    this.obstaculos.forEach((obstaculo) => {
      obstaculo.update();
    });

    // ========== NUEVO: Actualizar sistema de partículas ==========
    if (this.particleSystem) {
      this.particleSystem.update();
    }
    // ========== FIN NUEVO ==========

    if (this.sistemaIluminacion) {
      this.sistemaIluminacion.tick();
    }

    if (this.sistemaNiveles) {
      this.sistemaNiveles.update();
    }

    this.moverCamara();
  }

  moverCamara() {
    let lerpFactor = 0.05;
    const playerX = this.player.container.x;
    const playerY = this.player.container.y;

    const halfScreenWidth = this.app.screen.width / 2;
    const halfScreenHeight = this.app.screen.height / 2;

    const targetX = halfScreenWidth - playerX;
    const targetY = halfScreenHeight - playerY;

    const clampedX = Math.min(
      Math.max(targetX, -(this.canvasWidth - this.app.screen.width)),
      0
    );
    const clampedY = Math.min(
      Math.max(targetY, -(this.canvasHeight - this.app.screen.height)),
      0
    );

    this.app.stage.position.x = lerp(
      this.app.stage.position.x,
      clampedX,
      lerpFactor
    );
    this.app.stage.position.y = lerp(
      this.app.stage.position.y,
      clampedY,
      lerpFactor
    );
  }
}

// Inicializar el juego
let juego = new Juego();

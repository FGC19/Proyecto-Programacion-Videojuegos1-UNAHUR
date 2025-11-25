// Clase Juego (Actualizada)
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
    this.obstaculos = []; // Array para obstáculos
    this.faroles = []; // Array para faroles
    this.arboles = []; // Array para árboles (para el sistema de iluminación)

    this.keyboard = {};

    this.app.stage.sortableChildren = true;

    this.ponerFondo();
    this.ponerProtagonista();
    
    // Inicializar sistema de niveles
    this.sistemaNiveles = new SistemaNiveles(this);
    
    // NO llamar a ponerArboles, ponerFaroles, ponerZombies aquí
    // El sistema de niveles se encargará

    this.ponerListeners();

    // Inicializar sistema de iluminación
    this.sistemaIluminacion = new SistemaDeIluminacion(this);

    setTimeout(() => {
      this.app.ticker.add(this.actualizar.bind(this));
      window.__PIXI_APP__ = this.app;
      
      // Iniciar el nivel 1
      this.sistemaNiveles.iniciarNivel(1);
    }, 100);
  }

  ponerFondo() {
    PIXI.Texture.fromURL("./img/bg.png").then((patternTexture) => {
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

  // ← NUEVO: Método para generar árboles
  ponerArboles(cantidad) {
    for (let i = 0; i < cantidad; i++) {
      const x = Math.random() * this.canvasWidth;
      const y = Math.random() * this.canvasHeight;
      const tipo = Math.floor(Math.random() * 2) + 1; // Tipo 1 o 2
      const scale = 0.8 + Math.random() * 0.4; // Escala entre 0.8 y 1.2
      
      const arbol = new Arbol(x, y, this, tipo, scale);
      this.arboles.push(arbol);
    }
  }

  // ← NUEVO: Método para generar faroles
  ponerFaroles(cantidad) {
    for (let i = 0; i < cantidad; i++) {
      const x = Math.random() * this.canvasWidth;
      const y = Math.random() * this.canvasHeight;
      const radioLuz = 150 + Math.random() * 100; // Radio entre 150 y 250
      
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

  // ← NUEVO: Método para crear zombies con configuración específica
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

    // ← NUEVO: Tecla L para toggle de iluminación
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

    // ← NUEVO: Actualizar obstáculos (para animaciones)
    this.obstaculos.forEach((obstaculo) => {
      obstaculo.update();
    });

    // ← NUEVO: Actualizar sistema de iluminación
    if (this.sistemaIluminacion) {
      this.sistemaIluminacion.tick();
    }

    // ← NUEVO: Actualizar sistema de niveles
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

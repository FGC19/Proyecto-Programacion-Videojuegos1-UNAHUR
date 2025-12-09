class SistemaNiveles {
  constructor(juego) {
    this.juego = juego;
    this.nivelActual = 1;
    this.hombresLoboEliminados = 0;
    
    this.score = 0;
    this.highScore = this.cargarHighScore();
    this.puntosPorHombreLobo = 10;
    this.puntosPorNivel = 500;
    
    // Configuración de niveles
    this.niveles = {
      1: {
        hombresLobo: 150,
        arboles: 50,
        hombresLoboParaPasar: 150,
        velocidadHombresLoboMin: 0.5,
        velocidadHombresLoboMax: 0.7,
        mensajeBienvenida: "NIVEL 1 - Sobrevive y elimina a todos los Hombres Lobo"
      },
      2: {
        hombresLobo: 400,
        arboles: 80,
        hombresLoboParaPasar: 400,
        velocidadHombresLoboMin: 0.7,
        velocidadHombresLoboMax: 1.0,
        mensajeBienvenida: "NIVEL 2 - ¡La horda se intensifica!"
      }
    };
    
    this.crearUI();
  }

  cargarHighScore() {
    const saved = localStorage.getItem('hombreLoboHighScore');
    return saved ? parseInt(saved) : 0;
  }

  guardarHighScore() {
    localStorage.setItem('hombreLoboHighScore', this.highScore.toString());
  }

  agregarPuntos(puntos) {
    this.score += puntos;
    
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.guardarHighScore();
      
      this.textoHighScore.style.fill = 0xFFD700;
      setTimeout(() => {
        if (this.textoHighScore) {
          this.textoHighScore.style.fill = 0xFFFF00;
        }
      }, 500);
    }
    
    this.actualizarUI();
  }

  resetearScore() {
    this.score = 0;
    this.actualizarUI();
  }

  crearUI() {
    this.uiContainer = new PIXI.Container();
    this.uiContainer.zIndex = Z_INDEX.ui;
    this.juego.app.stage.addChild(this.uiContainer);

    this.textoNivel = new PIXI.Text('Nivel 1', {
      fontFamily: 'Arial',
      fontSize: 32,
      fill: 0xFFFFFF,
      stroke: 0x000000,
      strokeThickness: 4
    });
    this.textoNivel.position.set(20, 20);
    this.uiContainer.addChild(this.textoNivel);

    this.textoHombresLobo = new PIXI.Text('Hombres Lobo: 150/150', {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xFF4444,
      stroke: 0x000000,
      strokeThickness: 3
    });
    this.textoHombresLobo.position.set(20, 60);
    this.uiContainer.addChild(this.textoHombresLobo);

    this.textoScore = new PIXI.Text('Score: 0', {
      fontFamily: 'Arial',
      fontSize: 28,
      fill: 0x00FF00,
      stroke: 0x000000,
      strokeThickness: 4
    });
    this.textoScore.position.set(20, 95);
    this.uiContainer.addChild(this.textoScore);

    this.textoHighScore = new PIXI.Text('High Score: ' + this.highScore, {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xFFFF00,
      stroke: 0x000000,
      strokeThickness: 3
    });
    this.textoHighScore.position.set(20, 130);
    this.uiContainer.addChild(this.textoHighScore);

    this.barraVidaFondo = new PIXI.Graphics();
    this.barraVidaFondo.beginFill(0x660000);
    this.barraVidaFondo.drawRect(0, 0, 200, 20);
    this.barraVidaFondo.endFill();
    this.barraVidaFondo.position.set(20, 165);
    this.uiContainer.addChild(this.barraVidaFondo);

    this.barraVida = new PIXI.Graphics();
    this.barraVida.beginFill(0x00FF00);
    this.barraVida.drawRect(0, 0, 200, 20);
    this.barraVida.endFill();
    this.barraVida.position.set(20, 165);
    this.uiContainer.addChild(this.barraVida);

    this.textoVida = new PIXI.Text('Vida: 100/100', {
      fontFamily: 'Arial',
      fontSize: 20,
      fill: 0xFFFFFF,
      stroke: 0x000000,
      strokeThickness: 3
    });
    this.textoVida.position.set(25, 167);
    this.uiContainer.addChild(this.textoVida);

    this.mensajeNivel = new PIXI.Text('', {
      fontFamily: 'Arial',
      fontSize: 48,
      fill: 0xFFFF00,
      stroke: 0x000000,
      strokeThickness: 6,
      align: 'center'
    });
    this.mensajeNivel.anchor.set(0.5);
    this.mensajeNivel.visible = false;
    this.uiContainer.addChild(this.mensajeNivel);

    this.crearPantallaGameOver();
  }

  crearPantallaGameOver() {
    this.gameOverContainer = new PIXI.Container();
    this.gameOverContainer.visible = false;
    this.gameOverVisible = false;
    this.uiContainer.addChild(this.gameOverContainer);

    this.gameOverFondo = new PIXI.Graphics();
    this.gameOverFondo.beginFill(0x000000, 0.8);
    this.gameOverFondo.drawRect(0, 0, 4000, 4000);
    this.gameOverFondo.endFill();
    this.gameOverContainer.addChild(this.gameOverFondo);

    this.textoGameOver = new PIXI.Text('GAME OVER', {
      fontFamily: 'Arial',
      fontSize: 72,
      fill: 0xFF0000,
      stroke: 0x000000,
      strokeThickness: 8,
      align: 'center'
    });
    this.textoGameOver.anchor.set(0.5);
    this.gameOverContainer.addChild(this.textoGameOver);

    this.textoScoreFinal = new PIXI.Text('', {
      fontFamily: 'Arial',
      fontSize: 36,
      fill: 0x00FF00,
      stroke: 0x000000,
      strokeThickness: 4,
      align: 'center'
    });
    this.textoScoreFinal.anchor.set(0.5);
    this.gameOverContainer.addChild(this.textoScoreFinal);

    this.textoHighScoreFinal = new PIXI.Text('', {
      fontFamily: 'Arial',
      fontSize: 32,
      fill: 0xFFFF00,
      stroke: 0x000000,
      strokeThickness: 4,
      align: 'center'
    });
    this.textoHighScoreFinal.anchor.set(0.5);
    this.gameOverContainer.addChild(this.textoHighScoreFinal);

    this.textoReiniciar = new PIXI.Text('Presiona ENTER para reiniciar', {
      fontFamily: 'Arial',
      fontSize: 32,
      fill: 0xFFFFFF,
      stroke: 0x000000,
      strokeThickness: 4,
      align: 'center'
    });
    this.textoReiniciar.anchor.set(0.5);
    this.gameOverContainer.addChild(this.textoReiniciar);
  }

  mostrarGameOver() {
    this.gameOverContainer.visible = true;
    this.gameOverVisible = true;

    const centerX = this.juego.app.screen.width / 2;
    const centerY = this.juego.app.screen.height / 2;

    this.textoGameOver.position.set(centerX, centerY - 100);
    this.textoScoreFinal.text = 'Score Final: ' + this.score;
    this.textoScoreFinal.position.set(centerX, centerY - 20);
    this.textoHighScoreFinal.text = 'High Score: ' + this.highScore;
    this.textoHighScoreFinal.position.set(centerX, centerY + 30);
    this.textoReiniciar.position.set(centerX, centerY + 90);

    this.gameOverContainer.zIndex = Z_INDEX.ui + 1000;
  }

  gameOver() {
    if (this.gameOverVisible) return;
    
    this.juego.pausa = true;
    this.mostrarGameOver();
    this.escucharReinicio();
  }

  escucharReinicio() {
    const reiniciarHandler = (e) => {
      if (e.key === 'Enter' && this.gameOverVisible) {
        window.removeEventListener('keydown', reiniciarHandler);
        this.reiniciarJuego();
      }
    };
    
    window.addEventListener('keydown', reiniciarHandler);
  }

  reiniciarJuego() {
    console.log("🔄 === INICIANDO REINICIO ===");
    console.log("Nivel actual:", this.nivelActual);
    console.log("Hombres lobo antes de limpiar:", this.juego.hombresLobo.length);
    
    // Ocultar Game Over
    this.gameOverContainer.visible = false;
    this.gameOverVisible = false;
    
    // Resetear score
    this.resetearScore();
    
    // Guardar nivel actual
    const nivelAReiniciar = this.nivelActual;
    const config = this.niveles[nivelAReiniciar];
    
    // PRIMERO: Despausar el juego para que todo pueda actualizarse
    this.juego.pausa = false;
    
    // Limpiar nivel
    this.limpiarNivel();
    
    console.log("Hombres lobo después de limpiar:", this.juego.hombresLobo.length);
    
    // Reiniciar contador
    this.hombresLoboEliminados = 0;
    
    // Restaurar jugador
    if (this.juego.player) {
      this.juego.player.vida = this.juego.player.vidaMaxima;
      this.juego.player.invulnerable = false;
      this.juego.player.container.alpha = 1;
      this.juego.player.velocidad.x = 0;
      this.juego.player.velocidad.y = 0;
      this.juego.player.container.x = this.juego.canvasWidth / 2;
      this.juego.player.container.y = this.juego.canvasHeight / 2;
    }
    
    // Crear árboles
    console.log(`🌳 Creando ${config.arboles} árboles...`);
    this.juego.ponerArboles(config.arboles);
    console.log("Árboles creados:", this.juego.arboles.length);
    
    // Crear hombres lobo
    console.log(`🐺 Creando ${config.hombresLobo} hombres lobo con velocidad ${config.velocidadHombresLoboMin}-${config.velocidadHombresLoboMax}...`);
    this.juego.ponerHombresLoboConConfiguracion(
      config.hombresLobo,
      config.velocidadHombresLoboMin,
      config.velocidadHombresLoboMax
    );
    
    console.log("✅ Hombres lobo en array:", this.juego.hombresLobo.length);
    console.log("Primer hombre lobo:", this.juego.hombresLobo[0]);
    
    // Verificar que están en el stage
    let enStage = 0;
    this.juego.hombresLobo.forEach(hl => {
      if (hl.container && hl.container.parent) {
        enStage++;
      }
    });
    console.log("Hombres lobo en stage:", enStage);
    
    // Actualizar UI
    this.actualizarUI();
    
    console.log("🔄 === REINICIO COMPLETADO ===");
  }

  mostrarMensajeNivel(mensaje, duracion = 3000) {
    this.mensajeNivel.text = mensaje;
    this.mensajeNivel.position.set(
      this.juego.app.screen.width / 2,
      this.juego.app.screen.height / 2
    );
    this.mensajeNivel.visible = true;

    setTimeout(() => {
      this.mensajeNivel.visible = false;
    }, duracion);
  }

  iniciarNivel(nivel) {
    console.log(`🎮 Iniciando nivel ${nivel}...`);
    
    this.nivelActual = nivel;
    this.hombresLoboEliminados = 0;
    
    const config = this.niveles[nivel];
    
    // Limpiar nivel anterior
    this.limpiarNivel();
    
    // Crear nuevo nivel
    this.juego.ponerArboles(config.arboles);
    this.juego.ponerHombresLoboConConfiguracion(
      config.hombresLobo,
      config.velocidadHombresLoboMin,
      config.velocidadHombresLoboMax
    );
    
    console.log(`✅ Nivel ${nivel} creado con ${this.juego.hombresLobo.length} hombres lobo`);
    
    // Mostrar mensaje
    this.mostrarMensajeNivel(config.mensajeBienvenida);
    
    // Actualizar UI
    this.actualizarUI();
    
    // Reposicionar jugador al centro
    this.juego.player.container.x = this.juego.canvasWidth / 2;
    this.juego.player.container.y = this.juego.canvasHeight / 2;

    // Reiniciar estado del jugador
    try {
      const p = this.juego.player;
      if (p) {
        p.vida = p.vidaMaxima || 100;
        p.invulnerable = false;
        p.estaMuerto = false;
        p.listo = true;
        p.container.alpha = 1;
        p.velocidad.x = 0;
        p.velocidad.y = 0;
        p.velocidadMax = p.velocidadMaximaOriginal || p.velocidadMax;
      }
    } catch (e) {
      console.error("Error reiniciando jugador:", e);
    }
  }

  limpiarNivel() {
    console.log("🧹 Limpiando nivel...");
    
    // Eliminar hombres lobo
    [...this.juego.hombresLobo].forEach(hl => {
      if (hl && hl.container) {
        if (hl.container.parent) {
          hl.container.parent.removeChild(hl.container);
        }
        this.juego.grid.remove(hl);
      }
    });
    this.juego.hombresLobo = [];

    // Eliminar árboles
    if (this.juego.arboles) {
      [...this.juego.arboles].forEach(a => {
        if (a && a.container) {
          if (a.container.parent) {
            a.container.parent.removeChild(a.container);
          }
          this.juego.grid.remove(a);
        }
      });
      this.juego.arboles = [];
    }

    // Eliminar balas
    [...this.juego.balas].forEach(b => {
      if (b && b.container) {
        if (b.container.parent) {
          b.container.parent.removeChild(b.container);
        }
      }
    });
    this.juego.balas = [];

    // Limpiar obstáculos
    this.juego.obstaculos = [];
    
    console.log("✅ Nivel limpiado completamente");
  }

  hombreLoboEliminado() {
    this.hombresLoboEliminados++;
    this.agregarPuntos(this.puntosPorHombreLobo);
    this.actualizarUI();
    
    const config = this.niveles[this.nivelActual];
    if (this.hombresLoboEliminados >= config.hombresLoboParaPasar) {
      this.pasarSiguienteNivel();
    }
  }

  pasarSiguienteNivel() {
    this.agregarPuntos(this.puntosPorNivel);
    const siguienteNivel = this.nivelActual + 1;
    
    if (this.niveles[siguienteNivel]) {
      setTimeout(() => {
        this.mostrarMensajeNivel('¡NIVEL COMPLETADO! +' + this.puntosPorNivel + ' puntos', 2000);
        setTimeout(() => {
          this.iniciarNivel(siguienteNivel);
        }, 2500);
      }, 1000);
    } else {
      this.mostrarMensajeNivel('¡FELICIDADES! ¡GANASTE EL JUEGO!', 5000);
    }
  }

  actualizarUI() {
    const config = this.niveles[this.nivelActual];
    const hombresLoboRestantes = this.juego.hombresLobo.length;
    
    this.textoNivel.text = `Nivel ${this.nivelActual}`;
    this.textoHombresLobo.text = `Hombres Lobo: ${hombresLoboRestantes}/${config.hombresLobo}`;
    this.textoScore.text = `Score: ${this.score}`;
    this.textoHighScore.text = `High Score: ${this.highScore}`;
  }

  update() {
    this.uiContainer.position.x = -this.juego.app.stage.position.x;
    this.uiContainer.position.y = -this.juego.app.stage.position.y;
    
    try {
      if (this.juego && this.juego.player) {
        const p = this.juego.player;
        const maxVida = p.vidaMaxima || 100;
        const vidaActual = typeof p.vida === 'number' ? p.vida : 0;
        const ratio = Math.max(0, Math.min(1, vidaActual / maxVida));

        this.barraVida.clear();
        this.barraVida.beginFill(0x00FF00);
        this.barraVida.drawRect(0, 0, 200 * ratio, 20);
        this.barraVida.endFill();

        this.textoVida.text = `Vida: ${Math.round(vidaActual)}/${maxVida}`;
      }
    } catch (e) {
      // No interrumpir
    }
  }
}

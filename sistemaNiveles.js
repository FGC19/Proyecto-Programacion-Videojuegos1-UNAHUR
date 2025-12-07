class SistemaNiveles {
  constructor(juego) {
    this.juego = juego;
    this.nivelActual = 1;
    this.zombiesEliminados = 0;
    
    // ========== NUEVO: Sistema de Score ==========
    this.score = 0;
    this.highScore = this.cargarHighScore();
    this.puntosporZombie = 10;
    this.puntosporNivel = 500;
    // ========== FIN NUEVO ==========
    
    // Configuración de niveles
    this.niveles = {
      1: {
        zombies: 150,
        arboles: 50,
        zombiesParaPasar: 150,
        velocidadZombiesMin: 0.5,
        velocidadZombiesMax: 0.7,
        mensajeBienvenida: "NIVEL 1 - Sobrevive y elimina a todos los Hombres Lobo"
      },
      2: {
        zombies: 400,
        arboles: 80,
        zombiesParaPasar: 400,
        velocidadZombiesMin: 0.7,
        velocidadZombiesMax: 1.0,
        mensajeBienvenida: "NIVEL 2 - ¡La horda se intensifica!"
      }
    };
    
    this.crearUI();
  }

  // ========== NUEVO: Métodos de Score ==========
  cargarHighScore() {
    const saved = localStorage.getItem('zombieHighScore');
    return saved ? parseInt(saved) : 0;
  }

  guardarHighScore() {
    localStorage.setItem('zombieHighScore', this.highScore.toString());
  }

  agregarPuntos(puntos) {
    this.score += puntos;
    
    // Actualizar high score si es superado
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.guardarHighScore();
      
      // Efecto visual cuando se supera el high score
      this.textoHighScore.style.fill = 0xFFD700; // Dorado
      setTimeout(() => {
        if (this.textoHighScore) {
          this.textoHighScore.style.fill = 0xFFFF00; // Volver a amarillo
        }
      }, 500);
    }
    
    this.actualizarUI();
  }

  resetearScore() {
    this.score = 0;
    this.actualizarUI();
  }
  // ========== FIN NUEVO ==========

  crearUI() {
    // Crear contenedor de UI
    this.uiContainer = new PIXI.Container();
    this.uiContainer.zIndex = Z_INDEX.ui;
    this.juego.app.stage.addChild(this.uiContainer);

    // Texto de nivel
    this.textoNivel = new PIXI.Text('Nivel 1', {
      fontFamily: 'Arial',
      fontSize: 32,
      fill: 0xFFFFFF,
      stroke: 0x000000,
      strokeThickness: 4
    });
    this.textoNivel.position.set(20, 20);
    this.uiContainer.addChild(this.textoNivel);

    // Texto de zombies restantes
    this.textoZombies = new PIXI.Text('Hombres Lobo: 150/150', {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xFF4444,
      stroke: 0x000000,
      strokeThickness: 3
    });
    this.textoZombies.position.set(20, 60);
    this.uiContainer.addChild(this.textoZombies);

    // ========== NUEVO: UI de Score ==========
    // Score actual
    this.textoScore = new PIXI.Text('Score: 0', {
      fontFamily: 'Arial',
      fontSize: 28,
      fill: 0x00FF00,
      stroke: 0x000000,
      strokeThickness: 4
    });
    this.textoScore.position.set(20, 95);
    this.uiContainer.addChild(this.textoScore);

    // High Score
    this.textoHighScore = new PIXI.Text('High Score: ' + this.highScore, {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xFFFF00,
      stroke: 0x000000,
      strokeThickness: 3
    });
    this.textoHighScore.position.set(20, 130);
    this.uiContainer.addChild(this.textoHighScore);
    // ========== FIN NUEVO ==========

    // Barra de vida - Fondo (rojo)
    this.barraVidaFondo = new PIXI.Graphics();
    this.barraVidaFondo.beginFill(0x660000);
    this.barraVidaFondo.drawRect(0, 0, 200, 20);
    this.barraVidaFondo.endFill();
    this.barraVidaFondo.position.set(20, 165);
    this.uiContainer.addChild(this.barraVidaFondo);

    // Barra de vida - Vida actual (verde)
    this.barraVida = new PIXI.Graphics();
    this.barraVida.beginFill(0x00FF00);
    this.barraVida.drawRect(0, 0, 200, 20);
    this.barraVida.endFill();
    this.barraVida.position.set(20, 165);
    this.uiContainer.addChild(this.barraVida);

    // Texto de vida
    this.textoVida = new PIXI.Text('Vida: 100/100', {
      fontFamily: 'Arial',
      fontSize: 20,
      fill: 0xFFFFFF,
      stroke: 0x000000,
      strokeThickness: 3
    });
    this.textoVida.position.set(25, 167);
    this.uiContainer.addChild(this.textoVida);

    // Mensaje de nivel (se muestra temporalmente)
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

    // Pantalla de Game Over
    this.crearPantallaGameOver();
  }

  crearPantallaGameOver() {
    // Contenedor de Game Over (inicialmente invisible)
    this.gameOverContainer = new PIXI.Container();
    this.gameOverContainer.visible = false;
    this.gameOverVisible = false;
    this.uiContainer.addChild(this.gameOverContainer);

    // Fondo oscuro semi-transparente
    this.gameOverFondo = new PIXI.Graphics();
    this.gameOverFondo.beginFill(0x000000, 0.8);
    this.gameOverFondo.drawRect(0, 0, 4000, 4000);
    this.gameOverFondo.endFill();
    this.gameOverContainer.addChild(this.gameOverFondo);

    // Texto "GAME OVER"
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

    // ========== NUEVO: Mostrar score final y high score ==========
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
    // ========== FIN NUEVO ==========

    // Texto "Presiona ENTER para reiniciar"
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
    // Mostrar la pantalla de Game Over 
    this.gameOverContainer.visible = true;
    this.gameOverVisible = true;

    const centerX = this.juego.app.screen.width / 2;
    const centerY = this.juego.app.screen.height / 2;

    this.textoGameOver.position.set(centerX, centerY - 100);
    
    // ========== NUEVO: Mostrar scores ==========
    this.textoScoreFinal.text = 'Score Final: ' + this.score;
    this.textoScoreFinal.position.set(centerX, centerY - 20);
    
    this.textoHighScoreFinal.text = 'High Score: ' + this.highScore;
    this.textoHighScoreFinal.position.set(centerX, centerY + 30);
    // ========== FIN NUEVO ==========
    
    this.textoReiniciar.position.set(centerX, centerY + 90);

    // Aumentar zIndex para que esté encima
    this.gameOverContainer.zIndex = Z_INDEX.ui + 1000;
  }

  gameOver() {
    // Verificar que no esté ya en Game Over
    if (this.gameOverVisible) return;
    
    // Pausar el juego
    this.juego.pausa = true;
    
    // Mostrar pantalla de Game Over
    this.mostrarGameOver();
    
    // Listener para reiniciar con ENTER
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
    // Ocultar Game Over
    this.gameOverContainer.visible = false;
    this.gameOverVisible = false;
    
    // Despausar
    this.juego.pausa = false;
    
    // ========== NUEVO: Resetear score ==========
    this.resetearScore();
    // ========== FIN NUEVO ==========
    
    // Restaurar vida del jugador
    if (this.juego.player) {
      this.juego.player.vida = this.juego.player.vidaMaxima;
      this.juego.player.invulnerable = false;
      this.juego.player.container.alpha = 1;
    }
    
    // Reiniciar desde el nivel 1
    this.iniciarNivel(1);
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
    this.nivelActual = nivel;
    this.zombiesEliminados = 0;
    
    const config = this.niveles[nivel];
    
    // Limpiar nivel anterior
    this.limpiarNivel();
    
    // Crear nuevo nivel - IGUAL QUE EN EL ORIGINAL
    this.juego.ponerArboles(config.arboles);
    this.juego.ponerZombiesConConfiguracion(
      config.zombies,
      config.velocidadZombiesMin,
      config.velocidadZombiesMax
    );
    
    // Mostrar mensaje
    this.mostrarMensajeNivel(config.mensajeBienvenida);
    
    // Actualizar UI
    this.actualizarUI();
    
    // Reposicionar jugador al centro
    this.juego.player.container.x = this.juego.canvasWidth / 2;
    this.juego.player.container.y = this.juego.canvasHeight / 2;

    // Reiniciar estado del jugador (vida, invulnerabilidad, etc.)
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
    // Eliminar todos los zombies - IGUAL QUE EN EL ORIGINAL
    this.juego.zombies.forEach(z => {
      this.juego.app.stage.removeChild(z.container);
      this.juego.grid.remove(z);
    });
    this.juego.zombies = [];

    // Eliminar todos los árboles
    if (this.juego.arboles) {
      this.juego.arboles.forEach(a => {
        this.juego.app.stage.removeChild(a.container);
        this.juego.grid.remove(a);
      });
      this.juego.arboles = [];
    }

    // Eliminar balas
    this.juego.balas.forEach(b => {
      this.juego.app.stage.removeChild(b.container);
    });
    this.juego.balas = [];

    this.juego.obstaculos = [];
  }

  zombieEliminado() {
    this.zombiesEliminados++;
    
    // ========== NUEVO: Agregar puntos al eliminar zombie ==========
    this.agregarPuntos(this.puntosporZombie);
    // ========== FIN NUEVO ==========
    
    this.actualizarUI();
    
    // Verificar si pasó el nivel
    const config = this.niveles[this.nivelActual];
    if (this.zombiesEliminados >= config.zombiesParaPasar) {
      this.pasarSiguienteNivel();
    }
  }

  pasarSiguienteNivel() {
    // ========== NUEVO: Bonus por completar nivel ==========
    this.agregarPuntos(this.puntosporNivel);
    // ========== FIN NUEVO ==========
    
    const siguienteNivel = this.nivelActual + 1;
    
    if (this.niveles[siguienteNivel]) {
      setTimeout(() => {
        this.mostrarMensajeNivel('¡NIVEL COMPLETADO! +' + this.puntosporNivel + ' puntos', 2000);
        setTimeout(() => {
          this.iniciarNivel(siguienteNivel);
        }, 2500);
      }, 1000);
    } else {
      // Victoria final
      this.mostrarMensajeNivel('¡FELICIDADES! ¡GANASTE EL JUEGO!', 5000);
    }
  }

  actualizarUI() {
    const config = this.niveles[this.nivelActual];
    const zombiesRestantes = this.juego.zombies.length;
    
    this.textoNivel.text = `Nivel ${this.nivelActual}`;
    this.textoZombies.text = `Hombres Lobo: ${zombiesRestantes}/${config.zombies}`;
    
    // ========== NUEVO: Actualizar scores ==========
    this.textoScore.text = `Score: ${this.score}`;
    this.textoHighScore.text = `High Score: ${this.highScore}`;
    // ========== FIN NUEVO ==========
  }

  update() {
    // Actualizar posición de UI según la cámara
    this.uiContainer.position.x = -this.juego.app.stage.position.x;
    this.uiContainer.position.y = -this.juego.app.stage.position.y;
    
    // Actualizar barra de vida y texto según el jugador
    try {
      if (this.juego && this.juego.player) {
        const p = this.juego.player;
        const maxVida = p.vidaMaxima || 100;
        const vidaActual = typeof p.vida === 'number' ? p.vida : 0;
        const ratio = Math.max(0, Math.min(1, vidaActual / maxVida));

        // Redibujar la barra de vida con el ancho proporcional
        this.barraVida.clear();
        this.barraVida.beginFill(0x00FF00);
        this.barraVida.drawRect(0, 0, 200 * ratio, 20);
        this.barraVida.endFill();

        // Actualizar texto
        this.textoVida.text = `Vida: ${Math.round(vidaActual)}/${maxVida}`;
      }
    } catch (e) {
      // No interrumpir el juego por errores en el UI
    }
  }
}
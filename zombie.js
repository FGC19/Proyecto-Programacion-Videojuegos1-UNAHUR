class Zombie extends Objeto {
  constructor(x, y, velocidad, juego) {
    super(x, y, velocidad, juego);
    this.equipoParaUpdate = Math.floor(Math.random() * 9) + 1;
    this.juego = juego;
    this.grid = juego.grid;
    this.vision = 100 + Math.floor(Math.random() * 150);
    this.vida = 1;
    this.debug = 0;

    // Cargar cada sprite con sus dimensiones específicas
    this.spritesTotales = 6;
    this.spritesCargados = 0;

    // correr: 1408x128 = 11 frames de ancho (128x128 cada uno)
    this.cargarSpriteAnimado("./img/hombresloboWalk.png", 128, 128, velocidad * 1, (sprite) => {
      this.spritesAnimados.correr = sprite;
      this.verificarCargaCompleta();
    });

    // ataque1: 768x128 = 6 frames de ancho (128x128 cada uno)
    this.cargarSpriteAnimado("./img/hombresloboAttack_1.png", 128, 128, velocidad * 1, (sprite) => {
      this.spritesAnimados.ataque1 = sprite;
      this.verificarCargaCompleta();
    });

    // ataque2: 512x128 = 4 frames de ancho (128x128 cada uno)
    this.cargarSpriteAnimado("./img/hombresloboAttack_2.png", 128, 128, velocidad * 1, (sprite) => {
      this.spritesAnimados.ataque2 = sprite;
      this.verificarCargaCompleta();
    });

    // ataque3: 640x128 = 5 frames de ancho (128x128 cada uno)
    this.cargarSpriteAnimado("./img/hombresloboAttack_3.png", 128, 128, velocidad * 1, (sprite) => {
      this.spritesAnimados.ataque3 = sprite;
      this.verificarCargaCompleta();
    });

    // morir: 256x128 = 2 frames de ancho (128x128 cada uno)
    this.cargarSpriteAnimado("./img/hombresloboDead.png", 128, 128, velocidad * 0.5, (sprite) => {
      this.spritesAnimados.morir = sprite;
      this.verificarCargaCompleta();
    });

    // recibeTiro: 256x128 = 2 frames de ancho (128x128 cada uno)
    this.cargarSpriteAnimado("./img/hombresloboHurt.png", 128, 128, velocidad * 1.5, (sprite) => {
      this.spritesAnimados.recibeTiro = sprite;
      this.verificarCargaCompleta();
    });

    this.estados = { IDLE: 0, YENDO_AL_PLAYER: 1, ATACANDO: 2 };
    this.estado = this.estados.IDLE;
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
      
      // Eliminar el sprite después de la animación de muerte
      setTimeout(() => {
        this.borrar();
      }, 800);
    } else {
      let sprite = this.cambiarSprite("recibeTiro", 0, false);
      
      // Volver a la animación anterior después de recibir el tiro
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
      //SOLO SI LO TENGO DE VECINO, CALCULO LA DISTANCIA, Y ES LA DISTANCIA RAPIDA
      this.distanciaAlPlayer = calculoDeDistanciaRapido(
        this.container.x,
        this.container.y,
        this.juego.player.container.x,
        this.juego.player.container.y
      );
      //Y SI LA DISTANCIA ES MENOR A UNA CELDA, Q EN ESTE CASO LAS CELDAS NOS QUEDAN A UNA DISTANCIA Q QUEDA BIEN
      if (this.distanciaAlPlayer < this.juego.grid.cellSize) {
        //ASUMIMOS Q ESTA TOCANDO AL PLAYER
        this.estoyTocandoAlPlayer = true;
      }
    } else {
      this.distanciaAlPlayer = null;
    }
  }

  hacerCosasSegunEstado() {
    let vecAtraccionAlPlayer,
      vecSeparacion,
      vecAlineacion,
      vecCohesion,
      bordes;

    let sumaDeVectores = new PIXI.Point(0, 0);

    //CALCULO LA FUERZA Q TRAE AL PERSONAJE PADENTRO DE LA PANTALLA DE NUEVO
    bordes = this.ajustarPorBordes();

    if (this.estado == this.estados.YENDO_AL_PLAYER) {
      //SI ESTOY VIENDO AL PLAYER, HACERLE ATRACCION
      vecAtraccionAlPlayer = this.atraccionAlJugador();
      this.cambiarSprite("correr");
    } else if (this.estado == this.estados.IDLE) {
      //CALCULO LOS VECTORES PARA LOS PASOS DE BOIDS, SI NO HAY TARGET
      vecAlineacion = this.alineacion(this.vecinos);
      vecCohesion = this.cohesion(this.vecinos);
   
      this.cambiarSprite("correr");
    }

    //PARA AMBOS ESTADOS: YENDO Y IDLE
    if (
      this.estado == this.estados.IDLE ||
      this.estado == this.estados.YENDO_AL_PLAYER
    ) {
      vecSeparacion = this.separacion(this.vecinos);

      //SUMO LOS VECTORES ANTES DE APLICARLOS
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

    // ATANCANDO
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

    //USA EL METODO UPDATE Q ESTA EN LA CLASE DE LA CUAL HEREDA ESTA:
    super.update();
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
    //SI YA ESTABA ATANCANDO, NO CAMBIAR EL SPRITE
    if (this.spriteActual.startsWith("ataque")) return;

    this.cambiarSprite(
      "ataque" + (Math.floor(Math.random() * 2) + 1).toString()
    );
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

    //HACER NEGATIVO ESTE VECTOR Y LOS ZOMBIES TE HUYEN
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

      // Crear un vector que apunte hacia el centro de masa
      vecPromedio.x = vecPromedio.x - this.container.x;
      vecPromedio.y = vecPromedio.y - this.container.y;

      // // Escalar para que sea proporcional a la velocidad máxima
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

      // Escalar para que sea proporcional a la velocidad máxima
      vecPromedio.x *= 0.2;
      vecPromedio.y *= 0.2;
    }

    return vecPromedio;
  }
  ajustarPorBordes() {
    let fuerza = new PIXI.Point(0, 0);

    if (this.container.x < 0) fuerza.x = -this.container.x;
    if (this.container.y < 0) fuerza.y = -this.container.y;
    if (this.container.x > this.juego.canvaswidth)
      fuerza.x = -(this.container.x - this.juego.canvaswidth);
    if (this.container.y > this.juego.canvasHeight)
      fuerza.y = -(this.container.y - this.juego.canvasHeight);

    // if(this.debug)console.log(fuerza)
    return fuerza;
  }
}

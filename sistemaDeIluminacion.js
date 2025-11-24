class SistemaDeIluminacion {
  constructor(juego) {
    this.juego = juego;
    this.activo = false;
    this.inicializado = false;
    this.graficoSombrasProyectadas = null;
    this.renderTexture = null;
    this.spriteDeIluminacion = null;
    this.containerParaRenderizar = null;
    this.spriteNegro = null;
    this.blurParaElGraficoDeSombrasProyectadas = null;

    this.numeroDeDia = 0;
    this.minutoDelDia = 720; // Empezar al mediodía (12:00)
    this.minutosPorDia = 1440;
    this.cantidadDeLuzDelDia = 1;
    this.horaDelDia = 12;

    this.inicializar();
  }

  inicializar() {
    setTimeout(() => {
      this.crearSistemaDeIluminacionConRenderTexture();
      this.crearGraficoSombrasProyectadas();
      this.inicializado = true;
    }, 1000);
  }

  crearSistemaDeIluminacionConRenderTexture() {
    this.renderTexture = PIXI.RenderTexture.create({
      width: this.juego.canvasWidth,
      height: this.juego.canvasHeight,
    });

    this.spriteDeIluminacion = new PIXI.Sprite(this.renderTexture);
    this.spriteDeIluminacion.label = "spriteDeIluminacion";
    this.spriteDeIluminacion.zIndex = Z_INDEX.containerIluminacion;
    this.spriteDeIluminacion.blendMode = PIXI.BLEND_MODES.MULTIPLY;
    this.spriteDeIluminacion.alpha = 0.99;
    this.juego.app.stage.addChild(this.spriteDeIluminacion);

    this.containerParaRenderizar = new PIXI.Container();
    this.containerParaRenderizar.sortableChildren = true;

    this.spriteNegro = crearSpriteNegro(this.juego.canvasWidth, this.juego.canvasHeight);
    this.spriteNegro.label = "spriteNegro";
    this.spriteNegro.zIndex = 1;
    this.containerParaRenderizar.addChild(this.spriteNegro);

    if (this.juego.faroles) {
      for (let farol of this.juego.faroles) {
        farol.spriteGradiente = crearSpriteConGradiente(farol.radioLuz, 0xffffcc);
        farol.spriteGradiente.zIndex = 2;
        this.containerParaRenderizar.addChild(farol.spriteGradiente);
      }
    }

    this.spriteDeIluminacion.visible = this.activo;
    this.crearSpriteAmarilloParaElAtardecer();
  }

  crearSpriteAmarilloParaElAtardecer() {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0xffcc00, 0.5);
    graphics.drawRect(0, 0, this.juego.canvasWidth, this.juego.canvasHeight);
    graphics.endFill();
    
    this.spriteAmarilloParaElAtardecer = new PIXI.Sprite(graphics.generateTexture());
    this.spriteAmarilloParaElAtardecer.label = "spriteAmarilloParaElAtardecer";
    this.spriteAmarilloParaElAtardecer.alpha = 0;
    this.spriteAmarilloParaElAtardecer.zIndex = Z_INDEX.spriteAmarilloParaElAtardecer;
    this.spriteAmarilloParaElAtardecer.blendMode = PIXI.BLEND_MODES.MULTIPLY;
    this.juego.app.stage.addChild(this.spriteAmarilloParaElAtardecer);
  }

  crearGraficoSombrasProyectadas() {
    this.graficoSombrasProyectadas = new PIXI.Graphics();
    this.graficoSombrasProyectadas.zIndex = 3;
    this.graficoSombrasProyectadas.label = "graficoSombrasProyectadas";

    this.blurParaElGraficoDeSombrasProyectadas = new PIXI.BlurFilter({
      strength: 8,
      quality: 2,
      kernelSize: 5,
    });
    this.graficoSombrasProyectadas.filters = [
      this.blurParaElGraficoDeSombrasProyectadas,
    ];

    this.containerParaRenderizar.addChild(this.graficoSombrasProyectadas);
  }

  avanzarDia() {
    this.minutoDelDia += 1;
    if (this.minutoDelDia >= this.minutosPorDia) {
      this.minutoDelDia = 0;
      this.numeroDeDia++;
    }

    const cantidadDeLuzDelDiaProvisoria =
      (-Math.cos((this.minutoDelDia / this.minutosPorDia) * Math.PI * 2) + 1) / 2;

    this.cantidadDeLuzDelDia = Math.max(0, Math.min(1, cantidadDeLuzDelDiaProvisoria));
    this.horaDelDia = this.minutoDelDia / 60;
  }

  prenderTodosLosFaroles() {
    if (!this.juego.faroles) return;
    for (let farol of this.juego.faroles) {
      farol.prender();
    }
  }

  apagarTodosLosFaroles() {
    if (!this.juego.faroles) return;
    for (let farol of this.juego.faroles) {
      farol.apagar();
    }
  }

  prenderOApagarTodosLosFarolesSegunLaHoraDelDia() {
    if (this.horaDelDia > 7 && this.horaDelDia < 7.2) {
      this.apagarTodosLosFaroles();
    } else if (this.horaDelDia > 18 && this.horaDelDia < 18.2) {
      this.prenderTodosLosFaroles();
    }
  }

  tick() {
    if (!this.inicializado) return;
    
    this.avanzarDia();
    this.actualizarSpriteAmarilloParaElAtardecer();
    this.prenderOApagarTodosLosFarolesSegunLaHoraDelDia();

    if (this.graficoSombrasProyectadas) {
      this.graficoSombrasProyectadas.clear();
    }

    if (this.activo) {
      this.actualizarGradientsDeLosFaroles();
      this.actualizarSpriteDeIluminacion();
    }
  }

  actualizarSpriteAmarilloParaElAtardecer() {
    if (!this.spriteAmarilloParaElAtardecer) return;
    
    const desde = 16;
    const hasta = 21;
    
    if (this.horaDelDia < desde || this.horaDelDia > hasta) {
      this.spriteAmarilloParaElAtardecer.alpha = 0;
      return;
    }

    const ratio = (this.horaDelDia - desde) / (hasta - desde);
    let valorAlpha = Math.sin(ratio * Math.PI);
    valorAlpha = Math.max(0, Math.min(1, valorAlpha));
    
    this.spriteAmarilloParaElAtardecer.alpha = valorAlpha * 0.3;
  }

  actualizarSpriteDeIluminacion() {
    this.spriteDeIluminacion.alpha = 1 - this.cantidadDeLuzDelDia;

    this.juego.app.renderer.render({
      container: this.containerParaRenderizar,
      target: this.renderTexture,
      clear: true,
    });
  }

  actualizarGradientsDeLosFaroles() {
    if (!this.juego.faroles) return;
    
    for (let farol of this.juego.faroles) {
      if (!farol.estoyVisibleEnPantalla(1.33)) {
        farol.spriteGradiente.visible = false;
        continue;
      }

      farol.spriteGradiente.visible = farol.encendido;
      const posicionEnPantalla = farol.getPosicionEnPantalla();
      farol.spriteGradiente.x = posicionEnPantalla.x;
      farol.spriteGradiente.y = posicionEnPantalla.y;

      this.actualizarSombrasProyectadas(farol);
    }
  }

  actualizarSombrasProyectadas(farol) {
    const todosLosObjetos = [
      this.juego.player,
      ...this.juego.zombies,
      ...(this.juego.arboles || [])
    ].filter(obj => obj && obj.listo);

    const posDelFarol = farol.getPosicionEnPantalla();

    for (let objeto of todosLosObjetos) {
      if (objeto === farol) continue;
      if (!objeto.estoyVisibleEnPantalla || !objeto.estoyVisibleEnPantalla(1)) continue;

      const distancia = calcularDistancia(farol.posicion, objeto.container);

      if (distancia <= farol.radioLuz && distancia > 0) {
        const dx = objeto.container.x - farol.posicion.x;
        const dy = objeto.container.y - farol.posicion.y;
        const anguloAlCentro = Math.atan2(dy, dx);

        const radioObjeto = objeto.radio || 20;
        const anguloTangente = Math.asin(Math.min(1, (radioObjeto * 0.66) / distancia));

        const angulo1 = anguloAlCentro + anguloTangente;
        const angulo2 = anguloAlCentro - anguloTangente;

        const distanciaHastaTangente = Math.sqrt(
          Math.max(0, distancia * distancia - radioObjeto * radioObjeto)
        );

        const posObjEnPantalla = objeto.getPosicionEnPantalla ? 
          objeto.getPosicionEnPantalla() : 
          {
            x: objeto.container.x + this.juego.app.stage.position.x,
            y: objeto.container.y + this.juego.app.stage.position.y
          };

        const puntoTangente1x = posDelFarol.x + Math.cos(angulo1) * distanciaHastaTangente;
        const puntoTangente1y = posDelFarol.y + Math.sin(angulo1) * distanciaHastaTangente;
        const puntoTangente2x = posDelFarol.x + Math.cos(angulo2) * distanciaHastaTangente;
        const puntoTangente2y = posDelFarol.y + Math.sin(angulo2) * distanciaHastaTangente;

        const factorExtension = radioObjeto * 2 + distancia * 0.5;
        const puntoFinal1x = puntoTangente1x + Math.cos(angulo1) * factorExtension;
        const puntoFinal1y = puntoTangente1y + Math.sin(angulo1) * factorExtension;
        const puntoFinal2x = puntoTangente2x + Math.cos(angulo2) * factorExtension;
        const puntoFinal2y = puntoTangente2y + Math.sin(angulo2) * factorExtension;

        this.graficoSombrasProyectadas.moveTo(puntoTangente1x, puntoTangente1y);
        this.graficoSombrasProyectadas.lineTo(puntoFinal1x, puntoFinal1y);
        this.graficoSombrasProyectadas.lineTo(puntoFinal2x, puntoFinal2y);
        this.graficoSombrasProyectadas.lineTo(puntoTangente2x, puntoTangente2y);
        this.graficoSombrasProyectadas.lineTo(puntoTangente1x, puntoTangente1y);

        let cantDeSombra = (farol.radioLuz ** 1.5 / distancia ** 2) * 0.33;
        cantDeSombra = Math.max(0, Math.min(0.33, cantDeSombra));

        this.graficoSombrasProyectadas.fill({
          color: 0x000000,
          alpha: cantDeSombra,
        });
      }
    }
  }

  toggle() {
    this.activo = !this.activo;

    if (this.spriteDeIluminacion) {
      this.spriteDeIluminacion.visible = this.activo;
    }
  }

  isActivo() {
    return this.activo;
  }

  setActivo(valor) {
    if (this.activo !== valor) {
      this.toggle();
    }
  }
}
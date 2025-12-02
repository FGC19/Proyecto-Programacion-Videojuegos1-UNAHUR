// Clase base para entidades estáticas (árboles, rocas, etc.)
class EntidadEstatica extends Objeto {
  constructor(x, y, juego) {
    super(x, y, 0, juego); // Velocidad 0 porque son estáticos
    this.esEstatico = true;
    this.radio = 20; // Radio de colisión por defecto
  }

  // Las entidades estáticas no se mueven, así que sobrescribimos update
  update() {
    // Solo actualizar z-index para el orden de renderizado
    this.actualizarZIndex();
  }

  // Método para verificar colisión circular con otro objeto
  colisionaCon(objeto) {
    const distancia = calculoDeDistancia(
      this.container.x,
      this.container.y,
      objeto.container.x,
      objeto.container.y
    );
    return distancia < (this.radio + (objeto.radio || 25));
  }

  // Método para obtener el vector de repulsión cuando hay colisión
  obtenerVectorDeRepulsion(objeto) {
    const dx = objeto.container.x - this.container.x;
    const dy = objeto.container.y - this.container.y;
    const distancia = Math.sqrt(dx * dx + dy * dy);
    
    if (distancia === 0) return { x: 0, y: 0 };
    
    // Calcular la superposición
    const radioTotal = this.radio + (objeto.radio || 25);
    const superposicion = radioTotal - distancia;
    
    if (superposicion <= 0) return { x: 0, y: 0 };
    
    // Normalizar la dirección
    const nx = dx / distancia;
    const ny = dy / distancia;
    
    // Aplicar una fuerza más suave y proporcional
    const fuerza = superposicion * 0.5;
    
    return {
      x: -nx * fuerza,
      y: -ny * fuerza
    };
  }

  actualizarMiPosicionEnLaGrilla() {
    // Agregar a la grilla una sola vez
    if (!this.agregadoAGrilla) {
      this.grid.add(this);
      this.agregadoAGrilla = true;
    }
  }
}

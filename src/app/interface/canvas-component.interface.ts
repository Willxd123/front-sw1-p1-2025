export interface CanvasComponent {
    id: string;
    type?: string; // 'div' | 'label' | 'input' | etc.
    style: {
      top: string;
      left: string;
      width: string;
      height: string;
      backgroundColor?: string;
      color?: string;
      border?: string;
      borderRadius?: string;
      position?: string;
      fontSize?: string;
      fontFamily?: string; // Añade esta propiedad
      fontWeight?: string; // Opcional: para consistencia
      // Estilos específicos para botones
      cursor?: string;        // Para indicar que es clickeable
      textAlign?: string;    // Alineación del texto
      lineHeight?: string;   // Centrado vertical
      boxShadow?: string;     // Efecto de sombra
      transition?: string;    // Transiciones suaves
      display?: string;       // Comportamiento de display
    };
    children?: CanvasComponent[];
    parentId?: string | null;
    content?: string; // contenido textual para tags como label
  }
  
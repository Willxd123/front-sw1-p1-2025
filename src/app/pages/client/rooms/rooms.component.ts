import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ServerService } from '../../../services/server.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { NavegationComponent } from '../../../components/navegation/navegation.component';
import { DragDropModule } from '@angular/cdk/drag-drop';


interface Point {
  x: number;
  y: number;

}
interface CanvasComponent {
  id: string;
  label: string;
  style: any;
  children?: CanvasComponent[];
  parentId?: string | null;
}


@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    NavegationComponent,
    RouterModule,
    DragDropModule
  ],
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.css'],
})
export class RoomsComponent implements OnInit, AfterViewInit {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLDivElement>;
  roomCode: string = '';
  roomName: string = '';
  roomId: number = 0;
  errorMessage: string = '';
  usersInRoom: any[] = [];
  // Variables para almacenar las dimensiones temporales
  shapeTempX: number = 0;
  shapeTempY: number = 0;
  shapeWidth: number = 0; // Para almacenar el ancho
  shapeHeight: number = 0; // Para almacenar el alto
  strokeWidth: number = 0; // Para almacenar el strokeWidth
  /**
   * Inicia el proceso de arrastre de un componente
   * @param event Evento del mouse
   * @param comp Componente que se va a arrastrar
   */
  //componente
  components: CanvasComponent[] = []; // raíz

  selectedComponent: any = null;
  // Almacena el componente actualmente arrastrado
  draggingComponent: any = null;
  selectedComponentTop: number = 0;
  selectedComponentLeft: number = 0;
  selectedComponentWidth: number = 0;
  selectedComponentHeight: number = 0;

  // Desfase entre el puntero y la esquina superior izquierda del componente
  offsetX: number = 0;
  offsetY: number = 0;
  // JSON que representa todos los componentes del canvas
  jsonExport: any[] = [];
  // Controla visibilidad del modal
  isModalOpen: boolean = false;
  resizingComponent: any = null;
  resizeStartX: number = 1;
  resizeStartY: number = 1;
  initialWidth: number = 0;
  initialHeight: number = 0;
  // Código generado
  generatedHtml: string = '';
  generatedCss: string = '';


  //----------------
  private container!: HTMLElement;
  private width!: number;
  private height!: number;

  private isSelecting = false;
  private startSelectionPos: Point = { x: 0, y: 0 };

  constructor(
    private route: ActivatedRoute,
    private serverService: ServerService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.roomCode = this.route.snapshot.paramMap.get('code') || '';

    if (this.roomCode) {
      this.serverService.joinRoom(this.roomCode);
    }


  }

  ngAfterViewInit(): void {
    this.initializeCanvas();
  }


  initializeCanvas(): void {
    this.container = this.canvasRef.nativeElement;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
  }
  guideLines = {
    vertical: null as number | null,
    horizontal: null as number | null
  };

  addComponent(label: string): void {
    const id = 'comp-' + Date.now();
    const newComponent = {
      id,
      label,
      style: {
        width: '150px',
        height: '80px',
        backgroundColor: '#f0f0f0',
        top: '50px',
        left: '50px',
        position: 'absolute',
        zIndex: 1
      }
    };

    this.components.push(newComponent);
    this.jsonExport = [...this.components]; // sincroniza JSON con canvas
    this.selectComponent(newComponent);
  }
  addNavbar(): void {
    const id = 'comp-' + Date.now();
    const navbar: CanvasComponent = {
      id,
      label: 'Navbar',
      style: {
        width: '100%',
        height: '60px',
        backgroundColor: '#333',
        color: '#fff',
        top: '0px',
        left: '0px',
        position: 'absolute',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 2,
      },
      children: [
        {
          id: id + '-btn1',
          label: 'Inicio',
          style: {
            width: '80px',
            height: '30px',
            backgroundColor: '#555',
            color: '#fff',
            textAlign: 'center',
            lineHeight: '30px',
            borderRadius: '4px',
            fontSize: '14px',
            position: 'relative',
          }
        },
        {
          id: id + '-btn2',
          label: 'Acerca',
          style: {
            width: '80px',
            height: '30px',
            backgroundColor: '#555',
            color: '#fff',
            textAlign: 'center',
            lineHeight: '30px',
            borderRadius: '4px',
            fontSize: '14px',
            position: 'relative',
          }
        },
        {
          id: id + '-btn3',
          label: 'Contacto',
          style: {
            width: '80px',
            height: '30px',
            backgroundColor: '#555',
            color: '#fff',
            textAlign: 'center',
            lineHeight: '30px',
            borderRadius: '4px',
            fontSize: '14px',
            position: 'relative',
          }
        }
      ]
    };

    this.components.push(navbar);
    this.jsonExport = [...this.components];
    this.selectComponent(navbar);
  }

  selectComponent(comp: any): void {
    this.selectedComponent = comp;

    this.selectedComponentTop = parseInt(comp.style.top || '0');
    this.selectedComponentLeft = parseInt(comp.style.left || '0');
    this.selectedComponentWidth = parseInt(comp.style.width || '0');
    this.selectedComponentHeight = parseInt(comp.style.height || '0');
  }
  updateComponentTransform(): void {
    if (!this.selectedComponent) return;

    this.selectedComponent.style.top = `${this.selectedComponentTop}px`;
    this.selectedComponent.style.left = `${this.selectedComponentLeft}px`;
    this.selectedComponent.style.width = `${this.selectedComponentWidth}px`;
    this.selectedComponent.style.height = `${this.selectedComponentHeight}px`;

    this.jsonExport = [...this.components]; // Actualizar JSON
  }



  startDrag(event: MouseEvent, comp: any): void {
    this.draggingComponent = comp;
    const compRect = (event.target as HTMLElement).getBoundingClientRect();
    this.offsetX = event.clientX - compRect.left;
    this.offsetY = event.clientY - compRect.top;

    document.addEventListener('mousemove', this.onDrag);
    document.addEventListener('mouseup', this.stopDrag);
  }
  /**
   * Evento de movimiento del mouse durante el arrastre
   * Actualiza la posición del componente respecto al canvas
   */
  onDrag = (event: MouseEvent): void => {
    if (!this.draggingComponent) return;

    const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();

    const x = event.clientX - canvasRect.left - this.offsetX;
    const y = event.clientY - canvasRect.top - this.offsetY;

    let newLeft = Math.max(0, x);
    let newTop = Math.max(0, y);

    const dragged = this.draggingComponent;
    const draggedWidth = parseInt(dragged.style.width);
    const draggedHeight = parseInt(dragged.style.height);

    const draggedCenterX = newLeft + draggedWidth / 2;
    const draggedCenterY = newTop + draggedHeight / 2;

    const SNAP_THRESHOLD = 8;
    let snapX: number | null = null;
    let snapY: number | null = null;

    // Reset guías
    this.guideLines.vertical = null;
    this.guideLines.horizontal = null;

    for (const other of this.components) {
      if (other === dragged) continue;

      const otherLeft = parseInt(other.style.left);
      const otherTop = parseInt(other.style.top);
      const otherWidth = parseInt(other.style.width);
      const otherHeight = parseInt(other.style.height);

      const otherRight = otherLeft + otherWidth;
      const otherBottom = otherTop + otherHeight;
      const otherCenterX = otherLeft + otherWidth / 2;
      const otherCenterY = otherTop + otherHeight / 2;

      // Snapping horizontal
      if (Math.abs(draggedCenterX - otherCenterX) < SNAP_THRESHOLD) {
        snapX = otherCenterX - draggedWidth / 2;
        this.guideLines.vertical = otherCenterX;
      } else if (Math.abs(newLeft - otherLeft) < SNAP_THRESHOLD) {
        snapX = otherLeft;
        this.guideLines.vertical = otherLeft;
      } else if (Math.abs(newLeft + draggedWidth - otherRight) < SNAP_THRESHOLD) {
        snapX = otherRight - draggedWidth;
        this.guideLines.vertical = otherRight;
      }

      // Snapping vertical
      if (Math.abs(draggedCenterY - otherCenterY) < SNAP_THRESHOLD) {
        snapY = otherCenterY - draggedHeight / 2;
        this.guideLines.horizontal = otherCenterY;
      } else if (Math.abs(newTop - otherTop) < SNAP_THRESHOLD) {
        snapY = otherTop;
        this.guideLines.horizontal = otherTop;
      } else if (Math.abs(newTop + draggedHeight - otherBottom) < SNAP_THRESHOLD) {
        snapY = otherBottom - draggedHeight;
        this.guideLines.horizontal = otherBottom;
      }
    }

    // Aplicar snapping si corresponde
    if (snapX !== null) newLeft = snapX;
    if (snapY !== null) newTop = snapY;

    // Actualizar posición
    dragged.style.left = `${newLeft}px`;
    dragged.style.top = `${newTop}px`;

    // Sincronizar JSON
    this.jsonExport = [...this.components];
    this.selectedComponentTop = parseInt(dragged.style.top);
    this.selectedComponentLeft = parseInt(dragged.style.left);

  };

  updateComponentPosition(): void {
    if (!this.selectedComponent) return;

    this.selectedComponent.style.top = `${this.selectedComponentTop}px`;
    this.selectedComponent.style.left = `${this.selectedComponentLeft}px`;

    this.jsonExport = [...this.components]; // Actualiza el JSON
  }

  /**
   * Abre el modal y genera el HTML/CSS desde el JSON actual
   */
  openModal(): void {
    this.isModalOpen = true;
    this.generateHtmlAndCss();
  }

  /**
   * Cierra el modal
   */
  closeModal(): void {
    this.isModalOpen = false;
  }

  /**
   * Genera el HTML y CSS (inline) desde jsonExport
   */
  generateHtmlAndCss(): void {
    const innerHtml = this.buildHtmlRecursive(this.components);
    this.generatedHtml = `<body>\n${innerHtml}\n</body>`;
    this.generatedCss = this.buildCssRecursive(this.components);
  }

  /**
 * Genera HTML de forma recursiva desde los componentes y sus hijos
 */
  buildHtmlRecursive(components: CanvasComponent[]): string {
    return components.map(comp => {
      const childrenHtml = comp.children ? this.buildHtmlRecursive(comp.children) : '';
      return `<div style="${this.styleToString(comp.style)}">${comp.label}\n${childrenHtml}</div>`;
    }).join('\n');
  }
  buildCssRecursive(components: CanvasComponent[]): string {
    return components.map(comp => {
      const currentCss = `#${comp.id} { ${this.styleToString(comp.style)} }`;
      const childrenCss = comp.children ? this.buildCssRecursive(comp.children) : '';
      return `${currentCss}\n${childrenCss}`;
    }).join('\n');
  }


  /**
   * Convierte el objeto de estilos a string CSS inline
   * @param style Objeto de estilo
   */
  styleToString(style: any): string {
    return Object.entries(style)
      .map(([key, value]) => `${this.camelToKebab(key)}: ${value};`)
      .join(' ');
  }

  /**
   * Convierte camelCase a kebab-case (ej. backgroundColor -> background-color)
   */
  camelToKebab(str: string): string {
    return str.replace(/[A-Z]/g, match => '-' + match.toLowerCase());
  }


  stopDrag = (): void => {
    this.draggingComponent = null;
    this.guideLines.vertical = null;
    this.guideLines.horizontal = null;
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.stopDrag);
  };

  /**
   * Inicia el proceso de redimensionamiento del componente
   */
  startResize(event: MouseEvent, comp: any): void {
    event.stopPropagation(); // Evita conflicto con movimiento
    this.resizingComponent = comp;
    this.resizeStartX = event.clientX;
    this.resizeStartY = event.clientY;
    this.initialWidth = parseInt(comp.style.width);
    this.initialHeight = parseInt(comp.style.height);

    document.addEventListener('mousemove', this.onResize);
    document.addEventListener('mouseup', this.stopResize);
  }

  /**
   * Evento de redimensionamiento
   */
  onResize = (event: MouseEvent): void => {
    if (!this.resizingComponent) return;

    const deltaX = event.clientX - this.resizeStartX;
    const deltaY = event.clientY - this.resizeStartY;

    let newWidth = this.initialWidth + deltaX;
    let newHeight = this.initialHeight + deltaY;

    const SNAP_THRESHOLD = 8;
    let snapW: number | null = null;
    let snapH: number | null = null;

    this.guideLines.vertical = null;
    this.guideLines.horizontal = null;

    const resizing = this.resizingComponent;
    const compLeft = parseInt(resizing.style.left);
    const compTop = parseInt(resizing.style.top);

    const newRight = compLeft + newWidth;
    const newBottom = compTop + newHeight;

    for (const other of this.components) {
      if (other === resizing) continue;

      const otherLeft = parseInt(other.style.left);
      const otherTop = parseInt(other.style.top);
      const otherWidth = parseInt(other.style.width);
      const otherHeight = parseInt(other.style.height);
      const otherRight = otherLeft + otherWidth;
      const otherBottom = otherTop + otherHeight;

      // Snap ancho (width)
      if (Math.abs(newWidth - otherWidth) < SNAP_THRESHOLD) {
        snapW = otherWidth;
        this.guideLines.vertical = compLeft + otherWidth;
      } else if (Math.abs(newRight - otherRight) < SNAP_THRESHOLD) {
        snapW = otherRight - compLeft;
        this.guideLines.vertical = otherRight;
      }

      // Snap alto (height)
      if (Math.abs(newHeight - otherHeight) < SNAP_THRESHOLD) {
        snapH = otherHeight;
        this.guideLines.horizontal = compTop + otherHeight;
      } else if (Math.abs(newBottom - otherBottom) < SNAP_THRESHOLD) {
        snapH = otherBottom - compTop;
        this.guideLines.horizontal = otherBottom;
      }
    }

    // Aplicar snapping si corresponde
    if (snapW !== null) newWidth = snapW;
    if (snapH !== null) newHeight = snapH;

    // Aplicar dimensiones mínimas
    resizing.style.width = `${Math.max(50, newWidth)}px`;
    resizing.style.height = `${Math.max(30, newHeight)}px`;

    // Actualiza JSON exportable
    this.jsonExport = [...this.components];
  };


  /**
   * Finaliza el proceso de redimensionamiento
   */
  stopResize = (): void => {
    this.resizingComponent = null;
    this.guideLines.vertical = null;
    this.guideLines.horizontal = null;
    document.removeEventListener('mousemove', this.onResize);
    document.removeEventListener('mouseup', this.stopResize);
  };



  findElementById(id: string): HTMLElement | null {
    return document.querySelector(`[data-id="${id}"]`);
  }
  onDragOver(event: DragEvent): void {
    event.preventDefault(); // Permite el "drop"
  }

  onDrop(event: DragEvent, targetComp: CanvasComponent): void {
    event.preventDefault();

    if (this.draggingComponent && this.draggingComponent !== targetComp) {
      // Ajustar posición relativa al nuevo padre
      const targetElement = this.findElementById(targetComp.id);
      const draggedElement = this.findElementById(this.draggingComponent.id);

      if (targetElement && draggedElement) {
        const targetRect = targetElement.getBoundingClientRect();
        const draggedRect = draggedElement.getBoundingClientRect();

        // Calcular la nueva posición relativa al padre
        const newLeft = draggedRect.left - targetRect.left;
        const newTop = draggedRect.top - targetRect.top;

        // Actualizar estilos del componente arrastrado
        this.draggingComponent.style.left = `${newLeft}px`;
        this.draggingComponent.style.top = `${newTop}px`;

        // Actualizar el padre del componente arrastrado
        this.draggingComponent.parentId = targetComp.id;

        // Agregar el componente arrastrado como hijo del nuevo padre
        if (!targetComp.children) {
          targetComp.children = [];
        }
        targetComp.children.push(this.draggingComponent);
      }

      // Eliminar el componente arrastrado de su padre anterior (si tiene uno)
      if (this.draggingComponent.parentId) {
        const parent = this.findComponentById(this.draggingComponent.parentId);
        if (parent && parent.children) {
          parent.children = parent.children.filter(child => child.id !== this.draggingComponent.id);
        }
      } else {
        // Si no tiene padre, eliminarlo de la raíz
        this.components = this.components.filter(comp => comp.id !== this.draggingComponent.id);
      }
    }
  }
  findComponentById(id: string): CanvasComponent | null {
    const findRecursive = (components: CanvasComponent[]): CanvasComponent | null => {
      for (const comp of components) {
        if (comp.id === id) return comp;
        if (comp.children) {
          const found = findRecursive(comp.children);
          if (found) return found;
        }
      }
      return null;
    };

    return findRecursive(this.components);
  }
  onDragStart(event: DragEvent, comp: CanvasComponent): void {
    this.draggingComponent = comp;
    event.dataTransfer?.setData("text/plain", comp.id); // Necesario para permitir el drop
  }
  startToolbarDrag(event: MouseEvent, comp: CanvasComponent): void {
    event.preventDefault();
    this.draggingComponent = comp;
    const compRect = this.findElementById(comp.id)?.getBoundingClientRect();
    this.offsetY = compRect ? event.clientY - compRect.top : 0;
  
    document.addEventListener('mousemove', this.onToolbarDrag);
    document.addEventListener('mouseup', this.stopToolbarDrop);
  }
  stopToolbarDrop = (): void => {
    if (!this.draggingComponent) return;
  
    const draggedEl = this.findElementById(this.draggingComponent.id);
    const draggedRect = draggedEl?.getBoundingClientRect();
    const draggedComp = this.draggingComponent;
  
    for (const comp of this.components) {
      if (comp.id === draggedComp.id) continue;
      const el = this.findElementById(comp.id);
      if (!el || !draggedRect) continue;
  
      const rect = el.getBoundingClientRect();
      const overlapY = draggedRect.bottom > rect.top && draggedRect.top < rect.bottom;
      const insideX = draggedRect.left > rect.left && draggedRect.right < rect.right;
  
      if (overlapY && insideX) {
        // Anidar
        draggedComp.style.top = `${draggedRect.top - rect.top}px`;
        draggedComp.style.left = `${draggedRect.left - rect.left}px`;
  
        // Quitar de la raíz
        this.components = this.components.filter(c => c.id !== draggedComp.id);
  
        // Asignar nuevo padre
        draggedComp.parentId = comp.id;
        if (!comp.children) comp.children = [];
        comp.children.push(draggedComp);
  
        break;
      }
    }
  
    this.draggingComponent = null;
    this.jsonExport = [...this.components];
    document.removeEventListener('mousemove', this.onToolbarDrag);
    document.removeEventListener('mouseup', this.stopToolbarDrop);
  };
  

  onToolbarDrag = (event: MouseEvent): void => {
    if (!this.draggingComponent) return;

    const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();
    const y = event.clientY - canvasRect.top - this.offsetY;
    const newTop = Math.max(0, y);

    this.draggingComponent.style.top = `${newTop}px`;
    this.jsonExport = [...this.components]; // actualizar JSON exportado
  };

  stopToolbarDrag = (): void => {
    this.draggingComponent = null;
    document.removeEventListener('mousemove', this.onToolbarDrag);
    document.removeEventListener('mouseup', this.stopToolbarDrag);
  };

  /**
   * Anida un componente dentro de otro
   */





  /* handleKeyDown(event: KeyboardEvent): void {
    if ((event.key === 'Delete' || event.key === 'Backspace') && this.selectedShapes.length > 0) {
      this.deleteSelectedShapes();
    }
  }
  deleteSelectedShapes(): void {
    this.selectedShapes.forEach(shape => {
      shape.destroy(); // Elimina el nodo del layer
    });

    this.selectedShapes = [];
    this.transformer.nodes([]); // Quita el transformer
    this.layer.draw(); // Redibuja el layer
  }

  private setupStageEvents(): void {
    this.stage.on('mousedown touchstart', (e) => {
      if (e.target === this.stage) {
        const pos = this.stage.getPointerPosition();
        if (pos) {
          this.isSelecting = true;
          this.startSelectionPos = pos;
          this.selectionRectangle.visible(true);
          this.selectionRectangle.width(0);
          this.selectionRectangle.height(0);
        }
      }
    });

    this.stage.on('mousemove touchmove', () => {
      if (!this.isSelecting) return;

      const pointerPos = this.stage.getPointerPosition();
      if (pointerPos) {
        this.selectionRectangle.setAttrs({
          x: Math.min(this.startSelectionPos.x, pointerPos.x),
          y: Math.min(this.startSelectionPos.y, pointerPos.y),
          width: Math.abs(pointerPos.x - this.startSelectionPos.x),
          height: Math.abs(pointerPos.y - this.startSelectionPos.y),
        });
        this.layer.batchDraw();
      }
    });

    this.stage.on('mouseup touchend', () => {
      if (!this.isSelecting) return;
      this.isSelecting = false;
      this.selectionRectangle.visible(false);

      const box = this.selectionRectangle.getClientRect();
      const shapes = this.layer.find('.shape').filter((shape) => {
        const shapeRect = shape.getClientRect();
        return Konva.Util.haveIntersection(box, shapeRect);
      });

      this.transformer.nodes(shapes);
      this.selectedShapes = shapes as Konva.Shape[];
      console.log('Seleccionados:', this.selectedShapes);
      this.layer.batchDraw();
    });

    this.stage.on('click tap', (e) => {
      if (e.target === this.stage) {
        this.deselectShape();
      }
    });
  }


  selectShape(shape: Konva.Shape): void {
    this.shapeTempX = shape.x();
    this.shapeTempY = shape.y();
    this.shapeWidth = shape.width(); // Obtener el ancho
    this.shapeHeight = shape.height(); // Obtener el alto
    this.strokeWidth = shape.strokeWidth(); // Obtener el strokeWidth
    this.transformer.nodes([shape]);
    this.transformer.visible(true);
    this.selectedShapes = [shape];
    this.layer.draw();
  }

  deselectShape(): void {
    this.transformer.nodes([]);
    this.selectedShapes = [];
    this.transformer.visible(false);
    this.layer.draw();
  }
  // Método para actualizar las posiciones
  updateShapePosition(shape: Konva.Shape): void {
    shape.position({ x: this.shapeTempX, y: this.shapeTempY });

    // 🔁 Emitir el cambio de posición por socket
    this.serverService.emitMoveObject(
      this.roomCode,
      shape.id(), // Asegúrate que tiene ID válido
      this.shapeTempX,
      this.shapeTempY
    );

    this.layer.batchDraw();
  }


  // Nuevo método para actualizar las dimensiones (width, height)
  updateShapeDimensions(): void {
    this.selectedShapes.forEach(shape => {
      shape.width(this.shapeWidth);
      shape.height(this.shapeHeight);
      shape.strokeWidth(this.strokeWidth);
    });
    this.layer.batchDraw();
  }

  addRectangle(): void {
    const rectData = {
      id: crypto.randomUUID(), // opcional
      x: 1,
      y: 1,
      width: 100,
      height: 100,
      fill: this.getRandomColor(),
      stroke: 'black',
      strokeWidth: 2,
      name: 'shape',
    };

    // 1️⃣ Emitimos por socket (como en addClass)
    this.serverService.emitAddObject(this.roomCode, rectData);

  }

  createRectangle(rectData: any): void {
    const rect = new Konva.Rect({
      ...rectData,
      id: rectData.id,
      draggable: true,
    });

    this.layer.add(rect);
    this.layer.draw();
    this.shapeMap.set(rectData.id, rect); // ⬅️ Guardar en el mapa
    // Eventos para selección, transformación, etc.
    rect.on('click tap', (e) => {
      if (e.evt.ctrlKey || e.evt.metaKey) {
        const currentNodes = this.transformer.nodes();
        const shapeNodes = currentNodes.filter((node): node is Konva.Shape => node instanceof Konva.Shape);
        if (!shapeNodes.includes(rect)) {
          shapeNodes.push(rect);
          this.transformer.nodes(shapeNodes);
          this.selectedShapes = shapeNodes;
        }
      } else {
        this.selectShape(rect);
        this.selectedShapes = [rect];
      }
    });

    rect.on('dragmove', () => {
      const { x, y } = rect.position();
      this.shapeTempX = x;
      this.shapeTempY = y;

      // 🔁 Emitir movimiento por socket (solo 1 vez, directo)
      this.serverService.emitMoveObject(this.roomCode, rectData.id, x, y);
    });



    rect.on('transformend', () => {
      this.shapeWidth = rect.width() * rect.scaleX();
      this.shapeHeight = rect.height() * rect.scaleY();
      rect.width(this.shapeWidth);
      rect.height(this.shapeHeight);
      rect.scaleX(1);
      rect.scaleY(1);
      this.updateShapeDimensions();
    });
  }


  private getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  } */
}
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
import { v4 as uuidv4 } from 'uuid';
interface DragState {
  isDragging: boolean;
  component: CanvasComponent | null;
  startX: number;
  startY: number;
  initialLeft: number;
  initialTop: number;
}
interface Point {
  x: number;
  y: number;

}
interface CanvasComponent {
  id: string;
  label: string;
  style: {
    top: string;
    left: string;
    width: string;
    height: string;
    backgroundColor: string;
    color: string;  // Nuevo
    border: string; // Nuevo
    borderRadius: string; // Nuevo
    position: string;
  };
  children?: CanvasComponent[];
  parentId?: string | null;
}


@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DragDropModule,
    NavegationComponent,
    /* SidebarComponent */
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
  components: CanvasComponent[] = [];
  selectedComponent: CanvasComponent | null = null;
  //posicion
  dragState: DragState = {
    isDragging: false,
    component: null,
    startX: 0,
    startY: 0,
    initialLeft: 0,
    initialTop: 0,
  };
  contextMenu = {
    visible: false,
    x: 0,
    y: 0,
    targetId: '',
  };
  /**
   * Inicia el proceso de arrastre de un componente
   * @param event Evento del mouse
   * @param comp Componente que se va a arrastrar
   */


  // Almacena el componente actualmente arrastrado




  // JSON que representa todos los componentes del canvas
  jsonExport: any[] = [];
  // Controla visibilidad del modal
  isModalOpen: boolean = false;

  // Código generado


  //----------------


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
    // Escuchar carga inicial del canvas
    this.serverService.onInitialCanvasLoad().subscribe(components => {
      this.components = components;
      this.cdr.detectChanges();
    });
    // Escuchar componentes nuevos
    this.serverService.onComponentAdded().subscribe(component => {
      // Only add if it's not already in our components array
      const exists = this.components.some(comp => comp.id === component.id);
      if (!exists) {
        this.components.push(component);
        this.cdr.detectChanges();
      }
    });
    // Escuchar componentes hijos nuevos
    this.serverService.onChildComponentAdded().subscribe(({ parentId, childComponent }) => {
      const parent = this.findComponentById(parentId, this.components);
      if (parent) {
        // Only add if it's not already in the parent's children array
        const exists = parent.children?.some(child => child.id === childComponent.id) || false;
        if (!exists) {
          if (!parent.children) parent.children = [];
          parent.children.push(childComponent);
          this.cdr.detectChanges();
        }
      }
    });
    //remover
    this.serverService.onComponentRemoved().subscribe(componentId => {
      this.removeRecursive(this.components, componentId);
      if (this.selectedComponent?.id === componentId) {
        this.selectedComponent = null;
      }
      this.cdr.detectChanges();
    });
    //movimiento
    // En el ngOnInit del RoomsComponent, agrega:
    this.serverService.onComponentMoved().subscribe(({ componentId, newPosition }) => {
      const component = this.findComponentById(componentId, this.components);
      if (component) {
        component.style.left = newPosition.left;
        component.style.top = newPosition.top;
        this.cdr.detectChanges();
      }
    });

    this.serverService.onComponentTransformed().subscribe(({ componentId, newSize }) => {
      const component = this.findComponentById(componentId, this.components);
      if (component) {
        component.style.width = newSize.width;
        component.style.height = newSize.height;
        this.cdr.detectChanges();
      }
    });
    // Escuchar cambios de propiedades
    this.serverService.onComponentPropertiesUpdated().subscribe(({ componentId, updates }) => {
      const component = this.findComponentById(componentId, this.components);
      if (component) {
        // Aplica todos los cambios de estilo
        Object.assign(component.style, updates);
        this.cdr.detectChanges();
      }
    });
  }

  ngAfterViewInit(): void {

  }


  addComponent(label: string) {
    const newComponent: CanvasComponent = {
      id: uuidv4(),
      label,
      style: {
        top: '50px',
        left: '50px',
        width: '200px',
        height: '100px',
        backgroundColor: '#f0f0f0',
        color: '#004040',  // Nuevo
        border: '2px', // Nuevo
        borderRadius: '2px', // Nuevo
        position: 'absolute',
      },
      children: [],
      parentId: null,
    };
    // Emitir a través del socket

    this.serverService.addCanvasComponent(this.roomCode, newComponent);
    // Agregar localmente
    this.components.push(newComponent);
    this.contextMenu.visible = false;

  }

  addChild(parentId: string) {
    const parent = this.findComponentById(parentId, this.components);
    if (!parent) return;

    const child: CanvasComponent = {
      id: uuidv4(),
      label: 'Hijo de ' + parent.label,
      style: {
        top: '10px',
        left: '10px',
        width: '100px',
        height: '60px',
        backgroundColor: '#d0d0ff',
        color: '#004040',  // Nuevo
        border: '2px', // Nuevo
        borderRadius: '10px', // Nuevo
        position: 'absolute'
      },
      children: [],
      parentId: parent.id,
    };
    //socket
    this.serverService.addChildComponent(this.roomCode, parentId, child);

    if (!parent.children) parent.children = [];
    parent.children.push(child);
    this.contextMenu.visible = false;

  }


  removeComponent(id: string) {
    //socket
    this.serverService.removeCanvasComponent(this.roomCode, id);

    this.removeRecursive(this.components, id);
    if (this.selectedComponent?.id === id) this.selectedComponent = null;
    this.contextMenu.visible = false;
  }

  removeRecursive(list: CanvasComponent[], id: string): boolean {
    const index = list.findIndex((c) => c.id === id);
    if (index !== -1) {
      list.splice(index, 1);
      return true;
    }

    for (const comp of list) {
      if (comp.children && this.removeRecursive(comp.children, id)) {
        return true;
      }
    }

    return false;
  }

  findComponentById(id: string, list: CanvasComponent[]): CanvasComponent | null {
    for (const comp of list) {
      if (comp.id === id) return comp;
      if (comp.children) {
        const found = this.findComponentById(id, comp.children);
        if (found) return found;
      }
    }
    return null;
  }

  selectComponent(comp: CanvasComponent, event: MouseEvent) {
    event.stopPropagation(); // Stop event bubbling
    this.selectedComponent = comp;
    this.contextMenu.visible = false;
  }

  onComponentContextMenu(event: MouseEvent, id: string) {
    event.preventDefault();
    event.stopPropagation(); // Stop event bubbling
    this.contextMenu.visible = true;
    this.contextMenu.x = event.clientX;
    this.contextMenu.y = event.clientY;
    this.contextMenu.targetId = id;
  }

  onCanvasContextMenu(event: MouseEvent) {
    event.preventDefault();
    this.contextMenu.visible = false;
  }
  openHtmlModal() {
    this.isModalOpen = true;
  }

  exportHtml(): string {
    const renderComponent = (comp: CanvasComponent): string => {
      const styleString = Object.entries(comp.style)
        .map(([key, val]) => `${key}: ${val}`)
        .join('; ');
      const childrenHtml = comp.children?.map(renderComponent).join('') || '';
      return `<div style="${styleString}">${comp.label}${childrenHtml}</div>`;
    };

    return `<body>${this.components.map(renderComponent).join('')}</body>`;
  }
  //--------------------
  onMouseDown(event: MouseEvent, component: CanvasComponent) {
    event.preventDefault();
    event.stopPropagation();

    if (event.button === 0) { // Left click only
      this.dragState = {
        isDragging: true,
        component: component,
        startX: event.clientX,
        startY: event.clientY,
        initialLeft: parseInt(component.style.left),
        initialTop: parseInt(component.style.top)
      };
    }
  }
  // Modifica onMouseMove para emitir el movimiento
  onMouseMove(event: MouseEvent) {
    if (!this.dragState.isDragging || !this.dragState.component) return;

    const deltaX = event.clientX - this.dragState.startX;
    const deltaY = event.clientY - this.dragState.startY;

    const newLeft = this.dragState.initialLeft + deltaX;
    const newTop = this.dragState.initialTop + deltaY;

    const component = this.dragState.component;
    const parent = component.parentId ?
      this.findComponentById(component.parentId, this.components) : null;

    let finalLeft = newLeft;
    let finalTop = newTop;

    if (parent) {
      const parentWidth = parseInt(parent.style.width);
      const parentHeight = parseInt(parent.style.height);
      const componentWidth = parseInt(component.style.width);
      const componentHeight = parseInt(component.style.height);

      finalLeft = Math.max(0, Math.min(newLeft, parentWidth - componentWidth));
      finalTop = Math.max(0, Math.min(newTop, parentHeight - componentHeight));
    }

    // Actualiza localmente
    component.style.left = `${finalLeft}px`;
    component.style.top = `${finalTop}px`;

    // Emite el movimiento a través del socket
    this.serverService.moveComponent(this.roomCode, component.id, {
      left: component.style.left,
      top: component.style.top
    });
  }

  onMouseUp() {
    this.dragState.isDragging = false;
  }


  parsePxValue(value: string): number {
    return parseInt(value) || 0;
  }

  updateStylePx(event: Event, property: 'left' | 'top' | 'width' | 'height') {
    if (this.selectedComponent) {
      const value = (event.target as HTMLInputElement).value;
      this.selectedComponent.style[property] = `${value}px`;

      if (property === 'width' || property === 'height') {
        this.serverService.transformComponent(this.roomCode, this.selectedComponent.id, {
          width: this.selectedComponent.style.width,
          height: this.selectedComponent.style.height
        });
      } else {
        this.serverService.moveComponent(this.roomCode, this.selectedComponent.id, {
          left: this.selectedComponent.style.left,
          top: this.selectedComponent.style.top
        });
      }
    }
  }

  loadSampleJson() {
    // Sample JSON data representing a layout with nested components
    /* const sampleJson: CanvasComponent[] = [
      {
        id: uuidv4(),
        label: 'Header',
        style: {
          top: '20px',
          left: '20px',
          width: '600px',
          height: '60px',
          backgroundColor: '#ff7f27',
          position: 'absolute',
        },
        children: [
          {
            id: uuidv4(),
            label: 'Botón',
            style: {
              top: '10px',
              left: '450px',
              width: '80px',
              height: '30px',
              backgroundColor: '#d11a2a',
              position: 'absolute',
            },
            children: [],
            parentId: null, // Esto lo actualizarás dinámicamente si usas lógica recursiva
          }
        ],
        parentId: null,
      },
      {
        id: uuidv4(),
        label: 'Sidebar',
        style: {
          top: '100px',
          left: '20px',
          width: '100px',
          height: '320px',
          backgroundColor: '#c4df0a',
          position: 'absolute',
        },
        children: [],
        parentId: null,
      }
    ]

      ;

    // Set parent IDs properly for children
    sampleJson.forEach(component => {
      if (component.children) {
        component.children.forEach(child => {
          child.parentId = component.id;
        });
      }
    });

    // Load the sample JSON into the components array
    this.components = sampleJson;

    // Clear selection
    this.selectedComponent = null; */
  }

  //_--------------------
  // Reemplaza updateStylePx con estos nuevos métodos
  onPositionChange(value: number, property: 'left' | 'top') {
    if (this.selectedComponent) {
      // Actualiza localmente
      this.selectedComponent.style[property] = `${value}px`;

      // Emite el cambio a través del socket
      this.serverService.moveComponent(this.roomCode, this.selectedComponent.id, {
        left: this.selectedComponent.style.left,
        top: this.selectedComponent.style.top
      });
    }
  }

  onSizeChange(value: number, property: 'width' | 'height') {
    if (this.selectedComponent) {
      // Actualiza localmente
      this.selectedComponent.style[property] = `${value}px`;

      // Emite el cambio a través del socket
      this.serverService.transformComponent(this.roomCode, this.selectedComponent.id, {
        width: this.selectedComponent.style.width,
        height: this.selectedComponent.style.height
      });
    }
  }

  // Método unificado para manejar cambios
  /* onPropertyChange(value: any, property: keyof CanvasComponent['style']) {
    if (this.selectedComponent) {
      // Actualiza localmente
      this.selectedComponent.style[property] = typeof value === 'number' ? `${value}px` : value;

      // Prepara los updates (maneja px para dimensiones/posición)
      const updates = {
        [property]: typeof value === 'number' ? `${value}px` : value
      };

      // Envía los cambios al servidor
      this.serverService.updateComponentProperties(
        this.roomCode,
        this.selectedComponent.id,
        updates
      );
    }
  } */
  //bordes del componente
  // Métodos para manejar bordes de forma unificada
  getBorderProperty(prop: 'width' | 'style' | 'color'): string | number {
    if (!this.selectedComponent?.style.border) {
      return prop === 'width' ? 0 : prop === 'color' ? '#000000' : 'solid';
    }

    const parts = this.selectedComponent.style.border.split(' ');
    switch (prop) {
      case 'width': return parseInt(parts[0]) || 0;
      case 'color': return parts[2] || '#000000';
      default: return parts[1] || 'solid';
    }
  }

  setBorderProperty(prop: 'width' | 'style' | 'color', value: string | number) {
    if (!this.selectedComponent) return;

    const current = this.selectedComponent.style.border || '0 solid #000000';
    let [width, style, color] = current.split(' ');

    switch (prop) {
      case 'width': width = `${value}px`; break;
      case 'color': color = value as string; break;
      case 'style': style = value as string; break;
    }

    const newBorder = `${width || '0'} ${style || 'solid'} ${color || '#000000'}`;
    this.onPropertyChange(newBorder, 'border');
  }

  // Método principal unificado
  // Método principal unificado
  onPropertyChange(value: any, property: keyof CanvasComponent['style']) {
    if (!this.selectedComponent) return;

    // Formateo especial para propiedades numéricas
    let formattedValue = value;

    if (['top', 'left', 'width', 'height', 'borderRadius'].includes(property)) {
      formattedValue = `${value}px`; // Todas las medidas en px
    }

    // Actualización local
    this.selectedComponent.style[property] = formattedValue;

    // Envío a través de sockets
    this.serverService.updateComponentProperties(
      this.roomCode,
      this.selectedComponent.id,
      { [property]: formattedValue }
    );
  }



}
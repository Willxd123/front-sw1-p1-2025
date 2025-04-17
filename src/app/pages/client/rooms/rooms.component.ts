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
    /*     SidebarComponent,
        NavegationComponent, */
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


  }

  ngAfterViewInit(): void {
    this.initializeCanvas();
  }


  initializeCanvas(): void {

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
        position: 'absolute',
      },
      children: [],
      parentId: null,
    };
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
        position: 'absolute'
      },
      children: [],
      parentId: parent.id,
    };
  
    if (!parent.children) parent.children = [];
    parent.children.push(child);
    this.contextMenu.visible = false;
  }
  

  removeComponent(id: string) {
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
  onMouseMove(event: MouseEvent) {
    if (!this.dragState.isDragging) return;

    const deltaX = event.clientX - this.dragState.startX;
    const deltaY = event.clientY - this.dragState.startY;

    const newLeft = this.dragState.initialLeft + deltaX;
    const newTop = this.dragState.initialTop + deltaY;

    if (this.dragState.component) {
      const parent = this.dragState.component.parentId ? 
        this.findComponentById(this.dragState.component.parentId, this.components) : 
        null;

      if (parent) {
        // Constrain within parent boundaries
        const parentWidth = parseInt(parent.style.width);
        const parentHeight = parseInt(parent.style.height);
        const componentWidth = parseInt(this.dragState.component.style.width);
        const componentHeight = parseInt(this.dragState.component.style.height);

        this.dragState.component.style.left = Math.max(0, Math.min(newLeft, parentWidth - componentWidth)) + 'px';
        this.dragState.component.style.top = Math.max(0, Math.min(newTop, parentHeight - componentHeight)) + 'px';
      } else {
        // Root level component
        this.dragState.component.style.left = newLeft + 'px';
        this.dragState.component.style.top = newTop + 'px';
      }
    }
  }

  onMouseUp() {
    this.dragState.isDragging = false;
  }
}
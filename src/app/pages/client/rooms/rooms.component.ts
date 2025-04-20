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
import { NavegationComponent } from '../../../components/navegation/navegation.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { v4 as uuidv4 } from 'uuid';
import { SidebarIzqComponent } from '../../../components/sidebar-izq/sidebar-izq.component';
import { SidebarDerComponent } from '../../../components/sidebar-der/sidebar-der.component';

import { CanvasComponent } from '../../../interface/canvas-component.interface';
import { DragState } from '../../../interface/dragstate.interface';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DragDropModule,
    NavegationComponent,
    SidebarIzqComponent,
    SidebarDerComponent,

  ],
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.css'],
})
export class RoomsComponent implements OnInit, AfterViewInit {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLDivElement>;
  @ViewChild(SidebarIzqComponent) sidebarIzq!: SidebarIzqComponent;

  roomCode: string = '';
  roomName: string = '';
  roomId: number = 0;
  errorMessage: string = '';
  usersInRoom: any[] = [];
  showParticipants: boolean = false;
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
  clipboardComponent: CanvasComponent | null = null;
  cutMode: boolean = false;

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
        if (updates.content !== undefined) {
          component.content = updates.content;
        }
    
        // aplicar solo las demás propiedades en style
        const { content, ...styleUpdates } = updates;
        Object.assign(component.style, styleUpdates);
    
        this.cdr.detectChanges();
      }
    });
    
  }

  ngAfterViewInit(): void {

  }

  triggerAddComponentFromOutside() {
    this.sidebarIzq.addComponent();
  }
  triggerAddLabel() {
    this.sidebarIzq.addLabelComponent();
  }
 

  triggerHtmlModal() {
    this.sidebarIzq.openHtmlModal();
  }

  triggerSampleJson() {
    this.sidebarIzq.loadSampleJson();
  }
  
  //clic derecho para agregar hijo
  addChild(parentId: string) {
    const parent = this.findComponentById(parentId, this.components);
    if (!parent) return;

    const child: CanvasComponent = {
      id: uuidv4(),
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
      content: ' div hijo',
      children: [],
      parentId: parent.id,
    };
    //socket
    this.serverService.addChildComponent(this.roomCode, parentId, child);

    if (!parent.children) parent.children = [];
    parent.children.push(child);
    this.contextMenu.visible = false;

  }

  //eliminar un elemento
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
  //-----------------
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
        initialLeft: parseInt(component.style.left || '0'),
        initialTop: parseInt(component.style.top || '0'),
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

    /* if (parent) {
      const parentWidth = parseInt(parent.style.width);
      const parentHeight = parseInt(parent.style.height);
      const componentWidth = parseInt(component.style.width);
      const componentHeight = parseInt(component.style.height);

      finalLeft = Math.max(0, Math.min(newLeft, parentWidth - componentWidth));
      finalTop = Math.max(0, Math.min(newTop, parentHeight - componentHeight));
    } */

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
  copyComponent(component: CanvasComponent) {
    this.clipboardComponent = structuredClone(component); // copiado profundo
    this.cutMode = false;
  }

  cutComponent(component: CanvasComponent) {
    this.clipboardComponent = structuredClone(component);
    this.cutMode = true;
  }

  pasteComponent(targetParentId: string | null = null) {
    if (!this.clipboardComponent) return;

    const newComponent = structuredClone(this.clipboardComponent);
    newComponent.id = uuidv4(); // nueva ID
    newComponent.parentId = targetParentId;
    newComponent.style.top = '20px';
    newComponent.style.left = '20px';

    if (targetParentId) {
      this.serverService.addChildComponent(this.roomCode, targetParentId, newComponent);
      const parent = this.findComponentById(targetParentId, this.components);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(newComponent);
      }
    } else {
      this.serverService.addCanvasComponent(this.roomCode, newComponent);
      this.components.push(newComponent);
    }

    // Si estaba en modo cortar, eliminar original
    if (this.cutMode && this.clipboardComponent?.id) {
      this.removeComponent(this.clipboardComponent.id);
    }

    this.cutMode = false;
    this.contextMenu.visible = false;
  }

}
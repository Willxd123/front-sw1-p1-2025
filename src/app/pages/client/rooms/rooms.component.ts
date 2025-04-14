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
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import Sortable, { SortableEvent } from 'sortablejs';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    /*     SidebarComponent,
        NavegationComponent, */
    DragDropModule,
    RouterModule,

  ],
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.css'],
})

export class RoomsComponent implements OnInit, AfterViewInit {
  /* @ViewChild('canvasContainer', { static: false }) canvasRef!: ElementRef<HTMLDivElement>; */
  @ViewChild('canvasContainer', { static: false }) canvasRef!: ElementRef<HTMLDivElement>;
  //------------
  roomCode: string = '';
  roomName: string = '';
  roomId: number = 0;
  errorMessage: string = '';
  usersInRoom: any[] = [];
  // Variables para almacenar las dimensiones temporales
  // Variables para el editor
  zIndex = 1;
  selectedElement: HTMLElement | null = null;
  componentCounter = 1;
  // Posición y dimensiones del elemento seleccionado
  positionX = 0;
  positionY = 0;
  widthControl = 200;
  heightControl = 100;
  elementHtml = '';

  elements: any[] = [];

  // Propiedades del elemento seleccionado
 

  // Controles de borde


  // Controles de imagen

  //-----------------------------------------------------------------------------

  mostrarCodigo: boolean = false; // Controla la visibilidad del modal
  codigoExportado: string = ''; // Almacena el código HTML y CSS exportado
  //----------------------------------------------------------------------------
  constructor(
    private route: ActivatedRoute,
    private serverService: ServerService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.roomCode = this.route.snapshot.paramMap.get('code') || '';

    if (this.roomCode) {
      this.serverService.joinRoom(this.roomCode);
    }

  }

  ngAfterViewInit(): void {

    // Inicializar el canvas después de que la vista esté lista
    this.initializeCanvas();
  }
  initializeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    canvas.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('component')) {
        this.selectElement(target);
      }
    });

  }


  // Funciones para manejar elementos
  makeDraggable(el: HTMLElement) {
    el.onmousedown = (e) => {
      if (e.target !== el) return;

      const canvas = this.canvasRef.nativeElement;
      const offsetX = e.clientX - el.offsetLeft;
      const offsetY = e.clientY - el.offsetTop;

      el.style.zIndex = `${this.zIndex++}`;
      this.updateElementInList(el);
      this.selectElement(el);

      const onMouseMove = (eMove: MouseEvent) => {
        let newLeft = eMove.clientX - offsetX;
        let newTop = eMove.clientY - offsetY;

        const parent = el.parentElement!;
        const boundary = parent.getBoundingClientRect();

        // Limitar al área del contenedor padre
        if (newLeft < 0) newLeft = 0;
        if (newTop < 0) newTop = 0;
        if (newLeft + el.offsetWidth > boundary.width) {
          newLeft = boundary.width - el.offsetWidth;
        }
        if (newTop + el.offsetHeight > boundary.height) {
          newTop = boundary.height - el.offsetHeight;
        }

        el.style.left = `${newLeft}px`;
        el.style.top = `${newTop}px`;
      };

      const onMouseUp = (eUp: MouseEvent) => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        // Obtiene el elemento en el punto donde se suelta
        const dropTarget = document.elementFromPoint(eUp.clientX, eUp.clientY) as HTMLElement;

        // Se busca el contenedor válido más cercano (el ancestro que tenga la clase 'component')
        const container = dropTarget ? dropTarget.closest('.component') as HTMLElement : null;

        // Si se encontró un contenedor y no es el mismo elemento que se está arrastrando
        if (container && container !== el) {
          container.appendChild(el);
          // Ajusta las posiciones para que el elemento se coloque relativo a su nuevo contenedor
          el.style.position = 'absolute';
          el.style.left = '0px';
          el.style.top = '0px';
        } else if (dropTarget === canvas) {
          // Si el dropTarget es el canvas directamente, se agrega allí
          canvas.appendChild(el);
        }

        this.updatePositionValues(el);
        this.updateElementInList(el);
      };


      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };
  }

  selectElement(el: HTMLElement) {
    this.selectedElement = el;
    this.updatePositionValues(el);
    this.widthControl = el.offsetWidth;
    this.heightControl = el.offsetHeight;
    this.zIndex = parseInt(el.style.zIndex || '1');
    this.elementHtml = el.outerHTML;
  }
  //funcion para adicionar

  // Función para seleccionar un elemento por ID
  selectElementById(id: string) {
    const el = this.findElementById(this.elements, id);
    if (el) {
      const domElement = this.canvasRef.nativeElement.querySelector(`#${id}`) as HTMLElement;
      if (domElement) {
        this.selectElement(domElement);
      }
    }
  }

  // Función recursiva para encontrar un elemento por ID
  findElementById(elements: any[], id: string): any | null {
    for (const el of elements) {
      if (el.id === id) return el;
      const found = this.findElementById(el.children || [], id);
      if (found) return found;
    }
    return null;
  }

  updatePositionValues(el: HTMLElement) {
    this.positionX = parseInt(el.style.left) || 0;
    this.positionY = parseInt(el.style.top) || 0;
  }

  // Función para eliminar un elemento y sus hijos
  deleteSelectedElement() {
    if (this.selectedElement) {
      const id = this.selectedElement.id;
      this.removeElementFromRoot(this.elements, id);
      this.selectedElement.remove();
      this.selectedElement = null;
    }
  }
  // Función recursiva para eliminar un elemento del árbol
  removeElementFromRoot(elements: any[], id: string): void {
    const index = elements.findIndex(el => el.id === id);
    if (index >= 0) {
      elements.splice(index, 1);
    } else {
      for (const el of elements) {
        if (el.children) this.removeElementFromRoot(el.children, id);
      }
    }
  }
  // Función para actualizar la lista de elementos con jerarquía
  updateElementInList(el: HTMLElement) {
    const existingElement = this.findElementById(this.elements, el.id);
    const elementData = {
      id: el.id,
      type: el.dataset['tipo'] || 'elemento',
      zIndex: parseInt(el.style.zIndex || '1'),
      children: existingElement?.children || [] // Mantener los hijos existentes
    };

    if (existingElement) {
      Object.assign(existingElement, elementData);
    } else {
      this.elements.push(elementData);
    }

    // Ordenar por z-index
    this.elements.sort((a, b) => b.zIndex - a.zIndex);
  }

  // Funciones para actualizar propiedades
  updatePosition() {
    if (this.selectedElement) {
      this.selectedElement.style.left = `${this.positionX}px`;
      this.selectedElement.style.top = `${this.positionY}px`;
      this.elementHtml = this.selectedElement.outerHTML;
      this.updateElementInList(this.selectedElement);
    }
  }

  updateWidth() {
    if (this.selectedElement) {
      this.selectedElement.style.width = `${this.widthControl}px`;
      this.elementHtml = this.selectedElement.outerHTML;
    }
  }

  updateHeight() {
    if (this.selectedElement) {
      this.selectedElement.style.height = `${this.heightControl}px`;
      this.elementHtml = this.selectedElement.outerHTML;
    }
  }

  updateZIndex() {
    if (this.selectedElement) {
      this.selectedElement.style.zIndex = `${this.zIndex}`;
      this.updateElementInList(this.selectedElement);
    }
  }

  showHtml() {
    if (this.selectedElement) {
      alert(this.selectedElement.outerHTML);
    } else {
      alert('No hay elemento seleccionado');
    }
  }

  // Funciones para agregar componentes
  addComponent(el: HTMLElement, type: string) {
    el.className = 'component';
    el.dataset['tipo'] = type;
    el.id = `comp-${this.componentCounter++}`;
    el.style.position = 'absolute';
    el.style.left = '50px';
    el.style.top = '50px';
    el.style.zIndex = `${this.zIndex++}`;

    this.makeDraggable(el);
    this.canvasRef.nativeElement.appendChild(el);
    this.selectElement(el);
    this.updateElementInList(el);
  }
  addBox() {
    const el = document.createElement('div');
    el.innerText = 'Caja DIV';
    el.style.width = '200px';
    el.style.height = '100px';
    el.style.backgroundColor = '#f0f0f0';
    el.style.border = '1px solid #ccc';
    el.style.position = 'relative'; // Permite posicionar hijos relativos a este contenedor
    el.style.display = 'flex';
    el.style.justifyContent = 'center';
    el.style.alignItems = 'center';
    el.style.overflow = 'auto'; // Permite que los hijos se muestren correctamente si exceden el tamaño
    el.contentEditable = 'false'; // Deshabilitar edición directa del contenedor

    // Permitir que el contenedor acepte hijos
    el.addEventListener('dragover', (event) => {
      event.preventDefault();
    });

    el.addEventListener('drop', (event) => {
      event.preventDefault();
      const draggedElement = document.querySelector('.dragging') as HTMLElement;
      if (draggedElement) {
        el.appendChild(draggedElement);
        draggedElement.style.position = 'absolute'; // Ajusta la posición del hijo
        draggedElement.style.left = `${event.offsetX}px`;
        draggedElement.style.top = `${event.offsetY}px`;
      }
    });

    this.addComponent(el, 'caja');
  }

  addText() {
    const el = document.createElement('div');
    el.innerText = 'Texto editable';
    el.contentEditable = 'true';
    this.addComponent(el, 'texto');
  }

  addButton() {
    const el = document.createElement('button');
    el.innerText = 'Botón';
    this.addComponent(el, 'boton');
  }

  addImage() {
    const el = document.createElement('img');
    el.src = 'https://via.placeholder.com/150';
    el.alt = 'Imagen';
    this.addComponent(el, 'imagen');
  }

  addInput() {
    const el = document.createElement('input');
    el.type = 'text';
    el.placeholder = 'Escribe aquí...';
    this.addComponent(el, 'input');
  }

  addTextarea() {
    const el = document.createElement('textarea');
    el.placeholder = 'Área de texto...';
    this.addComponent(el, 'textarea');
  }

  addHeading(level: number) {
    const el = document.createElement(`h${level}`);
    el.innerText = `Título H${level}`;
    el.contentEditable = 'true';
    this.addComponent(el, `h${level}`);
  }
  abrirModalCodigo() {
    const canvas = this.canvasRef.nativeElement;
    const elements = Array.from(canvas.children);

    const getOuterHTMLRecursive = (element: HTMLElement): string => {
        let html = element.outerHTML;
        if (element.children.length > 0) {
            const childrenHTML = Array.from(element.children)
                .map(child => getOuterHTMLRecursive(child as HTMLElement))
                .join('');
            html = element.outerHTML.replace(element.innerHTML, childrenHTML);
        }
        return html;
    };

    let htmlCode = '';
    elements.forEach(el => {
        htmlCode += getOuterHTMLRecursive(el as HTMLElement) + '\n';
    });

    this.codigoExportado = htmlCode;
    this.mostrarCodigo = true;
}

  cerrarModalCodigo() {
    this.mostrarCodigo = false;
  }

}
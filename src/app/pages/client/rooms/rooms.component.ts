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
import Konva from 'konva';

interface Point {
  x: number;
  y: number;

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
  selectedShapes: Konva.Shape[] = [];

  private stage!: Konva.Stage;
  private layer!: Konva.Layer;
  private container!: HTMLElement;
  private width!: number;
  private height!: number;
  private transformer!: Konva.Transformer;
  private selectionRectangle!: Konva.Rect;
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
    this.addRectangle(); // Agregar un rectángulo inicial
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.cdr.detectChanges();
  }

  initializeCanvas(): void {
    this.container = this.canvasRef.nativeElement;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    const baseWidth = 1200;
    const baseHeight = 700;

    const actualWidth = this.container.offsetWidth;
    const actualHeight = this.container.offsetHeight;

    const scaleX = actualWidth / baseWidth;
    const scaleY = actualHeight / baseHeight;
    this.stage = new Konva.Stage({
      container: this.container.id,
      width: actualWidth,
      height: actualHeight,
    });

    this.stage.scale({ x: scaleX, y: scaleY });

    this.layer = new Konva.Layer();
    this.stage.add(this.layer);

    this.transformer = new Konva.Transformer({
      rotateEnabled: true,
      borderStroke: 'gray',
      borderDash: [3, 3],
      boundBoxFunc: (oldBox, newBox) => {
        // Limitar el tamaño mínimo
        if (newBox.width < 5 || newBox.height < 5) {
          return oldBox;
        }
        return newBox;
      }
    });
    this.layer.add(this.transformer);

    this.selectionRectangle = new Konva.Rect({
      fill: 'rgba(0, 161, 255, 0.3)',
      stroke: 'rgba(0, 161, 255, 0.7)',
      strokeWidth: 1,
      visible: false,
    });
    this.layer.add(this.selectionRectangle);

    this.setupStageEvents();
    this.layer.draw();
  }

  handleKeyDown(event: KeyboardEvent): void {
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
    shape.x(this.shapeTempX);
    shape.y(this.shapeTempY);
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
    const rect = new Konva.Rect({
      x: 1,
      y: 1,
      width: 100,
      height: 100,
      fill: this.getRandomColor(),
      draggable: true,
      stroke: 'black',
      strokeWidth: 2,
      name: 'shape'
    });

    this.layer.add(rect);
    this.shapeTempX = rect.x();
    this.shapeTempY = rect.y();
    this.shapeHeight = rect.height();
    this.shapeWidth = rect.width();
    rect.on('click tap', (e) => {
      if (e.evt.ctrlKey || e.evt.metaKey) {
        // Obtener nodos existentes y hacer una copia
        const currentNodes = this.transformer.nodes();

        // Filtrar solo los Shape válidos (para evitar error de tipos)
        const shapeNodes = currentNodes.filter(
          (node): node is Konva.Shape => node instanceof Konva.Shape
        );

        if (!shapeNodes.includes(rect)) {
          shapeNodes.push(rect);
          this.transformer.nodes(shapeNodes);
          this.selectedShapes = shapeNodes;
        }
      } else {
        this.selectShape(rect); // Ya asigna el transformer
        this.selectedShapes = [rect];
      }

      console.log('Seleccionados:', this.selectedShapes);
    });
    // Evento de drag para mover el rectángulo
    rect.on('dragmove', () => {
      this.shapeTempX = rect.x();  // Actualiza shapeTempX y shapeTempY al mover la forma
      this.shapeTempY = rect.y();
      this.updateShapePosition(rect);
    });
    // Evento de transformación (redimensionado) para actualizar las dimensiones
    rect.on('transformend', () => {
      // Actualiza las dimensiones después de la transformación
      this.shapeWidth = rect.width() * rect.scaleX();
      this.shapeHeight = rect.height() * rect.scaleY();

      // Restablece la escala para evitar distorsión
      rect.width(this.shapeWidth);
      rect.height(this.shapeHeight);
      rect.scaleX(1);
      rect.scaleY(1);

      this.updateShapeDimensions();
    });

    this.layer.draw();
  }


  private getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
}

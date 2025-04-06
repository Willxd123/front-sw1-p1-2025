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

  private stage!: Konva.Stage;
  private layer!: Konva.Layer;
  private container!: HTMLElement;
  private width!: number;
  private height!: number;
  private transformer!: Konva.Transformer;


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
    this.addRectangle(); // Agregar un rectángulo inicial si lo deseas
    this.cdr.detectChanges();
  }

  initializeCanvas(): void {
    this.container = this.canvasRef.nativeElement;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    // Inicializar Konva Stage
    this.stage = new Konva.Stage({
      container: this.container.id,
      width: this.width,
      height: this.height,
    });

    // Crear una capa de Konva
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);

    // Crear el transformer
    this.transformer = new Konva.Transformer({
      rotateEnabled: false, // Opcional: deshabilita rotación si no la necesitas
      borderStroke: 'gray',
      borderDash: [3, 3],
    });
    this.layer.add(this.transformer);
    this.layer.draw();
  }

  addRectangle(): void {
    const rect = new Konva.Rect({
      x: Math.random() * (this.width - 100),
      y: Math.random() * (this.height - 100),
      width: 100,
      height: 100,
      fill: this.getRandomColor(),
      draggable: true,
      stroke: 'black',
      strokeWidth: 2,
      name: 'shape' // Añade un nombre para identificar fácilmente
    });
  
    this.layer.add(rect);
    
    // Seleccionar la figura automáticamente al crearla
    this.transformer.nodes([rect]);
    
    this.layer.draw();
    
    // Agrega eventos para manejar la selección
    rect.on('click tap', () => {
      this.transformer.nodes([rect]);
      this.layer.draw();
    });
  }
  addCircle(): void {
    const circle = new Konva.Circle({
      x: Math.random() * (this.width - 100),
      y: Math.random() * (this.height - 100),
      radius: 50,
      fill: this.getRandomColor(),
      draggable: true,
      stroke: 'black',
      strokeWidth: 2,
      name: 'shape'
    });
  
    this.layer.add(circle);
    this.transformer.nodes([circle]);
    this.layer.draw();
    
    circle.on('click tap', () => {
      this.transformer.nodes([circle]);
      this.layer.draw();
    });
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
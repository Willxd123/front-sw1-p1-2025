import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServerService } from '../../services/server.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navegation',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './navegation.component.html',
  styleUrl: './navegation.component.css'
})
export class NavegationComponent implements OnInit {
  roomCode: string = ''; // Código de la sala que obtenemos de la URL
  roomName: string = ''; // Nombre de la sala que obtenemos del backend
  errorMessage: string = ''; // Para manejar errores
  usersInRoom: any[] = []; // Almacena los usuarios que se unen

  constructor(
    private route: ActivatedRoute,
    private serverService: ServerService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.roomCode = this.route.snapshot.paramMap.get('code') || '';
  }
  // Método para salir de la sala
  leaveRoom() {
    this.serverService.leaveRoom(this.roomCode);

    // Escuchar el evento cuando el usuario ha salido correctamente
    this.serverService.onLeftRoom().subscribe({
      next: () => {
        console.log(`Saliste de la sala ${this.roomCode}`);
        this.router.navigate(['/client']); // Redirigir
      },
      error: (err) => {
        console.error('Error al salir de la sala:', err);
        this.errorMessage = 'No se pudo salir de la sala.';
      },
    });
  }
}

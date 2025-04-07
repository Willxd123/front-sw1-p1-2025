import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ServerService {
  private socket: Socket;


  constructor() {
    this.socket = io(environment.SERVER_URL, {
      auth: {
        token: localStorage.getItem('authToken'),
      },
    });
  }
  // Escuchar mensaje de conexión
  onConnectionMessage(): Observable<string> {
    return new Observable((observer) => {
      this.socket.on('connectionMessage', (message: string) => {
        observer.next(message);
      });
    });
  }
  // Emitir evento para crear sala
  createRoom(createRoomDto: any) {
    this.socket.emit('createRoom', createRoomDto);
  }

  // Escuchar cuando se crea la sala
  onRoomCreated(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('roomCreated', (room) => {
        observer.next(room);
      });
    });
  }

  // Emitir evento para unirse a una sala
  joinRoom(roomCode: string) {
    this.socket.emit('joinRoom', { roomCode });
  }
  //salir de la sala
  leaveRoom(roomCode: string) {
    this.socket.emit('leaveRoom', { roomCode });
  }

  onLeftRoom(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('leftRoom', () => {
        observer.next();
      });
    });
  }

  // Escuchar cuando el usuario se une a la sala
  onJoinedRoom(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('joinedRoom', (room) => {
        observer.next(room);
      });
    });
  }

  onUsersListUpdate(): Observable<any[]> {
    return new Observable((observer) => {
      this.socket.on('updateUsersList', (users) => {
        observer.next(users);
      });
    });
  }

  //----------------objetos---------------
  emitAddObject(roomCode: string, objectData: any): void {
    this.socket.emit('addObject', { roomCode, objectData });
  }

  onObjectAdded(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('objectAdded', (objectData) => {
        observer.next(objectData);
      });
    });
  }

  onInitialCanvasState(): Observable<any[]> {
    return new Observable((observer) => {
      this.socket.on('initialCanvasState', (objects) => {
        console.log('📨 Recibido initialCanvasState desde servidor:', objects);
        observer.next(objects);
      });

    });
  }
  //-------mover objeto
  emitMoveObject(roomCode: string, objectId: string, x: number, y: number): void {
    this.socket.emit('moveObject', { roomCode, objectId, x, y });
  }

  onObjectMoved(): Observable<{ objectId: string; x: number; y: number }> {
    return new Observable((observer) => {
      this.socket.on('objectMoved', (data) => {
        observer.next(data);
      });
    });
  }


}

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
  onInitialCanvasLoad(): Observable<any[]> {
    return new Observable(observer => {
      this.socket.on('initialCanvasLoad', (components) => {
        observer.next(components);
      });
    });
  }
  //agrega componente
  addCanvasComponent(roomCode: string, component: any) {
    this.socket.emit('addComponent', { roomCode, component });
  }

  onComponentAdded(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('componentAdded', (component) => {
        observer.next(component);
      });
    });
  }
  //agrega hijo
  addChildComponent(roomCode: string, parentId: string, childComponent: any) {
    this.socket.emit('addChildComponent', { roomCode, parentId, childComponent });
  }

  onChildComponentAdded(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('childComponentAdded', ({ parentId, childComponent }) => {
        observer.next({ parentId, childComponent });
      });
    });
  }
  //remover
  removeCanvasComponent(roomCode: string, componentId: string) {
    this.socket.emit('removeComponent', { roomCode, componentId });
  }

  onComponentRemoved(): Observable<string> {
    return new Observable((observer) => {
      this.socket.on('componentRemoved', (componentId: string) => {
        observer.next(componentId);
      });
    });
  }
  //movimiento
  // Agrega estos métodos al ServerService

  // Para mover componentes
  moveComponent(roomCode: string, componentId: string, newPosition: { left: string, top: string }) {
    this.socket.emit('moveComponent', { roomCode, componentId, newPosition });
  }

  onComponentMoved(): Observable<{ componentId: string, newPosition: { left: string, top: string } }> {
    return new Observable((observer) => {
      this.socket.on('componentMoved', (data) => {
        observer.next(data);
      });
    });
  }

  // Para transformar componentes (cambiar tamaño)
  transformComponent(roomCode: string, componentId: string, newSize: { width: string, height: string }) {
    this.socket.emit('transformComponent', { roomCode, componentId, newSize });
  }

  onComponentTransformed(): Observable<{ componentId: string, newSize: { width: string, height: string } }> {
    return new Observable((observer) => {
      this.socket.on('componentTransformed', (data) => {
        observer.next(data);
      });
    });
  }
  // Agrega o reemplaza estos métodos en tu ServerService

  // Método unificado para actualizar cualquier propiedad
  updateComponentProperties(roomCode: string, componentId: string, updates: any) {
    this.socket.emit('updateComponentProperties', { roomCode, componentId, updates });
  }

  // Escucha cambios en las propiedades
  onComponentPropertiesUpdated(): Observable<{ componentId: string, updates: any }> {
    return new Observable((observer) => {
      this.socket.on('componentPropertiesUpdated', (data) => {
        observer.next(data);
      });
    });
  }
  //------------
  // Añade estos métodos en tu ServerService

updateComponentAttributes(roomCode: string, componentId: string, attributeUpdates: {[key: string]: string}) {
  this.socket.emit('updateComponentAttributes', { roomCode, componentId, attributeUpdates });
}

updateComponentContent(roomCode: string, componentId: string, content: string) {
  this.socket.emit('updateComponentContent', { roomCode, componentId, content });
}

// Y los observables correspondientes
onComponentAttributesUpdated() {
  return new Observable<{componentId: string, attributeUpdates: {[key: string]: string}}>(observer => {
    this.socket.on('componentAttributesUpdated', data => {
      observer.next(data);
    });
  });
}

onComponentContentUpdated() {
  return new Observable<{componentId: string, content: string}>(observer => {
    this.socket.on('componentContentUpdated', data => {
      observer.next(data);
    });
  });
}
}

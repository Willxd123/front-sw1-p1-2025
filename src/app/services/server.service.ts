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

  //----------------diagrama---------------
  emitAddClass(classData: any) {
    this.socket.emit('addClass', classData);
  }

  onClassAdded(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('classAdded', (classData) => {
        console.log('Clase recibida:', classData);
        observer.next(classData);
      });
    });
  }
  //posicion
  // Emitir la actualización de posición y tamaño al servidor
  emitClassPositionAndSizeUpdate(updateData: any) {
    this.socket.emit('updateClassPositionAndSize', updateData);
  }

  // Escuchar la actualización de la posición y tamaño de una clase
  onClassPositionAndSizeUpdated(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('classPositionAndSizeUpdated', (updateData) => {
        observer.next(updateData);
      });
    });
  }
  //atributo
  // Emitir la adición de un nuevo atributo al servidor
  emitAddAttribute(attributeData: any) {
    this.socket.emit('addAttribute', attributeData);
  }

  // Escuchar cuando se agrega un nuevo atributo a una clase
  onAttributeAdded(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('attributeAdded', (updateData) => {
        observer.next(updateData);
      });
    });
  }
  // Emitir el evento para actualizar un atributo
  emitUpdateAttribute(attributeData: any) {
    this.socket.emit('updateAttributeText', attributeData);
  }

  // Escuchar cuando se actualiza un atributo
  onAttributeUpdated(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('attributeUpdated', (updateData) => {
        observer.next(updateData);
      });
    });
  }

  //-----------------eliminar atributo---------------
  // Emitir la eliminación de un atributo al servidor (nuevo)
  emitRemoveAttribute(attributeData: any) {
    this.socket.emit('removeAttribute', attributeData);
  }

  // Escuchar cuando se elimina un atributo de una clase (nuevo)
  onAttributeRemoved(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('attributeRemoved', (updateData) => {
        observer.next(updateData);
      });
    });
  }
  //metodo
  // Emitir la adición de un nuevo método al servidor
  emitAddMethod(methodData: any) {
    this.socket.emit('addMethod', methodData);
  }

  // Escuchar cuando se agrega un nuevo método a una clase
  onMethodAdded(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('methodAdded', (updateData) => {
        observer.next(updateData);
      });
    });
  }
  //--------------eliminar metodo------
  // Emitir la eliminación de un método al servidor (nuevo)
  emitRemoveMethod(methodData: any) {
    this.socket.emit('removeMethod', methodData);
  }

  // Escuchar cuando se elimina un método de una clase (nuevo)
  onMethodRemoved(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('methodRemoved', (updateData) => {
        observer.next(updateData);
      });
    });
  }
  //nombre de la clase
  emitClassNameUpdate(updateData: any) {
    this.socket.emit('updateClassName', updateData);
  }

  onClassNameUpdated(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('classNameUpdated', (classData) => {
        observer.next(classData);
      });
    });
  }

  //eliminar clase
  emitDeleteClass(deleteData: any) {
    this.socket.emit('deleteClass', deleteData);
  }

  onClassDeleted(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('classDeleted', (classKey) => {
        observer.next(classKey);
      });
    });
  }
  emitCreateRelationship(relationshipData: any) {
    this.socket.emit('createRelationship', relationshipData);
  }
  onRelationshipCreated(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('relationshipCreated', (linkData) => {
        observer.next(linkData);
      });
    });
  }
  emitCreateManyToMany(data: any) {
    this.socket.emit('createManyToMany', data);
  }

  onManyToManyCreated(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('manyToManyCreated', (data) => {
        observer.next(data);
      });
    });
  }

}

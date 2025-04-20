import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { v4 as uuidv4 } from 'uuid';
import { ServerService } from '../../services/server.service';
import { CanvasComponent } from '../../interface/canvas-component.interface';
import { ActivatedRoute, Router } from '@angular/router';




@Component({
  selector: 'app-sidebar-izq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar-izq.component.html'
})
export class SidebarIzqComponent implements OnInit {

 
  roomName: string = ''; // Nombre de la sala que obtenemos del backend
  errorMessage: string = ''; // Para manejar errores
  usersInRoom: any[] = []; // Almacena los usuarios que se unen

  @Input() components: CanvasComponent[] = [];
  @Input() roomCode: string = '';
  @Input() contextMenu: any;
  @Input() isModalOpen: boolean = false;

  constructor(
    private route: ActivatedRoute,
    public serverService: ServerService,
    private router: Router
  ) { }
  showParticipants: boolean = false;

  ngOnInit(): void {
    this.roomCode = this.route.snapshot.paramMap.get('code') || '';
    this.serverService.onJoinedRoom().subscribe((room) => {
      this.roomName = room.name; // Asignar el nombre de la sala
      console.log(`Unido a la sala: ${this.roomName}`);
    });
    this.serverService.onUsersListUpdate().subscribe((users) => {
      this.usersInRoom = users; // Actualizar la lista de usuarios
    });
   }

   addComponent() {
    const newComponent: CanvasComponent = {
      id: uuidv4(),
      type: 'div',
      style: {
        top: '50px',
        left: '50px',
        width: '200px',
        height: '100px',
        backgroundColor: '#f0f0f0',
        color: '#000000', // Color de texto negro por defecto
        border: '1px solid #cccccc', // Borde más sutil
        borderRadius: '4px',
        position: 'absolute',
        fontSize: '16px' ,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: '40px',
      },
      content: 'Nuevo Div', // Texto por defecto más descriptivo
      children: [],
      parentId: null,
    };
  
    this.serverService.addCanvasComponent(this.roomCode, newComponent);
    this.components.push(newComponent);
    this.contextMenu.visible = false;
  }
  
  addLabelComponent() {
    const labelComponent: CanvasComponent = {
      id: uuidv4(),
      type: 'label',
      style: {
        top: '60px',
        left: '60px',
        width: '100px',
        height: '20px',
        backgroundColor: 'transparent', // Fondo transparente para etiquetas
        color: '#000000',
        position: 'absolute',
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: '40px',
      },
      content: 'Etiqueta:',
      children: [],
      parentId: null
    };
  
    this.serverService.addCanvasComponent(this.roomCode, labelComponent);
    this.components.push(labelComponent);
    this.contextMenu.visible = false;
  }
  
  addButtonComponent() {
    const defaultButtonStyles = {
        cursor: 'pointer',
        textAlign: 'center',
        lineHeight: '40px',
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease',
        display: 'inline-block'
    };
    
    const buttonComponent: CanvasComponent = {
        id: uuidv4(),
        type: 'button',
        style: {
            top: '50px',
            left: '50px',
            width: '120px',
            height: '40px',
            backgroundColor: '#4f46e5',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            position: 'absolute',
            fontSize: '14px',
            fontFamily: 'Arial, sans-serif',
            ...defaultButtonStyles // Spread operator para incluir los estilos específicos
        },
        content: 'Click me',
        children: [],
        parentId: null
    };

    this.serverService.addCanvasComponent(this.roomCode, buttonComponent);
    this.components.push(buttonComponent);
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
      const tag = comp.type || 'div'; // por defecto usa div
      const content = comp.content || '';
  
      if (tag === 'label') {
        return `<label style="${styleString}">${content}</label>`;
      }
  
      return `<${tag} style="${styleString}">${childrenHtml}</${tag}>`;
    };
  
    return `<body>${this.components.map(renderComponent).join('')}</body>`;
  }
  
  loadSampleJson() {
    const example: CanvasComponent[] = [
      {
        "id": "browser-window-container",
        "type": "div",
        "style": {
          "top": "0",
          "left": "0",
          "width": "100%",
          "height": "100%",
          "backgroundColor": "#ffffff",
          "position": "relative",
          "display": "flex",
          "flexDirection": "column",
          "border": "4px solid #000000",
          "borderRadius": "12px"
        },
        "children": [
          {
            "id": "browser-header",
            "type": "div",
            "style": {
              "width": "100%",
              "height": "40px",
              "backgroundColor": "#ffffff",
              "borderBottom": "4px solid #000000",
              "display": "flex",
              "flexDirection": "row",
              "justifyContent": "space-between",
              "alignItems": "center",
              "padding": "0 15px"
            },
            "parentId": "browser-window-container",
            "children": [
              {
                "id": "browser-controls",
                "type": "div",
                "style": {
                  "display": "flex",
                  "flexDirection": "row",
                  "alignItems": "center"
                },
                "parentId": "browser-header",
                "children": [
                  {
                    "id": "control-circle-1",
                    "type": "div",
                    "style": {
                      "width": "30px",
                      "height": "30px",
                      "borderRadius": "50%",
                      "border": "4px solid #000000",
                      "marginRight": "10px"
                    },
                    "parentId": "browser-controls"
                  },
                  {
                    "id": "control-circle-2",
                    "type": "div",
                    "style": {
                      "width": "30px",
                      "height": "30px",
                      "borderRadius": "50%",
                      "border": "4px solid #000000",
                      "marginRight": "10px"
                    },
                    "parentId": "browser-controls"
                  },
                  {
                    "id": "control-circle-3",
                    "type": "div",
                    "style": {
                      "width": "30px",
                      "height": "30px",
                      "borderRadius": "50%",
                      "border": "4px solid #000000"
                    },
                    "parentId": "browser-controls"
                  }
                ]
              },
              {
                "id": "address-bar",
                "type": "div",
                "style": {
                  "width": "300px",
                  "height": "20px",
                  "backgroundColor": "#ffffff",
                  "border": "4px solid #000000",
                  "borderRadius": "10px"
                },
                "parentId": "browser-header"
              }
            ]
          },
          {
            "id": "login-form-container",
            "type": "div",
            "style": {
              "width": "100%",
              "height": "calc(100% - 40px)",
              "display": "flex",
              "flexDirection": "column",
              "justifyContent": "center",
              "alignItems": "center",
              "padding": "40px"
            },
            "parentId": "browser-window-container",
            "children": [
              {
                "id": "username-input",
                "type": "div",
                "style": {
                  "width": "70%",
                  "height": "60px",
                  "border": "4px solid #000000",
                  "borderRadius": "10px",
                  "marginBottom": "30px",
                  "display": "flex",
                  "justifyContent": "center",
                  "alignItems": "center"
                },
                "parentId": "login-form-container",
                "children": [
                  {
                    "id": "username-text",
                    "type": "div",
                    "style": {
                      "fontSize": "30px",
                      "fontWeight": "bold",
                      "fontFamily": "sans-serif",
                      "color": "#000000",
                      "textAlign": "center"
                    },
                    "content": "LOGIN",
                    "parentId": "username-input"
                  }
                ]
              },
              {
                "id": "password-input",
                "type": "div",
                "style": {
                  "width": "70%",
                  "height": "60px",
                  "border": "4px solid #000000",
                  "borderRadius": "10px",
                  "display": "flex",
                  "justifyContent": "center",
                  "alignItems": "center"
                },
                "parentId": "login-form-container",
                "children": [
                  {
                    "id": "password-text",
                    "type": "div",
                    "style": {
                      "fontSize": "30px",
                      "fontFamily": "sans-serif",
                      "color": "#000000",
                      "textAlign": "center"
                    },
                    "content": "* * * * *",
                    "parentId": "password-input"
                  }
                ]
              }
            ]
          }
        ]
      }
    ];

    this.components.length = 0;
    this.components.push(...example);
  }
}

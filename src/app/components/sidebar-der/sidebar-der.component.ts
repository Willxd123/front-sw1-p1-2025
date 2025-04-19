import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CanvasComponent } from '../../interface/canvas-component.interface';
import { ServerService } from '../../services/server.service';

@Component({
  selector: 'app-sidebar-der',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sidebar-der.component.html'
})
export class SidebarDerComponent {
  @Input() selectedComponent: CanvasComponent | null = null;
  @Input() roomCode: string = '';

  constructor(private serverService: ServerService) {}

  parsePxValue(value: string | undefined): number {
    if (!value) return 0;
    return parseInt(value.replace('px', ''), 10);
  }

  onPropertyChange(value: any, property: keyof CanvasComponent['style']) {
    if (!this.selectedComponent) return;

    let formattedValue = value;
    if (['top', 'left', 'width', 'height', 'borderRadius', 'fontSize','lineHeight'].includes(property)) {
      formattedValue = `${value}px`;
    }

    this.selectedComponent.style[property] = formattedValue;

    this.serverService.updateComponentProperties(
      this.roomCode,
      this.selectedComponent.id,
      { [property]: formattedValue }
    );
    
  }
// sidebar-der.component.ts
webSafeFonts = [
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Helvetica', value: "'Helvetica Neue', Helvetica, sans-serif" },
  { name: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { name: 'Times New Roman', value: "'Times New Roman', Times, serif" },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Courier New', value: "'Courier New', Courier, monospace" },
  { name: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
  { name: 'Impact', value: 'Impact, Haettenschweiler, sans-serif' },
  { name: 'Comic Sans MS', value: "'Comic Sans MS', cursive" },
  { name: 'Palatino', value: "'Palatino Linotype', 'Book Antiqua', serif" },
  { name: 'Lucida', value: "'Lucida Sans Unicode', 'Lucida Grande', sans-serif" }
];
  getBorderProperty(prop: 'width' | 'style' | 'color'): string | number {
    if (!this.selectedComponent?.style.border) {
      return prop === 'width' ? 0 : prop === 'color' ? '#000000' : 'solid';
    }

    const parts = this.selectedComponent.style.border.split(' ');
    switch (prop) {
      case 'width': return parseInt(parts[0]) || 0;
      case 'color': return parts[2] || '#000000';
      default: return parts[1] || 'solid';
    }
  }

  setBorderProperty(prop: 'width' | 'style' | 'color', value: string | number) {
    if (!this.selectedComponent) return;

    const current = this.selectedComponent.style.border || '0 solid #000000';
    let [width, style, color] = current.split(' ');

    switch (prop) {
      case 'width': width = `${value}px`; break;
      case 'color': color = value as string; break;
      case 'style': style = value as string; break;
    }

    const newBorder = `${width || '0'} ${style || 'solid'} ${color || '#000000'}`;
    this.onPropertyChange(newBorder, 'border');
  }
  //------
  onContentChange(newContent: string) {
    if (!this.selectedComponent) return;
  
    this.selectedComponent.content = newContent;
  
    this.serverService.updateComponentProperties(this.roomCode, this.selectedComponent.id, {
      content: newContent
    });
  }
  
}

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-modal.html',
  styleUrl: './alert-modal.css'
})
export class AlertModalComponent {
  
  @Input() isOpen: boolean = false;
  @Input() type: string = '';
  @Input() message: string = '';
  
  @Output() closed = new EventEmitter<void>();

  closeAlert(): void {
    this.closed.emit();
  }
}
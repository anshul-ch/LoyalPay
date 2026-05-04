import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pin-pad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pin-pad.component.html',
  styleUrl: './pin-pad.component.css'
})
export class PinPadComponent implements OnInit, OnDestroy {
  @Input() title = 'Enter PIN';
  @Input() subtitle = 'Enter your 5-digit transaction PIN';
  @Output() confirmed = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  pin = '';
  dots = [0, 1, 2, 3, 4];
  keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
  shake = false;

  ngOnInit() {
    this.pin = '';
  }

  ngOnDestroy() {
    // cleanup — nothing to unsubscribe but keeps lifecycle symmetric
  }

  /** Handle physical keyboard input while the PIN pad is open */
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key >= '0' && event.key <= '9') {
      event.preventDefault();
      this.press(event.key);
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      this.press('del');
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.confirm();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancel();
    }
  }

  press(key: string) {
    if (key === 'del') {
      this.pin = this.pin.slice(0, -1);
      return;
    }
    if (key === '') return;
    if (this.pin.length >= 5) return;
    this.pin += key;
    if (this.pin.length === 5) {
      // Auto-confirm after a short delay so user sees the last dot fill
      setTimeout(() => this.confirm(), 200);
    }
  }

  confirm() {
    if (this.pin.length !== 5) {
      this.triggerShake();
      return;
    }
    const enteredPin = this.pin;
    this.pin = '';
    this.confirmed.emit(enteredPin);
  }

  cancel() {
    this.pin = '';
    this.cancelled.emit();
  }

  triggerShake() {
    this.shake = true;
    setTimeout(() => {
      this.shake = false;
      this.pin = '';
    }, 600);
  }

  clearPin() {
    this.pin = '';
  }
}

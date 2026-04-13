import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AccountLockService {
  private readonly lockedSubject = new BehaviorSubject<boolean>(false);
  private readonly messageSubject = new BehaviorSubject<string>('');

  locked$ = this.lockedSubject.asObservable();
  message$ = this.messageSubject.asObservable();

  lock(message: string): void {
    const finalMessage = message?.trim() || 'Your account has been deactivated. Please contact support.';
    this.messageSubject.next(finalMessage);
    this.lockedSubject.next(true);
  }

  unlock(): void {
    this.lockedSubject.next(false);
    this.messageSubject.next('');
  }

  get isLocked(): boolean {
    return this.lockedSubject.value;
  }

  get message(): string {
    return this.messageSubject.value;
  }
}

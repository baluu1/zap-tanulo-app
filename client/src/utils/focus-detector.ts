// Focus detection utilities for anti-cheat in Pomodoro timer

export interface FocusEvent {
  type: 'blur' | 'focus' | 'idle' | 'active' | 'visible' | 'hidden';
  timestamp: Date;
}

export class FocusDetector {
  private listeners: ((event: FocusEvent) => void)[] = [];
  private lastActivity: Date = new Date();
  private idleThreshold: number = 10000; // 10 seconds
  private idleTimer: NodeJS.Timeout | null = null;
  private isIdle: boolean = false;

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    // Window focus/blur
    window.addEventListener('focus', () => {
      this.emit({ type: 'focus', timestamp: new Date() });
    });

    window.addEventListener('blur', () => {
      this.emit({ type: 'blur', timestamp: new Date() });
    });

    // Page visibility
    document.addEventListener('visibilitychange', () => {
      const type = document.hidden ? 'hidden' : 'visible';
      this.emit({ type, timestamp: new Date() });
    });

    // Activity detection (mouse, keyboard, touch)
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => {
      this.updateActivity();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start idle detection
    this.resetIdleTimer();
  }

  private emit(event: FocusEvent) {
    this.listeners.forEach(listener => listener(event));
  }

  private updateActivity() {
    this.lastActivity = new Date();
    
    if (this.isIdle) {
      this.isIdle = false;
      this.emit({ type: 'active', timestamp: new Date() });
    }

    this.resetIdleTimer();
  }

  private resetIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    this.idleTimer = setTimeout(() => {
      if (!this.isIdle) {
        this.isIdle = true;
        this.emit({ type: 'idle', timestamp: new Date() });
      }
    }, this.idleThreshold);
  }

  public onFocusChange(listener: (event: FocusEvent) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public isCurrentlyFocused(): boolean {
    return !document.hidden && document.hasFocus();
  }

  public getTimeSinceLastActivity(): number {
    return Date.now() - this.lastActivity.getTime();
  }

  public destroy() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
    this.listeners = [];
  }
}

// Singleton instance
export const focusDetector = new FocusDetector();

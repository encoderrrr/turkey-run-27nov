// Gobble Run — keyboard and mouse input. Keys are edge-triggered: a jump
// fires once per press, and holding the key does not keep flapping. Clicks
// work on the menus and also jump while running, so the mouse alone can play.

export class Input {
  constructor(canvas) {
    this.jumpQueued = false;
    this.duckHeld = false;
    this.startQueued = false;
    this.restartQueued = false;
    this.pauseQueued = false;
    this.muteQueued = false;
    this.clickX = 0;
    this.clickY = 0;
    this.clicked = false;

    window.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      const code = event.code;
      if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
        this.jumpQueued = true;
        this.startQueued = true;
        event.preventDefault();
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        this.duckHeld = true;
        event.preventDefault();
      } else if (code === 'Enter') {
        this.startQueued = true;
        this.restartQueued = true;
      } else if (code === 'KeyR') {
        this.restartQueued = true;
      } else if (code === 'KeyP' || code === 'Escape') {
        this.pauseQueued = true;
      } else if (code === 'KeyM') {
        this.muteQueued = true;
      }
    });
    window.addEventListener('keyup', (event) => {
      if (event.code === 'ArrowDown' || event.code === 'KeyS') this.duckHeld = false;
    });
    canvas.addEventListener('pointerdown', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.clickX = (event.clientX - rect.left) * (canvas.width / rect.width);
      this.clickY = (event.clientY - rect.top) * (canvas.height / rect.height);
      this.clicked = true;
      this.startQueued = true;
    });
    // A click during a run is a jump, so touch and mouse can play too.
    canvas.addEventListener('pointerup', () => {
      this.jumpQueued = true;
    });
  }

  consumeJump() {
    const queued = this.jumpQueued;
    this.jumpQueued = false;
    return queued;
  }

  consumeStart() {
    const queued = this.startQueued;
    this.startQueued = false;
    return queued;
  }

  consumeRestart() {
    const queued = this.restartQueued;
    this.restartQueued = false;
    return queued;
  }

  consumePause() {
    const queued = this.pauseQueued;
    this.pauseQueued = false;
    return queued;
  }

  consumeMute() {
    const queued = this.muteQueued;
    this.muteQueued = false;
    return queued;
  }

  consumeClick() {
    const was = this.clicked;
    this.clicked = false;
    return was ? { x: this.clickX, y: this.clickY } : null;
  }
}

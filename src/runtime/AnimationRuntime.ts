export interface AnimationRuntimeOptions {
  speed: () => number;
  reducedMotion: () => boolean;
}

export class AnimationRuntime {
  private animations = new Set<Animation>();
  private generation = 0;
  private paused = false;

  constructor(private readonly options: AnimationRuntimeOptions) {}

  beginRun() {
    this.paused = false;
    this.generation += 1;
    return this.generation;
  }

  isCurrent(token: number) {
    return token === this.generation;
  }

  duration(milliseconds: number) {
    if (this.options.reducedMotion()) {
      return 1;
    }
    return Math.max(1, milliseconds / this.options.speed());
  }

  async animate(
    element: Element,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
  ) {
    const animation = element.animate(keyframes, {
      ...options,
      duration: this.duration(Number(options.duration ?? 1)),
    });
    this.animations.add(animation);
    if (this.paused) {
      animation.pause();
    }
    try {
      await animation.finished;
    } catch {
      // Cancellation is expected when a run resets or its concept unmounts.
    } finally {
      this.animations.delete(animation);
    }
  }

  async delay(milliseconds: number, token: number) {
    if (this.options.reducedMotion()) {
      return;
    }
    const duration = this.duration(milliseconds);
    let elapsed = 0;
    while (elapsed < duration && this.isCurrent(token)) {
      if (this.paused) {
        await new Promise<void>((resolve) => window.setTimeout(resolve, 30));
      } else {
        const slice = Math.min(30, duration - elapsed);
        await new Promise<void>((resolve) => window.setTimeout(resolve, slice));
        elapsed += slice;
      }
    }
  }

  togglePaused() {
    this.paused = !this.paused;
    this.animations.forEach((animation) => (this.paused ? animation.pause() : animation.play()));
    return this.paused;
  }

  finishActiveAnimations() {
    this.animations.forEach((animation) => animation.finish());
  }

  cancel() {
    this.generation += 1;
    this.paused = false;
    this.animations.forEach((animation) => animation.cancel());
    this.animations.clear();
  }

  get isPaused() {
    return this.paused;
  }
}

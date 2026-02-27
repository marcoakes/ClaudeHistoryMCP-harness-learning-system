export class CircuitBreaker {
  private failures = 0;
  private openedAt: number | null = null;
  private threshold: number;
  private cooldownMs: number;

  constructor(threshold = 4, cooldownMs = 60_000) {
    this.threshold = threshold;
    this.cooldownMs = cooldownMs;
  }

  canRun(): boolean {
    if (this.openedAt === null) return true;
    if (Date.now() - this.openedAt > this.cooldownMs) {
      this.openedAt = null;
      this.failures = 0;
      return true;
    }
    return false;
  }

  success(): void {
    this.failures = 0;
    this.openedAt = null;
  }

  fail(): void {
    this.failures += 1;
    if (this.failures >= this.threshold) {
      this.openedAt = Date.now();
    }
  }
}

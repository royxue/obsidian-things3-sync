export function rangeByStep(start: number, end: number, step: number): number[] {
  if (end === start || step === 0) {
      return [start];
  }
  if (step < 0) {
      step = -step;
  }

  const stepNumOfDecimal = step.toString().split(".")[1]?.length || 0;
  const endNumOfDecimal = end.toString().split(".")[1]?.length || 0;
  const maxNumOfDecimal = Math.max(stepNumOfDecimal, endNumOfDecimal);
  const power = Math.pow(10, maxNumOfDecimal);
  const diff = Math.abs(end - start);
  const count = Math.trunc(diff / step + 1);
  step = end - start > 0 ? step : -step;

  const intStart = Math.trunc(start * power);
  return Array.from(Array(count).keys())
      .map(x => {
          const increment = Math.trunc(x * step * power);
          const value = intStart + increment;
          return Math.trunc(value) / power;
      });
}

interface IQueue<T> {
  enqueue(item: T): void;
  dequeue(): T | undefined;
  size(): number;
}

export class Queue<T> implements IQueue<T> {
  private storage: T[] = [];

  constructor(private capacity: number = Infinity) {}

  enqueue(item: T): void {
    if (this.size() === this.capacity) {
      throw Error("Queue has reached max capacity, you cannot add more items");
    }
    this.storage.push(item);
  }
  dequeue(): T | undefined {
    return this.storage.shift();
  }
  size(): number {
    return this.storage.length;
  }
}
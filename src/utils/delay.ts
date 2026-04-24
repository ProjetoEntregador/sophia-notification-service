export function delay(min: number, max?: number) {
  const time = max ? Math.random() * (max - min) + min : min;

  return new Promise((resolve) => setTimeout(resolve, time));
}

export type TransactionExecutor = unknown;

export abstract class TransactionRunner {
  abstract run<T>(
    fn: (executor: TransactionExecutor) => Promise<T>,
  ): Promise<T>;
}

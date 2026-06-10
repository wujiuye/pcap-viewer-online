export type BridgeInitializationResult = {
  success: boolean;
  error?: string;
  columns?: any[];
};

export class Bridge {
  private worker: Worker | null = null;
  private callbacks: Map<string, (val: any) => void> = new Map();
  private activeRequests: Map<string, any> = new Map();
  private initializationResult: BridgeInitializationResult | null = null;
  private onProgress: ((msg: string | null) => void) | null = null;
  private onInit: (() => void) | null = null;

  get initialized() {
    return this.initializationResult?.success ?? false;
  }

  get initializationError() {
    return this.initializationResult?.error ?? "Unknown";
  }

  get columns() {
    return this.initializationResult?.columns ?? [];
  }

  get activeRequest() {
    return this.activeRequests.values().next().value ?? null;
  }

  initialize(onProgress?: (msg: string | null) => void, onInit?: () => void) {
    this.onProgress = onProgress ?? null;
    this.onInit = onInit ?? null;
    this.worker = new Worker(new URL("/worker.js", window.location.origin));
    this.worker.addEventListener("message", (e) => this.processMessage(e));
  }

  deinitialize() {
    this.worker?.terminate();
    this.initializationResult = null;
  }

  private processMessage({ data }: MessageEvent) {
    if (data.type === "progress") {
      this.onProgress?.(data.message);
      return;
    }

    const req = this.activeRequests.get(data.id);
    if (req) {
      this.activeRequests.delete(data.id);
    }

    if (data.type === "init") {
      this.initializationResult = data;
      this.onInit?.();
    }

    this.callbacks.get(data.id)?.(data);
    this.callbacks.delete(data.id);
  }

  private postMessage(data: any): Promise<any> {
    data.id = crypto.randomUUID();
    const req = { timestamp: Date.now(), type: data.type };
    this.activeRequests.set(data.id, req);
    const promise = new Promise((resolve) => this.callbacks.set(data.id, resolve));
    this.worker?.postMessage(data);
    return promise;
  }

  async getFrame(number: number) {
    const { frame } = await this.postMessage({ type: "frame", number });
    return frame;
  }

  async getFrames(filter: string, skip: number, limit: number) {
    const { frames } = await this.postMessage({
      type: "frames",
      filter,
      skip,
      limit,
    });
    return frames;
  }

  async findFrame(params: any) {
    const { result } = await this.postMessage({ type: "find", params });
    return result;
  }

  async checkFilter(filter: string) {
    const { result } = await this.postMessage({ type: "check-filter", filter });
    return result;
  }

  async createSession(file: File) {
    const { result } = await this.postMessage({ type: "open", file });
    return result;
  }

  async closeSession() {
    await this.postMessage({ type: "close" });
  }
}

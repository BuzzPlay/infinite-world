declare module 'tmi.js' {
  export interface TmiClient {
    on(
      event: 'message',
      listener: (
        channel: string,
        tags: Record<string, string | undefined>,
        message: string,
        self: boolean,
      ) => void,
    ): void;
    connect(): Promise<[string, string]>;
    disconnect(): Promise<void>;
  }

  interface TmiStatic {
    Client(options: {
      channels: string[];
      identity?: { username: string; password: string };
    }): TmiClient;
  }

  const tmi: TmiStatic;
  export default tmi;
}

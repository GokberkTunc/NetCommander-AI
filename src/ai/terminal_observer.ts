import { EventEmitter } from 'events';

export class TerminalObserver extends EventEmitter {
  private static instance: TerminalObserver;
  private buffer: string[] = [];
  private maxLines: number = 150;
  private currentLine: string = '';

  private constructor() {
    super();
  }

  public static getInstance(): TerminalObserver {
    if (!TerminalObserver.instance) {
      TerminalObserver.instance = new TerminalObserver();
    }
    return TerminalObserver.instance;
  }

  /**
   * Strip ANSI escape codes from raw terminal stream
   */
  public static stripAnsi(str: string): string {
    return str
      // eslint-disable-next-line no-control-regex
      .replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
      .replace(/\r/g, '');
  }

  /**
   * Feed raw terminal chunk from SSH or Telnet
   */
  public feedChunk(rawChunk: string): void {
    const clean = TerminalObserver.stripAnsi(rawChunk);
    const lines = clean.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (i === 0) {
        this.currentLine += lines[i];
      } else {
        if (this.currentLine.trim().length > 0) {
          this.buffer.push(this.currentLine);
          if (this.buffer.length > this.maxLines) {
            this.buffer.shift();
          }
        }
        this.currentLine = lines[i];
      }
    }
  }

  /**
   * Get formatted terminal output window
   */
  public getTerminalContext(linesCount: number = 60): string {
    const combined = [...this.buffer];
    if (this.currentLine.trim().length > 0) {
      combined.push(this.currentLine);
    }
    return combined.slice(-linesCount).join('\n');
  }

  public clear(): void {
    this.buffer = [];
    this.currentLine = '';
  }
}

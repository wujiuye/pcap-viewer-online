export const isNullish = (val: any) => val === null || val === undefined;

export const clamp = (min: number, val: number, max: number) =>
  Math.max(min, Math.min(val, max));

export class Base64 {
  static decode(encoded: string): Uint8Array {
    try {
      // @ts-ignore
      if (typeof Uint8Array.fromBase64 === 'function') {
        // @ts-ignore
        return Uint8Array.fromBase64(encoded);
      }
      throw new Error("No fromBase64");
    } catch {
      const bString = atob(encoded);
      const arr = new Uint8Array(bString.length);
      for (let i = 0; i < bString.length; i++) {
        arr[i] = bString.charCodeAt(i);
      }
      return arr;
    }
  }
}

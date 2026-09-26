import * as crypto from 'crypto';

export function sha256(data: string | object): string {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(str).digest('hex');
}

export function computeHashNode(previousHash: string, payload: any, resourceId: string): string {
  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHash('sha256').update(previousHash + payloadStr + resourceId).digest('hex');
}

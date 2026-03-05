import type { IoiSemanticEvent, IoiSemanticEventType } from '../../types';

export function createSemanticEvent<TPayload>(
  type: IoiSemanticEventType,
  payload: TPayload,
  schemaVersion: 1
): IoiSemanticEvent<TPayload> {
  return {
    type,
    payload,
    schemaVersion,
    timestamp: new Date().toISOString()
  };
}

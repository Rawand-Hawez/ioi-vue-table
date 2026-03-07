/**
 * Group expansion management module for IOI Table.
 * Handles group expand/collapse operations.
 */

import type { ComputedRef, Ref } from 'vue';
import type { IoiGroupExpandPayload, IoiSemanticEvent, IoiSemanticEventType, IoiTableState } from '../../types';
import type { GroupInfo } from './grouping';

/**
 * Group expansion API returned to the composable.
 */
export interface GroupExpansionApi {
  toggleGroupExpansion: (groupKey: string) => void;
  expandAllGroups: () => void;
  collapseAllGroups: () => void;
  isGroupExpanded: (groupKey: string) => boolean;
}

/**
 * Options for group expansion module.
 */
export interface GroupExpansionOptions {
  onGroupExpand?: (payload: IoiGroupExpandPayload) => void;
}

/**
 * Event emitter function type.
 */
type EventEmitter = <TPayload>(
  type: IoiSemanticEventType,
  payload: TPayload
) => IoiSemanticEvent<TPayload>;

/**
 * Creates group expansion management functions.
 */
export function createGroupExpansion(
  state: Ref<IoiTableState>,
  groups: ComputedRef<GroupInfo[]>,
  options: GroupExpansionOptions,
  emitEvent: EventEmitter
): GroupExpansionApi {
  function toggleGroupExpansion(groupKey: string): void {
    const currentKeys = state.value.expandedGroupKeys;
    const keySet = new Set(currentKeys);
    const wasExpanded = keySet.has(groupKey);

    if (wasExpanded) {
      keySet.delete(groupKey);
    } else {
      keySet.add(groupKey);
    }

    state.value = {
      ...state.value,
      expandedGroupKeys: Array.from(keySet)
    };

    const group = groups.value.find((g) => g.key === groupKey);
    if (group) {
      const payload: IoiGroupExpandPayload = {
        groupKey,
        groupValue: group.value,
        expanded: !wasExpanded,
        rowCount: group.indices.length
      };

      options.onGroupExpand?.(payload);

      emitEvent('data:explore', {
        reason: 'groupExpansion',
        groupKey,
        expanded: !wasExpanded
      });
    }
  }

  function expandAllGroups(): void {
    const allGroupKeys = groups.value.map((g) => g.key);

    state.value = {
      ...state.value,
      expandedGroupKeys: allGroupKeys
    };

    emitEvent('data:explore', {
      reason: 'expandAllGroups',
      count: allGroupKeys.length
    });
  }

  function collapseAllGroups(): void {
    state.value = {
      ...state.value,
      expandedGroupKeys: []
    };

    emitEvent('data:explore', {
      reason: 'collapseAllGroups',
      count: 0
    });
  }

  function isGroupExpanded(groupKey: string): boolean {
    return state.value.expandedGroupKeys.includes(groupKey);
  }

  return {
    toggleGroupExpansion,
    expandAllGroups,
    collapseAllGroups,
    isGroupExpanded
  };
}

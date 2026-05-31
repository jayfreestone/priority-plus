export interface PriorityPlusBrowserItem {
  href: string;
  label: string;
}

export const priorityPlusBrowserItems: readonly PriorityPlusBrowserItem[];
export const priorityPlusBrowserStyles: string;
export function installPriorityPlusBrowserStyles(): void;
export function testPriorityPlusBrowserBehavior(
  mount: () => void | Promise<void>,
): void;

import React from 'react';
import { render } from 'ink';
import { ReviewCanvas } from './review/review';
import type { CanvasOptions } from './review/types';

export async function renderCanvas(
  kind: string,
  filePath: string,
  options?: CanvasOptions
): Promise<void> {
  if (kind !== 'review') {
    throw new Error(`Unknown canvas kind: ${kind}`);
  }

  return new Promise((resolve) => {
    const { unmount, waitUntilExit } = render(
      <ReviewCanvas
        filePath={filePath}
        options={options}
        onExit={() => {
          unmount();
          resolve();
        }}
      />,
      { incrementalRendering: true }
    );

    waitUntilExit().then(resolve);
  });
}

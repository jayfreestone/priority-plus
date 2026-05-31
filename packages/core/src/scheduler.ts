export interface PriorityPlusScheduleOptions {
  refreshMeasurements?: boolean;
}

export interface PriorityPlusFrameScheduler {
  cancel: () => void;
  schedule: (options?: PriorityPlusScheduleOptions) => void;
}

type FrameCallback = (time: number) => void;
type RequestFrame = (callback: FrameCallback) => number;
type CancelFrame = (handle: number) => void;

export function createPriorityPlusFrameScheduler(
  callback: (options: Required<PriorityPlusScheduleOptions>) => void,
  {
    cancelFrame = getCancelFrame(),
    requestFrame = getRequestFrame(),
  }: {
    cancelFrame?: CancelFrame;
    requestFrame?: RequestFrame;
  } = {},
): PriorityPlusFrameScheduler {
  let frame: number | undefined;
  let refreshMeasurements = false;

  return {
    cancel() {
      if (frame !== undefined) {
        cancelFrame(frame);
      }

      frame = undefined;
      refreshMeasurements = false;
    },
    schedule(options = {}) {
      refreshMeasurements ||=
        options.refreshMeasurements === true;

      if (frame !== undefined) return;

      frame = requestFrame(() => {
        const shouldRefreshMeasurements = refreshMeasurements;
        frame = undefined;
        refreshMeasurements = false;

        callback({ refreshMeasurements: shouldRefreshMeasurements });
      });
    },
  };
}

function getRequestFrame(): RequestFrame {
  if (typeof requestAnimationFrame === "function") {
    return requestAnimationFrame;
  }

  return (callback) => {
    return setTimeout(() => callback(Date.now()), 0);
  };
}

function getCancelFrame(): CancelFrame {
  if (typeof cancelAnimationFrame === "function") {
    return cancelAnimationFrame;
  }

  return clearTimeout;
}

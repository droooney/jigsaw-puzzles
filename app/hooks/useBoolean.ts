import { useCallback, useState } from 'react';

interface HookReturnValue {
  value: boolean;
  setValue(value: boolean): void;
  toggle(): void;
  setTrue(): void;
  setFalse(): void;
}

export function useBoolean(init: boolean): HookReturnValue {
  const [value, setValue] = useState(init);

  return {
    value,
    setValue,
    toggle: useCallback(() => setValue((stateValue) => !stateValue), []),
    setTrue: useCallback(() => setValue(true), []),
    setFalse: useCallback(() => setValue(false), []),
  };
}

import React, { useRef, useState, useEffect } from 'react';
import { Text, useInput } from 'ink';

interface FastTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  showCursor?: boolean;
}

export function FastTextInput({
  value,
  onChange,
  onSubmit,
  placeholder = '',
  showCursor = true,
}: FastTextInputProps) {
  const bufferRef = useRef(value);
  const cursorRef = useRef(value.length);
  const [, setTick] = useState(0);
  const lastSyncedRef = useRef(value);

  useEffect(() => {
    if (value !== lastSyncedRef.current) {
      bufferRef.current = value;
      cursorRef.current = value.length;
      lastSyncedRef.current = value;
    }
  }, [value]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (bufferRef.current !== lastSyncedRef.current) {
        lastSyncedRef.current = bufferRef.current;
        onChange(bufferRef.current);
        setTick(t => t + 1);
      }
    }, 33);
    return () => clearInterval(interval);
  }, [onChange]);

  useInput((input, key) => {
    if (key.return) {
      onSubmit?.(bufferRef.current);
      return;
    }

    if (key.backspace || key.delete) {
      if (cursorRef.current > 0) {
        const before = bufferRef.current.slice(0, cursorRef.current - 1);
        const after = bufferRef.current.slice(cursorRef.current);
        bufferRef.current = before + after;
        cursorRef.current--;
      }
      return;
    }

    if (key.leftArrow) {
      cursorRef.current = Math.max(0, cursorRef.current - 1);
      setTick(t => t + 1);
      return;
    }

    if (key.rightArrow) {
      cursorRef.current = Math.min(bufferRef.current.length, cursorRef.current + 1);
      setTick(t => t + 1);
      return;
    }

    if (input && !key.ctrl && !key.meta) {
      const before = bufferRef.current.slice(0, cursorRef.current);
      const after = bufferRef.current.slice(cursorRef.current);
      bufferRef.current = before + input + after;
      cursorRef.current += input.length;
    }
  });

  const displayValue = bufferRef.current;
  const cursor = cursorRef.current;

  if (displayValue.length === 0 && placeholder) {
    return (
      <Text>
        {showCursor && <Text inverse> </Text>}
        <Text dimColor>{placeholder}</Text>
      </Text>
    );
  }

  const beforeCursor = displayValue.slice(0, cursor);
  const atCursor = displayValue[cursor] ?? ' ';
  const afterCursor = displayValue.slice(cursor + 1);

  return (
    <Text>
      {beforeCursor}
      {showCursor ? <Text inverse>{atCursor}</Text> : atCursor}
      {afterCursor}
    </Text>
  );
}

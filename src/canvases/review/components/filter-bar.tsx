import React from 'react';
import { Box, Text } from 'ink';
import type { CommentFilter } from '../types';
import { FILTER_OPTIONS } from '../constants';

interface FilterBarProps {
  currentFilter: CommentFilter;
  onFilterChange: (filter: CommentFilter) => void;
}

export function FilterBar({ currentFilter }: FilterBarProps) {
  return (
    <Box paddingX={1} marginBottom={1}>
      <Text dimColor>Filter: </Text>
      {FILTER_OPTIONS.map((opt, i) => (
        <React.Fragment key={opt.value}>
          {i > 0 && <Text dimColor> </Text>}
          <Text
            color={currentFilter === opt.value ? 'cyan' : undefined}
            inverse={currentFilter === opt.value}
          >
            [{opt.key}]{opt.label}
          </Text>
        </React.Fragment>
      ))}
    </Box>
  );
}

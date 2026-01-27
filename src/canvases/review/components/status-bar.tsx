import React from 'react';
import { Box, Text } from 'ink';
import type { CommentFilter } from '../types';

interface StatusBarProps {
  fileName: string;
  filter: CommentFilter;
  totalComments: number;
  unresolvedCount: number;
  copied?: boolean;
}

export function StatusBar({
  fileName,
  filter,
  totalComments,
  unresolvedCount,
  copied,
}: StatusBarProps) {
  const filterLabel = filter === 'all' ? 'All' : filter === 'unresolved' ? 'Unresolved' : filter;

  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1}>
      <Box flexGrow={1}>
        <Text bold>LGTuiM: </Text>
        <Text>{fileName}</Text>
      </Box>
      <Box>
        <Text dimColor>[{filterLabel} \u25BE] </Text>
        <Text>{totalComments} comments</Text>
        <Text dimColor> | </Text>
        <Text color={unresolvedCount > 0 ? 'yellow' : 'green'}>
          {unresolvedCount} unresolved
        </Text>
        {copied && (
          <>
            <Text dimColor> | </Text>
            <Text color="green">Copied!</Text>
          </>
        )}
      </Box>
    </Box>
  );
}

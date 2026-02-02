import React from 'react';
import { Box, Text } from 'ink';

export function HelpOverlay() {
  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="yellow"
      padding={2}
    >
      <Box marginBottom={1}>
        <Text bold color="yellow">Keyboard Shortcuts</Text>
      </Box>

      <Box flexDirection="row" marginBottom={1}>
        <Box flexDirection="column" marginRight={4}>
          <Text bold color="cyan">Document</Text>
          <Text><Text color="green">j/↓</Text>  Scroll down</Text>
          <Text><Text color="green">k/↑</Text>  Scroll up</Text>
          <Text><Text color="green">g</Text>    Go to top</Text>
          <Text><Text color="green">G</Text>    Go to bottom</Text>
          <Text><Text color="green">c</Text>    Add comment</Text>
          <Text><Text color="green">Tab</Text>  Switch panel</Text>
        </Box>

        <Box flexDirection="column">
          <Text bold color="cyan">Comments</Text>
          <Text><Text color="green">j/↓</Text>  Next comment</Text>
          <Text><Text color="green">k/↑</Text>  Previous comment</Text>
          <Text><Text color="green">e</Text>    Edit comment</Text>
          <Text><Text color="green">d</Text>    Delete comment</Text>
          <Text><Text color="green">r</Text>    Toggle resolved</Text>
          <Text><Text color="green">Enter</Text> Jump to line</Text>
        </Box>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="cyan">Global</Text>
        <Text><Text color="green">v</Text>      Summary view</Text>
        <Text><Text color="green">y</Text>      Copy to clipboard</Text>
        <Text><Text color="green">E</Text>      Export to file</Text>
        <Text><Text color="green">s</Text>      Save session</Text>
        <Text><Text color="green">?</Text>      Toggle help</Text>
        <Text><Text color="green">q/Esc</Text>  Quit</Text>
      </Box>

      <Text dimColor>Press any key to close</Text>
    </Box>
  );
}

import React from 'react';
import { Box, Text } from 'ink';

interface HelpOverlayProps {
  onClose: () => void;
}

export function HelpOverlay({ onClose }: HelpOverlayProps) {
  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="yellow"
      padding={2}
    >
      <Box marginBottom={1}>
        <Text bold color="yellow">LGTuiM Keyboard Shortcuts</Text>
      </Box>

      <Box flexDirection="row" marginBottom={1}>
        <Box flexDirection="column" marginRight={4}>
          <Text bold color="cyan">Document Focus</Text>
          <Text><Text color="green">j/\u2193</Text>  Scroll down</Text>
          <Text><Text color="green">k/\u2191</Text>  Scroll up</Text>
          <Text><Text color="green">g</Text>    Go to top</Text>
          <Text><Text color="green">G</Text>    Go to bottom</Text>
          <Text><Text color="green">c</Text>    Add comment</Text>
          <Text><Text color="green">Tab</Text>  Switch panel</Text>
        </Box>

        <Box flexDirection="column">
          <Text bold color="cyan">Comment Panel</Text>
          <Text><Text color="green">j/\u2193</Text>  Next comment</Text>
          <Text><Text color="green">k/\u2191</Text>  Previous comment</Text>
          <Text><Text color="green">e</Text>    Edit comment</Text>
          <Text><Text color="green">d</Text>    Delete comment</Text>
          <Text><Text color="green">r</Text>    Toggle resolved</Text>
          <Text><Text color="green">Enter</Text> Jump to line</Text>
        </Box>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="cyan">Global</Text>
        <Text><Text color="green">f</Text>      Cycle filter</Text>
        <Text><Text color="green">0-6</Text>    Quick filter (0=all, 1-6=type)</Text>
        <Text><Text color="green">v</Text>      Toggle summary view</Text>
        <Text><Text color="green">y</Text>      Copy to clipboard</Text>
        <Text><Text color="green">s</Text>      Save session</Text>
        <Text><Text color="green">?</Text>      Toggle help</Text>
        <Text><Text color="green">q/Esc</Text>  Quit</Text>
      </Box>

      <Box flexDirection="column">
        <Text bold color="cyan">Comment Types</Text>
        <Text><Text color="red">1</Text> Blocker  <Text color="yellow">2</Text> Concern  <Text color="blue">3</Text> Question</Text>
        <Text><Text color="magenta">4</Text> Suggest  <Text color="green">5</Text> Praise   <Text color="cyan">6</Text> Acknowledge</Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Press any key to close</Text>
      </Box>
    </Box>
  );
}

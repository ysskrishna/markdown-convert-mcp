export type ToolTextResult = {
  content: [{ type: 'text'; text: string }];
  isError?: true;
};

export function okText(text: string): ToolTextResult {
  return { content: [{ type: 'text', text }] };
}

export function errorText(message: string): ToolTextResult {
  return { content: [{ type: 'text', text: message }], isError: true };
}

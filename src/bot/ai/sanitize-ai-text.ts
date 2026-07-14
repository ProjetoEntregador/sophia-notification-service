export function sanitizeAiText(text?: string): string {
  if (!text) return '';

  let out = text;

  out = out.replace(/<function[^>]*>[\s\S]*?<\/function>/gi, ' ');
  out = out.replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, ' ');

  out = out.replace(/<function[^>]*>\s*(\{[\s\S]*?\}|\([\s\S]*?\))?/gi, ' ');
  out = out.replace(/<\/?(?:function|tool_call)\b[^>]*>?/gi, ' ');

  out = out.replace(
    /```(?:json|tool_code)?\s*\{[\s\S]*?"(?:name|function)"[\s\S]*?\}\s*```/gi,
    ' ',
  );

  out = out.replace(
    /\{\s*"(?:name|function)"\s*:\s*"[^"]+"\s*,\s*"(?:arguments|parameters|args)"\s*:\s*\{[\s\S]*?\}\s*\}/gi,
    ' ',
  );

  out = out
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  return out;
}

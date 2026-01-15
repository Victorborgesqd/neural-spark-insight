export interface GeneratedFile {
  filename: string;
  type: 'code' | 'text' | 'markdown';
  description: string;
  content: string;
}

export interface ParsedMessage {
  text: string;
  files: GeneratedFile[];
}

export function parseGeneratedFiles(content: string): ParsedMessage {
  const files: GeneratedFile[] = [];
  let text = content;
  
  // Match the special file format
  const fileRegex = /```:::GENERATED_FILE:::\s*\n([\s\S]*?)\n```:::END_FILE:::/g;
  
  let match;
  while ((match = fileRegex.exec(content)) !== null) {
    try {
      const jsonStr = match[1].trim();
      const parsed = JSON.parse(jsonStr);
      
      if (parsed.filename && parsed.content) {
        files.push({
          filename: parsed.filename,
          type: parsed.type || 'text',
          description: parsed.description || '',
          content: parsed.content
        });
      }
    } catch (e) {
      console.error('Failed to parse generated file:', e);
    }
    
    // Remove the file block from text
    text = text.replace(match[0], '');
  }
  
  // Clean up extra newlines
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  
  return { text, files };
}

export function downloadFile(file: GeneratedFile) {
  const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

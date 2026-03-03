export function generateDocumentNumber(prefix: string, nextNumber: string): string {
  return `${prefix}${nextNumber}`;
}

export function incrementNumber(current: string): string {
  const num = parseInt(current, 10);
  return String(num + 1);
}

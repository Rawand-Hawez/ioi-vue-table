export function resolveValidationMessage(validationResult: unknown): string {
  return typeof validationResult === 'string' && validationResult.length > 0
    ? validationResult
    : 'Invalid value';
}

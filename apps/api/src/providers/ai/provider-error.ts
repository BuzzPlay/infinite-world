type ProviderError = {
  message?: unknown;
  status?: unknown;
  statusCode?: unknown;
  body?: unknown;
  responseBody?: unknown;
};

/** Turns provider errors into a short, actionable message without exposing credentials. */
export function providerErrorMessage(stage: string, error: unknown) {
  const providerError = asProviderError(error);
  const status = numberValue(providerError?.status) ?? numberValue(providerError?.statusCode);
  const detail = errorDetail(providerError?.body ?? providerError?.responseBody);
  const fallback = error instanceof Error && error.message ? error.message : 'unknown provider error';
  const suffix = detail || fallback;
  return `${stage}${status ? ` (${status})` : ''}: ${suffix}`;
}

function asProviderError(error: unknown): ProviderError | null {
  return error && typeof error === 'object' ? (error as ProviderError) : null;
}

function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function errorDetail(value: unknown): string | null {
  const body = parseBody(value);
  if (!body || typeof body !== 'object') return typeof body === 'string' ? body : null;

  const record = body as Record<string, unknown>;
  if (typeof record.message === 'string') return record.message;
  if (typeof record.error === 'string') return record.error;
  if (!Array.isArray(record.detail)) return typeof record.detail === 'string' ? record.detail : null;

  const details = record.detail
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const issue = item as { loc?: unknown; msg?: unknown };
      if (typeof issue.msg !== 'string') return null;
      const field = Array.isArray(issue.loc)
        ? issue.loc.filter((part) => typeof part === 'string').join('.')
        : '';
      return field ? `${field}: ${issue.msg}` : issue.msg;
    })
    .filter((detail): detail is string => Boolean(detail));
  return details.length ? details.join('; ') : null;
}

function parseBody(value: unknown) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

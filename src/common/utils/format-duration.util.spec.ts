import { formatDuration } from './format-duration.util';

describe('formatDuration', () => {
  it('should format day correctly', () => {
    const result = formatDuration('10d', 'KR');
    expect(result).toBe('10일');
  });

  it('should format hour correctly', () => {
    const result = formatDuration('5h', 'KR');
    expect(result).toBe('5시');
  });

  it('should format minute correctly', () => {
    const result = formatDuration('30m', 'KR');
    expect(result).toBe('30분');
  });

  it('should format second correctly', () => {
    const result = formatDuration('45s', 'KR');
    expect(result).toBe('45초');
  });
});

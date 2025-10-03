export function formatDuration(
  durationString: string,
  countryCode: CountryCode,
) {
  const time = durationString.slice(0, -1);
  const string = durationString.slice(-1);
  const convertedString = stringTo[countryCode][string];

  return time + convertedString;
}

const stringTo = { KR: { d: '일', h: '시', m: '분', s: '초' } };

type CountryCode = 'KR';

export const genId = (length = 16): string => {
  const p = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return [...Array(length)].reduce(
    (a) => a + p[Math.floor(Math.random() * p.length)],
    '',
  );
};

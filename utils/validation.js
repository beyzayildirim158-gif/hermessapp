// Turkish national identity (T.C. Kimlik) validation helper
// Rules:
// - 11 digits
// - First digit cannot be 0
// - 10th digit: ((sum of 1st,3rd,5th,7th,9th)*7 - (sum of 2nd,4th,6th,8th)) mod 10
// - 11th digit: (sum of first 10 digits) mod 10
export function isValidTCKN(value) {
  if (!/^[0-9]{11}$/.test(value)) return false;
  if (value[0] === '0') return false;
  const digits = value.split('').map(d => parseInt(d,10));
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const d10 = ((oddSum * 7) - evenSum) % 10;
  if (d10 !== digits[9]) return false;
  const d11 = (digits.slice(0,10).reduce((a,b)=>a+b,0)) % 10;
  if (d11 !== digits[10]) return false;
  return true;
}

export function isEmail(str){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

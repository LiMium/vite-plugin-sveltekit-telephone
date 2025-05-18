let result = 0

export async function add(x: number) {
  result += x;
  return result;
}

export async function multiply(x: number) {
  result *= x;
  return result;
}
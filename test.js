function toPip(points, digits) {
  let factor = 0;

  if (digits <= 3) {
    factor = 0.01
  } else if (digits >= 4) {
    factor = 0.0001;
  }

  return Math.round(points / factor);
}

console.log(toPip(0.005, 3))
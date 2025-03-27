// converts nano-second timestamps to Date object by means of milliseconds
// NOTE: This has the potential to lose precision, but not in any significant way.
export const nanoToDate = (nano: BigInt): Date => {
	const milli = Number(nano) / 1000000;
	return new Date(milli);
}

// prints the date in a usable format
export const prettyPrintDate = (date: Date): string => {
	return `${date.toDateString()} ${date.toTimeString().split(' ')[0]}`;
}

// determines if value is within X standard deviations of mean
export const isValueWithinRange = (value: number, mean: number, stDev: number, threshold_stDev: number) => {
	const lower_bound = mean - (stDev * threshold_stDev);
	const upper_bound = mean + (stDev * threshold_stDev);

	return value >= lower_bound && value <= upper_bound;
}

// finds mean of data set
export const findMean = (values: number[]): number => (values.reduce((a, b) => a + b)) / values.length;

// finds standard deviation of data set
export const findStDev = (values: number[], mean: number): number => {
	return Math.sqrt(
		values.map(x => Math.pow(x - mean, 2))
		.reduce((a, b) => a + b) / values.length
	);
}
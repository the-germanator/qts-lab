import log4js from 'log4js'

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

// raises alarm to console.
export const raiseAlarm = (sensorName: string, alarmRanges: Date[][]) => {
	const logger = log4js.getLogger();

	if(alarmRanges.length === 0) return;

	let ranges = '';
	alarmRanges.forEach(range => {
		let delta: number = (range[1].getTime()- range[0].getTime()) / 1000; // in seconds
		let deltaHrs = Math.floor(delta / 3600);
		let deltaMin = Math.floor((delta - deltaHrs * 3600) / 60);
		let deltaSec = Math.floor((delta - deltaHrs * 3600 - deltaMin * 60) / 60);


		let startPretty = prettyPrintDate(range[0]);
		let endPretty = prettyPrintDate(range[1]);

		ranges += `\n\t - ${startPretty} --> ${endPretty} (${deltaHrs.toString().padStart(2, '0')}:${deltaMin.toString().padStart(2, '0')}:${deltaSec.toString().padStart(2, '0')})`
	});

	/**
	 * TODO: Add API call to Pagerduty, Slack/Teams/Discord, Twillio or AWS-specific alerting API call here
	 */
	logger.error(`${sensorName} was in alarm state ${alarmRanges.length} times during the following intervals: ${ranges}`)
}
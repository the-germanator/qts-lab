export const findMean = (values): number => {
	return (values
		.map(elem => elem.value)
		.reduce((a, b) => a + b)
	) / values.length;
}

export const findStDev = (values, mean): number => {
	return Math.sqrt(
		values
		.map(elem => elem.value)
		.map(x => Math.pow(x - mean, 2))
		.reduce((a, b) => a + b) / values.length
	);
}


export const isValueInRange = (value: number, mean: number, stDev: number, THRESHOLD_ST_DEV): boolean => {
	return value > mean - (stDev * THRESHOLD_ST_DEV)
	&& value < mean + (stDev * THRESHOLD_ST_DEV);
}

export const handleAlert = (values, sensor, beginSequence, ptr, mean, stDev): void => {
	let outputString = ''
	for(let i = 0; i < (ptr - beginSequence); i++) {
		outputString += `${values[beginSequence + i].value},`
	}
	console.log(`[${new Date(parseInt(values[beginSequence].time) / 1000000)} - ${new Date(parseInt(values[ptr].time) / 1000000)}] ${ptr - beginSequence} Outliers found in SAT '${sensor}'. Temperatures [${outputString}] are outside the safe range (${mean} +- ${stDev})`);
}
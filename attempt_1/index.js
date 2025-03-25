import parquetjs from '@dsnp/parquetjs';

let reader = await parquetjs.ParquetReader.openFile('../lab.parquet');

// only read columns we care about
let cursor = reader.getCursor(['time', 'TagName', 'max']);

// CONSTANTS
const THRESHOLD_ST_DEV = 3;
const OUTLIERS_PER_HOUR_TRIGGER = 5;
const NANO_PER_HOUR = 3600000000000;

// will hold records relating to air supply. Grouped by sensor
// with value as an of array of objects with time and value
const airSupplyRecords = {};

let record = null;
// loop through dataset
while (record = await cursor.next()) {
	
	// only store air supply data that's not null
	if(record.TagName.endsWith('.SAT') && record.max && record.time) {

		// check if value belongs to an existing sensor. 
		// Either create new entry or push sensor data to array
		const newTempRecord = { time: record.time, value: record.max }
		if(Object.keys(airSupplyRecords).includes(record.TagName)) {
			airSupplyRecords[record.TagName].push(newTempRecord);
		} else {
			airSupplyRecords[record.TagName] = [newTempRecord];
		}
	}
}

let errors = []

// sort values by their timestamps and calculate mean & st. dev.
for(const [sensor, values] of Object.entries(airSupplyRecords)) {



	values.sort((a,b) => {
		return a.time > b.time ? 1 : -1;
	});

	let mean = (values
		.map(elem => elem.value)
		.reduce((a, b) => a + b)
	) / values.length

	let stDev = Math.sqrt(
		values
		.map(elem => elem.value)
		.map(x => Math.pow(x - mean, 2))
		.reduce((a, b) => a + b) / values.length
	)

	airSupplyRecords[sensor].mean = mean;
	airSupplyRecords[sensor].stDev = stDev;

	// since we need OUTLIERS_PER_HOUR_TRIGGER in a row,
	// the last element that we could start on is length - OUTLIERS_PER_HOUR_TRIGGER
	let ptr = 0;
	let beginSequence = 0;
	while(ptr < values.length - OUTLIERS_PER_HOUR_TRIGGER) {
		
		let timeStamp = values[ptr].time
		let value = values[ptr].value

		// if current value is not an error, reset everything
		if(value > mean - (stDev * THRESHOLD_ST_DEV) && value < mean + (stDev * THRESHOLD_ST_DEV)) {
			// check if we just ended an error streak
			if(ptr - beginSequence >= 5) {
				let outputString = ''
				for(let i = 0; i < (ptr - beginSequence); i++) {
					outputString += `${values[beginSequence + i].value},`
				}
				console.log(`[${new Date(parseInt(values[beginSequence].time) / 1000000)} - ${new Date(parseInt(values[ptr].time) / 1000000)}] ${ptr - beginSequence} Outliers found in SAT '${sensor}'. Temperatures [${outputString}] are outside the safe range (${mean} +- ${stDev})`);
			}
			ptr++;
			beginSequence = ptr;
		} else {
			// we're looking at an error.
			// if this is the first instance, set the beginning sequence index
			if(beginSequence >= ptr) {
				// beginnning
				beginSequence = ptr;
				ptr++;
			} else {
				// in the middle
				if(parseInt(timeStamp - values[beginSequence].time) < NANO_PER_HOUR) {
					// we're still in hour range.
					// check if we've hit 5
					if(ptr - beginSequence >= 5) {
						ptr++;
					} else {
						ptr++;
					}
				} else {
					// we're out of range. Move beginning up one.
					beginSequence++;
					ptr++;
				}
			}
			
		}
	}
	




}



// search for error condition
// error format = { sensor: 'sensor_name', begin: timestamp, end: timestamp, values: [] }









// At this point we have a data structure that looks like this:
//{ 'QTS_LAB_CRAC_MG1102_21.SAT': [
//    { time: 1742820090000000000n, value: null },
// ]
// }









// /**
//  * Configure data structure to hold records where key = sensor, value = array of objects, each with timestamp and value
//  * example: { sensor_1: [ { time: 123, temp: 456 }, { time: 789, temp: 012 } ] }
//  */

// let tempReadings = {}


// // loop through records from parquet file
// while (record = await cursor.next()) {
// 	// strip down object to what we actually care about
// 	const cleanedData = {
// 		device_name: record.TagName,
// 		time: record.time,
// 		max: record.max
// 	}
// 	if(Object.keys(tempReadings).includes(cleanedData.device_name)) {
// 		tempReadings[cleanedData.device_name].push({ time: cleanedData.time, max: cleanedData.max })
// 	} else {
// 		tempReadings[cleanedData.device_name] = [{ time: cleanedData.time, max: cleanedData.max }]
// 	}
// }

// // for each sensor, determine the mean and standard deviation. 
// let statistics = {}
// for(const [sensor, values] of Object.entries(tempReadings)) {
	
// 	if(values.length > 0) {
		
// 		let tempValues = values.map(value => value.max);

// 		// find mean
// 		let mean = tempValues.reduce((a, b) => a + b) / values.length

// 		let stDev = Math.sqrt(
// 			tempValues.map(
// 				x => Math.pow(x - mean, 2)
// 			).reduce((a, b) => a + b) / values.length)

// 		statistics[sensor] = { mean, stDev }
// 	}
// }

// const THRESHOLD_ST_DEV = 1;
// const OUTLIERS_PER_HOUR_TRIGGER = 5;


// let alarms = []

// // find outliers.
// for(const [sensor, values] of Object.entries(tempReadings)) {
// 	const alarmLowerBound = statistics[sensor].mean - (statistics[sensor].stDev * THRESHOLD_ST_DEV)
// 	const alarmUpperBound = statistics[sensor].mean + (statistics[sensor].stDev * THRESHOLD_ST_DEV)

// 	let sequence_start = 0;
// 	const high_temp = false;

// 	// find first occurence of match and save time.
// 	values.forEach(value => {
// 		if(value > )
// 	});

// }
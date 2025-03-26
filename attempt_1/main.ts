import parquetjs from 'npm:@dsnp/parquetjs';
import { findMean, findStDev, isValueInRange, handleAlert } from './helpers.ts';
import { RawRecord, SensorLog } from './types.ts';


let reader = await parquetjs.ParquetReader.openFile('../lab.parquet');

// only read columns we care about
let cursor = reader.getCursor(['time', 'TagName', 'max']);

// CONSTANTS
const THRESHOLD_ST_DEV = 3;
const OUTLIERS_PER_HOUR_TRIGGER = 5;
const NANO_PER_HOUR = 3600000000000;

// will hold records relating to air supply. Grouped by sensor
// with value as an of array of objects with time and value
const airSupplyRecords: SensorLog = {};

// loop through dataset
let record: RawRecord | null = null;
while (record = await cursor.next()) {
	
	// only store air supply data that's not null
	if(record.TagName.endsWith('.SAT') && record.max && record.time) {

		// check if value belongs to an existing sensor. 
		// Either create new entry or push sensor data to array
		const newTempRecord = { time: record.time, value: record.max }
		if(Object.keys(airSupplyRecords).includes(record.TagName)) {
			airSupplyRecords[record.TagName].values.push(newTempRecord);
		} else {
			airSupplyRecords[record.TagName] = { values: [newTempRecord] };
		}
	}
}


// sort values by their timestamps and calculate mean & st. dev.
for(const [sensor, sensorData] of Object.entries(airSupplyRecords)) {

	sensorData.values.sort((a,b) => {
		return a.time > b.time ? 1 : -1;
	});

	let mean = findMean(sensorData.values);

	let stDev = findStDev(sensorData.values, mean);

	airSupplyRecords[sensor].mean = mean;
	airSupplyRecords[sensor].stDev = stDev;

	// since we need OUTLIERS_PER_HOUR_TRIGGER in a row,
	// the last element that we could start on is length - OUTLIERS_PER_HOUR_TRIGGER
	let ptr = 0;
	let beginSequence = 0;
	while(ptr < sensorData.values.length - OUTLIERS_PER_HOUR_TRIGGER) {
		
		let timeStamp = sensorData.values[ptr].time
		let value = sensorData.values[ptr].value

		// if current value is not an error, reset everything
		if(isValueInRange(value, mean, stDev, THRESHOLD_ST_DEV)) {
			// check if we just ended an error streak
			if(ptr - beginSequence >= 5) {
				handleAlert(sensorData.values, sensor, beginSequence, ptr, mean, stDev);
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
				if(timeStamp - sensorData.values[beginSequence].time < NANO_PER_HOUR) {
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
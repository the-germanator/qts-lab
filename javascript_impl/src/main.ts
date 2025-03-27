
import log4js from 'log4js';

import { 
	loadParquetToMemory,
	sortAndDedupeRecords,
	calculateMetricsForSensor,
	filterCompliantValues,
	rangeSlotInIndex 
} from './data_operations';
import { raiseAlarm } from './helpers';
import { ProcessedRecords } from './types';

var logger = log4js.getLogger();
logger.level = "error";

// configure parameters
const CONSTANTS = {
	TIMEFRAME: 3600000, // over how long of a period should we look for anomalies (in milliseconds. 3600000 = 1 hour)
	THRESHOLD_PER_HOUR: 5, // how many alerts in X timeframe should trigger the alarm
	STDEV_TRIGGER: 3 // how many standard deviations from the mean indicates an anomaly of a single value
};

// perform main analysis
export const analyzeData = (values: Date[], sensorName: string) => {
	// short-circuit if there aren't enough values to trigger an alarm
	if(values.length < CONSTANTS.THRESHOLD_PER_HOUR || values[values.length - 1].getTime() - values[0].getTime() < CONSTANTS.TIMEFRAME) return;

	// we know there are enough values to set up our pointers
	let ptr1 = 0;
	let ptr2 = CONSTANTS.THRESHOLD_PER_HOUR - 1;

	// array of arrays representing ranges where alarms should be fired. This is our main return value.
	let intervals: Date[][] = []
	
	while(ptr2 < values.length) {
		ptr1 = ptr2 - 1;

		while(ptr1 > 0 && values[ptr2].getTime() - values[ptr1 - 1].getTime() <= CONSTANTS.TIMEFRAME) {
			ptr1--;
		}
		if(ptr2 - ptr1 >= CONSTANTS.THRESHOLD_PER_HOUR - 1) {	
			let leftSlotInIndex = rangeSlotInIndex(intervals, values[ptr1], values[ptr2], true);
			let rightSlotInIndex = rangeSlotInIndex(intervals, values[ptr1], values[ptr2], false);
		
			if(leftSlotInIndex !== -1) {
				// update left side of existing interval
				intervals[leftSlotInIndex][0] = values[ptr1]
			} else if (rightSlotInIndex !== -1) {
				// update right side of existing interval
				intervals[rightSlotInIndex][1] = values[ptr2]
			} else {
				// no exact match was found. Must be a new record.
				intervals.push([values[ptr1], values[ptr2]])
			}
		}
		ptr2++;
	}

	raiseAlarm(sensorName, intervals);
}


export const main = async () => {
	logger.debug('Starting script')

	// data structure we re-use.
	const processed_records: ProcessedRecords = {};

	// records will be sanitized, grouped and loaded into processed_records at this stage
	await loadParquetToMemory('../lab.parquet', processed_records);
	logger.debug(`${Object.keys(processed_records).length.toString()} unique sensors found.`);

	// records will be sorted by timestamp and unique at this stage
	sortAndDedupeRecords(processed_records);
	logger.debug(`Finished sorting and deduping records.`);

	// records will have had their metrics calculated at this stage
	calculateMetricsForSensor(processed_records);
	logger.debug(`Finished calculating mean and stDev for records`);

	// filter out compliant values, leaving us with the outliers.
	filterCompliantValues(processed_records, CONSTANTS.STDEV_TRIGGER);
	logger.debug(`Finished removing compliant values`);

	// begin actual analysis
	for(const [sensor, sensorData] of Object.entries(processed_records)) {
		// extract only the timestamp of current record
		let _values: Date[] = sensorData.values.map(datapoint => datapoint.time);
		analyzeData(_values, sensor);
	}

	// done with analys
}

main();
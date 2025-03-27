
import log4js from 'log4js';

import { loadParquetToMemory, sortAndDedupeRecords, calculateMetricsForSensor, filterCompliantValues } from './data_operations';
import { } from './helpers';
import { ProcessedRecords } from './types';

var logger = log4js.getLogger();
logger.level = "debug";

// configure parameters
const CONSTANTS = {
	TIMEFRAME: 3600, // over how long of a period should we look for anomalies (in seconds. 3600 = 1 hour)
	THRESHOLD_PER_HOUR: 5, // how many alerts in X timeframe should trigger the alarm
	STDEV_TRIGGER: 3 // how many standard deviations from the mean indicates an anomaly of a single value
};


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

	}
	
}


main();
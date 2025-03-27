import parquetjs from '@dsnp/parquetjs'
import log4js from 'log4js'
import { findMean, findStDev, nanoToDate, isValueWithinRange } from './helpers';
import { ProcessedRecords, RawRecord, SensorValue } from './types';

const logger = log4js.getLogger();

export const loadParquetToMemory = async (filePath: string, raw_sanitized_records: ProcessedRecords) => {
	logger.debug('Loading parquet file and performing basic sanity checks on data');

	let originalCount = 0;
	let finalCount = 0;

	try {

		let reader = await parquetjs.ParquetReader.openFile(filePath);

		// only read columns we care about
		// @ts-ignore
		let cursor = reader.getCursor(['time', 'TagName', 'max']);

		// loop through dataset
		let record = null;
		while (record = await cursor.next()) {
			originalCount++;
			record = record as RawRecord;
			if(isRecordValid(record)) {
				// add to sanitized records
				const newSensorValue: SensorValue = { value: record.max, time: nanoToDate(record.time) };
				if(Object.keys(raw_sanitized_records).includes(record.TagName)) {
					raw_sanitized_records[record.TagName].values.push(newSensorValue)
				} else {
					raw_sanitized_records[record.TagName] = { values: [ newSensorValue ] }
				}
				finalCount++;
			}
		}
		await reader.close();
		logger.debug(`${finalCount}/${originalCount} records remain post sanity check`)
	} catch {
		logger.error('Failed to open or parse parquet file. Please try again.')
		return null;
	}
}


// filters records with invalid time, or value
export const isRecordValid = (record: RawRecord): boolean => {
	if(record === null) return false;

	const isTagValid = record.TagName !== null && record.TagName.length > 4 && record.TagName.endsWith('.SAT');
	const isTimeValid = record.time !== null && typeof record.time === 'bigint' && record.time > 0;
	const isDataValid = record.max !== null && typeof record.max === 'number' && record.max > 0;

	return isTagValid && isTimeValid && isDataValid;
}

// sorts record for each sensor by timestamp (and dedupe)
export const sortAndDedupeRecords = (processed_records: ProcessedRecords) => {
	logger.debug(`Starting to sort and dedupe records.`)

	// sort records for each sensor by timestamp
	for (const sensorData of Object.values(processed_records)) {
		// simple sort on timestamps. two bigints can be compared.
		sensorData.values.sort((a, b) =>  a.time > b.time ? 1 : -1);

		// filter out unique. Since elements are sorted, we just traverse array and check adjacent elements.
		sensorData.values = sensorData.values.filter((current, index, array) => {
			if(index === 0) return true;

			const isValueSame = current.value === array[index-1].value;
			const isDateSame = current.time.getTime() === array[index-1].time.getTime();

			return !(isValueSame && isDateSame);
		})
	}
}

export const calculateMetricsForSensor = (processed_records: ProcessedRecords) => {
	logger.debug(`Starting to calculate means and stDevs for records`)
	// calculate mean and stDev for each sensor
	for(const [sensor, sensorData] of Object.entries(processed_records)) {

		const _mean = findMean(sensorData.values.map(datapoint => datapoint.value))
		const _stDev = findStDev(sensorData.values.map(datapoint => datapoint.value), _mean)

		sensorData.mean = _mean;
		sensorData.stDev = _stDev;
	}
}

// we only really care about values outside the range.
export const filterCompliantValues = (processed_records: ProcessedRecords, STDEV_TRIGGER: number) => {
	logger.debug(`Starting to purge compliant values`)
	
	for (const sensorData of Object.values(processed_records)) {
		// const startingCount =  Object.values(sensorData.values).length;
		sensorData.values = sensorData.values.filter((record) => !isValueWithinRange(record.value, sensorData.mean!, sensorData.stDev!, STDEV_TRIGGER) )
		// const endingCount =  Object.values(sensorData.values).length;
		// logger.debug(`${endingCount}/${startingCount} records remain for current sensor.`)
	}
}
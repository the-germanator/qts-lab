import { 
	loadParquetToMemory,
	isRecordValid,
	sortAndDedupeRecords,
	calculateMetricsForSensor,
	filterCompliantValues 
} from '../data_operations';
import { RawRecord } from '../types';

import { records as DENSE_RAW_BAD } from './testdata/dense_bad_raw_data';
import { records as DENSE_RAW_GOOD } from './testdata/dense_good_raw_data';
import { records as SPARSE_RAW_GOOD } from './testdata/sparse_bad_raw_data';
import { records as SPARSE_RAW_BAD } from './testdata/sparse_good_raw_data';
import { 
	massively_duplicated_records,
	unsorted_records,
	statistics_data,
	statistics_enhanced_data 
} from './testdata/sample_processed_data';

describe('loadParquetToMemory', () => {

});

describe('isRecordValid', () => {

	const baseRecord: RawRecord = {
		TagName: 'hello_world.SAT',
		time: 1743034175000000000n,
		max: 12345
	}

	/**
	 * baseline
	 */
	it('should establish a baseline acceptable record', () => {
		expect(isRecordValid(baseRecord)).toBe(true);
	});

	it('should be able to identify null records as invalid ', () => {
		// @ts-ignore
		expect(isRecordValid(null)).toEqual(false);
	})


	/**
	 * Test tag name
	 */
	it('should be able to identify records with missing TagName as invalid', () => {
		const record = {...baseRecord};
		// @ts-ignore
		record.TagName = null;
		expect(isRecordValid(record)).toEqual(false);
	})

	it('should be able to identify records with short TagName as invalid', () => {
		const record = {...baseRecord};
		record.TagName = 'abc';
		expect(isRecordValid(record)).toEqual(false);
	})

	it('should be able to identify records with short TagName not ending in .SAT as invalid', () => {
		const record = {...baseRecord};
		record.TagName = 'hello_world';
		expect(isRecordValid(record)).toEqual(false);
	})

	it('should be able to identify records with short TagName not ending in .SAT as invalid', () => {
		const record = {...baseRecord};
		record.TagName = 'hello_world';
		expect(isRecordValid(record)).toEqual(false);
	})

	/**
	 * Test Time
	 */
	it('should be able to identify records with missing time as invalid', () => {
		const record = {...baseRecord};
		// @ts-ignore
		record.time = null;
		expect(isRecordValid(record)).toEqual(false);
	})

	it('should be able to identify records with incorrect time format as invalid', () => {
		const record = {...baseRecord};
		// @ts-ignore
		record.time = 'abc';
		expect(isRecordValid(record)).toEqual(false);
	})

	it('should be able to identify records with negative times as invalid', () => {
		const record = {...baseRecord};
		record.time = BigInt(-1);
		expect(isRecordValid(record)).toEqual(false);
	})

	/**
	 * Test values
	 */
	it('should be able to identify records with missing value as invalid', () => {
		const record = {...baseRecord};
		// @ts-ignore
		record.max = null;
		expect(isRecordValid(record)).toEqual(false);
	})

	it('should be able to identify records with incorrect value format as invalid', () => {
		const record = {...baseRecord};
		// @ts-ignore
		record.max = 'abc';
		expect(isRecordValid(record)).toEqual(false);
	})

	it('should be able to identify recordswith  negative value as invalid', () => {
		const record = {...baseRecord};
		record.max = -1;
		expect(isRecordValid(record)).toEqual(false);
	})
});

describe('sortAndDedupeRecords', () => {
	it('should find and remove duplicate records in pre-processed and sorted data ', () => {

		// make copy of object
		const records = {...massively_duplicated_records}

		sortAndDedupeRecords(records)
		expect(records['TAG1.SAT'].values).toHaveLength(3);
	})
	it('should correctly sort unsorted data', () => {
		const records = {...unsorted_records}

		sortAndDedupeRecords(records)
		expect(records['TAG2.SAT'].values).toHaveLength(10);
		expect(records['TAG2.SAT'].values.map(elem => elem.time.getTime())).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100])
	})
});

describe('calculateMetricsForSensor', () => {
	it('should find mean and stDev for processed data', () => {
		const records = {...statistics_data}

		calculateMetricsForSensor(records);

		expect(records['TAG3.SAT'].mean).toEqual(50)
		expect(records['TAG3.SAT'].stDev).toEqual(31.622776601683793)
	})
});

describe('filterCompliantValues', () => {
	it('should filter out values not outside the range set by the mean, stDev and threshold standard deviations', () => {
		const records = {...statistics_enhanced_data}

		const startingLength = records['TAG4.SAT'].values.length;

		// all records should be non-compliant
		filterCompliantValues(records, 1);

		expect(records['TAG4.SAT'].values).toHaveLength(startingLength);
	})
});
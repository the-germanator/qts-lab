import { 
	loadParquetToMemory,
	isRecordValid,
	sortAndDedupeRecords,
	calculateMetricsForSensor,
	filterCompliantValues ,
	rangeSlotInIndex
} from '../data_operations';
import { ProcessedRecords, RawRecord } from '../types';
import parquetjs from '@dsnp/parquetjs'


import { records as sample_raw_data } from './testdata/sample_raw_data';
import {
	massively_duplicated_records,
	unsorted_records,
	statistics_data,
	statistics_enhanced_data 
} from './testdata/sample_processed_data';

describe('loadParquetToMemory', () => {
	afterEach(() => {
		jest.clearAllMocks();
	})

	it('should call file load', async () => {
		const openFileSpy = jest.fn().mockResolvedValue({ next: jest.fn().mockResolvedValue(null) })

		parquetjs.ParquetReader.openFile = openFileSpy
		await loadParquetToMemory('./abc.def', {})
		expect(openFileSpy).toHaveBeenCalledWith('./abc.def')
	})

	it('should load sample file into memory', async () => {
		let ptr = 0;
		const nextSpy = jest.fn().mockImplementation(async () => {
			if(ptr < sample_raw_data.length) {
				ptr++;
				return sample_raw_data[ptr-1]
			} else {
				return null;
			}
		});
		const openFileSpy = jest.fn().mockResolvedValue({ close: jest.fn().mockResolvedValue(null), getCursor: jest.fn().mockReturnValue({ next: nextSpy })});
		parquetjs.ParquetReader.openFile = openFileSpy
		let temp_sanitized_records: ProcessedRecords = {}
		await loadParquetToMemory('./abc.def', temp_sanitized_records)

		expect(Object.values(temp_sanitized_records['TAG1.SAT'].values)).toHaveLength(10)
	})
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

describe('rangeSlotInIndex', () => {
	it('should detect left-slotted overlap', () => {
		let now = new Date()
		let startingIntervals = [[new Date(946702800), now]]; // 2000-01-01 until now
		let newInterval = [new Date(631170000), new Date(1262322000)]; // 1999-01-01 until 2010-01-01

		const result = rangeSlotInIndex(startingIntervals, newInterval[0], newInterval[1], true);

		// indicates index 0 in array, i.e. result found.
		expect(result).toEqual(0);
	});

	it('should detect right-slotted overlap', () => {
		let now = new Date()
		let startingIntervals = [[new Date(631170000), new Date(1262322000)]]; // 1999-01-01 until 2010-01-01
		let newInterval = [new Date(946702800), now]; // 2000-01-01 until now

		const result = rangeSlotInIndex(startingIntervals, newInterval[0], newInterval[1], false);

		// indicates index 0 in array, i.e. result found.
		expect(result).toEqual(0);
	});

	it('should return -1 for incorrect left-slotting', () => {
		let now = new Date()
		let startingIntervals = [[new Date(631170000), new Date(946702800)]]; // 1999-01-01 until 2000-01-01
		let newInterval = [new Date(1262322000), now]; // 2010-01-01 until now

		const result = rangeSlotInIndex(startingIntervals, newInterval[0], newInterval[1], true);

		// indicates no value found
		expect(result).toEqual(-1);
	});

	it('should return -1 for incorrect right-slotting', () => {
		let now = new Date()
		let startingIntervals = [[new Date(631170000), new Date(946702800)]]; // 1999-01-01 until 2000-01-01
		let newInterval = [new Date(1262322000), now]; // 2010-01-01 until now

		const result = rangeSlotInIndex(startingIntervals, newInterval[0], newInterval[1], false);

		// indicates no value found
		expect(result).toEqual(-1);
	});
})
import log4js from 'log4js';
import { 
	nanoToDate,
	prettyPrintDate,
	isValueWithinRange,
	findMean,
	findStDev,
	raiseAlarm
} from '../helpers';

import * as helpers from '../helpers';

describe('nanoToDate', () => {
	it('should parse Y2K correctly', () => {
		// @ts-ignore
		const Y2K: BigInt = 946702800000000000n;
		const Y2KAsADate = new Date('2000-01-01 00:00:00');

		expect(nanoToDate(Y2K)).toMatchObject(Y2KAsADate);
	})
});

describe('prettyPrintDate', () => {
	it('should print the current date/time according to the format of MM/DD/YYYY HH:mm:ss', () => {
		const now = new Date();
		expect(prettyPrintDate(now)).toMatch(/.{3}\ .{3}\ \d{2} \d{4} \d{2}\:\d{2}\:\d{2}/)
	})
});

describe('isValueWithinRange', () => {
	it('should correctly identify a value in range', () => {
		const value = 97;
		const mean = 100;
		const stDev = 1;
		const threshold_stDev= 3;
		expect(isValueWithinRange(value, mean, stDev, threshold_stDev)).toBeTruthy();
	});
	
	it('should correctly identify a value NOT in range', () => {
		const value = 105;
		const mean = 100;
		const stDev = 1;
		const threshold_stDev= 3;
		expect(isValueWithinRange(value, mean, stDev, threshold_stDev)).toBeFalsy();
	});
});

describe('findMean', () => {
	it('should correctly identify the mean of the provided dataset', () => {
		const inputDataset = [3.1415, 7, 22, 24, 12345.67];
		const expectedResult = 2480.3623;

		expect(findMean(inputDataset)).toEqual(expectedResult)
	});
});

describe('findStDev', () => {
	it('should find the standard deviation of a dataset', () => {
		const values = [98, 99, 100, 102, 104, 109];
		const mean = 102;

		const expectedStDev = 3.696845502136472;

		expect(findStDev(values, mean)).toEqual(expectedStDev);
	});
});

describe('raiseAlarm', () => {
    
	it('should not log when range is length 0', () => {
		const ranges: Date[][] = [];

		const errorSpy = jest.fn();

		log4js.getLogger = jest.fn().mockReturnValue({ error: errorSpy })

		raiseAlarm('test123', ranges);

		expect(errorSpy).not.toHaveBeenCalled()

	});

	it('should display info about 3 windows for a sensor', () => {
		const ranges = [[new Date(1), new Date(2001)], [new Date(3001), new Date(4000)]];

		const errorSpy = jest.fn();

		log4js.getLogger = jest.fn().mockReturnValue({ error: errorSpy })

		raiseAlarm('test123', ranges);

		expect(errorSpy).toHaveBeenCalledTimes(1);
		expect(errorSpy.mock.calls[0][0]).toContain('test123')

	});
});

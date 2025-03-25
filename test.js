import parquetjs from '@dsnp/parquetjs';
import assert from 'node:assert';
import { isBigIntObject } from 'node:util/types';

let reader = await parquetjs.ParquetReader.openFile('../lab.parquet');
let cursor = reader.getCursor();

let record = null;

// test if the following keys are present
let expectedKeys = ['iox::measurement', 'time', 'Device Name', 'TagName', 'max']

// loop through records from parquet file
while (record = await cursor.next()) {
	// get keys from object
	let keys = Object.keys(record)

	// loop through expected keys and ensure each one is present in actual object
	expectedKeys.forEach(expectedKey => assert(keys.includes(expectedKey)))

	// assert that tagName is always part of Device name
	assert(record.TagName.includes(record['Device Name']))

	// assert that TagName always matches <device name>.[RAT|SAT]
	const tagExtension = record.TagName.split('.')[1]
	assert(tagExtension === 'RAT' || tagExtension === 'SAT')

	// assert that "max" value is parseable as a number and time is a BigInt
	assert(!isNaN(record.max) && !isBigIntObject(record.time))
}
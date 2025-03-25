## First impressions
I began by inspecting a sampling of the data in a human-readable format to ensure I understood the data set's format. I noticed that the format is *generally*

```
{
  'iox::measurement': 'BMS_Value',
  time: <timestamp>,
  'Device Name': '<device_name>',
  TagName: '<device_name>.[RAT|SAT]',
  max: <float>
}
```

From an initial visual inspection, I deduced that:
- The following keys would always be present for each record: 'iox::measurement', 'time', 'Device Name', 'TagName', 'max'
- 'Device Name' and TagName are identical with the exception of the extension
- time is parseable as a BigInt
- max is parseable as a number

To test my initial assumptions, I wrote the following test (localed in ./test.js)

```
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
```
which passed, meaning that all records match my assumptions.
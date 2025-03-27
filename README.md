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
which passed, meaning that all records match my initial assumptions.


## Other assumptions
A brief google search shows that the "SAT" and "RAT" accronyms like stand for "Supply Air Temperature" and "Return Air Temperature" in the context of a data center. Since the problem states that what we're looking for is: 
| [...] rapid changes in the CRAC unit's supply temperature
I deduced that we're looking exclusively at values with the .SAT tag suffix.

I also assume that "occurs more than 5 times within a hour" means any 60-minute period, rather than between actual hours i.e. 00:00:00 - 01:00:00 etc.

I assume that values of null should be removed

I assume that values are in no way sorted.

I assume that timestamps are in nanoseconds i.e. one billionth of a second. To calculate time deltas, I'm performing simple math with the builtin BigInt methods and then dividing the final result by one billion to get the delta in seconds.

I assume that alerts should only be triggered if the same unit registers >= 5 unusual values in an hour.



## Sanity checking
After completing the javascript inplementation, I wanted to do a quick sanity check to ensure the system is working as intended. During earlier testing, I noticed one outlier unit: `QTS_LAB_CRAC_MG1102_10.SAT`. This unit has some pretty wild swings in temperature (compared to the mean), so it would serve as my reference point. I modified the logic in the main script to only focus on this unit and dump both the outlier values and final ranges to a file. Below is what I saw:
```
{
	"values": [
		{
			"value": 77.900002,
			"time": "2025-03-24T22:43:00.000Z"
		},
		{
			"value": 74.300003,
			"time": "2025-03-24T22:46:30.000Z"
		},
		[... several lines omitted ...]
		{
			"value": 77,
			"time": "2025-03-25T11:38:00.000Z"
		},
		{
			"value": 75.199997,
			"time": "2025-03-25T11:41:30.000Z"
		}
	],
	"mean": 73.11937327152427,
	"stDev": 0.3873603929087312
}
```

I observed that because the standard deviation is generally so low, even at 5+ standard deviations from the mean as the cutoff, we see a number of results. Note the timestamps of the earliest and latest record. We can compare this to the range output: 
```
[
	["2025-03-24T22:43:00.000Z","2025-03-24T22:46:30.000Z"],
	["2025-03-25T11:38:00.000Z","2025-03-25T11:41:30.000Z"]
]
```
They match! This is a good sign that things are working as intended.






## SOURCES
I used the following resources while working on this:
- npmjs.com: 			to find a parquet package
- stackoverflow.com: 	general resources
- mdn.com: 				general reference

No AI tools were used at any point.
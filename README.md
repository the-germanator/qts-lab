# QTS Lab Solution
&copy; Christoph Schild <christoph@schild.tech> all rights reserved.


## Quickstart
0. Enter folder: `cd ./javascript_impl`
1. Install dependencies: `npm i`
2. Run with `npm run start`
3. Test with `npm run test`

## Introduction
After reading the problem statement, I began by analyzing the dataset since I had never worked with parquet before. I wrote a small script to dump the data file to disk and began analyzing the struture. A typical record looked like this:

```js
	{
		'iox::measurement': 'BMS_Value',
		time: <timestamp>,
		'Device Name': '<device_name>',
		TagName: '<device_name>.[RAT|SAT]',
		max: <float>
	}
```


From this initial inspection and understanding of the problem, I observed that:

- Every record has the same five keys: 'iox::measurement', 'time', 'Device Name', 'TagName', 'max'
- The 'Device Name' and TagName values are always identical with the exception of the extension
- The extention in the TagName is always ".SAT" or ".RAT". I assumed that this refered to the "Supply Air Temperature" and the "Return Air Temperature". Requirement #2 in the lab states that we're hunting for values in the "supply temperature", so I decided to only focus on those values ensing in .SAT
- times are represented as BigInt unix timestamps (billionths of seconds)
- max is a float (or null)


To validate my initial assumptions, I wrote the following test (located in ./test.js)

```js
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
which passed, meaning that all records in the dataset match my expectations.


## Assumptions
In addition to the above mentioned assumptions, I had to make some pretty fundamental decisions about how to find and classify alerts.

- I assume that "in an hour" refers to a rolling 60-minute window
- I assume that a reasonable metric for determing outliers is ~3 standard deviations from the mean of the dataset
- I assume that if two timeperiods with alerts overlap, we want to combine them rather than treat them as seperate alerting periods
- I assume that outliers don't all have to be in the same direction. Values >3 st.dev above and below the mean are equally considered outliers.
- I assume that nano-second precision is not required for alerting.


## My Implemtation

### File structure
I chose typescript because of my experience in the language. 
The project is organized into three main files in the `src/` directory.


- The `main.ts` file contains the primary flow of the program and exposes some constants to tweak the thresholds for alerting, as well as the log level for debugging.
- The `data_operations.ts` file contains a lot of the boilerplate file I/O code and the code specific to the format of our records
- The `helpers.ts` file contains many generic helper functions (formatting, parsing, filtering, etc.)

<br />

- The `test/` directory contains all my unit tests. ***Test coverage is 100%***.
- The `test/testdata/` directory contains sample data for different stages of testing. 

<br />

- The `types.ts` file contains the important typescript types used in the project


### The algorithm
In very basic terms, I built a kind of data pipeline that refines and pre-processes as much as is reasonable before performing the analysis.

The flow goes:
```
1. load into memory (also removes invalid entries)
2. sort & remove duplicate entries
3. calculate mean & standard deviation for sensor values
4. remove compliant values
5. find and combine alerting periods
6. "alert" the user
```


### Design Considerations
Since I want this program to be scalable, I avoided duplicating data wherever possible. A full copy of the source data is store in memory, but then modified in-place as opposed to having copies made.



## Sanity checking
After completing my inplementation, I wanted to do a quick sanity check to ensure the system is working as intended. During earlier testing, I noticed one outlier unit in the dataset: `QTS_LAB_CRAC_MG1102_10.SAT`. This unit has a very low variance normally, but a few small windows of extreme values. I tuned my parameters to filter out all other units and dump the relevant data to a file:

```js
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
I compared this to my logging output to observe the alerting periods my script found:
```js
[
	["2025-03-24T22:43:00.000Z","2025-03-24T22:46:30.000Z"],
	["2025-03-25T11:38:00.000Z","2025-03-25T11:41:30.000Z"]
]
```
And sure enough, they match! There are two disjointed windows of extreme variance, reflected in the output.


## Future Improvements
- Alerting: Integration with a service that contacts a human to investigate an issue or with systems like AWS' cloudwatch
- Real-Time data: This code assumes the dataset is present at runtime, which gives us the added benefit of hindsight. Instead, as realtime records come in, the system could update a rolling threshold for outliers and purge old records older than our target timeframe.
- Removal of clear outliers: Remove values that are provably incorrect and clearly skewing the dataset
- Databasae integration: Integrate with a database (time-series is the obvious choice) to prevent high memory usage on the host machine


## SOURCES
I used the following resources while working on this:
- npmjs.com: 			finding packages
- stackoverflow.com: 	general resources
- mdn.com: 				general reference

***No AI tools/assistants were used at any point***
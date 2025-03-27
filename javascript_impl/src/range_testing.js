let CONSTANTS = {
	THRESHOLD_PER_HOUR: 5,
}



let intervals = []

// let values = [1,2,3,4,5,6,7,8,9,10,15,16,17,18,19,20,100,101,102,103,104,105,110,111,112,113,114]
let values = [0,1,2,3,4,5,6,7,8,9,10,200,201,202,203,204,205,208,209,210,214, 400, 401, 402, 403, 404, 500, 501, 502, 503, 553,603,653, 700, 701, 702, 703, 704, 705]
// short-circuit if there aren't enough values to trigger an alarm
if(values.length < CONSTANTS.THRESHOLD_PER_HOUR || values[values.length - 1] - values[0] < CONSTANTS.TIMEFRAME) console.log("TOO FEW");

let ptr1 = 0;
let ptr2 = 4;


while(ptr2 < values.length) {
	ptr1 = ptr2 - 1;
	while(ptr1 > 0 && values[ptr2] - values[ptr1 - 1] <= 100) {
		ptr1--;
	}
	
	if(ptr2 - ptr1 >= 4) {

		let existingIntervalIndex = intervals.findIndex(interval => interval[0] === values[ptr1] || interval[1] === values[ptr2]);
		let leftSlotInIndex = intervals.findIndex(interval => values[ptr1] < interval[0] && values[ptr2] > interval[0] && values[ptr2] < interval[1]);
		let rightSlotInIndex = intervals.findIndex(interval => values[ptr1] > interval[0] && values[ptr1] < interval[1] && values[ptr2] > interval[1]);

		if(existingIntervalIndex !== -1) {
			let oldMin = intervals[existingIntervalIndex][0];
			let oldMax = intervals[existingIntervalIndex][1];
			intervals[existingIntervalIndex] = [Math.min(oldMin, values[ptr1]), Math.max(oldMax, values[ptr2])]
		} else if(leftSlotInIndex !== -1) {
			console.log(`interval ${values[ptr1]}-${values[ptr2]} can slot into existing ${intervals[leftSlotInIndex][0]}-${intervals[leftSlotInIndex][1]} on the left`)
			intervals[leftSlotInIndex][0] = values[ptr1]
			console.log(`Interval is now: ${intervals[leftSlotInIndex]}`)
		} else if (rightSlotInIndex !== -1) {
			console.log(`interval ${values[ptr1]}-${values[ptr2]} can slot into existing ${intervals[rightSlotInIndex][0]}-${intervals[rightSlotInIndex][1]} on the right`)
			intervals[rightSlotInIndex][1] = values[ptr2]
			console.log(`Interval is now: ${intervals[rightSlotInIndex]}`)
		} else {
			// no exact match was found
			intervals.push([values[ptr1], values[ptr2]])
		}
	} else {
		console.log(`"miss from ptr ${ptr1}: ${values[ptr1]} to ${ptr2}: ${values[ptr2]} (difference of ${ptr2 - ptr1})`)
	}
	ptr2++;
}
console.log(intervals)





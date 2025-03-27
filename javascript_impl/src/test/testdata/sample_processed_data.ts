import { ProcessedRecords } from "../../types";

export const massively_duplicated_records: ProcessedRecords = {
	"TAG1.SAT": {
		values: [
			{ time: new Date(1743034175000), value: 100 },
			{ time: new Date(1743034175000), value: 100 },
			{ time: new Date(1743034175000), value: 100 },
			{ time: new Date(1743034175000), value: 100 },
			{ time: new Date(1743034175000), value: 100 },
			{ time: new Date(1743034175000), value: 100 },
			{ time: new Date(1743034175000), value: 100 },
			{ time: new Date(1743034175000), value: 100 },
			{ time: new Date(1743034175000), value: 100 },
			{ time: new Date(1743034175000), value: 100 },
			{ time: new Date(1743034175000), value: 100 },
			{ time: new Date(1743034175000), value: 100 },
			{ time: new Date(1743034176000), value: 101 },
			{ time: new Date(1743034176000), value: 102 },
		]
	}
}
export const unsorted_records: ProcessedRecords = {
	"TAG2.SAT": {
		values: [
			{ time: new Date(100), value: 100 },
			{ time: new Date(90), value: 100 },
			{ time: new Date(80), value: 100 },
			{ time: new Date(70), value: 100 },
			{ time: new Date(60), value: 100 },
			{ time: new Date(50), value: 100 },
			{ time: new Date(40), value: 100 },
			{ time: new Date(30), value: 100 },
			{ time: new Date(20), value: 100 },
			{ time: new Date(10), value: 100 },
		]
	}
}

export const statistics_data: ProcessedRecords = {
	"TAG3.SAT": {
		values: [
			{ time: new Date(100), value: 100 },
			{ time: new Date(90), value: 90 },
			{ time: new Date(80), value: 80 },
			{ time: new Date(70), value: 70 },
			{ time: new Date(60), value: 60 },
			{ time: new Date(50), value: 50 },
			{ time: new Date(40), value: 40 },
			{ time: new Date(30), value: 30 },
			{ time: new Date(20), value: 20 },
			{ time: new Date(10), value: 10 },
			{ time: new Date(10), value: 0 },
		]
	}
}

export const statistics_enhanced_data: ProcessedRecords = {
	// yes, it's true that the mean and stDev aren't correct here. This was easier.
	"TAG4.SAT": {
		mean: 1000,
		stDev: 1,
		values: [
			{ time: new Date(100), value: 100 },
			{ time: new Date(90), value: 90 },
			{ time: new Date(80), value: 80 },
			{ time: new Date(70), value: 70 },
			{ time: new Date(60), value: 60 },
			{ time: new Date(50), value: 50 },
			{ time: new Date(40), value: 40 },
			{ time: new Date(30), value: 30 },
			{ time: new Date(20), value: 20 },
			{ time: new Date(10), value: 10 },
		]
	}
}
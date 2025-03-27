export interface RawRecord {
	time: bigint;
	TagName: string;
	max: number;
};

export interface SensorValue {
	time: Date;
	value: number;
};

export interface ProcessedRecords {
	[key: string]: {
		mean?: number;
		stDev?: number;
		values: SensorValue[];
	}
};

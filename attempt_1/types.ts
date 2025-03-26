export interface RawRecord {
	time: bigint;
	TagName: string;
	max: number;
};

export interface SensorValue {
	time: bigint;
	value: number;
};


export interface SensorLog {
	[key: string]: {
		mean?: number;
		stDev?: number;
		values: SensorValue[];
	}
};
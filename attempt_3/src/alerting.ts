import log4js from 'log4js'
import { prettyPrintDate } from './helpers';
import { SensorValue } from "./types";

const logger = log4js.getLogger();

let ALERT_STATE: boolean = false;
let BEGIN_ALERT: Date = new Date(0);

export const handleAlert = (newState: boolean, record: SensorValue) => {
	if(newState && ALERT_STATE) {
		// we're already in an active alert, so set the smaller value as the starting point
		BEGIN_ALERT = new Date(Math.min(BEGIN_ALERT.getTime(), record.time.getTime()));
	} else if ( newState && !ALERT_STATE ) {
		// no alert is currently present. Start a new one.
		ALERT_STATE = true;
		BEGIN_ALERT = record.time
	} else if ( !newState && ALERT_STATE ) {
		// we're at the end of an alert state. Reset.
		ALERT_STATE = false;
		BEGIN_ALERT = new Date(0);
		logger.error(`ALERT STATE FROM ${prettyPrintDate(BEGIN_ALERT)} to ${prettyPrintDate(record.time)}`)
	} else {
		// we're not in an alarm state, nor should we start one. do nothing.
	}
}
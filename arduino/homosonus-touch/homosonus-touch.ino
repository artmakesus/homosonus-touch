#include "IRDistanceSensor.hpp"

static const int NUM_DISTANCE_SENSORS = 24;

IRDistanceSensor distanceSensors[NUM_DISTANCE_SENSORS];

void setup() {
	Serial.begin(9600);

	for (int16_t i = 0; i < NUM_DISTANCE_SENSORS; i++) {
		distanceSensors[i].init();
	}
}

void loop() {
	for (int16_t i = 0; i < NUM_DISTANCE_SENSORS; i++) {
		distanceSensors[i].update();
		sendData(i);
	}
}

void sendData(int16_t index) {
	// Serial data format
	// ------------------
	// index            => int16_t (2 bytes)
	// distanceInMeters => float   (4 bytes)
	// EOL              => '\r\n'  (2 bytes)

	Serial.write((const char *) &index, sizeof(index));
	Serial.write((const char *) &distanceSensors[index].distanceInMeters, sizeof(distanceSensors[index].distanceInMeters));
	Serial.println();
}

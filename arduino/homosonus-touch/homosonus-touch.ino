#include "IRDistanceSensor.hpp"

//#define DEBUG

static const int NUM_DISTANCE_SENSORS = 15;
static const int FRAME_RATE = 10;
static const int FRAME_PERIOD_MS = 1000 / FRAME_RATE;

int IRDistanceSensor::nextOutputPin = A0;
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

	delay(FRAME_PERIOD_MS);
}

void sendData(int16_t index) {
	// Serial data format
	// ------------------
	// index            => int16_t (2 bytes)
	// distanceInMeters => float   (4 bytes)
	// EOL              => '\r\n'  (2 bytes)

	#ifdef DEBUG
	if (index == 0) {
		Serial.print("index: ");
		Serial.print(index);
		Serial.print(" distance: ");
		Serial.println(distanceSensors[index].distanceInMeters);
	}
	#else
	Serial.write((const char *) &index, sizeof(index));
	Serial.write((const char *) &distanceSensors[index].distanceInMeters, sizeof(distanceSensors[index].distanceInMeters));
	Serial.println();
	#endif
	Serial.flush();
}

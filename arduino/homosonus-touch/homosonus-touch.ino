#include "IRDistanceSensor.hpp"

//#define DEBUG
#define FRONT (15)
#define BACK (0)
//#define SIDE (FRONT)
#define SIDE (BACK)

static const int NUM_DISTANCE_SENSORS = 15;
#if SIDE == FRONT
static const int PINS[NUM_DISTANCE_SENSORS] = { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 12, 11, 14 };
#else
static const int PINS[NUM_DISTANCE_SENSORS] = { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 };
#endif
static const int FRAME_RATE = 10;
static const int FRAME_PERIOD_MS = 1000 / FRAME_RATE;

int IRDistanceSensor::nextOutputPin = A0;
IRDistanceSensor distanceSensors[NUM_DISTANCE_SENSORS];

void setup() {
	Serial.begin(9600);

	for (int16_t i = 0; i < NUM_DISTANCE_SENSORS; i++) {
		distanceSensors[i].init(PINS[i]);
	}
}

void loop() {
	for (int16_t i = 0; i < NUM_DISTANCE_SENSORS; i++) {
		distanceSensors[i].update();
		sendDistance(i);
	}

	delay(FRAME_PERIOD_MS);
}

void sendDistance(int16_t index) {
	// Serial data format
	// ------------------
	// index            => int16_t (2 bytes)
	// distanceInMeters => float   (4 bytes)
	// EOL              => '\r\n'  (2 bytes)

	const int16_t i = index + SIDE;

#ifdef DEBUG
	if (index == 0) {
		Serial.print("index: ");
		Serial.print(i);
		Serial.print(" distance: ");
		Serial.println(distanceSensors[index].distanceInMeters);
	}
#else
	/*
	Serial.write((const char *) &i, sizeof(i));
	Serial.write((const char *) &distanceSensors[index].distanceInMeters, sizeof(distanceSensors[index].distanceInMeters));
	Serial.println();
	*/
	uint8_t buffer[6] = { 0 };
	memcpy(&buffer[0], (void *) &i, 2);
	memcpy(&buffer[2], (void *) &distanceSensors[index].distanceInMeters, 4);
	buffer[6] = 0;
	Serial.write((const char *) buffer, 6);
	Serial.println();
#endif
	Serial.flush();
}

#include "IRDistanceSensor.hpp"
#include "util.hpp"

#include <Arduino.h>

// Min output voltage => longest distance
static const float MIN_OUTPUT_VOLTAGE = 0.48f / 5 * 1023;

// Max output voltage => shortest distance
static const float MAX_OUTPUT_VOLTAGE = 2.5f / 5 * 1023;

// Automatically-incremented output pin when using default constructor.
// Can be changed as necessary.
int IRDistanceSensor::nextOutputPin = 2;

IRDistanceSensor::IRDistanceSensor() :
	mOutputPin(nextOutputPin++)
{
}

IRDistanceSensor::IRDistanceSensor(int outputPin) :
	mOutputPin(outputPin)
{
}

void IRDistanceSensor::init() {
	pinMode(mOutputPin, INPUT);
}

void IRDistanceSensor::update() {
	const int value = analogRead(mOutputPin);
	distanceInMeters = 1.5 - mapf(value, MIN_OUTPUT_VOLTAGE, MAX_OUTPUT_VOLTAGE, 0.2, 1.5);
}

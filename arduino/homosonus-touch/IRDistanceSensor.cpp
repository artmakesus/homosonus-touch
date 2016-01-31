#include "IRDistanceSensor.hpp"

#include <Arduino.h>

// Min output voltage => longest distance
static const float MIN_OUTPUT_VOLTAGE = 0.48f;

// Max output voltage => shortest distance
static const float MAX_OUTPUT_VOLTAGE = 2.83f;

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
	const float value = analogRead(mOutputPin);
	distanceInMeters = (1 - value / 666.0f) * 1.5f;
 	delay(5);
}

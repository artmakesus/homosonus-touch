#ifndef IR_DISTANCE_SENSOR_HPP
#define IR_DISTANCE_SENSOR_HPP

class IRDistanceSensor {
public:	
	static int nextOutputPin;

	float distanceInMeters;

	IRDistanceSensor();
	IRDistanceSensor(int outputPin);
	void init();
	void update();

private:
	int mOutputPin;
};

#endif

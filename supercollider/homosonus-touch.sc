(
var soundsDir = "/home/jacky/Projects/homosonus-touch/public/sounds/";
~buffers = [
	// Back
	Buffer.read(s, soundsDir ++ "user1/c0.wav"),
	Buffer.read(s, soundsDir ++ "user1/e0.wav"),
	Buffer.read(s, soundsDir ++ "user1/ds0.wav"),
	Buffer.read(s, soundsDir ++ "user1/b0.wav"),
	Buffer.read(s, soundsDir ++ "user1/g0.wav"),
	Buffer.read(s, soundsDir ++ "user1/c1.wav"),
	Buffer.read(s, soundsDir ++ "user1/e1.wav"),
	Buffer.read(s, soundsDir ++ "user1/ds1.wav"),
	Buffer.read(s, soundsDir ++ "user1/b1.wav"),
	Buffer.read(s, soundsDir ++ "user1/g1.wav"),
	Buffer.read(s, soundsDir ++ "user1/c2.wav"),
	Buffer.read(s, soundsDir ++ "user1/e2.wav"),
	Buffer.read(s, soundsDir ++ "user1/ds2.wav"),
	Buffer.read(s, soundsDir ++ "user1/b2.wav"),
	Buffer.read(s, soundsDir ++ "user1/g2.wav"),

	// Front
	Buffer.read(s, soundsDir ++ "user2/c00.wav"),
	Buffer.read(s, soundsDir ++ "user2/e00.wav"),
	Buffer.read(s, soundsDir ++ "user2/ds00.wav"),
	Buffer.read(s, soundsDir ++ "user2/b00.wav"),
	Buffer.read(s, soundsDir ++ "user2/g00.wav"),
	Buffer.read(s, soundsDir ++ "user2/c11.wav"),
	Buffer.read(s, soundsDir ++ "user2/e11.wav"),
	Buffer.read(s, soundsDir ++ "user2/ds11.wav"),
	Buffer.read(s, soundsDir ++ "user2/b11.wav"),
	Buffer.read(s, soundsDir ++ "user2/g11.wav"),
	Buffer.read(s, soundsDir ++ "user2/c22.wav"),
	Buffer.read(s, soundsDir ++ "user2/e22.wav"),
	Buffer.read(s, soundsDir ++ "user2/ds22.wav"),
	Buffer.read(s, soundsDir ++ "user2/b22.wav"),
	Buffer.read(s, soundsDir ++ "user2/g22.wav"),

	// Ambient
	Buffer.read(s, soundsDir ++ "ambient.wav"),
];
)

// Create synth defs
(
for (0, 14, {
	arg i;

	SynthDef("back"++i, {
		arg out = 0, buf, mul = 0;
		Out.ar(out, PlayBuf.ar(1, buf, loop: 1) * mul)
	}).add;

	SynthDef("front"++i, {
		arg out = 0, buf, mul = 0;
		Out.ar(out, PlayBuf.ar(1, buf, loop: 1) * mul)
	}).add;
});
SynthDef("ambient", {
	arg out = 0, buf, mul = 1;
	Out.ar(out, PlayBuf.ar(1, buf, loop: 1) * mul)
}).add;
)

// Create synths
(
~backSounds = Array.fill(15, {
	arg i;
	Synth.new(\back++i, [\buf, ~buffers[i].bufnum])
});
~frontSounds = Array.fill(15, {
	arg i;
	Synth.new(\front++i, [\buf, ~buffers[15 + i].bufnum])
});
~ambientSound = Synth.new(\ambient, [\buf, ~buffers[30].bufnum]);
)

// Handle OSC messages
// msg[1] => sensor index
// msg[2] => normalized distance (0.0 to 1.0)
(
OSCFunc({
	arg msg;

	~backSounds[msg[1]].set(\mul, msg[2]);

	msg.postln;
}, '/back', nil, 57120);
OSCFunc({
	arg msg;

	~frontSounds[msg[1]].set(\mul, msg[2]);

	msg.postln;
}, '/front', nil, 57120);

OSCFunc({
	arg msg;

	~ambientSound[msg[1]].set(\mul, msg[2]);

	msg.postln;
}, '/front', nil, 57120);
)

// Free sounds
(
for (0, 14, {
	arg i;
	~backSounds[i].free;
	~frontSounds[i + 15].free;
});
~ambientSound.free;
)
(
for (0, 30, {
	arg i;
	~buffers[i].free;
});
)

'done'.postln;


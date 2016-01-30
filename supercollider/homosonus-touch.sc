(
var soundsDir = "/home/jacky/Projects/homosonus-touch/supercollider/sounds/";
~buffers = [
	// Back
	Buffer.read(s, soundsDir ++ "user1/c0.wav"),
	Buffer.read(s, soundsDir ++ "user1/e0.wav"),
	Buffer.read(s, soundsDir ++ "user1/d#0.wav"),
	Buffer.read(s, soundsDir ++ "user1/b0.wav"),
	Buffer.read(s, soundsDir ++ "user1/g0.wav"),
	Buffer.read(s, soundsDir ++ "user1/c1.wav"),
	Buffer.read(s, soundsDir ++ "user1/e1.wav"),
	Buffer.read(s, soundsDir ++ "user1/d#1.wav"),
	Buffer.read(s, soundsDir ++ "user1/b1.wav"),
	Buffer.read(s, soundsDir ++ "user1/g1.wav"),
	Buffer.read(s, soundsDir ++ "user1/c2.wav"),
	Buffer.read(s, soundsDir ++ "user1/e2.wav"),
	Buffer.read(s, soundsDir ++ "user1/d#2.wav"),
	Buffer.read(s, soundsDir ++ "user1/b2.wav"),
	Buffer.read(s, soundsDir ++ "user1/g2.wav"),

	// Front
	Buffer.read(s, soundsDir ++ "user2/c00.wav"),
	Buffer.read(s, soundsDir ++ "user2/e00.wav"),
	Buffer.read(s, soundsDir ++ "user2/d#00.wav"),
	Buffer.read(s, soundsDir ++ "user2/b00.wav"),
	Buffer.read(s, soundsDir ++ "user2/g00.wav"),
	Buffer.read(s, soundsDir ++ "user2/c11.wav"),
	Buffer.read(s, soundsDir ++ "user2/e11.wav"),
	Buffer.read(s, soundsDir ++ "user2/d#11.wav"),
	Buffer.read(s, soundsDir ++ "user2/b11.wav"),
	Buffer.read(s, soundsDir ++ "user2/g11.wav"),
	Buffer.read(s, soundsDir ++ "user2/c22.wav"),
	Buffer.read(s, soundsDir ++ "user2/e22.wav"),
	Buffer.read(s, soundsDir ++ "user2/d#22.wav"),
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
		arg out = 0, buf, rate = 1;
		Out.ar(out, PlayBuf.ar(1, buf, rate, loop: 1))
	}).add;

	SynthDef("front"++i, {
		arg out = 0, buf, rate = 1;
		Out.ar(out, PlayBuf.ar(1, buf, rate, loop: 1))
	}).add;
});

SynthDef("ambient", {
	arg out = 0, buf, rate = 1;
	Out.ar(out, PlayBuf.ar(1, buf, rate, loop: 1))
}).add;
)

// Create synths
(
~backSounds = [
	Synth.new(\back0, [\buf, ~buffers[0].bufnum]),
	Synth.new(\back1, [\buf, ~buffers[1].bufnum]),
	Synth.new(\back2, [\buf, ~buffers[2].bufnum]),
	Synth.new(\back3, [\buf, ~buffers[3].bufnum]),
	Synth.new(\back4, [\buf, ~buffers[4].bufnum]),
	Synth.new(\back5, [\buf, ~buffers[5].bufnum]),
	Synth.new(\back6, [\buf, ~buffers[6].bufnum]),
	Synth.new(\back7, [\buf, ~buffers[7].bufnum]),
	Synth.new(\back8, [\buf, ~buffers[8].bufnum]),
	Synth.new(\back9, [\buf, ~buffers[9].bufnum]),
	Synth.new(\back10, [\buf, ~buffers[10].bufnum]),
	Synth.new(\back11, [\buf, ~buffers[11].bufnum]),
	Synth.new(\back12, [\buf, ~buffers[12].bufnum]),
	Synth.new(\back13, [\buf, ~buffers[13].bufnum]),
	Synth.new(\back14, [\buf, ~buffers[14].bufnum]),
];
~frontSounds = [
	Synth.new(\front0, [\buf, ~buffers[15].bufnum]),
	Synth.new(\front1, [\buf, ~buffers[16].bufnum]),
	Synth.new(\front2, [\buf, ~buffers[17].bufnum]),
	Synth.new(\front3, [\buf, ~buffers[18].bufnum]),
	Synth.new(\front4, [\buf, ~buffers[19].bufnum]),
	Synth.new(\front5, [\buf, ~buffers[20].bufnum]),
	Synth.new(\front6, [\buf, ~buffers[21].bufnum]),
	Synth.new(\front7, [\buf, ~buffers[22].bufnum]),
	Synth.new(\front8, [\buf, ~buffers[23].bufnum]),
	Synth.new(\front9, [\buf, ~buffers[24].bufnum]),
	Synth.new(\front10, [\buf, ~buffers[25].bufnum]),
	Synth.new(\front11, [\buf, ~buffers[26].bufnum]),
	Synth.new(\front12, [\buf, ~buffers[27].bufnum]),
	Synth.new(\front13, [\buf, ~buffers[28].bufnum]),
	Synth.new(\front14, [\buf, ~buffers[29].bufnum]),
];
~ambientSound = Synth.new(\ambient, [\buf, ~buffers[30].bufnum]);
)

// Handle OSC messages
(
OSCFunc({
	arg msg;

	~frontSounds[msg[1]].set(\rate, msg[2]);

	msg.postln;
}, '/front', nil, 57120);
OSCFunc({
	arg msg;

	~backSounds[msg[1]].set(\rate, msg[2]);

	msg.postln;
}, '/back', nil, 57120);
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


#include <SDL2/SDL.h>
#include <SDL2/SDL_mixer.h>
#include <lo/lo.h>
#include <signal.h>

#define NUM_SOUNDS (31)
#define FRAME_RATE (60)

static SDL_bool running = SDL_TRUE;

static lo_server_thread server;

static Mix_Chunk *sounds[NUM_SOUNDS] = { NULL };

static const char *filenames[NUM_SOUNDS] = {
	"../public/sounds/user1/c0.wav",
	"../public/sounds/user1/e0.wav",
	"../public/sounds/user1/ds0.wav",
	"../public/sounds/user1/b0.wav",
	"../public/sounds/user1/g0.wav",
	"../public/sounds/user1/c1.wav",
	"../public/sounds/user1/e1.wav",
	"../public/sounds/user1/ds1.wav",
	"../public/sounds/user1/b1.wav",
	"../public/sounds/user1/g1.wav",
	"../public/sounds/user1/c2.wav",
	"../public/sounds/user1/e2.wav",
	"../public/sounds/user1/ds2.wav",
	"../public/sounds/user1/b2.wav",
	"../public/sounds/user1/g2.wav",
	"../public/sounds/user2/c00.wav",
	"../public/sounds/user2/e00.wav",
	"../public/sounds/user2/ds00.wav",
	"../public/sounds/user2/b00.wav",
	"../public/sounds/user2/g00.wav",
	"../public/sounds/user2/c11.wav",
	"../public/sounds/user2/e11.wav",
	"../public/sounds/user2/ds11.wav",
	"../public/sounds/user2/b11.wav",
	"../public/sounds/user2/g11.wav",
	"../public/sounds/user2/c22.wav",
	"../public/sounds/user2/e22.wav",
	"../public/sounds/user2/ds22.wav",
	"../public/sounds/user2/b22.wav",
	"../public/sounds/user2/g22.wav",
	"../public/sounds/ambient.wav",
};

static void serverError(int num, const char *msg, const char *path) {
	fprintf(stderr, "serverError: liblo server error %d in path %s: %s\n", num, path, msg);
	exit(1);
}

static int frontHandler(const char *path, const char *types, lo_arg **argv, int argc, void *data, void *user_data) {
	const int index = argv[0]->i;
	const float volume = argv[1]->f;
	Mix_VolumeChunk(sounds[index + 15], (int) (volume * 128));
}

static int backHandler(const char *path, const char *types, lo_arg **argv, int argc, void *data, void *user_data) {
	const int index = argv[0]->i;
	const float volume = argv[1]->f;
	Mix_VolumeChunk(sounds[index], (int) (volume * 128));
}

static void signalHandler() {
	fprintf(stdout, "Interrupted\n");
	running = SDL_FALSE;
}

static void init() {
	SDL_Init(SDL_INIT_EVERYTHING);

	Mix_Init(MIX_INIT_FLAC);

	Mix_OpenAudio(MIX_DEFAULT_FREQUENCY, MIX_DEFAULT_FORMAT, 2, 2048);

	signal(SIGINT, signalHandler);
	signal(SIGTERM, signalHandler);

	server = lo_server_thread_new("57120", serverError);
	lo_server_thread_add_method(server, "/front", "if", frontHandler, NULL);
	lo_server_thread_add_method(server, "/back", "if", backHandler, NULL);
	lo_server_thread_start(server);
}

static void loadSounds() {
	for (size_t i = 0; i < NUM_SOUNDS; i++) {
		sounds[i] = Mix_LoadWAV(filenames[i]);
		if (!sounds[i]) {
			fprintf(stderr, "loadSounds: %s\n", Mix_GetError());
			exit(1);
		}
	}
}

static void allocateChannels() {
	Mix_AllocateChannels(NUM_SOUNDS * 2);
}

static void muteSounds() {
	for (size_t i = 0; i < NUM_SOUNDS; i++) {
		Mix_VolumeChunk(sounds[i], 0);
	}
}

static void playSounds() {
	for (size_t i = 0; i < NUM_SOUNDS; i++) {
		Mix_PlayChannel(-1, sounds[i], -1);
	}
}

static void loop() {
	while (running) {
		SDL_Delay(1000 / FRAME_RATE);
	}
}

static void freeSounds() {
	for (size_t i = 0; i < NUM_SOUNDS; i++) {
		Mix_FreeChunk(sounds[i]);
	}
}

static void quit() {
	lo_server_thread_free(server);

	Mix_CloseAudio();

	Mix_Quit();

	SDL_Quit();
}

int main() {
	init();

	loadSounds();

	allocateChannels();

	muteSounds();

	playSounds();

	loop();

	freeSounds();

	quit();
}

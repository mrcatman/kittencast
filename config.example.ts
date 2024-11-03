import { Config } from "./src/types";

const config: Config = {
	channels: [
		{
			playlists: [
				{
					name: 'main', // Internal name of a playlist
					url: 'example-data/demo.txt', // URL or file path of the playlist
					mode: 'random', // sequential - will be played in given order, random - will be shuffled
					options: {
						keepFiles: false, // Do not remove files after playback (useful for intros, advertising and other short videos)
						disableLogo: false, // Disable placing logo on videos
						disableTexts: true // Disable placing names on videos
					}
				},
			],

			mode: 'sequential', // sequential - playlists will be played in given order, random - playlists order will be shuffled
			backup: 'example-data/backup.mp4', // Backup video - will be played
			resolution: [1280, 720], // Resolution of converted videos (will be padded if aspect ratio differs)
			logo: 'example-data/logo.png', // Logo
			formatTitle: (title) => `Now playing: ${title}`, // format video titles (optional)
			textOptions: { // Drawtext options, see ffmpeg / fluent-ffmpeg manual for details
				fontsize: 20,
				fontcolor: 'white',
				x: 10,
				y: 10,
				alpha: .5
			},
			slug: 'example', // URLs of channels are: http://localhost:port/slug/index.m3u8
		}
	]
};

export {
	config
}

import * as ffmpeg from 'fluent-ffmpeg'
import { log } from "./logger";
import { ConvertVideoOptions } from "./types";

export const convertVideo = (input: string, output: string, options: ConvertVideoOptions): Promise<void> => {
	return new Promise((resolve, reject) => {
		const ffmpegInstance = ffmpeg(input);

		ffmpeg.ffprobe(input, (err, result) => {
			const { width, height } = result.streams.find(stream => stream.codec_type === 'video');

			let complexFilter = [];

			if (options.resolution) {
				if (width !== options.resolution[0] || height !== options.resolution[1]) {
					complexFilter.push({
						filter: 'scale',
						options: {w: '-1', h: options.resolution[1]},
						inputs: '0:v', outputs: 'scaled'
					})
					if (width / height < options.resolution[0] / options.resolution[1]) {
						complexFilter.push({
							filter: 'pad',
							options: {
								w: options.resolution[0],
								h: options.resolution[1],
								x: '(ow-iw)/2',
								y: '(oh-ih)/2',
							},
							inputs: 'scaled', outputs: 'padded'
						})
					}
				}
			}

			if (options.logo) {
				ffmpegInstance.input(options.logo);
				complexFilter.push({
					filter: 'overlay',
					options: {x: '(main_w-overlay_w)/2', y: '(main_h-overlay_h)/2'},
					inputs: `[${complexFilter.length ? complexFilter[complexFilter.length - 1].outputs : '0:v'}][1:v]`,
					outputs: 'overlayed'
				})
			}

			if (options.text) {
				complexFilter.push({
					filter: 'drawtext',
					options: options.text,
					inputs: complexFilter.length ? complexFilter[complexFilter.length - 1].outputs : '0:v',
					outputs: 'with_text'
				})
			}

			if (complexFilter.length) {
				complexFilter[complexFilter.length - 1].outputs = undefined;
				ffmpegInstance.complexFilter(complexFilter);
			}

			ffmpegInstance.addOption(['-f', 'hls'])
				.addOption(['-vsync', '1'])
				.addOption(['-hls_time', '10'])
				.addOption(['-hls_playlist_type', 'vod'])
				.addOption(['-preset', 'ultrafast'])
				.audioCodec('copy')
				.output(output)
				.on('progress', function (progress) {
					log(`${input}: Processed ${progress.percent.toFixed(2)}%`, true);
				})
				.on('error', function (err, stdout, stderr) {
					log(`An error occurred: ${stdout} ${stderr}`);
					reject(err);
				})
				.on('end', function () {
					log('Processing finished!');
					resolve();
				})
				.run();
		});
	});
}

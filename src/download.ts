import { youtubeDl } from './youtube-dl'
import { log } from "./logger";

export const downloadVideo = async (url: string, output: string): Promise<void> => {
	return new Promise(async (resolve, reject) => {

		let format = 'bestvideo[height<=480]+bestaudio/best[height<=480]';
		if (url.includes('vk.com')) {
			const info = await youtubeDl.getVideoInfo(url);
			format = info.formats.filter(formatInfo => formatInfo.format_id.startsWith('hls')).pop().format_id;
		}
		log(`Downloading ${url} to ${output}... (format: ${format}`);

		youtubeDl.exec([
			url,
			'-f',
			format,
			'-o',
			output,
		])
			.on('ytDlpEvent', (eventType, eventData) =>
				log(`${url}: ${eventType} ${eventData}`, true)
			)
			.on('error', reject)
			.on('close', () => {
				log(`Downloaded ${url}`);
				setTimeout(() => {
					resolve();
				}, 2000)
			});
	})
}

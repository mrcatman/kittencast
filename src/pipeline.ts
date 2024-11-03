import { Channel, PipelineOptions, Video, VideoSource } from "./types";
import { existsSync, promises } from "fs";
import { downloadVideo } from "./download";
import { convertVideo } from "./convert";
import { log } from "./logger";
import { getDuration, getSegments } from "./segments";
import { getFullPath, getFullFontPath, isUrl } from "./helpers";
const { mkdir, rename } = promises;

export const pipeline = async(source: VideoSource, channel: Channel, options?: PipelineOptions): Promise<Video> => {
	log(`${source.id}: Pipeline start`);

	const hlsDirectory = `storage/${source.id}`;
	const hlsDirectoryRelative = `/${hlsDirectory}`;
	const hlsDirectoryTemp = getFullPath(`${hlsDirectory}-temp`);
	const hlsDirectoryFinal = getFullPath(hlsDirectory);

	const hlsOutputTemp = `${hlsDirectoryTemp}/index.m3u8`;
	const hlsOutputFinal = `${hlsDirectoryFinal}/index.m3u8`;

	const logoPath = channel.config.logo && !options?.disableLogo ? channel.config.logo : null;
	const logo = logoPath && existsSync(getFullPath(logoPath)) ? getFullPath(logoPath) : null;

	const text = source.title && channel.config.textOptions && !options.disableText ? {
		...channel.config.textOptions,
		text: channel.config.formatTitle ? channel.config.formatTitle(source.title) : source.title,
		fontfile: channel.config.textOptions.fontfile ? getFullFontPath(channel.config.textOptions.fontfile) : undefined
	} : null;

	const resolution = channel.config.resolution;

	if (!existsSync(hlsDirectoryFinal) || !existsSync(hlsOutputFinal)) {
		let input: string;
		if (isUrl(source.url)) {
			input = getFullPath(`temp/${source.id}.mp4`);
			if (!existsSync(input)) {
				await downloadVideo(source.url, input);
			}
		} else {
			input = getFullPath(source.url);
		}
		await mkdir(hlsDirectoryTemp, {recursive: true});

		await convertVideo(input, hlsOutputTemp, {
			resolution,
			logo,
			text
		});
		await rename(hlsDirectoryTemp, hlsDirectoryFinal);

		//await unlink(tempOutput);
	}

	const segments = await getSegments(hlsOutputFinal);
	const duration = getDuration(segments);
	const video = {
		source,
		directory: hlsDirectoryRelative,
		segments,
		duration
	} as Video;

	log(`${source.id}: Pipeline end`);
	return video;
}


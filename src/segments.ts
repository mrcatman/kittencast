import { Video, VideoSegment } from "./types";
import { promises } from "fs";
const { readFile } = promises;

export const getSegments = async(playlist: string): Promise<VideoSegment[]> => {
	const lines = (await readFile(playlist, 'utf8')).split('\n');

	const segments: VideoSegment[] = [];
	lines.forEach((line, index) => {
		if (line.startsWith('#EXTINF')) {
			const duration = parseFloat(line.replace('#EXTINF:', '').replace(',', '')) * 1000;
			const filename = lines[index + 1];
			segments.push({
				duration,
				filename
			})
		}
	})
	return segments;
}

export const getDuration = (segments: VideoSegment[]): number => {
	return segments.reduce((partialSum, segment) => partialSum + segment.duration, 0);
}

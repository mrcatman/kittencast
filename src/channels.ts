import { config } from "../config";
import { Channel, ChannelPlaylist, ScheduleVideoOptions, VideoSource } from "./types";
import { pipeline } from "./pipeline";
import { HLS_MAX_SEGMENTS } from "./consts";
import { log } from "./logger";

const channels: Array<Channel> = config.channels.map(channelConfig => {
	return {
		config: channelConfig,
		playlists: channelConfig.playlists.map(playlistConfig => {
			return {
				config: playlistConfig,
				loaded: false,
				sources: [],
				index: 0
			}
		}),
		mediaSequence: 0,
		discontinuitySequence: 0,
		scheduledVideos: []
	}
})

const loadAndScheduleVideo = async(source: VideoSource, channel: Channel, options?: ScheduleVideoOptions) => {

	const keepFile = options?.keepFiles;
	const disableLogo = options?.disableLogo;

	const video = await pipeline(source, channel, {
		disableLogo
	});
	const start = channel.scheduledVideos.length
		? channel.scheduledVideos[channel.scheduledVideos.length - 1].start + channel.scheduledVideos[channel.scheduledVideos.length - 1].video.duration
		: new Date().getTime()

	log(`${channel.config.slug}: Added video "${source.title}" at time ${new Date(start).toLocaleString()}`);

	channel.scheduledVideos.push({
		keepFile,
		video,
		start
	})
}

const removePlayedVideos = (channel: Channel) => {
	const now = new Date().getTime();
	const playedVideos = channel.scheduledVideos.filter(item => item.start + item.video.duration < now);
	if (!playedVideos.length) {
		return;
	}

	channel.mediaSequence += playedVideos.length;
	channel.discontinuitySequence += playedVideos.reduce((partialSum, item) => partialSum + item.video.duration, 0);

	channel.scheduledVideos = channel.scheduledVideos.filter(item => item.start + item.video.duration >= now);

	log(`${channel.config.slug}: removed ${playedVideos.length} played videos from playlist`);
}


const getHlsPlaylist = (slug: string): string => {
	const channel = channels.find(channel => channel.config.slug === slug);
	if (!channel) {
		throw new Error('Channel not found');
	}
	const now = new Date().getTime();
	const scheduledVideos = channel.scheduledVideos;

	let mediaSequence = channel.mediaSequence;
	let discontinuitySequence = channel.discontinuitySequence;
	let targetDuration = 0;
	let segmentsCount = 0;

	const segments: Array<string> = [];
	for (const playlistItem of scheduledVideos) {
		let segmentTime = playlistItem.start;
		for (const segment of playlistItem.video.segments) {
			if (segmentsCount >= HLS_MAX_SEGMENTS) {
				break;
			}
			if (segmentTime > now) {
				if (segment.duration > targetDuration) {
					targetDuration = segment.duration;
				}
				segments.push(
					`#EXTINF:${(segment.duration / 1000).toFixed(3)},\n${playlistItem.video.directory}/${segment.filename}`
				);
				segmentsCount++;
			} else {
				mediaSequence++;
			}
			segmentTime += segment.duration;
		}
		if (segments.length >= HLS_MAX_SEGMENTS) {
			break;
		}
		discontinuitySequence++;
		if (segments.length) {
			segments.push('#EXT-X-DISCONTINUITY');
		}
	}
	if (!segments.length && channel.backup) {
		return [
			'#EXTM3U',
			`#EXT-X-TARGETDURATION:${channel.backup.duration}`,
			'#EXT-X-VERSION:3',
			'#EXT-X-MEDIA-SEQUENCE:0',
			'#EXT-X-PLAYLIST-TYPE:VOD',
			...channel.backup.segments.map(segment => `#EXTINF:${(segment.duration / 1000).toFixed(3)},\n${channel.backup.directory}/${segment.filename}`),
			'#EXT-X-ENDLIST'
		].join('\n');
	}

	return [
		'#EXTM3U',
		`#EXT-X-TARGETDURATION:${targetDuration / 1000}`,
		'#EXT-X-ALLOW-CACHE:NO',
		'#EXT-X-VERSION:3',
		`#EXT-X-MEDIA-SEQUENCE:${mediaSequence}`,
		`#EXT-X-DISCONTINUITY-SEQUENCE:${discontinuitySequence}`,
		...segments
	].join('\n');
}

export {
	channels,
	getHlsPlaylist,
	loadAndScheduleVideo,
	removePlayedVideos
}

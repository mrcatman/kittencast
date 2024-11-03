export interface VideoSource {
	id: string;
	url: string;
	title?: string;
}

export interface VideoSegment {
	filename: string;
	duration: number;
}
export interface Video {
	source: VideoSource;
	directory: string;
	segments: VideoSegment[];
	duration: number;
}

export interface VideoScheduledItem {
	start: number;
	video: Video;
	keepFile: boolean;
}

type ChannelPlaylistConfigMode = 'random' | 'sequential';

export interface ChannelPlaylistConfig {
	name?: string;
	frequency?: number;
	url: string;
	mode: ChannelPlaylistConfigMode;
	options: {
		keepFiles?: boolean;
		disableLogo?: boolean;
		disableTexts?: boolean;
	}
}

type ChannelConfigMode = 'random' | 'sequential';

export interface ChannelConfig {
	playlists: Array<ChannelPlaylistConfig>;
	mode: ChannelConfigMode;
	backup: string;
	slug: string;
	resolution: [number, number];
	logo: string;
	textOptions: any;
	formatTitle?: (title: string) => string;
}

export interface Config {
	channels: Array<ChannelConfig>;
}

export interface ChannelPlaylist {
	config: ChannelPlaylistConfig;
	loaded: boolean;
	index: number;
	sources: Array<VideoSource>;
}

export interface Channel {
	config: ChannelConfig;
	mediaSequence: number;
	discontinuitySequence: number;
	playlistIndex?: number;
	playlists: Array<ChannelPlaylist>;
	scheduledVideos: Array<VideoScheduledItem>;
	backup?: Video;
}

export interface Task {
	id: string;
	channel: string;
	execute: () => Promise<void>;
	active: boolean;
}

export interface PipelineOptions {
	disableLogo?: boolean;
	disableText?: boolean;
}

export interface ScheduleVideoOptions {
	keepFiles?: boolean;
	disableLogo?: boolean;
}

export interface ConvertVideoOptions {
	resolution?: [number, number];
	logo?: string;
	text?: any;
}

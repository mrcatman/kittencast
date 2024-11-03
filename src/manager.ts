import { Channel, ChannelPlaylist, Task } from "./types";
import { channels, loadAndScheduleVideo, removePlayedVideos } from "./channels";
import {
	MAX_SIMULTANEOUS_TASKS,
	MAX_SCHEDULED_ITEMS,
	PLAYLIST_MANAGER_POLLING_TIME,
	PLAYLIST_MANAGER_RELOAD_INTERVAL_ON_ERROR
} from "./consts";
import { loadPlaylist } from "./playlists";
import { log } from "./logger";
import { shuffle } from "./helpers";
import { pipeline } from "./pipeline";


const loadPlaylists = async (): Promise<boolean> => {
	let loadedAll = true;
	for (const channel of channels) {
		for (const playlist of channel.playlists) {
			if (!playlist.loaded) {
				try {
					log(`${channel.config.slug}: loading playlist "${playlist.config.name}"`);
					const sources = await loadPlaylist(playlist.config);
					playlist.loaded = true;
					playlist.sources = sources;
					log(`${channel.config.slug}: loaded playlist "${playlist.config.name}": ${sources.length} source(s)`);
				} catch (e) {
					loadedAll = false;
					log(`${channel.config.slug}: playlist "${playlist.config.name}" could not be loaded: ${e.toString()}`);
				}
			}
		}
	}
	return loadedAll;
}

const tryToLoadPlaylists = async () => {
	const status = await loadPlaylists();
	if (!status) {
		setTimeout(tryToLoadPlaylists, PLAYLIST_MANAGER_RELOAD_INTERVAL_ON_ERROR);
	}
}

const getNextPlaylist = (channel: Channel): ChannelPlaylist  => {
	const loadedPlaylists = channel.playlists.filter(playlist => playlist.loaded);
	if (channel.config.mode === 'random') {
		const playlistsWithFrequency = [];
		loadedPlaylists.forEach((playlist) => {
			for (let i = 0; i < (playlist.config.frequency || 1); i++) {
				playlistsWithFrequency.push(playlist);
			}
		})
		return playlistsWithFrequency[Math.floor(Math.random() * playlistsWithFrequency.length)];
	} else {
		channel.playlistIndex = channel.playlistIndex < loadedPlaylists.length - 1 ? channel.playlistIndex + 1 : 0;
		return loadedPlaylists[channel.playlistIndex];
	}
}

const getNextSource = (playlist: ChannelPlaylist) => {
	playlist.index = playlist.index < playlist.sources.length - 1 ? playlist.index + 1 : 0;
	if (playlist.index === 0 && playlist.config.mode === 'random') {
		shuffle(playlist.sources);
	}
	const source = playlist.sources[playlist.index];
	return source;
}

let tasks: Task[] = [];
let checkInterval: NodeJS.Timeout;

const nextTask = async () => {
	if (tasks.filter(task => task.active).length < MAX_SIMULTANEOUS_TASKS) {
		const currentTask = tasks.find(task => !task.active);
		if (currentTask) {
			currentTask.active = true;
			await currentTask.execute();
			tasks = tasks.filter(task => task.id !== currentTask.id);
			nextTask();
		}
	}
}

const addNewTask = () => {
	const now = new Date().getTime();
	const channel = channels.filter(
		channel => !!channel.playlists.find(playlist => playlist.loaded)
			&& channel.scheduledVideos.filter(item => item.start > now).length < MAX_SCHEDULED_ITEMS
			&& !tasks.find(task => task.channel === channel.config.slug)
	).sort((a, b) => a.scheduledVideos.at(-1).start - b.scheduledVideos.at(-1).start)[0];
	if (!channel) {
		return;
	}
	const playlist = getNextPlaylist(channel);
	const source = getNextSource(playlist);
	if (tasks.filter(task => task.id === source.id).length) {
		return;
	}
	const options = {
		keepFiles: playlist.config.options.keepFiles,
		disableLogo: playlist.config.options.disableLogo,
		disableText: playlist.config.options.disableTexts
	}
	tasks.push({
		id: source.id,
		channel: channel.config.slug,
		execute: () => loadAndScheduleVideo(source, channel, options),
		active: false
	});
	nextTask();
}

const prepareBackups = async() => {
	for (const channel of channels) {
		log(`Preparing backup video for ${channel.config.slug}`);
		channel.backup = await pipeline({
			id: `${channel.config.slug}-backup`,
			title: 'testbackup',
			url: channel.config.backup
		}, channel, {
			disableLogo: true,
			disableText: true
		});
	}
}

const removeAllPlayedVideos = () => {
	for (const channel of channels) {
		removePlayedVideos(channel);
	}
}

const start = async() => {
	await prepareBackups();
	await tryToLoadPlaylists();

	addNewTask();
	checkInterval = setInterval(() => {
		removeAllPlayedVideos();
		addNewTask();
	}, PLAYLIST_MANAGER_POLLING_TIME);
}

export {
	start
}

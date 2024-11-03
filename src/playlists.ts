import { ChannelPlaylistConfig, VideoSource } from "./types";
import { existsSync, promises } from "fs";
import { getFullPath, isUrl } from "./helpers";
const { readFile } = promises;

const makeId = (url: string) => {
	return btoa(unescape(encodeURIComponent( url ))).replaceAll('=', '');
}

const loadFromUrl = async (url: string): Promise<string> => {
	const result = await fetch(url);
	return await result.text();
}

const loadFromFile = async (path: string): Promise<string> => {
	const fullPath = getFullPath(path);
	if (!existsSync(fullPath)) {
		throw new Error(`Playlist file ${fullPath} doesn't exist`);
	}
	return await readFile(fullPath, 'utf8');
}

const loadPlaylist = async (playlist: ChannelPlaylistConfig): Promise<VideoSource[]> => {
	const playlistAsString = await (isUrl(playlist.url) ? loadFromUrl(playlist.url) : loadFromFile(playlist.url));
	return playlistAsString.replaceAll('\r', '').split('\n')
		.filter(str => str.trim().length)
		.join('\n')
		.split('\n\n')
		.map(item => item.split('\n')).filter(item => item.length)
		.map(item => {
		if (item.length > 2) {
			return {
				id: item[0],
				title: item[1],
				url: item[2]
			}
		}
		if (item.length > 1) {
			return {
				id: makeId(item[1]),
				title: item[0],
				url: item[1]
			}
		}
		return {
			id: makeId(item[0]),
			url: item[0],
		}
	});
}

export {
	loadPlaylist
}

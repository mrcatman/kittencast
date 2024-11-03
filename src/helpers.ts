import { isAbsolute, resolve } from "path";

export const shuffle = (array: Array<any>): void => {
	let currentIndex = array.length;
	while (currentIndex != 0) {
		let randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;
		[array[currentIndex], array[randomIndex]] = [
			array[randomIndex], array[currentIndex]];
	}
}

export const getFullPath = (path: string) => {
	return isAbsolute(path) ? path : resolve(__dirname, `../${path}`);
}

export const getFullFontPath = (path: string) => {
	return getFullPath(path).replaceAll('\\', '/').replaceAll(':/', '\\\\:/');
}

export const isUrl = (url: string) => {
	return url.startsWith('http:') || url.startsWith('https:') || url.startsWith('//');
}

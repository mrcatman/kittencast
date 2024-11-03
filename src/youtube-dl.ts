import { resolve } from "path";
import YTDlpWrap from 'yt-dlp-wrap';

const customBinaryPath = resolve(__dirname, '../bin/yt-dlp.exe')
const youtubeDl = new YTDlpWrap(customBinaryPath);

export {
	youtubeDl
}

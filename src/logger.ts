export const log = (text: string, update: boolean = false) => {
	const textWithTime = `[${new Date().toLocaleTimeString()}] ${text}`;
	process.stdout.write(`${update ? '' : '\n'}${textWithTime}${update ? '\r' : ''}`);
}

import Fastify from 'fastify'
import * as fastifyStatic from "@fastify/static";
import { join } from 'path'
import { getHlsPlaylist } from './channels'

const server = Fastify({
	logger: true
})

interface hlsPlaylistParams {
	slug: string;
}

server.register(fastifyStatic, {
	root: join(__dirname, '../storage'),
	prefix: '/storage/'
})

// @ts-ignore
server.get<{ Params: hlsPlaylistParams }>('/:slug/index.m3u8', (request, reply) => {
	const { slug } = request.params;
	const response = getHlsPlaylist(slug);
	reply.send(response)
})

export {
	server
}

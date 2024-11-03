import { server } from "./src/server";
import { start } from "./src/manager";
import { HTTP_PORT } from "./src/consts";

server.listen({ port: HTTP_PORT }, (err, address) => {
	if (err) throw err
});

start()

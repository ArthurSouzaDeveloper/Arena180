import { createServer } from "node:http";
import { getToken } from "next-auth/jwt";
import next from "next";
import { Server } from "socket.io";
import { statusPermiteChat, usuarioParticipaContratacao } from "./src/lib/chat";
import { prisma } from "./src/lib/prisma";
import { mensagemSchema } from "./src/lib/validation";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = Number(process.env.PORT ?? 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

function nomeSala(conversaId: string): string {
  return `conversa:${conversaId}`;
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));
  const io = new Server(httpServer);

  io.use(async (socket, next) => {
    const token = await getToken({
      req: { headers: socket.request.headers as Record<string, string> },
      secret: process.env.AUTH_SECRET,
    });

    if (!token?.sub) {
      next(new Error("Não autorizado."));
      return;
    }

    socket.data.usuarioId = token.sub;
    next();
  });

  io.on("connection", (socket) => {
    const usuarioId = socket.data.usuarioId as string;

    socket.on("conversa:entrar", async (conversaId: string) => {
      const conversa = await prisma.conversa.findUnique({
        where: { id: conversaId },
        include: { contratacao: true },
      });

      if (
        !conversa ||
        !usuarioParticipaContratacao(conversa.contratacao, usuarioId) ||
        !statusPermiteChat(conversa.contratacao.status)
      ) {
        socket.emit("conversa:erro", "Você não tem acesso a essa conversa.");
        return;
      }

      socket.join(nomeSala(conversaId));
    });

    socket.on(
      "mensagem:enviar",
      async (payload: { conversaId: string; texto: string }) => {
        const conversa = await prisma.conversa.findUnique({
          where: { id: payload?.conversaId },
          include: { contratacao: true },
        });

        if (
          !conversa ||
          !usuarioParticipaContratacao(conversa.contratacao, usuarioId) ||
          !statusPermiteChat(conversa.contratacao.status)
        ) {
          socket.emit("conversa:erro", "Você não tem acesso a essa conversa.");
          return;
        }

        const parsed = mensagemSchema.safeParse({ texto: payload.texto });
        if (!parsed.success) {
          socket.emit("conversa:erro", "Mensagem inválida.");
          return;
        }

        const mensagem = await prisma.mensagem.create({
          data: {
            conversaId: conversa.id,
            remetenteId: usuarioId,
            texto: parsed.data.texto,
          },
          include: { remetente: { select: { nome: true } } },
        });

        io.to(nomeSala(conversa.id)).emit("mensagem:nova", mensagem);
      },
    );
  });

  httpServer.listen(port, () => {
    console.log(`> Arena180 rodando em http://${hostname}:${port}`);
  });
});

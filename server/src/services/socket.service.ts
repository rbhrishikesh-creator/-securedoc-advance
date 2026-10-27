import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { TokenService } from './token.service';

let io: SocketIOServer | null = null;

export class SocketService {
  static init(server: HttpServer, allowedOrigin: string): SocketIOServer {
    io = new SocketIOServer(server, {
      cors: {
        origin: allowedOrigin || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    io.use((socket: Socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (token) {
        try {
          const decoded = TokenService.verifyJwt(token);
          (socket as any).user = decoded;
        } catch {
          // Allow connection as guest if needed, or proceed
        }
      }
      next();
    });

    io.on('connection', (socket: Socket) => {
      const user = (socket as any).user;
      if (user) {
        socket.join(`user:${user.userId}`);
      }

      // Join document collaboration room
      socket.on('join:document', (documentId: string) => {
        socket.join(`doc:${documentId}`);
      });

      // Leave document room
      socket.on('leave:document', (documentId: string) => {
        socket.leave(`doc:${documentId}`);
      });

      socket.on('disconnect', () => {
        // cleanup
      });
    });

    return io;
  }

  static getIO(): SocketIOServer | null {
    return io;
  }

  /**
   * Broadcasts document changes (new version, rename, restore, delete) to the document room
   */
  static emitDocumentUpdate(documentId: string, event: string, payload: any): void {
    if (io) {
      io.to(`doc:${documentId}`).emit(event, payload);
      // Also broadcast general activity
      io.emit('activity:feed', {
        type: 'document_change',
        documentId,
        event,
        payload,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Broadcasts a new comment in real-time
   */
  static emitCommentAdded(documentId: string, comment: any): void {
    if (io) {
      io.to(`doc:${documentId}`).emit('comment:added', comment);
    }
  }

  /**
   * Delivers private notification to a specific user (e.g., when a document is shared with them)
   */
  static emitUserNotification(userId: string, notification: any): void {
    if (io) {
      io.to(`user:${userId}`).emit('notification', notification);
    }
  }
}

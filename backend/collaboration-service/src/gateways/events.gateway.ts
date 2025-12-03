import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/ws',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<number, Set<string>> = new Map();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      client.data.userId = payload.userId;
      client.data.projectIds = payload.projectIds || [];
      client.data.teamIds = payload.teamIds || [];

      // Track user connections
      if (!this.userSockets.has(payload.userId)) {
        this.userSockets.set(payload.userId, new Set());
      }
      this.userSockets.get(payload.userId)?.add(client.id);

      console.log(`Client connected: ${client.id}, User: ${payload.userId}`);
    } catch (error) {
      console.error('WebSocket authentication failed:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId && this.userSockets.has(userId)) {
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    }
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-project')
  handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() projectId: number,
  ) {
    const room = `project-${projectId}`;
    client.join(room);
    console.log(`Client ${client.id} joined ${room}`);
  }

  @SubscribeMessage('join-sprint')
  handleJoinSprint(
    @ConnectedSocket() client: Socket,
    @MessageBody() sprintId: number,
  ) {
    const room = `sprint-${sprintId}`;
    client.join(room);
    console.log(`Client ${client.id} joined ${room}`);
  }

  @SubscribeMessage('leave-project')
  handleLeaveProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() projectId: number,
  ) {
    const room = `project-${projectId}`;
    client.leave(room);
    console.log(`Client ${client.id} left ${room}`);
  }

  @SubscribeMessage('leave-sprint')
  handleLeaveSprint(
    @ConnectedSocket() client: Socket,
    @MessageBody() sprintId: number,
  ) {
    const room = `sprint-${sprintId}`;
    client.leave(room);
    console.log(`Client ${client.id} left ${room}`);
  }

  // Emit methods to be called from services
  emitToProject(projectId: number, event: string, data: any) {
    this.server.to(`project-${projectId}`).emit(event, data);
  }

  emitToSprint(sprintId: number, event: string, data: any) {
    this.server.to(`sprint-${sprintId}`).emit(event, data);
  }

  emitToUser(userId: number, event: string, data: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach(socketId => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }
}

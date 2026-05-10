import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Sidebar } from '../components/layout/Sidebar';
import { ChatPanel } from '../components/room/ChatPanel';
import { Button } from '../components/ui/Button';
import { GameAreaSkeleton } from '../components/ui/SkeletonLoader';
import { TicTacToe } from '../components/games/TicTacToe';
import { ConnectFour } from '../components/games/ConnectFour';
import { RockPaperScissors } from '../components/games/RockPaperScissors';
import { Hangman } from '../components/games/Hangman';
import type { Room as RoomType, Message, RoomMember } from '../types/room.types';
import type { GameType, GameStartedEvent, GameStateEvent, GameEndEvent, GamePlayer } from '../types/game.types';

interface RoomStateResponse {
  room: {
    id: string;
    name: string;
    type: string;
    maxMembers: number;
  };
  members: Array<{
    userId: string;
    username: string;
    displayName: string;
    role: 'OWNER' | 'MEMBER' | 'SPECTATOR';
    isOnline: boolean;
  }>;
  messages: Array<{
    id: string;
    content: string;
    type: 'CHAT' | 'GAME_LOG';
    userId: string;
    username: string;
    displayName: string;
    createdAt: string;
  }>;
  activeGame: {
    gameId: string;
    gameType: string;
    status: string;
    state: Record<string, unknown>;
    players: Array<{
      userId: string;
      username: string;
      displayName: string;
      role: string;
      playerIndex: number;
    }>;
  } | null;
  userRole: 'OWNER' | 'MEMBER' | 'SPECTATOR';
}

const GAME_TYPES: { value: GameType; label: string; icon: string }[] = [
  { value: 'TIC_TAC_TOE', label: 'Tic-Tac-Toe', icon: '⊞' },
  { value: 'CONNECT_FOUR', label: 'Connect Four', icon: '◉' },
  { value: 'ROCK_PAPER_SCISSORS', label: 'Rock Paper Scissors', icon: '✊' },
  { value: 'HANGMAN', label: 'Hangman', icon: '✎' },
];

export function Room() {
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { socket, isAuthenticated } = useSocket();
  const { addToast } = useToast();

  const [room, setRoom] = useState<RoomType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [myRole, setMyRole] = useState<string>('MEMBER');
  const [isLoadingState, setIsLoadingState] = useState(true);

  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [activeGameType, setActiveGameType] = useState<GameType | null>(null);
  const [gameState, setGameState] = useState<Record<string, unknown> | null>(null);
  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>([]);
  const [gameResult, setGameResult] = useState<GameEndEvent | null>(null);
  const [stateRecoveryError, setStateRecoveryError] = useState<string | null>(null);

  /* Fetch room data */
  useEffect(() => {
    if (!roomId || !token) return;
    api.get<RoomType>(`/api/rooms/${roomId}`, token).then((data) => {
      setRoom(data);
      setMembers(data.members);
    }).catch(() => navigate('/dashboard'));
  }, [roomId, token, navigate]);

  /* State recovery function */
  const recoverState = useCallback(() => {
    if (!socket || !isAuthenticated || !roomId) return;

    setIsLoadingState(true);
    setStateRecoveryError(null);
    
    const timeoutId = setTimeout(() => {
      setIsLoadingState(false);
      setStateRecoveryError('Failed to load room state - timeout');
      addToast('error', 'Failed to load room state - timeout');
    }, 5000);

    socket.emit('room:get_state', { roomId }, (res: RoomStateResponse | { error: string }) => {
      clearTimeout(timeoutId);
      setIsLoadingState(false);

      if ('error' in res) {
        setStateRecoveryError(res.error);
        addToast('error', res.error);
        
        // Redirect to dashboard for unrecoverable errors
        if (res.error === 'Room not found' || res.error === 'Not a member of this room') {
          navigate('/dashboard');
        }
        return;
      }

      // Clear error on successful recovery
      setStateRecoveryError(null);

      setRoom(res.room as RoomType);
      
      const transformedMembers: RoomMember[] = res.members.map((m) => ({
        id: `${m.userId}-${res.room.id}`,
        userId: m.userId,
        roomId: res.room.id,
        role: m.role,
        user: {
          id: m.userId,
          username: m.username,
          displayName: m.displayName,
        },
      }));
      setMembers(transformedMembers);
      setMyRole(res.userRole);

      const transformedMessages: Message[] = res.messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        type: msg.type,
        userId: msg.userId,
        roomId: res.room.id,
        createdAt: msg.createdAt,
        user: {
          id: msg.userId,
          username: msg.username,
          displayName: msg.displayName,
        },
      }));
      setMessages(transformedMessages);

      if (res.activeGame) {
        setActiveGameId(res.activeGame.gameId);
        setActiveGameType(res.activeGame.gameType as GameType);
        setGameState(res.activeGame.state as Record<string, unknown>);
        
        const transformedPlayers: GamePlayer[] = res.activeGame.players.map((p) => ({
          id: `${p.userId}-${res.activeGame!.gameId}`,
          gameId: res.activeGame!.gameId,
          userId: p.userId,
          role: p.role,
          playerIndex: p.playerIndex,
          user: {
            id: p.userId,
            username: p.username,
            displayName: p.displayName,
          },
        }));
        setGamePlayers(transformedPlayers);
        setGameResult(null);
      } else {
        setActiveGameId(null);
        setActiveGameType(null);
        setGameState(null);
        setGamePlayers([]);
        setGameResult(null);
      }
    });
  }, [socket, isAuthenticated, roomId, navigate, addToast]);

  /* Join room via socket */
  useEffect(() => {
    if (!socket || !isAuthenticated || !roomId) return;

    socket.emit('room:join', { roomId }, (res: { error?: string }) => {
      if (res?.error) {
        addToast('error', res.error);
      } else {
        recoverState();
      }
    });

    return () => {
      socket.emit('room:leave', { roomId });
    };
  }, [socket, isAuthenticated, roomId, addToast, recoverState]);

  /* Socket event listeners */
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const onJoined = (data: { roomId: string; role: string }) => {
      setMyRole(data.role);
    };

    const onRoomUpdated = (updatedRoom: RoomType) => {
      setRoom(updatedRoom);
      setMembers(updatedRoom.members);
    };

    const onMessageReceived = (message: Message) => {
      setMessages((prev) => [...prev, message]);
    };

    const onGameStarted = (data: GameStartedEvent) => {
      setActiveGameId(data.gameId);
      setActiveGameType(data.gameType);
      setGameState(data.state);
      setGamePlayers(data.players);
      setGameResult(null);
    };

    const onGameState = (data: GameStateEvent) => {
      setGameState(data.state);
    };

    const onGameEnd = (data: GameEndEvent) => {
      setGameResult(data);
      if (data.state) {
        setGameState(data.state);
      }
      
      if (data.result === 'draw') {
        addToast('success', 'Game ended in a draw!');
      } else if (data.winnerId) {
        // Use gamePlayers state directly to avoid stale closure
        setGamePlayers((currentPlayers) => {
          const winner = currentPlayers.find((p) => p.userId === data.winnerId);
          addToast('success', `${winner?.user.displayName || 'Player'} wins!`);
          return currentPlayers;
        });
      }
      
      if (data.reason === 'disconnect_timeout') {
        addToast('warning', 'Opponent disconnected - game ended');
      } else if (data.reason === 'player_left') {
        addToast('warning', 'An opponent left the room - game ended');
        setActiveGameId(null);
        setActiveGameType(null);
        setGameState(null);
        setGamePlayers([]);
        setGameResult(null);
      }
    };

    const onUserLeft = (data: { userId: string; username: string }) => {
      setMembers((prev) => prev.map((m) => m.userId === data.userId ? { ...m, isOnline: false } : m));
    };

    socket.on('room:joined', onJoined);
    socket.on('room:updated', onRoomUpdated);
    socket.on('room:user_left', onUserLeft);
    socket.on('message:received', onMessageReceived);
    socket.on('game:started', onGameStarted);
    socket.on('game:state', onGameState);
    socket.on('game:end', onGameEnd);

    return () => {
      socket.off('room:joined', onJoined);
      socket.off('room:updated', onRoomUpdated);
      socket.off('room:user_left', onUserLeft);
      socket.off('message:received', onMessageReceived);
      socket.off('game:started', onGameStarted);
      socket.off('game:state', onGameState);
      socket.off('game:end', onGameEnd);
    };
  }, [socket, isAuthenticated]);

  /* Game actions */
  const handleStartGame = useCallback((gameType: GameType) => {
    if (!socket || !roomId) return;
    socket.emit('game:start', { roomId, gameType }, (res: { error?: string }) => {
      if (res?.error) addToast('error', res.error);
    });
  }, [socket, roomId, addToast]);

  const handleMove = useCallback((move: Record<string, unknown>) => {
    if (!socket || !roomId || !activeGameId) return;
    socket.emit('game:move', { gameId: activeGameId, roomId, move }, (res: { error?: string }) => {
      // Display error toast for any game move errors, including role-based errors
      // (e.g., "Only the Word Guesser can guess letters" for Hangman)
      if (res?.error) addToast('error', res.error);
    });
  }, [socket, roomId, activeGameId, addToast]);

  /* Check if current user is room owner */
  const isOwner = myRole === 'OWNER' || members.some((m) => m.userId === user?.id && m.role === 'OWNER');

  /* Build player display list */
  const playerDisplayList = useMemo(() => gamePlayers.map((gp) => ({
    userId: gp.userId,
    displayName: gp.user.displayName,
  })), [gamePlayers]);

  /* Render game component */
  const renderGame = () => {
    if (!gameState || !activeGameType || !user) return null;

    const commonProps = {
      onMove: handleMove,
      currentUserId: user.id,
      players: playerDisplayList,
    };

    switch (activeGameType) {
      case 'TIC_TAC_TOE':
        return <TicTacToe gameState={gameState as Parameters<typeof TicTacToe>[0]['gameState']} {...commonProps} />;
      case 'CONNECT_FOUR':
        return <ConnectFour gameState={gameState as Parameters<typeof ConnectFour>[0]['gameState']} {...commonProps} />;
      case 'ROCK_PAPER_SCISSORS':
        return <RockPaperScissors gameState={gameState as Parameters<typeof RockPaperScissors>[0]['gameState']} {...commonProps} />;
      case 'HANGMAN':
        return <Hangman gameState={gameState as Parameters<typeof Hangman>[0]['gameState']} {...commonProps} />;
      default:
        return null;
    }
  };

  if (!room || isLoadingState || stateRecoveryError) {
    return (
      <div className="flex h-screen bg-bg-base">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          {stateRecoveryError ? (
            <div className="text-center animate-fade-in">
              <p className="text-white text-sm mb-4">Failed to load room state</p>
              <p className="text-text-muted text-xs mb-6">{stateRecoveryError}</p>
              <Button variant="outlined" onClick={recoverState}>
                Retry
              </Button>
            </div>
          ) : (
            <GameAreaSkeleton />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-bg-base">
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Room header */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-text-muted hover:text-white transition-colors duration-200 cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-white font-semibold text-sm">{room.name}</h2>
              <p className="text-text-muted text-xs">{members.length} members</p>
            </div>
          </div>

          {/* Online members */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {members.slice(0, 4).map((m) => (
                <div
                  key={m.id}
                  className="w-6 h-6 rounded-full bg-bg-card border border-bg-base flex items-center justify-center text-[9px] text-text-secondary font-medium"
                  title={m.user.displayName}
                >
                  {m.user.displayName.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Game + Chat split */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* Game area */}
          <div className="flex-1 flex flex-col p-8 items-center justify-center min-w-0">
            {!activeGameId && !gameResult && (
              /* No game started — Premium game selection */
              <div className="flex-1 flex flex-col items-center justify-center gap-8 p-4 sm:p-6 animate-fade-in">
                <div className="flex flex-col items-center justify-center gap-3 min-h-[100px]">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-faint">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="10 8 16 12 10 16 10 8" />
                  </svg>
                  <p className="text-text-secondary text-lg font-medium tracking-wide">No game in progress</p>
                  {isOwner ? (
                    <p className="text-text-muted text-sm">Choose a game to start</p>
                  ) : (
                    <p className="text-text-muted text-sm">Waiting for the room owner to start a game</p>
                  )}
                </div>

                {isOwner && (
                  <div className="flex flex-wrap items-center justify-center gap-6 max-w-3xl mx-auto">
                    {GAME_TYPES.map((game) => (
                      <button
                        key={game.value}
                        onClick={() => handleStartGame(game.value)}
                        className="flex flex-col items-center justify-center w-40 h-40 bg-bg-elevated border border-border-subtle rounded-[2rem] hover:bg-bg-card hover:border-border-default hover:-translate-y-1 transition-all duration-300 cursor-pointer group shadow-lg"
                      >
                        <span className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">{game.icon}</span>
                        <p className="text-white font-medium text-base group-hover:-translate-y-0.5 transition-transform duration-300">
                          {game.label}
                        </p>
                        <p className="text-sm text-text-muted mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Start game</p>
                      </button>
                    ))}
                  </div>
                )}

                {myRole === 'SPECTATOR' && (
                  <p className="text-text-muted text-xs italic">
                    You joined as a spectator
                  </p>
                )}
              </div>
            )}

            {(activeGameId || gameResult) && (
              /* Active game or finished game */
              <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
                {renderGame()}

                {gameResult && (
                  <div className="mt-6 text-center">
                    <p className="text-white font-semibold text-sm sm:text-base">
                      {gameResult.result === 'draw'
                        ? 'Game ended in a draw!'
                        : `Winner: ${playerDisplayList.find((p) => p.userId === gameResult.winnerId)?.displayName || 'Unknown'}`}
                    </p>
                    {gameResult.reason === 'disconnect_timeout' && (
                      <p className="text-text-muted text-xs mt-1">Opponent disconnected</p>
                    )}
                    {isOwner && (
                      <div className="mt-4">
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setActiveGameId(null);
                            setActiveGameType(null);
                            setGameState(null);
                            setGamePlayers([]);
                            setGameResult(null);
                          }}
                        >
                          New Game
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chat panel */}
          <div className="w-80 shrink-0 bg-bg-surface border-l border-border-subtle flex flex-col">
            <ChatPanel roomId={roomId!} messages={messages} />
          </div>
        </div>
      </div>
    </div>
  );
}

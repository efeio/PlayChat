import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
import { Wordle } from '../components/games/Wordle';
import { MemoryCards } from '../components/games/MemoryCards';
import { NumberGuess } from '../components/games/NumberGuess';
import { GameResult } from '../components/games/GameResult';
import { GAME_ICONS } from '../components/games/GameIcons';
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

const GAME_TYPES: { value: GameType; label: string; color: string }[] = [
  { value: 'TIC_TAC_TOE', label: 'XOX', color: 'from-indigo-500 to-purple-500' },
  { value: 'CONNECT_FOUR', label: 'Dörtlü Bağla', color: 'from-cyan-500 to-blue-500' },
  { value: 'ROCK_PAPER_SCISSORS', label: 'Taş Kağıt Makas', color: 'from-amber-500 to-orange-500' },
  { value: 'HANGMAN', label: 'Adam Asmaca', color: 'from-emerald-500 to-teal-500' },
  { value: 'WORDLE', label: 'Wordle', color: 'from-lime-500 to-green-500' },
  { value: 'MEMORY_CARDS', label: 'Hafıza Kartları', color: 'from-pink-500 to-rose-500' },
  { value: 'NUMBER_GUESS', label: 'Sayı Tahmin', color: 'from-violet-500 to-fuchsia-500' },
];

export function Room() {
  const { id: roomId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { socket, isAuthenticated } = useSocket();
  const { addToast } = useToast();

  const [room, setRoom] = useState<RoomType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [myRole, setMyRole] = useState<string>('MEMBER');
  const [isLoadingState, setIsLoadingState] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [chatVisible, setChatVisible] = useState(true);

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
      setStateRecoveryError('Oda durumu yüklenemedi - zaman aşımı');
      addToast('error', 'Oda durumu yüklenemedi - zaman aşımı');
    }, 5000);

    socket.emit('room:get_state', { roomId }, (res: RoomStateResponse | { error: string }) => {
      clearTimeout(timeoutId);
      setIsLoadingState(false);

      if ('error' in res) {
        setStateRecoveryError(res.error);
        addToast('error', res.error);

        if (res.error === 'Room not found' || res.error === 'Not a member of this room') {
          navigate('/dashboard');
        }
        return;
      }

      setStateRecoveryError(null);
      setRoom(res.room as RoomType);

      const transformedMembers: RoomMember[] = res.members.map((m) => ({
        id: `${m.userId}-${res.room.id}`,
        userId: m.userId,
        roomId: res.room.id,
        role: m.role,
        isOnline: m.isOnline,
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
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!socket || !isAuthenticated || !roomId) return;

    const password = searchParams.get('password') || undefined;
    socket.emit('room:join', { roomId, password }, (res: { error?: string }) => {
      if (res?.error) {
        addToast('error', res.error);
      } else {
        joinedRef.current = true;
        if (password) {
          navigate(`/room/${roomId}`, { replace: true });
        }
        recoverState();
      }
    });

    return () => {
      if (joinedRef.current && socket.connected) {
        socket.emit('room:leave', { roomId });
        joinedRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isAuthenticated, roomId]);

  /* Socket event listeners */
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const onJoined = (data: { roomId: string; role: string }) => {
      setMyRole(data.role);
    };

    const onRoomUpdated = (data: { id: string; members?: RoomMember[] } & Partial<RoomType>) => {
      if (data.members) {
        setMembers(data.members);
      }
      setRoom((prev) => prev ? { ...prev, ...data } : prev);
    };

    const onMessageReceived = (message: Message) => {
      setMessages((prev) => {
        const next = [...prev, message];
        return next.length > 100 ? next.slice(next.length - 100) : next;
      });
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
        addToast('info', 'Oyun berabere bitti!');
      } else if (data.winnerId) {
        setGamePlayers((currentPlayers) => {
          const winner = currentPlayers.find((p) => p.userId === data.winnerId);
          const isWinner = data.winnerId === user?.id;
          const isLoser = currentPlayers.some(p => p.userId === user?.id) && !isWinner;

          if (isWinner) {
            addToast('success', 'Oyunu kazandın!');
          } else if (isLoser) {
            addToast('error', `${winner?.user.displayName || 'Rakip'} oyunu kazandı.`);
          } else {
            addToast('info', `${winner?.user.displayName || 'Oyuncu'} oyunu kazandı!`);
          }
          return currentPlayers;
        });
      }

      if (data.reason === 'disconnect_timeout') {
        addToast('warning', 'Rakibin bağlantısı kesildi — oyun sona erdi');
      } else if (data.reason === 'player_left') {
        addToast('warning', 'Bir rakip odadan ayrıldı — oyun sona erdi');
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
  }, [socket, isAuthenticated, user?.id]);

  /* Page Visibility: re-sync state when tab wakes from hibernation */
  useEffect(() => {
    if (!socket || !isAuthenticated || !roomId) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && joinedRef.current) {
        recoverState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [socket, isAuthenticated, roomId, recoverState]);

  /* Game actions */
  const handleStartGame = useCallback((gameType: GameType) => {
    if (!socket || !roomId) return;
    socket.emit('game:start', { roomId, gameType }, (res: { error?: string }) => {
      if (res?.error) addToast('error', res.error);
    });
  }, [socket, roomId, addToast]);

  const handleMove = useCallback((move: Record<string, unknown>, onError?: (error: string) => void) => {
    if (!socket || !roomId || !activeGameId) return;
    socket.emit('game:move', { gameId: activeGameId, roomId, move }, (res: { error?: string }) => {
      if (res?.error) {
        if (onError) {
          onError(res.error);
        } else {
          addToast('error', res.error);
        }
      }
    });
  }, [socket, roomId, activeGameId, addToast]);

  /* Check if current user is room owner */
  const isOwner = myRole === 'OWNER' || members.some((m) => m.userId === user?.id && m.role === 'OWNER');

  /* Detect ownerless room — no member has OWNER role */
  const roomHasOwner = members.some((m) => m.role === 'OWNER');
  const isOwnerlessLobby = !activeGameId && !gameResult && !roomHasOwner && members.length > 0;

  const handleClaimHost = useCallback(() => {
    if (!socket || !roomId) return;
    socket.emit('room:claim_host', { roomId }, (res: { error?: string }) => {
      if (res?.error) {
        addToast('error', res.error);
      } else {
        setMyRole('OWNER');
        addToast('success', 'Oda sahibi oldun!');
      }
    });
  }, [socket, roomId, addToast]);

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
      case 'WORDLE':
        return <Wordle gameState={gameState as Parameters<typeof Wordle>[0]['gameState']} {...commonProps} />;
      case 'MEMORY_CARDS':
        return <MemoryCards gameState={gameState as Parameters<typeof MemoryCards>[0]['gameState']} {...commonProps} />;
      case 'NUMBER_GUESS':
        return <NumberGuess gameState={gameState as Parameters<typeof NumberGuess>[0]['gameState']} {...commonProps} />;
      default:
        return null;
    }
  };

  if (!room || isLoadingState || stateRecoveryError) {
    return (
      <div className="flex h-screen bg-bg-base overflow-hidden">
        <div className={`shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${sidebarVisible ? 'w-60' : 'w-0'}`}>
          <div className="w-60 h-full">
            <Sidebar />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          {stateRecoveryError ? (
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-status-error/10 border border-status-error/20 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-status-error">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6M9 9l6 6" />
                </svg>
              </div>
              <p className="text-text-primary text-sm font-medium mb-2">Oda yüklenemedi</p>
              <p className="text-text-muted text-xs mb-6">{stateRecoveryError}</p>
              <Button variant="outlined" onClick={recoverState}>
                Tekrar dene
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
    <div className="flex h-screen bg-bg-base overflow-hidden">
      {/* Sidebar with animation */}
      <div className={`shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${sidebarVisible ? 'w-60' : 'w-0'}`}>
        <div className="w-60 h-full">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Room header */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-border-default bg-bg-surface/60 backdrop-blur-md shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarVisible(!sidebarVisible)}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-text-primary/5 transition-all duration-200 cursor-pointer"
              title={sidebarVisible ? 'Menüyü gizle' : 'Menüyü göster'}
              aria-label={sidebarVisible ? 'Menüyü gizle' : 'Menüyü göster'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-text-primary/5 transition-all duration-200 cursor-pointer"
              aria-label="Geri dön"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-px h-6 bg-border-default" />
            <div>
              <h2 className="text-text-primary font-semibold text-sm">{room.name}</h2>
              <p className="text-text-muted text-[11px]">{members.length} oyuncu odada</p>
            </div>
          </div>

          {/* Online members + chat toggle */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-1.5">
              {members.slice(0, 4).map((m) => (
                <div
                  key={m.id}
                  className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-primary/80 to-accent-secondary/80 ring-2 ring-bg-surface flex items-center justify-center text-[9px] text-text-inverse font-bold relative"
                  title={m.user.displayName}
                >
                  {m.user.displayName.charAt(0).toUpperCase()}
                  {m.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-status-online border-2 border-bg-surface"></span>
                  )}
                </div>
              ))}
              {members.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-bg-elevated ring-2 ring-bg-surface flex items-center justify-center text-[9px] text-text-muted font-bold">
                  +{members.length - 4}
                </div>
              )}
            </div>
            <button
              onClick={() => setChatVisible(!chatVisible)}
              className={`p-2 rounded-lg transition-all duration-200 cursor-pointer ${chatVisible ? 'text-accent-primary bg-accent-primary/10' : 'text-text-muted hover:text-text-primary hover:bg-text-primary/5'}`}
              title={chatVisible ? 'Sohbeti gizle' : 'Sohbeti göster'}
              aria-label={chatVisible ? 'Sohbeti gizle' : 'Sohbeti göster'}
              aria-pressed={chatVisible}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Game + Chat split */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Game area (Center) */}
          <div className="flex-1 flex flex-col items-center justify-center min-w-0 overflow-hidden relative">
            {!activeGameId && !gameResult && (
              <div className="w-full h-full flex flex-col items-center justify-center gap-8 p-6 sm:p-8 animate-fade-in">
                {/* No game state */}
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-bg-card border border-border-default flex items-center justify-center animate-float">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#playGrad)" strokeWidth="1.5">
                      <defs>
                        <linearGradient id="playGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#22d3ee" />
                        </linearGradient>
                      </defs>
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="10 8 16 12 10 16 10 8" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-text-primary text-lg font-semibold" style={{ fontFamily: 'var(--font-family-display)' }}>
                      {isOwner ? 'Oyun seç' : 'Oyun bekleniyor'}
                    </p>
                    <p className="text-text-muted text-sm mt-1">
                      {isOwner ? 'Maç başlatmak için aşağıdan bir oyun seç' : 'Oda sahibi kısa süre içinde oyun başlatacak'}
                    </p>
                  </div>
                </div>

                {isOwnerlessLobby && myRole !== 'SPECTATOR' && (
                  <div className="flex flex-col items-center gap-3 animate-fade-in">
                    <p className="text-amber-400 text-xs font-medium">Oda sahibi bulunamadı</p>
                    <Button onClick={handleClaimHost}>
                      Oda Sahibi Ol
                    </Button>
                  </div>
                )}

                {isOwner && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto w-full px-4">
                    {GAME_TYPES.map((game) => (
                      <button
                        key={game.value}
                        onClick={() => handleStartGame(game.value)}
                        className="relative group cursor-pointer rounded-2xl border border-border-default bg-bg-card/80 hover:bg-bg-elevated p-6 flex flex-col items-center justify-center gap-4 min-h-[160px] transition-all duration-300 hover:border-accent-primary/30 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.3)]"
                      >
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center text-text-inverse group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                          {GAME_ICONS[game.value]}
                        </div>
                        <div className="text-center">
                          <p className="text-text-primary font-semibold text-sm group-hover:text-accent-secondary transition-colors">
                            {game.label}
                          </p>
                          <p className="text-text-muted text-[10px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            Başlat
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {myRole === 'SPECTATOR' && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-warm/10 border border-accent-warm/20">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-warm">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4M12 16h.01" />
                    </svg>
                    <p className="text-accent-warm text-xs font-medium">İzliyorsun</p>
                  </div>
                )}
              </div>
            )}

            {(activeGameId || gameResult) && (
              <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
                {renderGame()}
              </div>
            )}
          </div>

          {/* Chat panel (Right) */}
          <div className={`shrink-0 border-l border-border-default flex flex-col relative bg-bg-surface/30 transition-all duration-300 ease-in-out overflow-hidden ${chatVisible ? 'w-full md:w-[340px] lg:w-[360px]' : 'w-0 border-l-0'}`}>
            <div className="w-full md:w-[340px] lg:w-[360px] h-full flex flex-col">
              <ChatPanel roomId={roomId!} messages={messages} />
            </div>
          </div>
        </div>
      </div>

      {/* Game Result Modal — rendered outside all containers */}
      {gameResult && user && (
        <GameResult
          result={gameResult}
          players={gamePlayers}
          currentUserId={user.id}
          gameType={activeGameType || ''}
          gameState={gameState}
          onPlayAgain={isOwner && activeGameType ? () => handleStartGame(activeGameType) : undefined}
          onClose={() => {
            setActiveGameId(null);
            setActiveGameType(null);
            setGameState(null);
            setGamePlayers([]);
            setGameResult(null);
          }}
        />
      )}
    </div>
  );
}

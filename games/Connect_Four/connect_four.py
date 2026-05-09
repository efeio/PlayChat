"""
Connect Four — pure game rules (6×7), turns, win/draw detection, move validation.

Board layout: ``board[row][col]`` with row 0 at the top and row ROWS-1 at the bottom.
Empty cells are 0; player pieces are 1 or 2.
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any

ROWS = 6
COLS = 7
PLAYERS = (1, 2)
CONNECT_N = 4

# (delta_row, delta_col) — horizontal, vertical, two diagonals
_WIN_DIRECTIONS: tuple[tuple[int, int], ...] = (
    (0, 1),   # horizontal
    (1, 0),   # vertical
    (1, 1),   # diagonal ↘
    (1, -1),  # diagonal ↙
)


def new_board() -> list[list[int]]:
    """Return an empty ROWS×COLS board."""
    return [[0] * COLS for _ in range(ROWS)]


def column_is_full(board: list[list[int]], col: int) -> bool:
    """True if the top cell in ``col`` is occupied."""
    return board[0][col] != 0


def drop_piece(
    board: list[list[int]], col: int, player: int
) -> tuple[int, int] | None:
    """
    Place ``player`` in ``col``, mutating ``board``.

    Returns ``(row, col)`` of the placed piece, or ``None`` if the column is full
    or ``col`` is out of range.
    """
    if not (0 <= col < COLS):
        return None
    if column_is_full(board, col):
        return None
    for row in range(ROWS - 1, -1, -1):
        if board[row][col] == 0:
            board[row][col] = player
            return row, col
    return None


def _count_run(
    board: list[list[int]],
    row: int,
    col: int,
    player: int,
    dr: int,
    dc: int,
) -> int:
    """Count consecutive ``player`` cells from (row, col) along (dr, dc), including start."""
    n = 0
    r, c = row, col
    while 0 <= r < ROWS and 0 <= c < COLS and board[r][c] == player:
        n += 1
        r += dr
        c += dc
    return n


def has_connect_four(
    board: list[list[int]], row: int, col: int, player: int
) -> bool:
    """
    Return True if ``player`` has at least CONNECT_N in a row through ``(row, col)``.

    Checks horizontal, vertical, and both diagonals.
    """
    for dr, dc in _WIN_DIRECTIONS:
        total = 1
        total += _count_run(board, row + dr, col + dc, player, dr, dc)
        total += _count_run(board, row - dr, col - dc, player, -dr, -dc)
        if total >= CONNECT_N:
            return True
    return False


def winning_line_cells(
    board: list[list[int]], row: int, col: int, player: int
) -> list[list[int]] | None:
    """
    If ``player`` wins through ``(row, col)``, return exactly CONNECT_N cells ``[[r,c], ...]``.

    When the run is longer than CONNECT_N, returns the length-CONNECT_N segment that
    includes ``(row, col)``.
    """
    for dr, dc in _WIN_DIRECTIONS:
        line: list[tuple[int, int]] = [(row, col)]
        r, c = row + dr, col + dc
        while 0 <= r < ROWS and 0 <= c < COLS and board[r][c] == player:
            line.append((r, c))
            r += dr
            c += dc
        r, c = row - dr, col - dc
        while 0 <= r < ROWS and 0 <= c < COLS and board[r][c] == player:
            line.append((r, c))
            r -= dr
            c -= dc
        if len(line) < CONNECT_N:
            continue
        if dr == 0 and dc == 1:
            line.sort(key=lambda p: p[1])
        elif dr == 1 and dc == 0:
            line.sort(key=lambda p: p[0])
        elif dr == 1 and dc == 1:
            line.sort(key=lambda p: p[0])
        else:
            line.sort(key=lambda p: p[0])
        try:
            idx = line.index((row, col))
        except ValueError:
            continue
        start = min(max(0, idx - (CONNECT_N - 1)), len(line) - CONNECT_N)
        return [list(p) for p in line[start : start + CONNECT_N]]
    return None


def is_board_full(board: list[list[int]]) -> bool:
    """True when all top-row cells are filled (no more legal drops)."""
    return all(board[0][c] != 0 for c in range(COLS))


def validate_move_request(
    *,
    board: list[list[int]],
    current_player: int,
    winner: int | None,
    draw: bool,
    moving_player: int,
    column: int,
) -> str | None:
    """
    Return an error string if the move is illegal, else ``None``.

    Order of checks matches typical API error reporting.
    """
    if moving_player not in PLAYERS:
        return "player must be 1 or 2"
    if winner is not None or draw:
        return "Game is over"
    if current_player != moving_player:
        return "Not your turn"
    if not isinstance(column, int) or not (0 <= column < COLS):
        return "Invalid column"
    if column_is_full(board, column):
        return "Column is full"
    return None


def apply_move(
    board: list[list[int]],
    *,
    current_player: int,
    winner: int | None,
    draw: bool,
    moving_player: int,
    column: int,
) -> tuple[bool, str | None, dict[str, Any] | None]:
    """
    Attempt one drop for ``moving_player`` in ``column``.

    Mutates ``board`` only on success.

    Returns ``(ok, error_message, side_effects)`` where ``side_effects`` on success is::
        ``{ "row": int, "col": int, "next_player": int | None, "winner": int | None, "draw": bool }``
    """
    err = validate_move_request(
        board=board,
        current_player=current_player,
        winner=winner,
        draw=draw,
        moving_player=moving_player,
        column=column,
    )
    if err is not None:
        return False, err, None

    placed = drop_piece(board, column, moving_player)
    if placed is None:
        return False, "Illegal move", None

    row, col = placed
    new_winner: int | None = None
    new_draw = False
    next_player: int | None = None
    win_cells: list[list[int]] | None = None

    if has_connect_four(board, row, col, moving_player):
        new_winner = moving_player
        win_cells = winning_line_cells(board, row, col, moving_player)
    elif is_board_full(board):
        new_draw = True
    else:
        next_player = 2 if moving_player == 1 else 1

    return True, None, {
        "row": row,
        "col": col,
        "next_player": next_player,
        "winner": new_winner,
        "draw": new_draw,
        "winning_line": win_cells,
    }


class ConnectFourGame:
    """
    Mutable game session: board, turn, outcome, and monotonic ``move_seq`` for clients.
    """

    __slots__ = ("board", "current_player", "winner", "draw", "move_seq", "winning_line")

    def __init__(self) -> None:
        self.reset()

    def reset(self) -> None:
        self.board = new_board()
        self.current_player = 1
        self.winner: int | None = None
        self.draw = False
        self.move_seq = 0
        self.winning_line: list[list[int]] | None = None

    def snapshot(self) -> dict[str, Any]:
        """JSON-serializable game fields (no chat)."""
        wl = self.winning_line
        return {
            "board": deepcopy(self.board),
            "current_player": self.current_player,
            "winner": self.winner,
            "draw": self.draw,
            "move_seq": self.move_seq,
            "winning_line": [c[:] for c in wl] if wl else None,
        }

    def try_move(self, player: int, column: int) -> tuple[bool, str | None]:
        """
        Apply a move if legal. Returns ``(True, None)`` or ``(False, error_string)``.
        """
        ok, err, fx = apply_move(
            self.board,
            current_player=self.current_player,
            winner=self.winner,
            draw=self.draw,
            moving_player=player,
            column=column,
        )
        if not ok or fx is None:
            return False, err or "Illegal move"

        self.move_seq += 1
        self.winning_line = None
        if fx["winner"] is not None:
            self.winner = fx["winner"]
            wl = fx.get("winning_line")
            self.winning_line = wl if isinstance(wl, list) else None
        elif fx["draw"]:
            self.draw = True
        else:
            next_p = fx["next_player"]
            assert next_p is not None
            self.current_player = next_p

        return True, None

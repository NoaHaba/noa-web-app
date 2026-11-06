
export type Player = "X" | "O";

export type Cell = Player | null;

export type GameStatus = "playing" | "finished";

export type GameResult = Player | "draw" | null;

export type GameState = {
  board: Cell[];
  currentPlayer: Player;
  status: GameStatus;
  result: GameResult;
  moves: number[];
};

export function createGame(): GameState {
  return {
    board: Array(9).fill(null),
    currentPlayer: "X",
    status: "playing",
    result: null,
    moves: [],
  };
}


const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function hasThreeInARow(
  board: Cell[],
  player: Player,
): boolean {
  return WINNING_LINES.some(([a, b, c]) => {
    return (
      board[a] === player &&
      board[b] === player &&
      board[c] === player
    );
  });
}


export function makeMove(
  game: GameState,
  position: number,
): GameState {
  if (game.status === "finished") {
    throw new Error("The game is already finished");
  }

  if (
    !Number.isInteger(position) ||
    position < 0 ||
    position > 8
  ) {
    throw new Error("Invalid position");
  }

  if (game.board[position] !== null) {
    throw new Error("This cell is already occupied");
  }

  const player = game.currentPlayer;

  const board = [...game.board];
  board[position] = player;

  const moves = [...game.moves, position];

  if (hasThreeInARow(board, player)) {
    return {
      board,
      moves,
      currentPlayer: player,
      status: "finished",
      result: player === "X" ? "O" : "X",
    };
  }

  if (board.every((cell) => cell !== null)) {
    return {
      board,
      moves,
      currentPlayer: player,
      status: "finished",
      result: "draw",
    };
  }

  return {
    board,
    moves,
    currentPlayer: player === "X" ? "O" : "X",
    status: "playing",
    result: null,
  };
}

/**
 * Elo rating system for ELOQUENT multiplayer.
 */

export function calculateElo(playerRating, opponentRating, playerScore, opponentScore, gamesPlayed = 30) {
  const K = gamesPlayed < 30 ? 32 : 16;

  const expectedPlayer = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const expectedOpponent = 1 / (1 + Math.pow(10, (playerRating - opponentRating) / 400));

  // Normalize scores to 0/0.5/1
  let actualPlayer, actualOpponent;
  if (playerScore > opponentScore) {
    actualPlayer = 1;
    actualOpponent = 0;
  } else if (playerScore < opponentScore) {
    actualPlayer = 0;
    actualOpponent = 1;
  } else {
    actualPlayer = 0.5;
    actualOpponent = 0.5;
  }

  const newPlayerRating = Math.round(playerRating + K * (actualPlayer - expectedPlayer));
  const newOpponentRating = Math.round(opponentRating + K * (actualOpponent - expectedOpponent));
  const change = newPlayerRating - playerRating;

  return { newPlayerRating, newOpponentRating, change };
}

export function getInitialElo() {
  return 1200;
}

export function getRankTitle(elo) {
  if (elo < 1000) return 'Novize';
  if (elo < 1200) return 'Lehrling';
  if (elo < 1400) return 'Geselle';
  if (elo < 1600) return 'Redner';
  if (elo < 1800) return 'Meister';
  if (elo < 2000) return 'Großmeister';
  return 'Legende';
}

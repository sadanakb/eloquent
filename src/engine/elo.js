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

  const newPlayerRating = Math.max(0, Math.min(10000, Math.round(playerRating + K * (actualPlayer - expectedPlayer))));
  const newOpponentRating = Math.max(0, Math.min(10000, Math.round(opponentRating + K * (actualOpponent - expectedOpponent))));
  const change = newPlayerRating - playerRating;

  return { newPlayerRating, newOpponentRating, change };
}

export function getInitialElo() {
  return 400;
}

export function getRankTitle(elo) {
  if (elo < 100) return 'Anfänger';
  if (elo < 250) return 'Lehrling';
  if (elo < 400) return 'Redner';
  if (elo < 600) return 'Dichter';
  if (elo < 900) return 'Rhetoriker';
  if (elo < 1300) return 'Wortkünstler';
  if (elo < 2000) return 'Meister';
  if (elo < 3500) return 'Großmeister';
  if (elo < 5000) return 'Legende';
  return 'Eloquenz-Gott';
}

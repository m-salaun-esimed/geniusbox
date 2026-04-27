# Smart10 Local Rules Spec (v1)

## Match Setup
- 2 to 10 players on one shared screen.
- One selected True/False question pack.
- Match length defaults to up to 10 rounds, limited by available questions.

## Round Flow
1. A question is shown to all players.
2. The active player answers True or False.
3. If correct, active player gains 1 point and the round ends.
4. If incorrect, next player attempts the same question.
5. If all players miss, round ends with no points.

## Turn Order
- Turn order is sequential by player list.
- First player in the setup list starts each round for v1.

## Scoring
- Correct answer: +1 point.
- Incorrect answer: +0 points.

## Endgame
- Game ends after the configured number of rounds.
- Highest score wins.
- Ties are allowed and shown as co-winners.

## Shared-Screen UX Requirements
- Always show active player.
- Always show scoreboard.
- Show round transitions clearly.
- Keep answer controls simple: two buttons (`True`, `False`).

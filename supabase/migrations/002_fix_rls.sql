-- Fix: matches RLS policy allowed any authenticated user to view ALL friend challenge matches
-- (because "friend_code is not null" was always true for friend challenges)
-- Now only the actual players can view their own matches.

drop policy if exists "Players can view own matches" on matches;

create policy "Players can view own matches" on matches
  for select using (
    auth.uid() = player1_id
    or auth.uid() = player2_id
    or (auth.uid() = player1_id and friend_code is not null)
  );

-- Also fix: allow anonymous joining of friend challenges by code lookup
-- The joinFriendChallenge function needs to UPDATE the match (set player2_id).
-- The current update policy allows player1 OR player2 to update.
-- But player2 is null when joining — they can't match auth.uid() = player2_id.
-- Fix: allow update when match is in 'waiting' status and player2_id is null.
drop policy if exists "Players can update own matches" on matches;

create policy "Players can update own matches" on matches
  for update using (
    auth.uid() = player1_id
    or auth.uid() = player2_id
    or (status = 'waiting' and player2_id is null)
  );

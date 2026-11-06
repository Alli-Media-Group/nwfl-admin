# NWFL data: where it stands and how to fill the gaps (6 Nov 2026)

Checked against the live database (22 teams, 653 matches, 50 players) and outside sources found with Exa:
TheNWFL's own match reports, Punch, Vanguard, Voice of Nigeria, Sports247, Nigeria Football, and the Wikipedia page for the 2025/26 NWFL Premiership (its results come from TheNWFL).

## 1. The 10 "upcoming" matches are not missing results
They are leftover rows from the original fixture list. Every one of them has a played twin in the database.

| Stale row (id) | Shows | The real match (id) |
|---|---|---|
| 641 Sunshine v Ahudiyannem, 1 Apr, matchday 13 | upcoming | 582, played 2 Apr, 0-1 |
| 637 to 646 (nine matches), 29 Apr, matchday 17 | upcoming | 610 to 618, played, results in |

Matchday 17 was played on **Wednesday 29 April 2026** (the news reports of 30 April say "on Wednesday"). The played rows carry the wrong date, 25 April, and the stale rows carry the right date plus the 16:00 kick-off.

**Fix:** copy the 29 April date and kick-off onto the nine played rows, then delete the ten stale rows. Take a backup first. Nothing needs to be "filled in".

## 2. The 162 regular-season results are correct
All 162 played matches were compared with the Wikipedia results matrices. 160 match exactly. The other two (Dannaz v Osun, ids 475 and 555) are Wikipedia's mistake, not ours: our rows have the right home ground (Onikan Stadium and Lanreleke), goal scorers that agree with the score, and they produce the same league table as Wikipedia's (Dannaz 23 points, Osun 18). Nothing to fix.

## 3. The Super Six is missing (the real gap)
The championship round (5 to 14 June 2026, Adokiye Amiesimaka Stadium, Port Harcourt) is **not in the database**: 15 matches, the title decider, and Edo Queens being crowned. The newest match we hold is 6 May. This is why the public Analytics page stops at the group stage and why top scorers read 9 goals when the official figure is 13.

Results (from the Wikipedia matrix; the seven in bold are also confirmed by news reports):

- Abia 0-0 Nasarawa
- Abia 1-0 Rivers
- **Abia 1-1 Robo Queens** (final day)
- Bayelsa 1-1 Abia
- **Edo Queens 0-0 Bayelsa** (final day, title decided)
- **Edo Queens 6-2 Abia** (10 June, Chioma Moses scored four)
- **Edo Queens 0-1 Nasarawa** (opening game)
- **Edo Queens 2-1 Rivers** (matchday four)
- Nasarawa 2-1 Bayelsa
- **Nasarawa 0-0 Rivers** (final day)
- Rivers 1-2 Bayelsa
- Rivers 3-2 Robo Queens
- Robo Queens 0-2 Bayelsa
- **Robo Queens 1-4 Edo Queens**
- Robo Queens 2-0 Nasarawa

Final table: Edo 10, Bayelsa 8, Nasarawa 8, Abia 6, Rivers 4, Robo 4. Home and away labels in the matrix are the league's; the exact date of each match still has to be read off TheNWFL's match reports.

Season awards to store: Golden Boot shared by Abasiofon Uwah and Atume Doosuur (13 goals each), Player of the Season Oluwakemi Adegbuyi, Goalkeeper of the Season Fatima Oloko, Fair Play Award Rivers Angels.

**Fix:** add the 15 matches as a new stage ("Super Six") with dates from the match reports, then recompute standings and top scorers. Add the awards.

## 4. Players: 580 records, but nearly empty and full of duplicates
(An earlier version of this report said 50 players; that was only the first page of the list.)
- 580 players across all 22 clubs. Only the name, club and nationality are filled. Position, shirt number, date of birth, photo and bio are empty for every one.
- 988 of the 1,114 goals and 71 players carry an invisible symbol in front of the name (a ball emoji that the old import left behind). That symbol makes "Atume Doosuur" and "Atume Doosuur" two different people, so goals were split between duplicates. This is why the scorers list showed fewer goals than the official figures.
- 85 duplicate records (same person, same club, or the name in the other order: "Abasiofon Uwah" and "Uwah Abasiofon") are merged by the clean-up. 580 players become 495.
- Every goal already points at a player.

### What a proper player page looks like (the Hasaacas Ladies site Alli showed, plus Global Sports Archive)
- Squad grouped by position (Goalkeepers, Defenders, Midfielders, Forwards), each with a shirt number and photo.
- Each player: position, shirt number, age, nationality, appearances, minutes, goals, assists, yellow and red cards, for the season.
- A club page links its fixtures, results, and the squad.

### What we need to store to support that
| Need | Today | Add |
|---|---|---|
| Profile (photo, position, number, birth date) | fields exist, empty | fill them |
| Which season a player was in which club | no | a squad entry per player, club and season |
| Appearances, minutes | no | line-ups per match |
| Goals, assists | goals exist per match (scorer name, minute); no assists | link each goal to a player; add the assist |
| Cards | no | card events per match |

### Where the data can come from (no central squad list exists)
1. **Clubs fill their own squads.** The admin already has invitations for team managers, so each club can submit its squad sheet, with the league approving it.
2. **Read the sheet with AI.** A squad photo or pasted list becomes a draft squad, a person approves it (the same review pattern as results entry).
3. **Match reports for cards, line-ups and assists.** TheNWFL's match reports name scorers, minutes and cards; the same draft-and-approve step turns each report into events.
4. Do not copy another site's player data wholesale: ask the clubs, or get the league's permission.

## 5. Suggested order
1. Back up, then fix section 1 (dates and the ten stale rows).
2. Check the Dannaz v Osun pair with the league.
3. Add the Super Six and awards, then re-check standings and top scorers.
4. Add the player model (squads, events) and a Players page on the public site.
5. Invite the clubs to submit squads, with AI-assisted entry.

Steps 1 to 3 change live data, so they wait for Victor's go-ahead.

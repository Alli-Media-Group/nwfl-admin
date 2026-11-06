# NWFL admin: restructure and AI-assisted entry (plan)

Status: plan, not built. Written 6 Nov 2026 after Alli retired the Google Sheet and asked for a simpler way to enter data.

## 1. The problem today
The sidebar is one flat list of 12 items with no grouping, so a new person cannot tell what is daily work, what is setup and what is a one-off tool:

Dashboard, Matches, Teams, Players, Standings, WhatsApp Parser, Sheet Sync, Blog & Gallery, Media Library, Missing Logos, Invitations, API Access.

Mixed together are: match-day work (Matches, Standings), league setup (Teams, Players), content (Blog & Gallery, Media Library), housekeeping (Missing Logos), tools tied to the retired sheet (Sheet Sync), and access control (Invitations, API Access). Entry is by filling forms by hand.

## 2. What other league tools do (researched with Exa, 6 Nov 2026)
- **Sofascore Torneo 2.0** groups a competition's menu by what you are doing: *Run* (Matches, Standings, Brackets), *Build* (Teams, Players, Venues, Format), *Settings* (Info, Regulations, Suspensions, Collaborators). Day-to-day work at the top, setup in the middle, configuration at the bottom.
- **MyCup** has the same idea and shows the dashboard shortcuts that match the stage the tournament is in (in progress shows "Enter result" with a count of matches waiting for a score). It also keeps an activity feed of who entered what.
- **PlayHQ** has a separate "Game Day" area: pick a day, see that day's games, enter results. Competition setup is elsewhere. It also lets one login administer several organisations ("Using as").
- **FIFA Connect (FCMS)** puts a calendar on the dashboard where an orange box means "needs attention" and keeps a to-do list under it.
- **TTLeagueApp** has a "scorecard inbox": results submitted by others wait there until an admin approves or rejects them.

## 3. Proposed structure
| Group | Pages | Why |
|---|---|---|
| (top) | Home | What needs attention today |
| **Match day** | Results entry, Fixtures, Standings | The daily work. Results entry is the main button. |
| **League** | Teams, Players, Seasons | Set up once, change rarely |
| **Content** | News and Blog, Gallery, Media Library | Public-site material |
| **Access** | People and invitations, API Access | Who can see or change what |
| **Tools** (hidden by default) | Missing Logos, Sheet Import (one last import, then removed) | Housekeeping |

Home shows: matches waiting for a result, drafts waiting for review, and the latest activity (who entered what).

## 4. Results entry: write it, the system fills it, a person approves
Pattern researched: a human-in-the-loop review step between an AI draft and the database.

Flow:
1. Staff paste or type the result in plain words (or forward the WhatsApp message). Example: "Rivers Angels 2-1 Edo Queens, Uwah 23', 67', Doosuur 80', yellow card Okon 55'".
2. The system drafts the match: teams (matched to the real list), score, scorers and minutes, cards.
3. The review screen shows the **original text beside the draft**. Fields it is unsure about are marked. Anything that fails a check is blocked from approval.
4. A person edits inline if needed, then presses **Approve**. Nothing reaches the public site before that.
5. Every approval records who, when, the original text and what was changed (our rule: corrections, never deletions).

Checks the draft must pass: both teams exist, the score equals the number of goals listed, the match exists in the fixtures, minutes are 1 to 120, no duplicate of an existing result.

Principles from the research that we follow: show the source next to the draft; flag the uncertain fields instead of hiding them; clean drafts go to a quick review, uncertain ones wait in a queue; inline editing, not approve-or-reject only; keep each correction so the drafting improves.

We already have a WhatsApp parser in the admin. This builds on it rather than replacing it.

## 5. The organisations' management hub (what Alli asked)
Alli said organisations need somewhere to see their own data (like discussed for WAUG). Separate from the league admin: each organisation signs in and sees only its own data, with its own key where it needs the feed. Not started. Alli wants NWFL and WAUG finished and handed over first.

## 6. Order of work
1. Restructure the admin menu and Home (no new features, only clearer).
2. Visual pass: consistent spacing, tables and forms, readable dark mode.
3. Results entry with the review screen (drafts from text first).
4. Retire the Google Sheet: one final import of anything newer than 6 May 2026, then remove Sheet Sync.
5. Organisations' hub, after NWFL and WAUG are handed over.

## 7. Open questions for Alli
- Who enters results during match days: league staff only, or team managers too?
- Are scorers and cards recorded for every match, or only the score? (The database holds 653 matches with scores; scorers exist for at least the latest season, but I have not checked how complete they are for older ones.)
- Does the league want a person to approve every result, or only the ones the system is unsure about?

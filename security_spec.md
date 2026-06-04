# Security Specification for RPSC AI-Quizzer Firestore Database

Identity, Integrity, and State Invariants protecting the system against malicious requests.

## 1. Data Invariants

1. **User Profile**:
   - Must correspond strictly to the authenticated `uid` of the user.
   - Users cannot modify or fabricate their `email` or profile fields once verified.
   - Initial streak, custom badges, and quiz count must have clean initialization values.
   
2. **Quiz Attempt (`users/{userId}/quiz_attempts/{attemptId}`)**:
   - Access to this sub-collection is strictly tied to `/users/{userId}` ownership.
   - Every quiz attempt is immutable. Once written, attempts cannot be modified or updated by high-privilege operations.
   - The user must be authenticated, verified, and the `userId` in the path must match the authenticated `request.auth.uid`.

3. **Bookmark (`users/{userId}/bookmarks/{bookmarkId}`)**:
   - Access and lifecycle are restricted to the owner of `/users/{userId}`.
   - `question` and `options` maps must validate type correctness. Can be created/deleted, but not updated (or only created/deleted for simplicity).

---

## 2. The "Dirty Dozen" Privilege Escalation Payloads

These 12 scenarios describe adversarial actions that our Firestore security rules must block:

1. **Identity Spoofing on Create**: Authenticated User A tries to create a user profile inside `users/User_B`.
2. **Email Hijacking via Update**: Authenticated User A tries to modify their profile email to `admin@rpsc.gov.in`.
3. **Streak Tampering**: User A sends of 500 state value directly to short-circuit achievement boards without satisfying milestones.
4. **Attempt Spoofing**: Authenticated User A attempts to write a fake quiz score into `users/User_B/quiz_attempts/fake_attempt`.
5. **Score Injection**: Authenticated User A tries to insert a quiz attempt with a score higher than `questionCount`.
6. **Immutable Override**: User A tries to update a previously submitted immutable quiz attempt record to change their score.
7. **Foreign Bookmark Creation**: User A tries to add a bookmark into User B's bookmarks folder.
8. **Document ID Poisoning / Denial of Wallet**: User A injects a long 1.5MB junk ID (random characters like `@@@@@...`) as a bookmark ID to trigger database resource overload.
9. **PiI Harvesting / Blanket Reads**: User A performs a blanket, unfiltered list query on the `/users` collection without specifying an owner constraint.
10. **Ghost State Creation**: User A creates a user profile containing undocumented properties to bypass schema verification.
11. **Self-Assigned Admin privileges**: User A attempts to set `isAdmin: true` during profile creation or update.
12. **Historical Spoofing**: User A attempts to specify client-controlled `createdAt` timestamp strings in the past instead of current Server timestamp verification.

---

## 3. Test Cases for Security Rules Verification

The upcoming `firestore.rules` must reject all 12 malicious payload patterns with a `PERMISSION_DENIED` status. Our rules will implement:
- Standalone validator helpers `isValidUser`, `isValidQuizAttempt`, `isValidBookmark`.
- Key checklist size rules (`data.keys().size()`).
- Immutable parameter locks (`incoming().email == existing().email`).
- Strict temporal sync (`createdAt == request.time`).

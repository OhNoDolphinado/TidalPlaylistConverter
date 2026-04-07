## UAT Plan 1 (Login Functionality):

- Login should log you in if provided with the right credentials (username, password)
- Login should fail if provided with the wrong credentials
- The login page should tell the user what went wrong if it does fail (wrong password or email, server error, etc)

### Test Cases:

**User Acceptance test cases**:
1) Test that providing a username and a password that we've confirmed is in the database already actually logs the user in
2) Test that providing a correct username and an incorrect password does not log the user in, and throws a message about "incorrect username or password"
3) Test that providing an incorrect username and a correct password does not log the user in, and throws a message about "incorrect username or password"
4) Test that providing both incorrect user and password does not log the user in and throws the message
5) Simulate a severance between the login page and the server, and test that trying to log in throws a user-friendly server error message

**Test data used**: Usernames and Passwords that have confirmed to be in (or explicitly not in) the user database

**Test environment**: Local (with database spun up), on Mac, newest Docker version

**Test plans**: 
All of the UA test cases should have worked properly:
1) Logs in properly
2) Does not log in, throws user info error message
3) Does not log in, throws user info error message
4) Does not log in, throws user info error message
5) Does not log in, throws server error message

**User Acceptance Tester Info**: Should work for any user of the service, both those that have not logged in and those who have. Presumably users would be music listeners intending to import Spotify playlists and convert them to Tidal ones.

**Actual Test Results**:
The actual test results should be the same as the expected outputs of the test plans.
Once we actually run them, we will hopefully update this with a success, or a fail and the reason for failure if the test does not succeed.


## UAT Plan 2 (Importing from Spotify):

- Importing should provided the user with the right songs in a Tidal playlist
- Importing should tell the user what songs went missing from Spotify if Tidal didn't have a copy

### Test Cases:

**User Acceptance test cases**:
1) Test that providing a Spotify playlist that we've confirmed every song is in the Tidal database and it should swap every song over to a Tidal playlist
2) Test that providing a Spotify playlist that we've confirmed every song, but one, is in the Tidal database and it should swap every song over to a Tidal playlist besides that song + throws a message about "name_of_song not found"

**Test data used**: Spotify playlists and Tidal songs that have confirmed to be in (or explicitly not in) the Spotify/Tidal database

**Test environment**: Local (with database spun up & API connected to), on Mac, newest Docker version

**Test plans**: 
All of the UA test cases should have worked properly:
1) Every song is a Tidal playlist
2) Every song but one is in a Tidal playlist and throws user info error message

**User Acceptance Tester Info**: Should work for any user of the service, both those that have not logged in and those who have. Presumably users would be music listeners intending to import Spotify playlists and convert them to Tidal ones.

**Actual Test Results**:
The actual test results should be the same as the expected outputs of the test plans.
Once we actually run them, we will hopefully update this with a success, or a fail and the reason for failure if the test does not succeed.
# Spec Delta

## ADDED Requirements

### Requirement: Connect with a device token
The app SHALL let the user connect the device by entering the sync server's address and this device's token. Before saving them, the app SHALL check them with the server. A refused token or an unreachable server SHALL show an error and leave the device unconnected. The app SHALL NOT offer creating an account or a token.

#### Scenario: Valid token
- **WHEN** the user enters the server address and a configured device token and connects
- **THEN** the device is connected and its first connection starts (see sync)

#### Scenario: Refused token
- **WHEN** the user connects with a token the server does not accept
- **THEN** an error says that the token was refused, and the device stays unconnected

#### Scenario: Server unreachable
- **WHEN** the user connects while offline or with a wrong address
- **THEN** an error says that the server could not be reached, and the device stays unconnected

### Requirement: Server address suggested in the browser
In the browser build, the address field SHALL start with the address the page was loaded from, unless that is a local development address.

#### Scenario: Hosted browser build
- **WHEN** the browser build served at `https://orbit.example.workers.dev` shows the connect form
- **THEN** the address field contains `https://orbit.example.workers.dev`

#### Scenario: Development server
- **WHEN** the connect form is shown at `http://localhost:1420`
- **THEN** the address field is empty

### Requirement: Working without a connection
A device that is not connected SHALL work fully on its local data and SHALL NOT send any request to a sync server.

#### Scenario: Never connected
- **WHEN** the app is used without ever entering a token
- **THEN** all data is saved locally and no sync request is made

### Requirement: Connection kept
A connected device SHALL stay connected across app restarts and page reloads until it is disconnected. The address and token SHALL be stored in the local settings and never synced.

#### Scenario: Restart
- **WHEN** a connected device restarts the app or reloads the page
- **THEN** it is still connected and a sync runs

### Requirement: Disconnect
The user SHALL be able to disconnect the device. Disconnecting SHALL stop syncing, forget the token and keep all local data. Connecting again later SHALL be a first connection again.

#### Scenario: Disconnect
- **WHEN** the user disconnects
- **THEN** the connect form is shown again, no further sync happens, and all local data is still there

#### Scenario: Connect again
- **WHEN** a disconnected device connects again to a server that holds data
- **THEN** the app asks for confirmation before replacing the local data

## REMOVED Requirements

### Requirement: Connection settings at build time
**Reason**: The server address and token are entered in the app (`docs/SPEC.md` §6.6). Nothing about sync is configured at build time.
**Migration**: Enter the address and token in the app ("Connect with a device token").

### Requirement: Sign in with email and password
**Reason**: There are no accounts; each device has its own token (`docs/SPEC.md` §2, §7).
**Migration**: "Connect with a device token".

### Requirement: Session kept
**Reason**: Replaced by "Connection kept" (no session, a stored token).
**Migration**: None.

### Requirement: Sign out
**Reason**: Replaced by "Disconnect".
**Migration**: None.

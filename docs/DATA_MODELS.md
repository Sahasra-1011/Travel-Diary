Define Core Data Models

GPS Point (raw sensor data)
---------
latitude: number
longitude: number
timestamp: number
speed: number

 Exists only in mobile memory/storage.


Trip
---------
tripId: UUID
startTime: timestamp
endTime: timestamp
distance: meters
duration: seconds
avgSpeed: km/h
mode: enum
route: GPSPoint[]

Used for user UI.

TripSummary  —-- this is shared
---------
startZone: string
endZone: string
distance: meters
duration: seconds
mode: enum
timeBucket: hour/day

No personal identifiers.

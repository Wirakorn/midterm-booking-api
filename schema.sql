DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS equipment;

CREATE TABLE equipment (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL
);

CREATE TABLE bookings (
    id TEXT PRIMARY KEY,
    equipmentId TEXT NOT NULL,
    borrowerName TEXT NOT NULL,
    startAt TEXT NOT NULL,
    endAt TEXT NOT NULL,
    purpose TEXT NOT NULL,
    FOREIGN KEY (equipmentId) REFERENCES equipment(id)
);

INSERT INTO equipment (id, name, location) VALUES 
('eq-1', 'Projector A', 'Building 1'),
('eq-2', 'Camera B', 'Building 2');
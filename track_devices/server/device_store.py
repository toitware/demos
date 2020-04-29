# Copyright (C) 2020 Toitware ApS. All rights reserved.

import uuid
import pymysql as mysql

def create_device_store(config):
    conn = mysql.connect(host=config['mysql']['host'],port=config['mysql']['port'],user=config['mysql']['user'],password=config['mysql']['password'],database=config['mysql']['database'],autocommit=True)
    return DeviceStore(conn)

class DeviceStore:

    def __init__(self, conn):
        self.conn = conn

    def register_device(self, cursor, device_id):
        cursor.execute("INSERT IGNORE INTO `devices` (`id`,`created_at`) VALUES (%s, NOW())", [device_id.bytes])

    def write_location(self, device_id, created_at, loc):
        cursor = self.conn.cursor()
        try:
            self.register_device(cursor, device_id)
            cursor.execute("INSERT INTO `device_locations` (`device_id`,`location`,`created_at`) VALUES(%s,POINT(%s,%s),%s)", [device_id.bytes, loc.lat, loc.lon, created_at])
            self.conn.commit()
        finally:
            cursor.close()

    def write_thp(self, device_id, created_at, t, h, p):
        cursor = self.conn.cursor()
        try:
            self.register_device(cursor, device_id)
            cursor.execute("INSERT INTO `device_thps` (`device_id`,`temperature`, `pressure`,`humidity`,`created_at`) VALUES(%s,%s,%s,%s,%s)", [device_id.bytes, t, p, h, created_at])
            self.conn.commit()
        finally:
            cursor.close()


    def delete_device(self, device_id):
        cursor = self.conn.cursor()
        try:
            self.register_device(cursor, device_id)
            cursor.execute("DELETE FROM `device_locations` WHERE device_id = %s", [device_id.bytes])
            cursor.execute("DELETE FROM `device_thps` WHERE device_id = %s", [device_id.bytes])
            cursor.execute("DELETE FROM `devices` WHERE id = %s", [device_id.bytes])
            self.conn.commit()
        finally:
            cursor.close()

    def list_thps(self, device_id):
        query = """
        SELECT
            `device_thps`.`temperature`,
            `device_thps`.`pressure`,
            `device_thps`.`humidity`,
            `device_thps`.`created_at` as `thp_created_at`
        FROM
            `device_thps`
        WHERE `device_thps`.`device_id` = %s
        ORDER BY `device_thps`.`created_at` DESC
        """
        cursor = self.conn.cursor()
        cursor.execute(query, [device_id.bytes])
        rows = cursor.fetchall()

        try:
            return [THP(r[0],r[1],r[2],r[3]) for r in rows]
        finally:
            cursor.close()

    def list_locations(self, device_id):
        query = """
        SELECT
            ST_X(`device_locations`.`location`),
            ST_Y(`device_locations`.`location`),
            `device_locations`.`created_at` as `thp_created_at`
        FROM
            `device_locations`
        WHERE `device_locations`.`device_id` = %s
        ORDER BY `device_locations`.`created_at` DESC
        """
        cursor = self.conn.cursor()
        cursor.execute(query, [device_id.bytes])
        rows = cursor.fetchall()

        try:
            return [Location(r[0],r[1],r[2]) for r in rows]
        finally:
            cursor.close()

    def get_device(self, device_id):
        query = """
        SELECT
            hex(`devices`.`id`),
            `devices`.`created_at`,
            `devices`.`name`
        FROM
            `devices`
        WHERE `devices`.`id` = %s
        """

        cursor = self.conn.cursor()
        cursor.execute(query, [device_id.bytes])
        r = cursor.fetchone()

        try:
            return Device(
                uuid.UUID(hex=r[0]),
                r[1],
                r[2],
                self.list_locations(device_id),
                self.list_thps(device_id),
            )
        finally:
            cursor.close()

    def list_devices(self):
        query = """
        SELECT
            hex(`devices`.`id`),
            `devices`.`created_at`,
            `devices`.`name`,
            ST_X(`device_locations`.`location`) as `lat`,
            ST_Y(`device_locations`.`location`) as `lon`,
            `device_locations`.`created_at` as `loc_created_at`,
            `device_thps`.`temperature`,
            `device_thps`.`pressure`,
            `device_thps`.`humidity`,
            `device_thps`.`created_at` as `thp_created_at`
        FROM
            `devices`
        LEFT OUTER JOIN
            `device_locations`
        ON
            `devices`.`id` = `device_locations`.`device_id` AND
            `device_locations`.`created_at` = (
                SELECT MAX(`created_at`)
                FROM `device_locations`
                WHERE `device_locations`.`device_id` = `devices`.`id`
            )
        LEFT OUTER JOIN
            `device_thps`
        ON
            `devices`.`id` = `device_thps`.`device_id` AND
            `device_thps`.`created_at` = (
                SELECT MAX(`created_at`)
                FROM `device_thps`
                WHERE `device_locations`.`device_id` = `devices`.`id`
            )
        ORDER BY
            `devices`.`id`
        """

    # TODO: Filter on location bounds
        cursor = self.conn.cursor()
        cursor.execute(query)
        rows = cursor.fetchall()

        try:
            return [Device(
                uuid.UUID(hex=r[0]),
                r[1],
                r[2],
                Location(r[3],r[4],r[5]) if r[3] else None,
                THP(r[6],r[7],r[8],r[9]) if r[6] else None,
            ) for r in rows]
        finally:
            cursor.close()

    def close(self):
        self.conn.close()

class Location:
    lat = 0.0
    lon = 0.0
    created_at = None

    def __init__(self, lat, lon,created_at=None):
        self.lat = lat
        self.lon = lon
        self.created_at = created_at

    def map(self):
        return {
            "lat": self.lat,
            "lon": self.lon,
            "created_at": self.created_at.isoformat("T") if self.created_at else None,
        }

class THP:
    temperature=0.0
    humidity=0.0
    pressure=0.0
    created_at=None

    def __init__(self, temperature, humidity, pressure, created_at=None):
        self.temperature = temperature
        self.humidity = humidity
        self.pressure = pressure
        self.created_at = created_at

    def map(self):
        return {
            "temperature": self.temperature,
            "humidity": self.humidity,
            "pressure": self.pressure,
            "created_at": self.created_at.isoformat("T") if self.created_at else None,
        }

class Device:
    id=None
    created_at=None
    name=""

    def __init__(self, id, created_at, name, locations=None, thps=None):
        self.id = id
        self.created_at = created_at
        self.name = name
        self.locations = locations
        self.thps = thps

    def map(self):
        res = {
            "id": str(self.id),
            "created_at": self.created_at.isoformat("T") if self.created_at else None,
            "name": self.name,
        }

        if type(self.locations) is list:
            res["locations"] = [l.map() for l in self.locations]
        else:
            res["location"] = self.locations.map() if self.locations else None

        if type(self.thps) is list:
            res["thps"] = [thp.map() for thp in self.thps]
        else:
            res["thp"] = self.thps.map() if self.thps else None
        return res

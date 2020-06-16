-- Copyright (C) 2020 Toitware ApS. All rights reserved.

CREATE TABLE IF NOT EXISTS devices (
    `id` binary(16) not null,
    `name` varchar(255),
    `created_at` DATETIME(6) NOT NULL,
    PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS device_locations (
    `id` MEDIUMINT NOT NULL AUTO_INCREMENT,
    `device_id` binary(16) NOT NULL,
    `location` POINT NOT NULL,
    `created_at` DATETIME(6) NOT NULL,
    PRIMARY KEY(`id`),
    INDEX dev_loc_idx (`device_id`, `created_at`)
);

CREATE TABLE IF NOT EXISTS device_thps (
    `id` MEDIUMINT NOT NULL AUTO_INCREMENT,
    `device_id` binary(16) NOT NULL,
    `temperature` DECIMAL(16,10) NOT NULL,
    `pressure` DECIMAL(16,10) NOT NULL,
    `humidity` DECIMAL(16,10) NOT NULL,
    `created_at` DATETIME(6) NOT NULL,
    PRIMARY KEY(`id`),
    INDEX dev_loc_idx (`device_id`, `created_at`)
);


CREATE TABLE IF NOT EXISTS device_alerts (
    `id` MEDIUMINT NOT NULL AUTO_INCREMENT,
    `device_id` binary(16) NOT NULL,
    `message` varchar(512) NOT NULL,
    `resolved` tinyint(1) NOT NULL,
    `created_at` DATETIME(6) NOT NULL,
    PRIMARY KEY(`id`),
    INDEX dev_loc_idx (`device_id`, `created_at`)
);
